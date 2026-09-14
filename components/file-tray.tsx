'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { VendoredFile } from './agents-md-data';

/**
 * Reads the files a project's AGENTS.md points at, without leaving the page.
 *
 * The files are served from our own origin, vendored at the same commit the
 * entry was measured against (scripts/sync-agents-md-files.ts), so what opens
 * here is the revision the analysis on the page describes. They are fetched when
 * a reader opens one rather than inlined, because a project like Airflow routes
 * to eighteen documents and nobody opens all of them.
 *
 * Files are shown as source, not rendered. This is a directory of instruction
 * files: the markdown syntax is part of what is being read, and rendering it
 * away would show something an agent never sees.
 */

interface TrayRequest {
    path: string;
    /** First line of a quote to scroll to and mark, when opened from a technique. */
    match?: string;
}

interface TrayContext {
    open: (request: TrayRequest) => void;
    /** Paths with a local copy, so a caller can avoid offering a file that will 404. */
    readable: Set<string>;
    /** Paths the AGENTS.md names that do not exist in the repository at this commit. */
    missing: Set<string>;
}

const FileTrayContext = createContext<TrayContext | undefined>(undefined);

export function useFileTray(): TrayContext | undefined {
    return useContext(FileTrayContext);
}

const FENCE = /^\s*(```|~~~)/;
const HEADING = /^#{1,6} /;
const QUOTE = /^\s*>/;
const BULLET = /^\s*([-*+]|\d+\.)\s/;

const LINE_CLASS = {
    heading: 'text-teal',
    code: 'text-gray-500',
    fence: 'text-gray-600',
    bullet: 'text-light-cream/80',
    quote: 'text-gray-550 italic',
    text: 'text-light-cream/70',
} as const;

/**
 * Tints a line by what it is in the source. Deliberately a line-level classifier
 * rather than a markdown parser: it never has to escape or trust the content,
 * and it works the same on the .rst files in the corpus.
 */
function classifyLines(source: string): { text: string; tone: keyof typeof LINE_CLASS }[] {
    let inFence = false;
    return source.split('\n').map((text) => {
        if (FENCE.test(text)) {
            inFence = !inFence;
            return { text, tone: 'fence' as const };
        }
        if (inFence) return { text, tone: 'code' as const };
        if (HEADING.test(text)) return { text, tone: 'heading' as const };
        if (QUOTE.test(text)) return { text, tone: 'quote' as const };
        if (BULLET.test(text)) return { text, tone: 'bullet' as const };
        return { text, tone: 'text' as const };
    });
}

function formatBytes(bytes: number): string {
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`;
}

interface TrayProps {
    slug: string;
    owner: string;
    repo: string;
    sha: string;
    files: VendoredFile[];
    license?: string;
    licensePath?: string;
    children: React.ReactNode;
}

