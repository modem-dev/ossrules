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
    bullet: 'text-gray-400',
    quote: 'text-gray-550 italic',
    text: 'text-gray-400',
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
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
    const cache = useRef(new Map<string, string>());
    const panel = useRef<HTMLDialogElement>(null);
    const returnFocus = useRef<HTMLElement | null>(null);

    const byPath = useMemo(() => new Map(files.map((file) => [file.path, file])), [files]);
    const readable = useMemo(() => new Set(files.filter((file) => !file.missing).map((file) => file.path)), [files]);
    const missing = useMemo(() => new Set(files.filter((file) => file.missing).map((file) => file.path)), [files]);

    const open = useCallback((next: TrayRequest) => {
        returnFocus.current = document.activeElement as HTMLElement | null;
        setCopyStatus('idle');
        setRequest(next);
    }, []);

    const close = useCallback(() => {
        panel.current?.close();
        setRequest(undefined);
        returnFocus.current?.focus({ preventScroll: true });
    }, []);

    const context = useMemo(() => ({ open, readable, missing }), [open, readable, missing]);
    const path = request?.path;

    const copySource = async () => {
        if (source === undefined) return;
        try {
            await navigator.clipboard.writeText(source);
            setCopyStatus('copied');
        } catch {
            setCopyStatus('failed');
        }
    };

    useEffect(() => {
        if (copyStatus !== 'copied') return;
        const timer = window.setTimeout(() => setCopyStatus('idle'), 2000);
        return () => window.clearTimeout(timer);
    }, [copyStatus]);

    useEffect(() => {
        if (!path) {
            setSource(undefined);
            setFailed(false);
            return;
        }
        setFailed(false);
        const cached = cache.current.get(path);
        if (cached !== undefined) {
            setSource(cached);
            return;
        }
        setSource(undefined);
        setFailed(false);

        let live = true;
        const url = `/files/${slug}/${path.split('/').map(encodeURIComponent).join('/')}`;
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

    // A native modal makes the page behind it inert and contains keyboard focus.
    useEffect(() => {
        if (!path) return;
        const dialog = panel.current;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialog?.showModal();
        dialog?.querySelector<HTMLButtonElement>('[data-close-file]')?.focus();
        return () => {
            dialog?.close();
            document.body.style.overflow = previous;
        };
    }, [path]);

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

    const markedCount = request?.match?.trimEnd().split('\n').length ?? 0;
    const sourceUrl = `https://github.com/${owner}/${repo}/blob/${sha}/${path?.split('/').map(encodeURIComponent).join('/') ?? ''}`;

    return (
        <FileTrayContext.Provider value={context}>
            {children}
            {path ? (
                <dialog
                    ref={panel}
                    aria-label={path}
                    className="source-dialog"
                    onCancel={(event) => {
                        event.preventDefault();
                        close();
                    }}
                >
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Close file"
                        onClick={close}
                        className="absolute inset-0 cursor-default"
                    />
                    <div className="source-panel">
                        <header className="source-header">
                            <div className="min-w-0 flex-1">
                                <p className="break-all font-mono text-sm">{path}</p>
                                <p className="mt-2 break-words font-mono text-[11px] text-gray-550 leading-relaxed">
                                    {owner}/{repo} · {sha.slice(0, 7)}
                                    {file ? ` · ${formatBytes(file.bytes)} · ${file.lines} lines` : ''}
                                    {license ? ` · ${license}` : ''}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    type="button"
                                    onClick={copySource}
                                    disabled={source === undefined || failed}
                                    className="source-control disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label={file?.truncated ? 'Copy displayed source' : 'Copy source file'}
                                >
                                    {copyStatus === 'copied' ? 'Copied ✓' : 'Copy'}
                                </button>
                                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="source-control">
                                    GitHub ↗
                                </a>
                                <button
                                    type="button"
                                    data-close-file
                                    onClick={close}
                                    className="source-control"
                                    aria-label="Close source file"
                                >
                                    Close ×
                                </button>
                            </div>
                        </header>
                        <div className="source-scroll" aria-busy={!failed && lines === undefined}>
                            {failed ? (
                                <p role="alert" className="p-6 text-gray-550 text-sm leading-relaxed">
                                    That file could not be loaded. It is still available{' '}
                                    <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-teal underline">
                                        on GitHub
                                    </a>
                                    .
                                </p>
                            ) : lines === undefined ? (
                                <p role="status" className="p-6 font-mono text-gray-600 text-xs">
                                    Loading source…
                                </p>
                            ) : (
                                <pre className="source-code">
                                    <code>
                                        {lines.map((line, index) => (
                                            <span
                                                // biome-ignore lint/suspicious/noArrayIndexKey: source lines are identified by position.
                                                key={index}
                                                data-line={index}
                                                data-highlight={
                                                    markedLine >= 0 && index >= markedLine && index < markedLine + markedCount
                                                        ? true
                                                        : undefined
                                                }
                                                className="source-line"
                                            >
                                                <span aria-hidden className="source-line-number">
                                                    {index + 1}
                                                </span>
                                                <span
                                                    className={`min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] ${LINE_CLASS[line.tone]}`}
                                                >
                                                    {line.text || ' '}
                                                </span>
                                            </span>
                                        ))}
                                    </code>
                                </pre>
                            )}
                        </div>
                        <footer className="source-footer">
                            <p role="status" className={copyStatus === 'failed' ? 'mb-2' : 'sr-only'}>
                                {copyStatus === 'copied'
                                    ? 'Source copied to clipboard.'
                                    : copyStatus === 'failed'
                                      ? 'Could not copy. Select the source text and copy it manually, or try again.'
                                      : ''}
                            </p>
                            {file?.truncated ? (
                                <p>
                                    Showing the first {formatBytes(new Blob([source ?? '']).size)} of {formatBytes(file.bytes)}.{' '}
                                    <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
                                        Read the rest on GitHub
                                    </a>
                                    .
                                </p>
                            ) : (
                                <p>
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
                        </footer>
                    </div>
                </dialog>
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

    if (!tray?.readable.has(path)) {
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

    if (!tray?.readable.has('AGENTS.md')) return <>{children}</>;

    return (
        <div className="quote-block">
            {children}
            <button type="button" onClick={() => tray.open({ path: 'AGENTS.md', match: quote })} className="quote-open">
                AGENTS.md · View in source <span aria-hidden>↗</span>
            </button>
        </div>
    );
}
