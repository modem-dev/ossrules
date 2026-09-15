import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { getAgentsProject, getAgentsProjects } from './agents-md';
import type { SkillFile, SkillManifest } from './skill-schema';

export const getSkillManifest = cache((slug: string): SkillManifest | undefined => {
    if (!getAgentsProject(slug)) return undefined;
    const filename = path.join(process.cwd(), 'content/skills', `${slug}.json`);
    if (!fs.existsSync(filename)) return undefined;
    return JSON.parse(fs.readFileSync(filename, 'utf8')) as SkillManifest;
});

export function getProjectSkills(slug: string) {
    return getSkillManifest(slug)?.skills ?? [];
}

export function getAllSkills() {
    return getAgentsProjects().flatMap((project) => getProjectSkills(project.slug).map((skill) => ({ skill, project })));
}

export function readSkillFile(slug: string, file: SkillFile): Buffer | undefined {
    if (!getAgentsProject(slug) || file.omitted || !/^[a-f0-9]{40}$/.test(file.blob)) return undefined;
    return fs.readFileSync(path.join(process.cwd(), 'content/skill-files', slug, file.blob));
}

export function skillSourceUrl(manifest: SkillManifest, filePath: string) {
    return `https://github.com/${manifest.repository}/blob/${manifest.sha}/${filePath.split('/').map(encodeURIComponent).join('/')}`;
}
