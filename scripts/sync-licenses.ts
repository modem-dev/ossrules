/** Repair license metadata at existing pinned revisions without refreshing the corpus. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { identifyLicense, licensePath } from '../lib/license';
import type { SkillManifest } from '../lib/skill-schema';

type TreeFile = { path: string; type: string; mode: string; sha: string; size?: number };
const only = process.argv.includes('--slug') ? process.argv[process.argv.indexOf('--slug') + 1] : undefined;
const snapshots = new Map<string, Promise<{ file: TreeFile; bytes: Buffer }>>();
function readLicense(repository: string, sha: string) {
    const key = `${repository}/${sha}`;
    let result = snapshots.get(key);
    if (!result) {
        result = (async () => {
            const tree = JSON.parse(execFileSync('gh', ['api', `repos/${repository}/git/trees/${sha}`]).toString()) as {
                truncated: boolean;
                tree: TreeFile[];
            };
            if (tree.truncated) throw new Error(`${key}: incomplete tree`);
            const selected = licensePath(tree.tree.filter((f) => f.type === 'blob').map((f) => f.path));
            const file = tree.tree.find((f) => f.path === selected);
            if (!file || file.mode === '120000') throw new Error(`${key}: no readable root license; previous snapshot retained`);
            const response = await fetch(
                `https://raw.githubusercontent.com/${repository}/${sha}/${file.path.split('/').map(encodeURIComponent).join('/')}`,
            );
            if (!response.ok) throw new Error(`${key}: license fetch failed (${response.status})`);
            const bytes = Buffer.from(await response.arrayBuffer());
            if (createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') !== file.sha)
                throw new Error(`${key}: blob hash mismatch`);
            new TextDecoder('utf-8', { fatal: true }).decode(bytes);
            return { file, bytes };
        })();
        snapshots.set(key, result);
    }
    return result;
}
async function main() {
    let count = 0;
    for (const filename of fs.readdirSync('content/projects').filter((f) => f.endsWith('.json'))) {
        const project = JSON.parse(fs.readFileSync(path.join('content/projects', filename), 'utf8'));
        if (only && project.slug !== only) continue;
        const instructionPath = `public/files/${project.slug}/manifest.json`;
        const skillPath = `content/skills/${project.slug}.json`;
        const instructions = JSON.parse(fs.readFileSync(instructionPath, 'utf8'));
        const skills: SkillManifest | undefined = fs.existsSync(skillPath) ? JSON.parse(fs.readFileSync(skillPath, 'utf8')) : undefined;
        const repository = `${project.owner}/${project.repo}`;
        // Finish both reads before changing either snapshot for this project.
        const instructionLicense = await readLicense(repository, instructions.sha);
        const skillLicense = skills ? await readLicense(skills.repository, skills.sha) : undefined;
        instructions.license = identifyLicense(instructionLicense.bytes.toString('utf8'));
        instructions.licensePath = instructionLicense.file.path;
        if (skills && skillLicense) {
            const { file, bytes } = skillLicense;
            skills.repositoryLicense = { path: file.path, blob: file.sha, bytes: bytes.length, text: true, mode: file.mode };
            const directory = `content/skill-files/${project.slug}`;
            fs.mkdirSync(directory, { recursive: true });
            fs.writeFileSync(path.join(directory, file.sha), bytes);
            fs.writeFileSync(skillPath, `${JSON.stringify(skills, null, 4)}\n`);
        }
        fs.writeFileSync(instructionPath, `${JSON.stringify(instructions, null, 4)}\n`);
        console.log(
            `${project.slug}: ${instructions.license ?? instructionLicense.file.path}; skill license ${skillLicense?.file.path ?? 'no snapshot'}`,
        );
        count++;
    }
    console.log(`Verified licenses for ${count} projects at their pinned revisions.`);
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
