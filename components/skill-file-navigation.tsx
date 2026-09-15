'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

function showDocument() {
    const heading = document.getElementById('skill-document-title');
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: 'start' });
}

export function SkillFileNavigation({
    files,
    selectedPath,
    baseHref,
}: {
    files: { path: string; omitted?: string }[];
    selectedPath: string;
    baseHref: string;
}) {
    const picker = useRef<HTMLDetailsElement>(null);
    const pendingPath = useRef<string | null>(null);

    useEffect(() => {
        if (pendingPath.current !== selectedPath) return;
        pendingPath.current = null;
        if (window.matchMedia('(max-width: 760px)').matches) showDocument();
    }, [selectedPath]);

    function fileLinks(mobile: boolean) {
        return (
            <nav aria-label={mobile ? 'Choose skill file' : 'Skill files'}>
                <ul>
                    {files.map((item) => (
                        <li key={item.path}>
                            <Link
                                href={`${baseHref}?file=${encodeURIComponent(item.path)}`}
                                scroll={false}
                                aria-current={item.path === selectedPath ? 'page' : undefined}
                                onNavigate={
                                    mobile
                                        ? () => {
                                              if (picker.current) picker.current.open = false;
                                              if (item.path === selectedPath) showDocument();
                                              else pendingPath.current = item.path;
                                          }
                                        : undefined
                                }
                            >
                                <span aria-hidden className="shrink-0">
                                    {item.path.endsWith('.sh') ? '>_' : '▤'}
                                </span>
                                <span className="min-w-0 [overflow-wrap:anywhere]">
                                    {item.path}
                                    {item.omitted ? <span className="block text-[11px]">Not bundled</span> : null}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        );
    }

    return (
        <div className="skill-file-navigation">
            <div className="skill-desktop-files">
                <p className="eyebrow mb-3">Files</p>
                {fileLinks(false)}
            </div>
            <details
                ref={picker}
                className="skill-mobile-files"
                onKeyDown={(event) => {
                    if (event.key === 'Escape' && picker.current?.open) {
                        picker.current.open = false;
                        picker.current.querySelector('summary')?.focus();
                        event.stopPropagation();
                    }
                }}
            >
                <summary>
                    <span className="font-mono [overflow-wrap:anywhere]">{selectedPath}</span>
                    <span className="skill-file-count">
                        Browse {files.length} {files.length === 1 ? 'file' : 'files'}
                    </span>
                </summary>
                {fileLinks(true)}
            </details>
        </div>
    );
}
