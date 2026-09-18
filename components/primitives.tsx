/**
 * Shared display pieces for the /agents-md project pages.
 *
 * Presentational components shared across project pages.
 */

import Link from 'next/link';
import type { PatternId } from './agents-md-data';
import { PATTERNS_BY_ID } from './agents-md-data';

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
