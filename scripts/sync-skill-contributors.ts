/** Refresh attribution at existing snapshots without changing bundled source or analysis. */
import fs from 'node:fs';
import path from 'node:path';
import type { SkillManifest } from '../lib/skill-schema';
import { collectSkillContributors } from './skill-contributors';

const directory = path.join(process.cwd(), 'content/skills');
const only = process.argv.includes('--slug') ? process.argv[process.argv.indexOf('--slug') + 1] : undefined;
const names = fs.readdirSync(directory).filter((name) => name.endsWith('.json') && (!only || name === `${only}.json`));
if (!names.length) throw new Error('No matching skill snapshots.');
for (const name of names) {
    const filename = path.join(directory, name);
    const manifest = JSON.parse(fs.readFileSync(filename, 'utf8')) as SkillManifest;
    for (const skill of manifest.skills) {
        skill.contributions = collectSkillContributors(manifest.repository, manifest.sha, skill.path);
    }
    // Write only after every file in the project has succeeded.
    fs.writeFileSync(filename, `${JSON.stringify(manifest, null, 4)}\n`);
    console.log(`${manifest.slug}: contributor history for ${manifest.skills.length} skills at ${manifest.sha.slice(0, 7)}`);
}
