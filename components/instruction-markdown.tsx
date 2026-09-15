'use client';

import { Children, isValidElement, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { instructionLink } from '@/lib/instruction-links';
import { HighlightedSource } from './highlighted-source';

function text(children: ReactNode): string {
    return Children.toArray(children)
        .map((child) => (isValidElement<{ children?: ReactNode }>(child) ? text(child.props.children) : String(child)))
        .join('');
}

export function InstructionMarkdown({
    source,
    sourceUrl,
    readable,
    onOpen,
}: {
    source: string;
    sourceUrl: string;
    readable: Set<string>;
    onOpen: (path: string) => void;
}) {
    const ids = new Map<string, number>();
    function heading(level: 1 | 2 | 3 | 4 | 5 | 6, children: ReactNode) {
        const slug = text(children)
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s_-]/gu, '')
            .replace(/\s/g, '-');
        const count = ids.get(slug) ?? 0;
        ids.set(slug, count + 1);
        const Tag = `h${level}` as const;
        return <Tag id={`instruction-${slug}${count ? `-${count}` : ''}`}>{children}</Tag>;
    }
    return (
        <div className="skill-markdown p-5 sm:p-8">
            <Markdown
                remarkPlugins={[remarkGfm]}
                skipHtml
                components={{
                    pre: ({ children }) => {
                        const code = Children.toArray(children).find((child) => isValidElement(child));
                        if (!isValidElement<{ className?: string; children?: ReactNode }>(code)) return <pre>{children}</pre>;
                        return (
                            <HighlightedSource
                                source={text(code.props.children).replace(/\n$/, '')}
                                language={code.props.className?.replace('language-', '') ?? 'text'}
                            />
                        );
                    },
                    a: ({ href, children }) => {
                        if (!href) return <span>{children}</span>;
                        const { href: to, path: target, anchor } = instructionLink(href, sourceUrl);
                        if (!to) return <span>{children}</span>;
                        return (
                            <a
                                href={to}
                                target={href.startsWith('#') || (target && readable.has(target)) ? undefined : '_blank'}
                                rel="noopener noreferrer"
                                onClick={(event) => {
                                    if (href.startsWith('#')) {
                                        event.preventDefault();
                                        event.currentTarget
                                            .closest('.skill-markdown')
                                            ?.querySelectorAll('[id]')
                                            .forEach((element) => {
                                                if (element.id === `instruction-${anchor}`) element.scrollIntoView({ block: 'start' });
                                            });
                                    } else if (target && readable.has(target)) {
                                        event.preventDefault();
                                        onOpen(target);
                                    }
                                }}
                            >
                                {children}
                            </a>
                        );
                    },
                    img: ({ src, alt }) =>
                        typeof src === 'string' && src ? (
                            <a href={instructionLink(src, sourceUrl).href} target="_blank" rel="noopener noreferrer">
                                {alt || 'View image'} ↗
                            </a>
                        ) : null,
                    table: ({ children }) => (
                        <div className="overflow-x-auto">
                            <table>{children}</table>
                        </div>
                    ),
                    h1: ({ children }) => heading(1, children),
                    h2: ({ children }) => heading(2, children),
                    h3: ({ children }) => heading(3, children),
                    h4: ({ children }) => heading(4, children),
                    h5: ({ children }) => heading(5, children),
                    h6: ({ children }) => heading(6, children),
                }}
            >
                {source}
            </Markdown>
        </div>
    );
}
