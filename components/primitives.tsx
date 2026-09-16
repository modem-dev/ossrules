/**
 * Shared display pieces for the /agents-md project pages.
 *
 * Presentational only, and deliberately free of Modem marketing imports, so
 * this directory plus the two route files can move to a standalone site.
 */

import Link from 'next/link';
import type { AgentsProject, PatternId } from './agents-md-data';
import { formatStars, PATTERNS_BY_ID } from './agents-md-data';

export function PatternBadge({ pattern, href }: { pattern: PatternId; href?: string }) {
    const label = PATTERNS_BY_ID[pattern].name;
    const className = 'inline-block rounded border border-gray-750 bg-medium-gray px-2.5 py-1.5 text-xs text-teal leading-relaxed';

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
export function FileStatGrid({ project, tokens }: { project: AgentsProject; tokens?: number }) {
    const stats: { value: string; label: string; hint?: string }[] = [
        { value: project.file.lines.toLocaleString(), label: 'Lines' },
        { value: tokens?.toLocaleString('en-US') ?? 'Unavailable', label: 'Tokens', hint: tokens === undefined ? undefined : 'o200k_base' },
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

    function statRows(items: typeof stats) {
        return items.map((stat) => (
            <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>
                    {stat.value}
                    {stat.hint ? <span>{stat.hint}</span> : null}
                </dd>
            </div>
        ));
    }

    return (
        <>
            <dl className="file-stats">{statRows(stats.slice(0, 2))}</dl>
            <details className="mt-2">
                <summary className="inline-summary cursor-pointer text-teal text-xs">File details</summary>
                <dl className="file-stats">{statRows(stats.slice(2))}</dl>
            </details>
        </>
    );
}

/**
 * A verbatim excerpt. Rendered in mono so it reads as source rather than as our
 * prose, which matters when the surrounding paragraph is our analysis.
 */
export function Excerpt({ text, startLine }: { text: string; startLine?: number }) {
    return (
        <blockquote className="m-0">
            {startLine !== undefined ? <span className="sr-only">Source excerpt starting at line {startLine}.</span> : null}
            <pre className="font-mono text-[13px] text-gray-400 leading-7">
                <code>
                    {text.split('\n').map((line, index) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: source lines are identified by position.
                        <span key={index} className={startLine === undefined ? 'block' : 'excerpt-line'}>
                            {startLine !== undefined ? (
                                <span aria-hidden className="excerpt-line-number">
                                    {startLine + index}
                                </span>
                            ) : null}
                            <span className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]">{line || ' '}</span>
                        </span>
                    ))}
                </code>
            </pre>
        </blockquote>
    );
}
