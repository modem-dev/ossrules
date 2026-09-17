import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import type { AgentsProject, VendoredFiles } from '@/components/agents-md-data';
import { toProjectListingEntry } from '@/components/agents-md-data';
import { validateAgentsProject } from '@/components/agents-md-schema';
import { type DocumentMention, documentMentions } from './document-mentions';
import { countSourceTokens } from './token-count';

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

/** Project-page prose stays on the server; the directory receives only listing data. */
export function getProjectListings() {
    return getAgentsProjects().map(toProjectListingEntry);
}

export function getAgentsProjectByRepository(owner: string, repo: string): AgentsProject | undefined {
    return getAgentsProjects().find(
        (project) => project.owner.toLowerCase() === owner.toLowerCase() && project.repo.toLowerCase() === repo.toLowerCase(),
    );
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

/** Resolve excerpt lines at build time without sending the full file to the client. */
export function getAgentsSource(slug: string): string | undefined {
    const project = getAgentsProject(slug);
    if (!project) return undefined;
    return getDocumentSource(slug, project.instructionFile ?? 'AGENTS.md');
}

export function getDocumentSource(slug: string, filePath: string): string | undefined {
    const file = getVendoredFiles(slug)?.files.find((item) => item.path === filePath);
    if (!file || file.missing || file.unavailable) return undefined;
    const sourcePath = path.join(FILES_DIR, slug, file.resolvedPath ?? filePath);
    return fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8') : undefined;
}

export function sourceExcerpt(source: string | undefined, quote: string): { text: string; startLine?: number } {
    if (!source || !quote.trim()) return { text: quote };
    // Editorial quotes may flatten whitespace. Locate the words, then restore
    // the original source lines so wrapping never invents file line numbers.
    const pattern = quote
        .trim()
        .split(/\s+/)
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('\\s+');
    const match = new RegExp(pattern).exec(source);
    if (!match) return { text: quote };
    const startLine = source.slice(0, match.index).split('\n').length;
    const endLine = source.slice(0, match.index + match[0].length).split('\n').length;
    return {
        text: source
            .split('\n')
            .slice(startLine - 1, endLine)
            .join('\n'),
        startLine,
    };
}

/** Enrich only on the server; source and tokenizer remain out of browser bundles. */
export function getInstructionDocuments(slug: string) {
    const files = (getVendoredFiles(slug)?.files ?? []).map((file) => ({
        ...file,
        ...(!file.symlink ? { tokens: countSourceTokens(getDocumentSource(slug, file.path)) } : {}),
    }));
    const mentions: Record<string, DocumentMention[]> = {};
    for (const file of files) {
        if (file.symlink || !/(^|\/)(AGENTS|CLAUDE)\.md$/.test(file.path)) continue;
        for (const [target, passages] of Object.entries(
            documentMentions(
                getDocumentSource(slug, file.path),
                files.map((f) => f.path),
                file.path,
            ),
        )) {
            if (passages.length) {
                mentions[target] ??= [];
                mentions[target].push(...passages);
            }
        }
    }
    return { files, mentions };
}
