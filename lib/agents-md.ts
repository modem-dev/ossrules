import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import type { AgentsProject } from '@/components/agents-md/agents-md-data';
import { validateAgentsProject } from '@/components/agents-md/agents-md-schema';

/**
 * Loads the AGENTS.md corpus from content/agents-md/*.json.
 *
 * Entries are one JSON file per project so a new one can be produced, reviewed
 * and merged on its own. The procedure for writing one is in
 * .claude/skills/agents-md-entry/SKILL.md; this module is the consumer, and it
 * validates rather than trusts: an entry that does not match the schema throws
 * at build time instead of rendering a half-empty page.
 */

const CONTENT_DIR = path.join(process.cwd(), 'content', 'agents-md');

let cache: AgentsProject[] | undefined;

export function getAgentsProjects(): AgentsProject[] {
    if (cache) return cache;

    const files = fs.readdirSync(CONTENT_DIR).filter((name) => name.endsWith('.json'));
    const projects = files.map((name) => {
        const raw = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, name), 'utf8')) as unknown;
        const errors = validateAgentsProject(raw, name);
        if (errors.length > 0) {
            throw new Error(`Invalid AGENTS.md entry in content/agents-md/${name}:\n  ${errors.join('\n  ')}`);
        }
        const project = raw as AgentsProject;
        if (project.slug !== name.replace(/\.json$/, '')) {
            throw new Error(`content/agents-md/${name} declares slug "${project.slug}"; filename and slug must match.`);
        }
        return project;
    });

    // Stars descending is the directory's default order and the order the
    // previous/next links on a project page follow.
    cache = projects.sort((a, b) => b.stars - a.stars);
    return cache;
}

export function getAgentsProject(slug: string): AgentsProject | undefined {
    return getAgentsProjects().find((project) => project.slug === slug);
}

export function agentsProjectSlugs(): string[] {
    return getAgentsProjects().map((project) => project.slug);
}

export function projectsWithPattern(pattern: string): AgentsProject[] {
    return getAgentsProjects().filter((project) => (project.patterns as string[]).includes(pattern));
}
