import type { MetadataRoute } from 'next';
import { getAgentsProjects } from '@/lib/agents-md';
import { projectHref, projectSkillsHref, skillHref } from '@/lib/project-paths';
import { SITE_URL } from '@/lib/schema';
import { getSkillManifest } from '@/lib/skills';

export default function sitemap(): MetadataRoute.Sitemap {
    const paths = ['/', '/agent-rules', '/skills'];
    for (const project of getAgentsProjects()) {
        paths.push(projectHref(project));
        const skills = getSkillManifest(project.slug)?.skills ?? [];
        if (skills.length) paths.push(projectSkillsHref(project));
        for (const skill of skills) paths.push(skillHref(project, skill.id));
    }
    // Snapshot/scan timestamps are not page modification dates. Omit lastmod.
    return paths.map((path) => ({ url: `${SITE_URL}${path}` }));
}