export function FileTrayProvider({ slug, owner, repo, sha, files, license, licensePath, children }: TrayProps) {
    const [request, setRequest] = useState<TrayRequest | undefined>();
    const [source, setSource] = useState<string | undefined>();
    const [failed, setFailed] = useState(false);
    const cache = useRef(new Map<string, string>());
    const panel = useRef<HTMLDivElement>(null);
    const returnFocus = useRef<HTMLElement | null>(null);

    const byPath = useMemo(() => new Map(files.map((file) => [file.path, file])), [files]);
    const readable = useMemo(() => new Set(files.filter((file) => !file.missing).map((file) => file.path)), [files]);
    const missing = useMemo(() => new Set(files.filter((file) => file.missing).map((file) => file.path)), [files]);

    const open = useCallback((next: TrayRequest) => {
        returnFocus.current = document.activeElement as HTMLElement | null;
        setRequest(next);
    }, []);

    const close = useCallback(() => {
        setRequest(undefined);
        returnFocus.current?.focus();
    }, []);

    const context = useMemo(() => ({ open, readable, missing }), [open, readable, missing]);
    const path = request?.path;

    useEffect(() => {
        if (!path) {
            setSource(undefined);
            setFailed(false);
            return;
        }
        const cached = cache.current.get(path);
        if (cached !== undefined) {
            setSource(cached);
            return;
        }
        setSource(undefined);
        setFailed(false);

        let live = true;
        const url = `/agents-md/files/${slug}/${path.split('/').map(encodeURIComponent).join('/')}`;
        fetch(url)
            .then((response) => (response.ok ? response.text() : Promise.reject(new Error(String(response.status)))))
            .then((text) => {
                cache.current.set(path, text);
                if (live) setSource(text);
            })
            .catch(() => {
                if (live) setFailed(true);
            });

        return () => {
            live = false;
        };
    }, [path, slug]);

    // Escape closes, and the page behind must not scroll while the tray is over it.
    useEffect(() => {
        if (!path) return;
        const abort = new AbortController();
        window.addEventListener(
            'keydown',
            (event) => {
                if (event.key === 'Escape') close();
            },
            { signal: abort.signal },
        );
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        panel.current?.focus();
        return () => {
            abort.abort();
            document.body.style.overflow = previous;
        };
    }, [path, close]);

    const file = path ? byPath.get(path) : undefined;
    const lines = source === undefined ? undefined : classifyLines(source);

    // The line a technique quote starts on, so the tray can open where it is cited.
    const markedLine = useMemo(() => {
        if (!lines || !request?.match) return -1;
        const needle = request.match.trim().split('\n')[0].trim();
        if (needle.length === 0) return -1;
        return lines.findIndex((line) => line.text.includes(needle));
    }, [lines, request?.match]);

    useEffect(() => {
        if (markedLine < 0) return;
        panel.current?.querySelector(`[data-line="${markedLine}"]`)?.scrollIntoView({ block: 'center' });
    }, [markedLine]);

    return (
        <FileTrayContext.Provider value={context}>
            {children}
            {path ? (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <button
                        type="button"
                        aria-label="Close file"
                        onClick={close}
                        className="absolute inset-0 cursor-default bg-marketing-black/70 backdrop-blur-sm"
                    />
                    <div
                        ref={panel}
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                        aria-label={path}
                        className="relative flex h-full w-full max-w-[46rem] flex-col border-gray-750/70 border-l bg-dark-gray shadow-2xl outline-none"
                    >
                        <div className="flex items-start gap-3 border-gray-750/70 border-b px-5 py-4">
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-mono text-light-cream text-sm">{path}</p>
                                <p className="mt-1 font-inter text-gray-550 text-xs">
                                    {owner}/{repo} at {sha.slice(0, 7)}
                                    {file ? ` · ${formatBytes(file.bytes)} · ${file.lines} lines` : ''}
                                    {license ? ` · ${license}` : ''}
                                </p>
                            </div>
                            <a
                                href={`https://github.com/${owner}/${repo}/blob/${sha}/${path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 font-inter text-teal text-xs hover:underline"
                            >
                                GitHub
                            </a>
                            <button
                                type="button"
                                onClick={close}
                                aria-label="Close"
                                className="-mr-1 shrink-0 cursor-pointer px-1 font-inter text-gray-550 text-sm transition-colors hover:text-light-cream"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-auto bg-gray-850">
                            {failed ? (
                                <p className="p-5 font-roboto text-gray-550 text-sm">
                                    That file could not be loaded. It is still available{' '}
                                    <a
                                        href={`https://github.com/${owner}/${repo}/blob/${sha}/${path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-teal hover:underline"
                                    >
                                        on GitHub
                                    </a>
                                    .
                                </p>
                            ) : lines === undefined ? (
                                <p className="p-5 font-inter text-gray-600 text-xs">Loading…</p>
                            ) : (
                                <pre className="p-5 font-mono text-[12.5px] leading-5">
                                    {lines.map((line, index) => (
                                        <div
                                            // biome-ignore lint/suspicious/noArrayIndexKey: source lines are identified by position.
                                            key={index}
                                            data-line={index}
                                            className={`flex gap-4 ${index === markedLine ? 'bg-dark-teal/50' : ''}`}
                                        >
                                            <span className="w-8 shrink-0 select-none text-right text-gray-700">{index + 1}</span>
                                            <span className={`whitespace-pre-wrap break-words ${LINE_CLASS[line.tone]}`}>
                                                {line.text || ' '}
                                            </span>
                                        </div>
                                    ))}
                                </pre>
                            )}
                        </div>

                        {file?.truncated ? (
                            <p className="border-gray-750/70 border-t px-5 py-3 font-inter text-gray-550 text-xs">
                                Showing the first {formatBytes(new Blob([source ?? '']).size)} of {formatBytes(file.bytes)}.{' '}
                                <a
                                    href={`https://github.com/${owner}/${repo}/blob/${sha}/${path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-teal hover:underline"
                                >
                                    Read the rest on GitHub
                                </a>
                                .
                            </p>
                        ) : (
                            <p className="border-gray-750/70 border-t px-5 py-3 font-inter text-gray-600 text-xs">
                                Copy stored at the pinned commit.{' '}
                                {license ? `${owner}/${repo} is ${license}-licensed` : `See ${owner}/${repo} for its license`}
                                {licensePath ? (
                                    <>
                                        {' ('}
                                        <a
                                            href={`https://github.com/${owner}/${repo}/blob/${sha}/${licensePath}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-teal hover:underline"
                                        >
                                            {licensePath}
                                        </a>
                                        {')'}
                                    </>
                                ) : null}
                                .
                            </p>
                        )}
                    </div>
                </div>
            ) : null}
        </FileTrayContext.Provider>
    );
}

/**
 * Opens a file in the tray.
 *
 * A path the AGENTS.md names but the repository does not contain is rendered as
 * plain text saying so, rather than as a link to a page that 404s as well. That
 * an instruction file points at a document which is not there is a fact about
 * the file, and worth showing rather than papering over.
 */
export function FileLink({
    path,
    label,
    href,
    className,
    children,
}: {
    path: string;
    label?: string;
    href: string;
    className?: string;
    children: React.ReactNode;
}) {
    const tray = useFileTray();

    if (tray?.missing.has(path)) {
        return (
            <span className="text-gray-650" title={label}>
                <span className="line-through decoration-gray-700">{children}</span>
                <span className="text-gray-700"> — not in the repository at this commit</span>
            </span>
        );
    }

    if (!tray || !tray.readable.has(path)) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={className} title={label}>
                {children}
            </a>
        );
    }

    return (
        <button type="button" onClick={() => tray.open({ path })} className={className} title={label}>
            {children}
        </button>
    );
}

/**
 * Wraps a verbatim technique quote so it opens AGENTS.md at the line it came
 * from. Every quote in the corpus is character-for-character from the file, so
 * the first line of one is enough to find it.
 */
export function QuoteLink({ quote, children }: { quote: string; children: React.ReactNode }) {
    const tray = useFileTray();

    if (!tray || !tray.readable.has('AGENTS.md')) return <>{children}</>;

    return (
        <button
            type="button"
            onClick={() => tray.open({ path: 'AGENTS.md', match: quote })}
            className="group block w-full cursor-pointer text-left"
            title="Show this in the file"
        >
            {children}
            <span className="mt-1.5 block font-inter text-gray-600 text-xs transition-colors group-hover:text-teal">
                Show in AGENTS.md →
            </span>
        </button>
    );
}
