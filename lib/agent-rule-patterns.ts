import 'server-only';

import { type PatternId, repoFileUrl } from '@/components/agents-md-data';
import guides from '@/content/patterns/guides.json';
import { getAgentsProject, getDocumentSource, getVendoredFiles, sourceExcerpt } from './agents-md';
import { projectHref } from './project-paths';
import { writeSourceLocation } from './source-location';

/** Editorial selections illustrate different uses, rather than ranking projects by popularity. */
const GUIDES: Record<PatternId, { projects: string[]; moves: string[]; application: string }> = guides;

export function getPatternGuide(pattern: PatternId) {
    const guide = GUIDES[pattern];
    if (guide.moves.length !== 3 || guide.moves.some((move) => !move.trim()) || !guide.application.trim()) {
        throw new Error(`The ${pattern} guide needs three non-empty cues and application guidance.`);
    }
    const examples = guide.projects.map((slug) => {
        const project = getAgentsProject(slug);
        const technique = project?.techniques.find((item) => item.pattern === pattern && item.quote);
        if (!project?.patterns.includes(pattern) || !technique?.quote) {
            throw new Error(`Missing ${pattern} example in ${slug}. Review the pattern guide selection.`);
        }
        const path = technique.sourcePath ?? project.instructionFile ?? 'AGENTS.md';
        const excerpt = sourceExcerpt(getDocumentSource(slug, path), technique.quote);
        if (getVendoredFiles(slug)?.sha !== project.lastCommit.sha || excerpt.startLine === undefined) {
            throw new Error(`Cannot verify ${pattern} example in ${slug}/${path} at its pinned commit.`);
        }
        const lineCount = excerpt.text.split('\n').length;
        const endLine = excerpt.startLine + lineCount - 1;
        const search = writeSourceLocation(
            `technique=${pattern}`,
            { path, startLine: excerpt.startLine, lineCount },
            'raw',
            project.lastCommit.sha,
        );
        return {
            project,
            technique,
            excerpt: { ...excerpt, startLine: excerpt.startLine },
            path,
            endLine,
            sourceHref: `${projectHref(project)}?${search}`,
            upstreamHref: `${repoFileUrl(project, path)}#L${excerpt.startLine}-L${endLine}`,
        };
    });
    return { application: guide.application, moves: guide.moves, examples };
}
