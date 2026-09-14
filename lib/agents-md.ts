import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import type { AgentsProject, VendoredFiles } from '@/components/agents-md-data';
import { validateAgentsProject } from '@/components/agents-md-schema';

/**
 * Loads the AGENTS.md corpus from content/projects/*.json.
 *
 * Entries are one JSON file per project so a new one can be produced, reviewed
 * and merged on its own. The procedure for writing one is in
 * .claude/skills/agents-md-entry/SKILL.md; this module is the consumer, and it
 * validates rather than trusts: an entry that does not match the schema throws
 * at build time instead of rendering a half-empty page.
 */

const CONTENT_DIR = path.join(process.cwd(), 'content', 'projects');
const FILES_DIR = path.join(process.cwd(), 'public', 'files');

let cache: AgentsProject[] | undefined;
const manifestCache = new Map<string, VendoredFiles>();

export function getAgentsProjects(): AgentsProject[] {
    if (cache) return cache;

    const files = fs.readdirSync(CONTENT_DIR).filter((name) => name.endsWith('.json'));
    const projects = files.map((name) => {
        const raw = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, name), 'utf8')) as unknown;
        const errors = validateAgentsProject(raw, name);
        if (errors.length > 0) {
            throw new Error(`Invalid AGENTS.md entry in content/projects/${name}:\n  ${errors.join('\n  ')}`);
        }
        const project = raw as AgentsProject;
        if (project.slug !== name.replace(/\.json$/, '')) {
            throw new Error(`content/projects/${name} declares slug "${project.slug}"; filename and slug must match.`);
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

/**
 * The local copies of the files a project's AGENTS.md reads, as written by
 * scripts/sync-agents-md-files.ts.
 *
 * Only the index is read here. The file bodies are served as static assets and
 * fetched when a reader actually opens one, so a project with 18 referenced
 * documents does not put half a megabyte of other people's text into its page.
 */
export function getVendoredFiles(slug: string): VendoredFiles | undefined {
    const cached = manifestCache.get(slug);
    if (cached) return cached;

    const manifestPath = path.join(FILES_DIR, slug, 'manifest.json');
    if (!fs.existsSync(manifestPath)) return undefined;

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as VendoredFiles;
    manifestCache.set(slug, manifest);
    return manifest;
}
