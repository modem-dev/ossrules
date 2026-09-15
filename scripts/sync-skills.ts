/** Repository discovery is independent of the editorial AGENTS.md revision. Never execute fetched files. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
    excludedSkillPath,
    parseSkill,
    SCAN_SCOPE,
    type SkillFile,
    type SkillManifest,
    safeRelativePath,
    skillId,
} from '../lib/skill-schema';
import { collectSkillContributors } from './skill-contributors';

const root = process.cwd();
const manifestDir = path.join(root, 'content/skills');
const filesDir = path.join(root, 'content/skill-files');
const only = process.argv.includes('--slug') ? process.argv[process.argv.indexOf('--slug') + 1] : undefined;
const MAX_FILE = 1024 * 1024;
const MAX_BUNDLE = 10 * 1024 * 1024;
interface TreeFile {
    path: string;
    mode: string;
    type: string;
    sha: string;
    size?: number;
}
interface Entry {
    instructionFile?: 'AGENTS.md' | 'CLAUDE.md';
    slug: string;
    owner: string;
    repo: string;
    defaultBranch: string;
}
function api<T>(url: string): T {
    return JSON.parse(execFileSync('gh', ['api', url], { maxBuffer: 64 * 1024 * 1024 }).toString()) as T;
}

async function sync(entry: Entry) {
    const repository = `${entry.owner}/${entry.repo}`;
    const repo = api<{ default_branch: string }>(`repos/${repository}`);
    const branch = repo.default_branch;
    const commit = api<{ sha: string }>(`repos/${repository}/commits/${encodeURIComponent(branch)}`);
    const tree = api<{ truncated: boolean; tree: TreeFile[] }>(`repos/${repository}/git/trees/${commit.sha}?recursive=1`);
    if (tree.truncated) throw new Error(`${entry.slug}: incomplete GitHub tree; previous snapshot retained.`);
    const candidates = tree.tree.filter((f) => f.path === 'SKILL.md' || f.path.endsWith('/SKILL.md'));
    const manifest: SkillManifest = {
        version: 1,
        slug: entry.slug,
        repository,
        branch,
        sha: commit.sha,
        scannedAt: new Date().toISOString(),
        scope: SCAN_SCOPE,
        excluded: [],
        invalid: [],
        skills: [],
    };
    const writes = new Map<string, Buffer>();
    const fetched = new Map<string, { bytes: Buffer; text: boolean }>();
    async function read(file: TreeFile, relative: string): Promise<SkillFile> {
        if (!safeRelativePath(file.path) || !safeRelativePath(relative)) throw new Error('Unsafe repository path.');
        const info: SkillFile = { path: relative, blob: file.sha, bytes: file.size ?? 0, text: false, mode: file.mode };
        if (file.mode === '120000') return { ...info, omitted: 'Symlink; inspect the upstream target.' };
        if (file.type !== 'blob') return { ...info, omitted: 'Submodule; files live in another repository.' };
        if ((file.size ?? 0) > MAX_FILE) return { ...info, omitted: 'Exceeds the 1 MiB file limit.' };
        let body = fetched.get(file.sha);
        if (!body) {
            const response = await fetch(
                `https://raw.githubusercontent.com/${repository}/${commit.sha}/${file.path.split('/').map(encodeURIComponent).join('/')}`,
            );
            if (!response.ok) throw new Error(`${file.path}: HTTP ${response.status}; previous snapshot retained.`);
            const bytes = Buffer.from(await response.arrayBuffer());
            const hash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
            if (hash !== file.sha) throw new Error(`${file.path}: Git blob hash mismatch.`);
            let text = !bytes.includes(0);
            try {
                new TextDecoder('utf-8', { fatal: true }).decode(bytes);
            } catch {
                text = false;
            }
            body = { bytes, text };
            fetched.set(file.sha, body);
        }
        if (body.bytes.length > MAX_FILE) return { ...info, omitted: 'Exceeds the 1 MiB file limit.' };
        writes.set(file.sha, body.bytes);
        return { ...info, bytes: body.bytes.length, text: body.text };
    }
    for (const candidate of candidates) {
        if (excludedSkillPath(candidate.path)) {
            manifest.excluded.push(candidate.path);
            continue;
        }
        const prefix = candidate.path === 'SKILL.md' ? '' : `${path.posix.dirname(candidate.path)}/`;
        const instruction = await read(candidate, 'SKILL.md');
        if (instruction.omitted || !instruction.text) {
            manifest.invalid.push({ path: candidate.path, reason: instruction.omitted ?? 'Not UTF-8 text.' });
            continue;
        }
        let metadata: ReturnType<typeof parseSkill>;
        try {
            const source = writes.get(candidate.sha);
            if (!source) throw new Error('Instruction source unavailable.');
            metadata = parseSkill(source.toString('utf8'));
        } catch (error) {
            manifest.invalid.push({ path: candidate.path, reason: (error as Error).message });
            continue;
        }
        const bundle = tree.tree.filter((f) => f.type !== 'tree' && f.path.startsWith(prefix));
        let total = instruction.bytes;
        const files: SkillFile[] = [instruction];
        for (const file of bundle) {
            if (file.path === candidate.path) continue;
            const relative = file.path.slice(prefix.length);
            // Nested skills are their own bundles; do not silently duplicate them.
            const nested = candidates.some(
                (c) => c.path !== candidate.path && c.path.startsWith(prefix) && file.path.startsWith(`${path.posix.dirname(c.path)}/`),
            );
            if (nested || total + (file.size ?? 0) > MAX_BUNDLE || files.length >= 250) {
                files.push({
                    path: relative,
                    blob: file.sha,
                    mode: file.mode,
                    bytes: file.size ?? 0,
                    text: false,
                    omitted: nested ? 'Belongs to a nested skill.' : 'Bundle exceeds the 10 MiB / 250 file limit.',
                });
                continue;
            }
            const stored = await read(file, relative);
            if (!stored.omitted) total += stored.bytes;
            files.push(stored);
        }
        manifest.skills.push({
            id: skillId(candidate.path),
            path: candidate.path,
            ...metadata,
            files,
            contributions: collectSkillContributors(repository, commit.sha, candidate.path),
        });
    }
    if (manifest.skills.length) {
        const agents = tree.tree.find((f) => f.path === (entry.instructionFile ?? 'AGENTS.md'));
        if (agents) manifest.agentsFile = await read(agents, agents.path);
        const license = tree.tree.find((f) => /^(LICENSE|LICENCE|COPYING)(\.(md|txt))?$/i.test(f.path));
        if (license) manifest.repositoryLicense = await read(license, license.path);
    }
    fs.mkdirSync(path.join(filesDir, entry.slug), { recursive: true });
    for (const [blob, bytes] of writes) fs.writeFileSync(path.join(filesDir, entry.slug, blob), bytes);
    fs.mkdirSync(manifestDir, { recursive: true });
    fs.writeFileSync(path.join(manifestDir, `${entry.slug}.json`), `${JSON.stringify(manifest, null, 4)}\n`);
    console.log(
        `${entry.slug}: ${manifest.skills.length} skills, ${manifest.invalid.length} invalid, ${manifest.excluded.length} excluded (${commit.sha.slice(0, 7)})`,
    );
}

async function main() {
    const entries = fs
        .readdirSync(path.join(root, 'content/projects'))
        .filter((f) => f.endsWith('.json'))
        .map((f) => JSON.parse(fs.readFileSync(path.join(root, 'content/projects', f), 'utf8')) as Entry)
        .filter((entry) => !only || entry.slug === only);
    if (!entries.length) throw new Error('No matching projects.');
    for (const entry of entries) await sync(entry);
}
main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
