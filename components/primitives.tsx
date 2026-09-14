/**
 * Shared display pieces for the /agents-md project pages.
 *
 * Presentational components shared across project pages.
 */

import Link from 'next/link';
import type { AgentsProject, PatternId } from './agents-md-data';
import { formatStars, PATTERNS_BY_ID, readMinutes } from './agents-md-data';

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
