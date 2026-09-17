import path from 'node:path';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { remarkSkillFileLinks } from '@/lib/skill-file-links';
import type { SkillHeading } from '@/lib/skill-outline';
import { bundleFilePath, safeRelativePath } from '@/lib/skill-schema';
import { DocumentMarkdown } from './document-markdown';

export function SkillMarkdown({
    source,
    currentFile,
    files,
    baseHref,
    upstreamRoot,
    headings,
}: {
    source: string;
    currentFile: string;
    files: string[];
    baseHref: string;
    upstreamRoot: string;
    headings: SkillHeading[];
}) {
    function destination(href: string): string {
        const relative = bundleFilePath(currentFile, href);
        if (relative && files.includes(relative))
            return `${baseHref}?file=${encodeURIComponent(relative)}#${href.includes('#') ? href.split('#').slice(1).join('#') : 'skill-document-title'}`;
        if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) return href;
        // GitHub resolves out-of-bundle references against the pinned repository.
        const url = new URL(upstreamRoot);
        const parts = url.pathname.split('/');
        const repoPath = parts.slice(5).join('/');
        const target = path.posix.normalize(path.posix.join(repoPath, path.posix.dirname(currentFile), href.split('#')[0]));
        if (!safeRelativePath(target)) return '';
        return `${url.origin}${parts.slice(0, 5).join('/')}/${target}${href.includes('#') ? `#${href.split('#').slice(1).join('#')}` : ''}`;
    }

    function link(href: string, children: ReactNode) {
        const to = href ? destination(href) : '';
        if (!to) return <span>{children}</span>;
        return to.startsWith(`${baseHref}?`) ? (
            <Link href={to} className="skill-file-link" title={`Open ${bundleFilePath(currentFile, href)} in this skill`}>
                <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M9.5 1.5h-6v13h9v-10l-3-3Z" />
                    <path d="M9.5 1.5v3h3M5.5 8h5M5.5 10.5h4" />
                </svg>
                {children}
            </Link>
        ) : (
            <a href={to} target={to.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer">
                {children}
            </a>
        );
    }
    const byLine = new Map(headings.map((heading) => [heading.line, heading]));
    function heading(level: 1 | 2 | 3 | 4 | 5 | 6, children: ReactNode, line?: number) {
        const item = line === undefined ? undefined : byLine.get(line);
        const Tag = `h${level}` as const;
        return (
            <Tag id={item?.id} tabIndex={item ? -1 : undefined}>
                {children}
            </Tag>
        );
    }
    return (
        <DocumentMarkdown
            source={source}
            plugins={[[remarkSkillFileLinks, { currentFile, files }]]}
            components={{
                a: ({ href, children }) => link(href ?? '', children),
                img: ({ src, alt }) => (typeof src === 'string' && src ? link(src, alt || 'View image') : null),
                h1: ({ children, node }) => heading(1, children, node?.position?.start.line),
                h2: ({ children, node }) => heading(2, children, node?.position?.start.line),
                h3: ({ children, node }) => heading(3, children, node?.position?.start.line),
                h4: ({ children, node }) => heading(4, children, node?.position?.start.line),
                h5: ({ children, node }) => heading(5, children, node?.position?.start.line),
                h6: ({ children, node }) => heading(6, children, node?.position?.start.line),
            }}
        />
    );
}
