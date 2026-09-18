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
 * The output directory is excluded from Biome (see biome.json). The files are
 * other people's, and reformatting them would break the verbatim quotes the
 * corpus depends on; the manifests are generated, and a formatter rewriting one
 * would leave this script and the pre-commit hook overwriting each other.
 *
 *   npx tsx scripts/sync-agents-md-files.ts           # write
 *   npx tsx scripts/sync-agents-md-files.ts --check   # verify, no writes (CI)
 *   npx tsx scripts/sync-agents-md-files.ts --slug x  # one project
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { instructionImports, localTarget, resolveSymlink } from '../lib/instruction-files';
import { countSourceLines } from '../lib/instruction-measurements';
import { isInstructionPath } from '../lib/instruction-path';
import { identifyLicense, licensePath } from '../lib/license';
import { excludedSkillPath } from '../lib/skill-schema';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'projects');
const FILES_DIR = path.join(process.cwd(), 'public', 'files');

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
    instructionFile?: string;
    slug: string;
    owner: string;
    repo: string;
    defaultBranch: string;
    lastCommit: { sha: string };
    references: Reference[];
    techniques?: { sourcePath?: string }[];
    license?: string;
}

interface ManifestFile {
    symlink?: string;
    resolvedPath?: string;
    unavailable?: string;
    imports?: ReturnType<typeof instructionImports>;
    sameContentAs?: string;
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
    `https://raw.githubusercontent.com/${entry.owner}/${entry.repo}/${entry.lastCommit.sha}/${filePath.split('/').map(encodeURIComponent).join('/')}`;

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

async function detectLicense(entry: Entry, available: Set<string>): Promise<{ license?: string; licensePath?: string }> {
    const candidate = licensePath([...available]);
    if (!candidate) return {};
    const response = await fetch(rawUrl(entry, candidate));
    if (!response.ok) throw new Error(`${entry.slug}: could not fetch ${candidate} (${response.status}); previous snapshot retained.`);
    return { license: identifyLicense(await response.text()), licensePath: candidate };
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

    const tree = JSON.parse(
        execFileSync('gh', ['api', `repos/${entry.owner}/${entry.repo}/git/trees/${entry.lastCommit.sha}?recursive=1`], {
            maxBuffer: 64 * 1024 * 1024,
        }).toString(),
    ) as {
        truncated: boolean;
        tree: { path: string; mode: string; type: string; sha: string }[];
    };
    if (tree.truncated) throw new Error(`${entry.slug}: incomplete repository tree; previous snapshot retained.`);
    const nodes = new Map(tree.tree.map((file) => [file.path, file]));
    const available = new Set(tree.tree.filter((file) => file.type === 'blob').map((file) => file.path));
    const paths = new Set([
        entry.instructionFile ?? 'AGENTS.md',
        ...entry.references.filter((reference) => reference.kind !== 'pattern').map((r) => r.path),
        ...(entry.techniques ?? []).flatMap((technique) => (technique.sourcePath ? [technique.sourcePath] : [])),
        ...tree.tree.filter((file) => isInstructionPath(file.path) && !excludedSkillPath(file.path)).map((file) => file.path),
    ]);
    const symlinks = new Map<string, string>();
    const records = new Map<string, ManifestFile>();
    const sourceCache = new Map<string, string>();
    const parsedImports = new Set<string>();
    const pending = [...paths].map((filePath) => ({ path: filePath, imports: /(^|\/)CLAUDE\.md$/.test(filePath) }));
    // Imports can revisit a file already discovered through AGENTS.md. Fetch once,
    // but parse imported prose as Claude instructions even when its name differs.
    for (const task of pending) {
        const filePath = task.path;
        if (!isSafePath(filePath)) throw new Error(`Unsafe instruction path: ${filePath}`);
        const node = nodes.get(filePath);
        let record = records.get(filePath);
        if (!record) {
            if (node?.type !== 'blob') {
                record = { path: filePath, bytes: 0, lines: 0, missing: true };
                problems.push(`${entry.slug}: ${filePath} is not a file in the pinned tree.`);
            } else {
                const response = await fetch(rawUrl(entry, filePath));
                if (!response.ok) throw new Error(`${entry.slug}: ${filePath} returned ${response.status}; previous snapshot retained.`);
                const bytes = Buffer.from(await response.arrayBuffer());
                const hash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
                if (hash !== node.sha) throw new Error(`${entry.slug}: ${filePath} source hash mismatch.`);
                const source = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
                const { text, truncated } = clip(source);
                sourceCache.set(filePath, source);
                wanted.set(filePath, text);
                record = {
                    path: filePath,
                    bytes: bytes.length,
                    lines: countSourceLines(source),
                    ...(truncated ? { truncated: true } : {}),
                };
                if (node.mode === '120000') {
                    record.symlink = source;
                    symlinks.set(filePath, record.symlink);
                    const resolved = localTarget(filePath, record.symlink);
                    if (resolved) pending.push({ path: resolved, imports: task.imports });
                }
            }
            records.set(filePath, record);
            files.push(record);
        }
        if (!task.imports || record.missing || parsedImports.has(filePath)) continue;
        parsedImports.add(filePath);
        if (record.symlink !== undefined) {
            const resolved = localTarget(filePath, record.symlink);
            if (resolved) pending.push({ path: resolved, imports: true });
            continue;
        }
        const imports = instructionImports(filePath, sourceCache.get(filePath) ?? '', available);
        if (imports.length) record.imports = imports;
        for (const imported of imports) if (imported.path) pending.push({ path: imported.path, imports: true });
    }
    const identities = new Map<string, string>();
    for (const file of files) {
        if (file.symlink !== undefined) {
            const resolved = resolveSymlink(file.path, symlinks, available);
            file.resolvedPath = resolved.path;
            file.unavailable = resolved.unavailable;
        } else if (!file.missing && /(^|\/)(AGENTS|CLAUDE)\.md$/.test(file.path)) {
            const sha = nodes.get(file.path)?.sha;
            if (sha) {
                const original = identities.get(sha);
                if (original) file.sameContentAs = original;
                else identities.set(sha, file.path);
            }
        }
        for (const imported of file.imports ?? []) {
            if (imported.path && !available.has(imported.path)) imported.unavailable = 'Not in this repository snapshot';
        }
    }

    files.sort((a, b) => a.path.localeCompare(b.path));
    const { license, licensePath } = await detectLicense(entry, available);
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
