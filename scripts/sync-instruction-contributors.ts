/** Refresh file attribution without changing source snapshots or analysis. */
import fs from 'node:fs';
import path from 'node:path';
import type { AgentsProject } from '../components/agents-md-data';
import { collectSkillContributors } from './skill-contributors';

const output = path.join(process.cwd(), 'content/instruction-contributors.json');
const snapshots: Record<string, unknown> = {};
for (const name of fs
    .readdirSync('content/projects')
    .filter((name) => name.endsWith('.json'))
    .sort()) {
    const project = JSON.parse(fs.readFileSync(path.join('content/projects', name), 'utf8')) as AgentsProject;
    const file = project.instructionFile ?? 'AGENTS.md';
    const repository = `${project.owner}/${project.repo}`;
    snapshots[project.slug] = {
        repository,
        sha: project.lastCommit.sha,
        path: file,
        contributions: collectSkillContributors(repository, project.lastCommit.sha, file),
    };
    console.log(`${project.slug}: ${file}`);
}
// Preserve the previous complete snapshot if any request fails.
fs.writeFileSync(output, `${JSON.stringify(snapshots, null, 4)}\n`);
