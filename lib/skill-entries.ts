import 'server-only';
import type { AgentsProject } from '@/components/agents-md-data';
import { logoSrc } from '@/components/agents-md-data';
import type { SkillEntry } from '@/components/skill-explorer';
import type { SkillRecord } from './skill-schema';
import { skillHref } from './skills';

export function skillEntry(skill: SkillRecord, project: AgentsProject): SkillEntry {
    return {
        id: skill.id,
        href: skillHref(project.slug, skill.id),
        name: skill.name,
        description: skill.description,
        path: skill.path,
        files: skill.files.length,
        complete: skill.files.every((file) => !file.omitted),
        project: { slug: project.slug, name: project.name, logo: logoSrc(project), repository: `${project.owner}/${project.repo}` },
    };
}
