/**
 * Shared display pieces for the /agents-md collection.
 *
 * Presentational components shared across project pages.
 */

import Link from 'next/link';
import type { AgentsProject, Pattern, PatternId } from './agents-md-data';
import { AGENTS_PROJECTS, formatStars, PATTERNS_BY_ID, readMinutes } from './agents-md-data';

/** Longest file in the collection, used to scale every relative bar to a shared axis. */
const MAX_LINES = Math.max(...AGENTS_PROJECTS.map((project) => project.file.lines));

export function PatternBadge({ pattern, href }: { pattern: PatternId; href?: string }) {
    const label = PATTERNS_BY_ID[pattern].name;
    const className =
        'inline-block rounded-full border border-dark-teal/60 bg-dark-teal/20 px-2.5 py-1 font-inter text-xs text-teal/90 leading-none';

    if (!href) {
        return <span className={className}>{label}</span>;
    }

    return (
        <Link href={href} className={`${className} hover:border-teal/70 hover:text-teal transition-colors`}>
            {label}
        </Link>
    );
}

/**
 * Relative length bar. The comparison is the point: seeing that Ghostty is 39
 * lines next to herdr's 317 is the fastest way to understand that these files
 * do not agree on what an AGENTS.md is for.
 */
export function LineBar({ lines, label = true }: { lines: number; label?: boolean }) {
    const percent = Math.max(3, Math.round((lines / MAX_LINES) * 100));

    return (
        <div className="flex items-center gap-3">
            <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-750"
                role="img"
                aria-label={`${lines} lines, relative to the longest file in the collection at ${MAX_LINES} lines`}
            >
                <div className="h-full rounded-full bg-teal/70" style={{ width: `${percent}%` }} />
            </div>
            {label ? <span className="font-mono text-xs text-gray-550 tabular-nums">{lines} lines</span> : null}
        </div>
    );
}

export function StatTile({ value, label, hint }: { value: string; label: string; hint?: string }) {
    return (
        <div className="rounded-lg border border-gray-750/70 bg-medium-gray/40 px-4 py-3">
            <div className="font-unit-medium text-2xl text-light-cream tabular-nums leading-none">{value}</div>
            <div className="mt-1.5 font-inter text-xs text-gray-550 leading-snug">{label}</div>
            {hint ? <div className="mt-0.5 font-inter text-[11px] text-gray-600 leading-snug">{hint}</div> : null}
        </div>
    );
}

/** The full measured profile of one AGENTS.md. */
export function FileStatGrid({ project }: { project: AgentsProject }) {
    const stats: { value: string; label: string; hint?: string }[] = [
        { value: project.file.lines.toLocaleString(), label: 'Lines' },
        { value: project.file.words.toLocaleString(), label: 'Words', hint: `about ${readMinutes(project)} min read` },
        { value: `${(project.file.bytes / 1024).toFixed(1)}kB`, label: 'File size' },
        { value: String(project.file.headings), label: 'Headings' },
        { value: String(project.file.bullets), label: 'Bullet rules' },
        { value: String(project.file.codeBlocks), label: 'Code blocks' },
        {
            value: String(project.file.docLinks),
            label: 'Links to other docs',
            hint: project.file.docLinks > 5 ? 'router style' : undefined,
        },
        { value: formatStars(project.stars), label: 'Repo stars' },
    ];

    return (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-gray-750/70 bg-medium-gray/40 px-4 py-3">
                    <dd className="font-unit-medium text-xl text-light-cream tabular-nums leading-none">{stat.value}</dd>
                    <dt className="mt-1.5 font-inter text-xs text-gray-550 leading-snug">{stat.label}</dt>
                    {stat.hint ? <dd className="mt-0.5 font-inter text-[11px] text-gray-600 leading-snug">{stat.hint}</dd> : null}
                </div>
            ))}
        </dl>
    );
}

/**
 * A verbatim excerpt. Rendered in mono so it reads as source rather than as our
 * prose, which matters when the surrounding paragraph is our analysis.
 */
export function Excerpt({ children }: { children: React.ReactNode }) {
    return (
        <blockquote className="mt-3 border-l-2 border-teal/50 bg-gray-850/50 py-2.5 pl-4 pr-3">
            <p className="whitespace-pre-line font-mono text-[13px] text-gray-400 leading-relaxed">{children}</p>
        </blockquote>
    );
}

export function PatternCard({ pattern, projects }: { pattern: Pattern; projects: AgentsProject[] }) {
    return (
        <div className="rounded-xl border border-gray-750/70 bg-medium-gray/30 p-5">
            <h3 className="font-unit-medium text-lg text-light-cream leading-snug">{pattern.name}</h3>
            <p className="mt-1.5 font-roboto text-[15px] text-light-cream/75 leading-relaxed">{pattern.summary}</p>
            <p className="mt-2.5 font-inter text-sm text-gray-550 leading-relaxed">{pattern.detail}</p>
            {projects.length > 0 ? (
                <p className="mt-3.5 font-inter text-xs text-gray-600 leading-relaxed">
                    Used by{' '}
                    {projects.map((project, index) => (
                        <span key={project.slug}>
                            {index > 0 ? ', ' : ''}
                            <Link href={`/agents-md/${project.slug}`} className="text-teal/80 hover:text-teal hover:underline">
                                {project.name}
                            </Link>
                        </span>
                    ))}
                </p>
            ) : null}
        </div>
    );
}
