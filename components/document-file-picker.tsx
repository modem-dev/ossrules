'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

function showDocument() {
    const heading = document.getElementById('skill-document-title');
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: 'start' });
}

export function DocumentFilePicker({
    files,
    selectedPath,
    baseHref,
    onSelect,
}: {
    files: { path: string; omitted?: string }[];
    selectedPath: string;
    baseHref?: string;
    onSelect?: (path: string) => void;
}) {
    const picker = useRef<HTMLDetailsElement>(null);
    const pendingPath = useRef<string | null>(null);
    const [query, setQuery] = useState('');

    useEffect(() => {
        if (!baseHref) return;
        if (pendingPath.current === selectedPath) {
            pendingPath.current = null;
            showDocument();
            return;
        }
        // Wait for Next's hash navigation to commit before moving keyboard focus.
        const frame = window.requestAnimationFrame(() => {
            if (!window.location.hash) return;
            try {
                document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.focus({ preventScroll: true });
            } catch {
                // An invalid upstream fragment should not prevent reading the file.
            }
        });
        return () => window.cancelAnimationFrame(frame);
    }, [selectedPath, baseHref]);

    useEffect(() => {
        function outside(event: PointerEvent) {
            if (picker.current?.open && event.target instanceof Node && !picker.current.contains(event.target)) {
                picker.current.open = false;
            }
        }
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, []);

    const visible = files.filter((file) => file.path.toLowerCase().includes(query.trim().toLowerCase()));
    const groups = new Map<string, typeof files>();
    for (const file of visible) {
        const group = file.path.includes('/') ? `${file.path.split('/')[0]}/` : 'Files';
        const items = groups.get(group) ?? [];
        items.push(file);
        groups.set(group, items);
    }

    return (
        <details
            ref={picker}
            className="skill-file-picker"
            // Native disclosures can be opened before the streamed reader hydrates.
            suppressHydrationWarning
            onToggle={(event) => {
                if (!event.currentTarget.open) setQuery('');
            }}
            onBlur={(event) => {
                if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
            }}
            onKeyDown={(event) => {
                if (event.key === 'Escape' && picker.current?.open) {
                    event.preventDefault();
                    picker.current.open = false;
                    picker.current.querySelector('summary')?.focus();
                    event.stopPropagation();
                }
            }}
        >
            <summary>
                <span className="skill-picker-path">{selectedPath}</span>
                <span className="skill-file-count">
                    Browse {files.length} {files.length === 1 ? 'file' : 'files'}
                </span>
            </summary>
            <div className="skill-picker-panel">
                {files.length > 12 ? (
                    <input
                        type="search"
                        aria-label="Find a file"
                        placeholder="Find a file…"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                ) : null}
                <nav aria-label="Choose file">
                    {[...groups].map(([group, items]) => (
                        <div key={group}>
                            <p className="eyebrow">{group}</p>
                            <ul>
                                {items.map((item) => (
                                    <li key={item.path}>
                                        {baseHref ? (
                                            <Link
                                                href={`${baseHref}?file=${encodeURIComponent(item.path)}`}
                                                scroll={false}
                                                aria-current={item.path === selectedPath ? 'page' : undefined}
                                                onNavigate={() => {
                                                    if (picker.current) picker.current.open = false;
                                                    if (item.path === selectedPath) showDocument();
                                                    else pendingPath.current = item.path;
                                                }}
                                            >
                                                <span aria-hidden className="shrink-0">
                                                    {item.path.endsWith('.sh') ? '>_' : '▤'}
                                                </span>
                                                <span className="min-w-0 [overflow-wrap:anywhere]">
                                                    {item.path}
                                                    {item.omitted ? <span className="block text-[11px]">Not bundled</span> : null}
                                                </span>
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                aria-current={item.path === selectedPath ? 'page' : undefined}
                                                onClick={() => {
                                                    if (picker.current) picker.current.open = false;
                                                    picker.current?.querySelector('summary')?.focus();
                                                    onSelect?.(item.path);
                                                }}
                                            >
                                                {' '}
                                                <span aria-hidden className="shrink-0">
                                                    {item.path.endsWith('.sh') ? '>_' : '▤'}
                                                </span>
                                                <span className="min-w-0 [overflow-wrap:anywhere]">
                                                    {item.path}
                                                    {item.omitted ? <span className="block text-[11px]">Not bundled</span> : null}
                                                </span>
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {!visible.length ? <p role="status">No files match “{query}”.</p> : null}
                </nav>
            </div>
        </details>
    );
}
