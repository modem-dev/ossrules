import 'server-only';
import type { AgentsProject } from '@/components/agents-md-data';
import { logoSrc } from '@/components/agents-md-data';
import type { SkillEntry } from '@/components/skill-explorer';
import { projectSkillsHref, skillHref } from './project-paths';
import type { SkillRecord } from './skill-schema';
import { getSkillManifest } from './skills';

export function skillEntry(skill: SkillRecord, project: AgentsProject): SkillEntry {
    const manifest = getSkillManifest(project.slug);
    return {
        id: skill.id,
        href: skillHref(project, skill.id),
        name: skill.name,
        description: skill.description,
        path: skill.path,
        files: skill.files.length,
        complete: skill.files.every((file) => !file.omitted),
        contributions: skill.contributions,
        historyUrl: manifest
            ? `https://github.com/${manifest.repository}/commits/${manifest.sha}/${skill.path.split('/').map(encodeURIComponent).join('/')}`
            : undefined,
        project: {
            href: projectSkillsHref(project),
            slug: project.slug,
            name: project.name,
            logo: logoSrc(project),
            repository: `${project.owner}/${project.repo}`,
        },
    };
}
