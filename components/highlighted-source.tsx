'use client';

import { Fragment, useEffect, useState } from 'react';
import type { ThemedTokenWithVariants } from 'shiki';

/** Tokens become React text nodes, never trusted HTML from a repository. */
export function HighlightedSource({
    source,
    language,
    numbered = false,
    markedLine = -1,
    markedCount = 0,
    lineAnchors = [],
}: {
    source: string;
    language: string;
    numbered?: boolean;
    markedLine?: number;
    markedCount?: number;
    lineAnchors?: { id: string; line: number }[];
}) {
    const [result, setResult] = useState<{ source: string; language: string; tokens: ThemedTokenWithVariants[][] }>();
    useEffect(() => {
        let live = true;
        import('@/lib/syntax')
            .then(({ highlight }) => highlight(source, language))
            .then((tokens) => {
                if (live && tokens) setResult({ source, language, tokens });
            })
            .catch(() => {
                /* Unknown grammars or unavailable highlighting leave readable, verbatim source. */
            });
        return () => {
            live = false;
        };
    }, [source, language]);
    const tokens = result?.source === source && result.language === language ? result.tokens : undefined;
    const anchors = new Map(lineAnchors.map(({ id, line }) => [line, id]));
    return (
        <pre className={numbered ? 'source-code' : undefined}>
            <code>
                {source.split('\n').map((line, index) => {
                    const content =
                        tokens?.[index]?.map((token, tokenIndex) => (
                            <span
                                // biome-ignore lint/suspicious/noArrayIndexKey: tokens have stable positions within a source line.
                                key={tokenIndex}
                                style={{
                                    color: `light-dark(${token.variants.light.color}, ${token.variants.dark.color})`,
                                    fontStyle: (token.variants.light.fontStyle ?? 0) & 1 ? 'italic' : undefined,
                                    fontWeight: (token.variants.light.fontStyle ?? 0) & 2 ? 600 : undefined,
                                }}
                            >
                                {token.content}
                            </span>
                        )) ?? line;
                    return numbered ? (
                        <span
                            // biome-ignore lint/suspicious/noArrayIndexKey: source line numbers identify positions.
                            key={index}
                            className="source-line"
                            id={anchors.get(index + 1)}
                            tabIndex={anchors.has(index + 1) ? -1 : undefined}
                            data-line={index}
                            data-highlight={index >= markedLine && index < markedLine + markedCount ? true : undefined}
                        >
                            <span aria-hidden className="source-line-number">
                                {index + 1}
                            </span>
                            <span className="min-w-0 whitespace-pre-wrap text-gray-400 [overflow-wrap:anywhere]">
                                {line ? content : ' '}
                            </span>
                        </span>
                    ) : (
                        // biome-ignore lint/suspicious/noArrayIndexKey: source line numbers identify positions.
                        <Fragment key={index}>
                            {index > 0 ? '\n' : ''}
                            {content}
                        </Fragment>
                    );
                })}
            </code>
        </pre>
    );
}
