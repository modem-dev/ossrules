/**
 * Build-time check for the AGENTS.md corpus in content/projects/.
 *
 * Entries are produced by evaluating a repository's AGENTS.md, a job that fans
 * out across model runs, so this runs the same validation the site loader runs
 * but reports every problem in every file at once instead of throwing on the
 * first. It also checks the things the loader cannot: that an entry's avatar
 * exists, that no two entries claim the same repository, and that the vendored
 * copies of the files the entry reads are present and taken from the same
 * commit the entry was measured at.
 *
 * This stays offline. Whether a vendored file still matches upstream is a
 * question for `pnpm check:agents-md-files`, which has to make network calls.
 *
 * Usage: npx tsx scripts/validate-agents-md.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { validateAgentsProject } from '../components/agents-md-schema';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'projects');
const LOGO_DIR = path.join(process.cwd(), 'public', 'logos');
const FILES_DIR = path.join(process.cwd(), 'public', 'files');

interface ManifestFile {
    symlink?: string;
    resolvedPath?: string;
    unavailable?: string;
    path: string;
    missing?: true;
}

/**
 * Checks the vendored tree against the entry: same commit, every file the entry
 * reads accounted for, and every accounted-for file actually on disk. A manifest
 * that has drifted from its entry means the tray would show one revision of a
 * file beside measurements taken from another.
 */
function checkVendoredFiles(
    slug: string,
    entry: {
        instructionFile?: string;
        lastCommit?: { sha?: string };
        references?: { path: string; kind?: string }[];
        techniques?: { sourcePath?: string }[];
    },
): string[] {
    const manifestPath = path.join(FILES_DIR, slug, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        return [`missing vendored files at public/files/${slug}/ — run pnpm sync:agents-md-files`];
    }

    let manifest: { sha?: string; files?: ManifestFile[] };
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (error) {
        return [`vendored manifest is not valid JSON (${(error as Error).message})`];
    }

    const problems: string[] = [];
    if (manifest.sha !== entry.lastCommit?.sha) {
        problems.push(
            `vendored files are from commit ${manifest.sha?.slice(0, 8)} but the entry pins ${entry.lastCommit?.sha?.slice(0, 8)} — run pnpm sync:agents-md-files`,
        );
    }

    const primary = manifest.files?.find((file) => file.path === (entry.instructionFile ?? 'AGENTS.md'));
    if (!primary || primary.missing || primary.unavailable || primary.symlink !== undefined) {
        problems.push('The analyzed instructionFile must be a readable regular file, not a symlink.');
    }
    for (const file of manifest.files ?? []) {
        if (
            file.resolvedPath &&
            !manifest.files?.some(
                (target) => target.path === file.resolvedPath && !target.missing && !target.unavailable && !target.symlink,
            )
        ) {
            problems.push(`${file.path}: resolved symlink target is not readable.`);
        }
    }
    const stored = new Map((manifest.files ?? []).map((file) => [file.path, file]));
    const expected = [
        entry.instructionFile ?? 'AGENTS.md',
        ...(entry.references ?? []).filter((r) => r.kind !== 'pattern').map((r) => r.path),
        ...(entry.techniques ?? []).flatMap((technique) => (technique.sourcePath ? [technique.sourcePath] : [])),
    ];
    for (const filePath of new Set(expected)) {
        const file = stored.get(filePath);
        if (!file) {
            problems.push(`${filePath} is referenced but not vendored — run pnpm sync:agents-md-files`);
        } else if (!file.missing && !fs.existsSync(path.join(FILES_DIR, slug, filePath))) {
            problems.push(`${filePath} is in the manifest but not on disk — run pnpm sync:agents-md-files`);
        }
    }
    return problems;
}

function main() {
    if (!fs.existsSync(CONTENT_DIR)) {
        console.error(`Missing ${CONTENT_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(CONTENT_DIR).filter((name) => name.endsWith('.json'));
    const problems: string[] = [];
    const seenRepos = new Map<string, string>();

    for (const name of files) {
        const slug = name.replace(/\.json$/, '');
        let parsed: unknown;
        try {
            parsed = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, name), 'utf8'));
        } catch (error) {
            problems.push(`${name}: not valid JSON (${(error as Error).message})`);
            continue;
        }

        for (const message of validateAgentsProject(parsed, name)) {
            problems.push(`${name}: ${message}`);
        }

        const entry = parsed as { slug?: string; owner?: string; repo?: string };
        if (entry.slug !== slug) {
            problems.push(`${name}: slug "${entry.slug}" does not match the filename.`);
        }

        const repoKey = `${entry.owner}/${entry.repo}`;
        const existing = seenRepos.get(repoKey);
        if (existing) {
            problems.push(`${name}: ${repoKey} is already covered by ${existing}.`);
        } else {
            seenRepos.set(repoKey, name);
        }

        if (!fs.existsSync(path.join(LOGO_DIR, `${slug}.png`))) {
            problems.push(`${name}: missing avatar at public/logos/${slug}.png`);
        }

        for (const message of checkVendoredFiles(slug, parsed as Parameters<typeof checkVendoredFiles>[1])) {
            problems.push(`${name}: ${message}`);
        }
    }

    if (problems.length > 0) {
        console.error(`\n${problems.length} problem(s) in the AGENTS.md corpus:\n`);
        for (const problem of problems) console.error(`  - ${problem}`);
        console.error('');
        process.exit(1);
    }

    console.log(`✅ All ${files.length} instruction entries are valid.`);
}

main();
