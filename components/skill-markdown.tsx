import path from 'node:path';
import Link from 'next/link';
import { Children, isValidElement, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { bundleFilePath, safeRelativePath } from '@/lib/skill-schema';

function headingText(children: ReactNode): string {
    return Children.toArray(children)
        .map((child) => (isValidElement<{ children?: ReactNode }>(child) ? headingText(child.props.children) : String(child)))
        .join('');
}

export function SkillMarkdown({
    source,
    currentFile,
    files,
    baseHref,
    upstreamRoot,
}: {
    source: string;
    currentFile: string;
    files: string[];
    baseHref: string;
    upstreamRoot: string;
}) {
    function destination(href: string): string {
        const relative = bundleFilePath(currentFile, href);
        if (relative && files.includes(relative))
            return `${baseHref}?file=${encodeURIComponent(relative)}${href.includes('#') ? `#${href.split('#').slice(1).join('#')}` : ''}`;
        if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) return href;
        // GitHub resolves out-of-bundle references against the pinned repository.
        const url = new URL(upstreamRoot);
        const parts = url.pathname.split('/');
        const repoPath = parts.slice(5).join('/');
        const target = path.posix.normalize(path.posix.join(repoPath, path.posix.dirname(currentFile), href.split('#')[0]));
        if (!safeRelativePath(target)) return '';
        return `${url.origin}${parts.slice(0, 5).join('/')}/${target}${href.includes('#') ? `#${href.split('#').slice(1).join('#')}` : ''}`;
    }
    const used = new Map<string, number>();
    function heading(level: 1 | 2 | 3 | 4 | 5 | 6, children: ReactNode) {
        const text = headingText(children)
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s_-]/gu, '')
            .replace(/\s/g, '-');
        const count = used.get(text) ?? 0;
        used.set(text, count + 1);
        const Tag = `h${level}` as const;
        return <Tag id={count ? `${text}-${count}` : text}>{children}</Tag>;
    }
    return (
        <div className="skill-markdown">
            <Markdown
                remarkPlugins={[remarkGfm]}
                skipHtml
                components={{
                    a: ({ href, children }) => {
                        const to = href ? destination(href) : '';
                        if (!to) return <span>{children}</span>;
                        return to.startsWith(`${baseHref}?`) ? (
                            <Link href={to} scroll={false}>
                                {children}
                            </Link>
                        ) : (
                            <a href={to} target={to.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer">
                                {children}
                            </a>
                        );
                    },
                    img: ({ src, alt }) =>
                        typeof src === 'string' && src ? (
                            <a href={destination(src)} target="_blank" rel="noopener noreferrer">
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
