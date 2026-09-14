/**
 * Downloads a local copy of every file the corpus reads, so the site can show
 * them without calling GitHub at request time.
 *
 * The entries carry an analysis of a file at one specific commit. Fetching that
 * file from GitHub when a reader opens it would mean the page and the file could
 * disagree the moment upstream moves, and would put an unauthenticated,
 * rate-limited dependency on the read path of a static site. So the files are
 * vendored: pinned to the same `lastCommit.sha` the measurements were taken at,
 * committed, and served from our own origin.
 *
 * Everything here is mechanical. It derives from the entry JSON and the pinned
 * commit alone, so a second run over unchanged entries writes nothing, and a
 * model run that adds an entry gets its files by running this rather than by
 * pasting content into the repo.
 *
 *   npx tsx scripts/sync-agents-md-files.ts           # write
 *   npx tsx scripts/sync-agents-md-files.ts --check   # verify, no writes (CI)
 *   npx tsx scripts/sync-agents-md-files.ts --slug x  # one project
 */

import fs from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'agents-md');
const FILES_DIR = path.join(process.cwd(), 'public', 'agents-md', 'files');

/**
 * Bytes kept per file. Everything above this in the corpus today is a changelog
 * or a release-process doc, where the top of the file is the part worth reading
 * anyway; the tray shows what fits and links out for the rest. Raising this is a
 * one-line change, but it is the whole size of the vendored tree.
 */
const MAX_BYTES = 64 * 1024;

const CHECK = process.argv.includes('--check');
const ONLY = process.argv.includes('--slug') ? process.argv[process.argv.indexOf('--slug') + 1] : undefined;

interface Reference {
    path: string;
    label?: string;
    /** Set when the reference names a shape rather than a file ("the nearest AGENTS.md"). */
    kind?: 'pattern';
}

interface Entry {
    slug: string;
    owner: string;
    repo: string;
    defaultBranch: string;
    lastCommit: { sha: string };
    references: Reference[];
    license?: string;
}

interface ManifestFile {
    path: string;
    /** Size upstream, before any truncation. */
    bytes: number;
    lines: number;
    /** True when only the first MAX_BYTES are stored. */
    truncated?: boolean;
    /** True when the path does not resolve at this commit — an upstream broken link. */
    missing?: true;
}

interface Manifest {
    slug: string;
    /** The commit every file here was taken from. */
    sha: string;
    license?: string;
    licensePath?: string;
    files: ManifestFile[];
}

const rawUrl = (entry: Entry, filePath: string) =>
    `https://raw.githubusercontent.com/${entry.owner}/${entry.repo}/${entry.lastCommit.sha}/${filePath}`;

/** Refuses anything that could write outside the project's own directory. */
function isSafePath(filePath: string): boolean {
    if (filePath.length === 0 || filePath.includes('\\') || filePath.startsWith('/')) return false;
    return filePath.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');
}

/** Truncates on a line boundary so the stored file never ends mid-sentence. */
function clip(source: string): { text: string; truncated: boolean } {
    if (Buffer.byteLength(source, 'utf8') <= MAX_BYTES) return { text: source, truncated: false };
    const head = Buffer.from(source, 'utf8').subarray(0, MAX_BYTES).toString('utf8');
    const lastBreak = head.lastIndexOf('\n');
    return { text: `${lastBreak > 0 ? head.slice(0, lastBreak) : head}\n`, truncated: true };
}

const LICENSE_PATHS = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'COPYING', 'LICENSE-APACHE'];

/**
 * Names the license from its own text. Only the families present in the corpus
 * are matched; anything else is recorded as the path so the page can link to it
 * rather than assert a license we did not identify.
 */
const LICENSE_SIGNATURES: [RegExp, string][] = [
    [/GNU AFFERO GENERAL PUBLIC LICENSE\s+Version 3/i, 'AGPL-3.0'],
    [/GNU GENERAL PUBLIC LICENSE\s+Version 3/i, 'GPL-3.0'],
    [/GNU LESSER GENERAL PUBLIC LICENSE\s+Version 3/i, 'LGPL-3.0'],
    [/Apache License\s+Version 2\.0/i, 'Apache-2.0'],
    [/Mozilla Public License Version 2\.0/i, 'MPL-2.0'],
    [/Business Source License/i, 'BUSL-1.1'],
    [/Functional Source License/i, 'FSL-1.1'],
    [/Permission is hereby granted, free of charge/i, 'MIT'],
    [/Redistribution and use in source and binary forms[\s\S]{0,600}Neither the name/i, 'BSD-3-Clause'],
    [/Redistribution and use in source and binary forms/i, 'BSD-2-Clause'],
    [/Permission to use, copy, modify, and\/or distribute/i, 'ISC'],
    [/This is free and unencumbered software released into the public domain/i, 'Unlicense'],
];

