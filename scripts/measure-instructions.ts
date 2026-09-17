/** Remeasure existing pinned source without fetching upstream or advancing review dates. */
import fs from 'node:fs';
import path from 'node:path';
import type { AgentsProject, VendoredFiles } from '../components/agents-md-data';
import { countSourceLines, measureInstructions } from '../lib/instruction-measurements';

const fileIndex = process.argv.indexOf('--file');
if (fileIndex !== -1) {
    const file = process.argv[fileIndex + 1];
    if (!file) throw new Error('--file requires a source path');
    console.log(JSON.stringify(measureInstructions(fs.readFileSync(file, 'utf8')), null, 4));
} else {
    const write = process.argv.includes('--write');
    const updates: { filename: string; source: string; measured: ReturnType<typeof measureInstructions> }[] = [];
    const manifests: { filename: string; manifest: VendoredFiles }[] = [];
    for (const filename of fs.readdirSync('content/projects').filter((name) => name.endsWith('.json'))) {
        const target = path.join('content/projects', filename);
        const source = fs.readFileSync(target, 'utf8');
        const project = JSON.parse(source) as AgentsProject;
        const manifest = JSON.parse(fs.readFileSync(`public/files/${project.slug}/manifest.json`, 'utf8')) as VendoredFiles;
        const primary = manifest.files.find((file) => file.path === (project.instructionFile ?? 'AGENTS.md'));
        if (
            manifest.sha !== project.lastCommit.sha ||
            !primary ||
            primary.missing ||
            primary.unavailable ||
            primary.symlink ||
            primary.truncated
        ) {
            throw new Error(`${project.slug}: complete primary source at the analysis commit is required`);
        }
        const measured = measureInstructions(fs.readFileSync(`public/files/${project.slug}/${primary.path}`, 'utf8'));
        const changes = (Object.keys(measured) as (keyof typeof measured)[]).filter((key) => measured[key] !== project.file[key]);
        if (changes.length) {
            console.log(`${project.slug}: ${changes.map((key) => `${key} ${project.file[key]} → ${measured[key]}`).join(', ')}`);
            updates.push({ filename: target, source, measured });
        }
        let manifestChanged = false;
        for (const file of manifest.files) {
            if (file.missing || file.unavailable || file.symlink || file.truncated) continue;
            const text = fs.readFileSync(`public/files/${project.slug}/${file.path}`, 'utf8');
            const lines = countSourceLines(text);
            if (lines !== file.lines) {
                console.log(`${project.slug}/${file.path}: manifest lines ${file.lines} → ${lines}`);
                file.lines = lines;
                manifestChanged = true;
            }
        }
        if (manifestChanged) manifests.push({ filename: `public/files/${project.slug}/manifest.json`, manifest });
    }
    // Validate every input before writing any entry. Preserve unrelated JSON formatting and editorial text.
    if (write) {
        for (const { filename, source, measured } of updates) {
            const next = source.replace(
                /("file"\s*:\s*\{)([^}]+)(\})/,
                (_, start, body: string, end) =>
                    start +
                    body.replace(/("(\w+)"\s*:\s*)\d+/g, (original, prefix, key: keyof typeof measured) =>
                        Object.hasOwn(measured, key) ? `${prefix}${measured[key]}` : original,
                    ) +
                    end,
            );
            fs.writeFileSync(filename, next);
        }
        for (const { filename, manifest } of manifests) fs.writeFileSync(filename, `${JSON.stringify(manifest, null, 4)}\n`);
    }
    console.log(`${updates.length} entries ${write ? 'updated from pinned source' : 'need measurement updates'}.`);
    console.log(`${manifests.length} manifests ${write ? 'updated' : 'need line-count updates'}.`);
    if ((updates.length || manifests.length) && !write) process.exitCode = 1;
}