async function detectLicense(entry: Entry): Promise<{ license?: string; licensePath?: string }> {
    for (const candidate of LICENSE_PATHS) {
        const response = await fetch(rawUrl(entry, candidate));
        if (!response.ok) continue;
        const text = await response.text();
        const match = LICENSE_SIGNATURES.find(([pattern]) => pattern.test(text));
        return { license: match?.[1], licensePath: candidate };
    }
    return {};
}

function readEntries(): Entry[] {
    return fs
        .readdirSync(CONTENT_DIR)
        .filter((name) => name.endsWith('.json'))
        .map((name) => JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, name), 'utf8')) as Entry)
        .filter((entry) => ONLY === undefined || entry.slug === ONLY);
}

async function syncEntry(entry: Entry, problems: string[]): Promise<{ changed: boolean }> {
    const targetDir = path.join(FILES_DIR, entry.slug);
    const wanted = new Map<string, string>();
    const files: ManifestFile[] = [];

    const paths = ['AGENTS.md', ...entry.references.filter((reference) => reference.kind !== 'pattern').map((r) => r.path)];

    for (const filePath of [...new Set(paths)]) {
        if (!isSafePath(filePath)) {
            problems.push(`${entry.slug}: reference path ${JSON.stringify(filePath)} is not a safe relative path.`);
            continue;
        }
        const response = await fetch(rawUrl(entry, filePath));
        if (!response.ok) {
            // An AGENTS.md that points at a path which does not exist is a fact about
            // the file, not a failure here. It is recorded so the tree can say so.
            files.push({ path: filePath, bytes: 0, lines: 0, missing: true });
            problems.push(`${entry.slug}: ${filePath} is ${response.status} at ${entry.lastCommit.sha.slice(0, 8)}.`);
            continue;
        }
        const source = await response.text();
        const { text, truncated } = clip(source);
        wanted.set(filePath, text);
        files.push({
            path: filePath,
            bytes: Buffer.byteLength(source, 'utf8'),
            lines: source.split('\n').length - 1,
            ...(truncated ? { truncated: true } : {}),
        });
    }

    files.sort((a, b) => a.path.localeCompare(b.path));
    const { license, licensePath } = await detectLicense(entry);
    const manifest: Manifest = {
        slug: entry.slug,
        sha: entry.lastCommit.sha,
        ...(license ? { license } : {}),
        ...(licensePath ? { licensePath } : {}),
        files,
    };

    const onDisk = new Map<string, string>();
    if (fs.existsSync(targetDir)) {
        const walk = (dir: string) => {
            for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, item.name);
                if (item.isDirectory()) walk(full);
                else if (item.name !== 'manifest.json') onDisk.set(path.relative(targetDir, full), fs.readFileSync(full, 'utf8'));
            }
        };
        walk(targetDir);
    }

    const manifestPath = path.join(targetDir, 'manifest.json');
    const manifestText = `${JSON.stringify(manifest, null, 4)}\n`;
    const manifestCurrent = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : '';

    const stale = [...onDisk.keys()].filter((key) => !wanted.has(key));
    const changed = manifestCurrent !== manifestText || stale.length > 0 || [...wanted].some(([key, text]) => onDisk.get(key) !== text);

    if (changed && !CHECK) {
        for (const key of stale) fs.rmSync(path.join(targetDir, key), { force: true });
        for (const [key, text] of wanted) {
            const destination = path.join(targetDir, key);
            fs.mkdirSync(path.dirname(destination), { recursive: true });
            fs.writeFileSync(destination, text);
        }
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(manifestPath, manifestText);
    }

    return { changed };
}

async function main() {
    const entries = readEntries();
    if (entries.length === 0) {
        console.error(ONLY ? `No entry with slug "${ONLY}".` : 'No entries found.');
        process.exit(1);
    }

    const problems: string[] = [];
    const changedSlugs: string[] = [];

    for (const entry of entries) {
        const { changed } = await syncEntry(entry, problems);
        if (changed) changedSlugs.push(entry.slug);
        process.stdout.write(`  ${changed ? (CHECK ? '!' : '~') : '='} ${entry.slug}\n`);
    }

    if (problems.length > 0) {
        console.log(`\n${problems.length} path${problems.length === 1 ? '' : 's'} did not resolve:`);
        for (const problem of problems) console.log(`  - ${problem}`);
        console.log('  These are recorded as missing in the manifest and shown as unresolved in the tree.');
    }

    if (CHECK && changedSlugs.length > 0) {
        console.error(`\n${changedSlugs.length} project(s) have vendored files out of sync: ${changedSlugs.join(', ')}`);
        console.error('Run: pnpm sync:agents-md-files');
        process.exit(1);
    }

    console.log(
        changedSlugs.length === 0 ? '\nEvery vendored file matches its entry.' : `\nWrote files for ${changedSlugs.length} project(s).`,
    );
}

main();
