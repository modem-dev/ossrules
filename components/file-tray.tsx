'use client';

import dynamic from 'next/dynamic';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { DocumentMention } from '@/lib/document-mentions';
import type { VendoredFile } from './agents-md-data';
import { HighlightedSource } from './highlighted-source';
import { SourceComparison } from './source-comparison';

const InstructionMarkdown = dynamic(() => import('./instruction-markdown').then((module) => module.InstructionMarkdown), {
    loading: () => (
        <p role="status" className="p-6 text-xs text-gray-600">
            Rendering Markdown…
        </p>
    ),
});

/**
 * Reads the files a project's AGENTS.md points at, without leaving the page.
 *
 * The files are served from our own origin, vendored at the same commit the
 * entry was measured against (scripts/sync-agents-md-files.ts), so what opens
 * here is the revision the analysis on the page describes. They are fetched when
 * a reader opens one rather than inlined, because a project like Airflow routes
 * to eighteen documents and nobody opens all of them.
 *
 * Markdown is rendered for reading; raw source preserves exact lines for citations.
 */

interface TrayRequest {
    via?: string;
    path: string;
    /** First line of a quote to scroll to and mark, when opened from a technique. */
    match?: string;
    startLine?: number;
    lineCount?: number;
}

interface TrayContext {
    primaryFile: string;
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

function formatBytes(bytes: number): string {
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`;
}

function DocumentReferences({
    path,
    primaryFile,
    mentions,
    canOpen,
    onOpen,
    expanded,
    onExpandedChange,
}: {
    path: string;
    primaryFile: string;
    mentions: DocumentMention[];
    canOpen: boolean;
    onOpen: (mention: DocumentMention) => void;
    expanded: boolean;
    onExpandedChange: (expanded: boolean) => void;
}) {
    const passage = (mention: DocumentMention) => {
        const endLine = mention.startLine + mention.lines.length - 1;
        const label = `${mention.sourcePath ?? primaryFile} · ${endLine === mention.startLine ? `line ${mention.startLine}` : `lines ${mention.startLine}–${endLine}`}`;
        return (
            <div key={`${mention.sourcePath}:${mention.startLine}`} className="mt-3">
                {canOpen ? (
                    <button
                        type="button"
                        onClick={() => onOpen(mention)}
                        className="min-h-9 text-left font-mono text-teal text-xs hover:underline"
                    >
                        {label} <span aria-hidden>↗</span>
                    </button>
                ) : (
                    <p className="py-2 font-mono text-gray-550 text-xs">{label}</p>
                )}
                <pre className="mt-1 rounded border border-gray-750 bg-medium-gray py-3 pr-3 font-mono text-xs leading-6">
                    <code>
                        {mention.lines.map((line, index) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: source lines are identified by position.
                            <span key={mention.startLine + index} className="excerpt-line">
                                <span aria-hidden className="excerpt-line-number">
                                    {mention.startLine + index}
                                </span>
                                <span className="min-w-0 whitespace-pre-wrap text-gray-400 [overflow-wrap:anywhere]">
                                    {line.split(path).map((part, partIndex) => (
                                        // biome-ignore lint/suspicious/noArrayIndexKey: segments are positions within a fixed source line.
                                        <span key={partIndex}>
                                            {partIndex > 0 ? (
                                                <mark className="rounded-sm bg-dark-teal px-0.5 text-teal">{path}</mark>
                                            ) : null}
                                            {part}
                                        </span>
                                    ))}
                                </span>
                            </span>
                        ))}
                    </code>
                </pre>
            </div>
        );
    };
    const first = mentions[0];
    return (
        <details className="source-references" open={expanded} onToggle={(event) => onExpandedChange(event.currentTarget.open)}>
            <summary className="text-teal">
                {first
                    ? `From ${first.sourcePath ?? primaryFile}:${first.startLine}${mentions.length > 1 ? ` +${mentions.length - 1}` : ''}`
                    : 'Reference context'}
            </summary>
            <section aria-label="Reference context" className="pb-3">
                {mentions.length > 0 ? (
                    mentions.map(passage)
                ) : (
                    <p className="mt-2 text-gray-550 text-xs leading-relaxed">
                        No exact path mention found in the pinned instructions. This document may be referenced indirectly or through a
                        pattern.
                    </p>
                )}
            </section>
        </details>
    );
}

interface TrayProps {
    primaryFile?: string;
    primaryFileModifiedAt?: string;
    slug: string;
    owner: string;
    repo: string;
    sha: string;
    files: VendoredFile[];
    mentions: Record<string, DocumentMention[]>;
    license?: string;
    licensePath?: string;
    children: React.ReactNode;
}

export function FileTrayProvider({
    primaryFile = 'AGENTS.md',
    primaryFileModifiedAt,
    slug,
    owner,
    repo,
    sha,
    files,
    mentions,
    license,
    licensePath,
    children,
}: TrayProps) {
    const [request, setRequest] = useState<TrayRequest | undefined>();
    const [comparePath, setComparePath] = useState<string>();
    const [view, setView] = useState<'markdown' | 'raw'>('markdown');
    const [source, setSource] = useState<string | undefined>();
    const [failed, setFailed] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
    const [returnDocument, setReturnDocument] = useState<{ request: TrayRequest; scrollTop: number; view: 'markdown' | 'raw' }>();
    const [expandedReferences, setExpandedReferences] = useState<Record<string, boolean>>({});
    const scrollRestore = useRef<number | undefined>(undefined);
    const cache = useRef(new Map<string, string>());
    const panel = useRef<HTMLDialogElement>(null);
    const returnFocus = useRef<HTMLElement | null>(null);

    const byPath = useMemo(() => new Map(files.map((file) => [file.path, file])), [files]);
    const readable = useMemo(() => new Set(files.filter((file) => !file.missing && !file.unavailable).map((file) => file.path)), [files]);
    const missing = useMemo(() => new Set(files.filter((file) => file.missing || file.unavailable).map((file) => file.path)), [files]);

    const open = useCallback(
        (next: TrayRequest) => {
            if (!panel.current?.open) returnFocus.current = document.activeElement as HTMLElement | null;
            setCopyStatus('idle');
            setReturnDocument(undefined);
            scrollRestore.current = undefined;
            const resolvedPath = byPath.get(next.path)?.resolvedPath;
            setComparePath(undefined);
            setView(next.startLine !== undefined || next.match ? 'raw' : 'markdown');
            setRequest(resolvedPath ? { ...next, via: next.path, path: resolvedPath } : next);
        },
        [byPath],
    );

    const close = useCallback(() => {
        panel.current?.close();
        setComparePath(undefined);
        setRequest(undefined);
        setReturnDocument(undefined);
        returnFocus.current?.focus({ preventScroll: true });
    }, []);

    const context = useMemo(() => ({ open, readable, missing, primaryFile }), [open, readable, missing, primaryFile]);
    const path = request?.path;
    const instructionFiles = files.filter(
        (file) => !file.symlink && !file.missing && !file.unavailable && /(^|\/)(AGENTS|CLAUDE)\.md$/.test(file.path),
    );
    const alternatives = instructionFiles.filter((file) => file.path !== path);

    const visitMention = (mention: DocumentMention) => {
        if (!request) return;
        setReturnDocument({ request, scrollTop: panel.current?.querySelector('.source-scroll')?.scrollTop ?? 0, view });
        setView('raw');
        setSource(undefined);
        setCopyStatus('idle');
        setRequest({ path: mention.sourcePath ?? primaryFile, startLine: mention.startLine, lineCount: mention.lines.length });
    };

    const backToDocument = () => {
        if (!returnDocument) return;
        scrollRestore.current = returnDocument.scrollTop;
        setSource(undefined);
        setCopyStatus('idle');
        setRequest(returnDocument.request);
        setView(returnDocument.view);
        setReturnDocument(undefined);
    };

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
        (
            dialog?.querySelector<HTMLButtonElement>('[data-back-source]') ?? dialog?.querySelector<HTMLButtonElement>('[data-close-file]')
        )?.focus();
        const scroll = dialog?.querySelector('.source-scroll');
        if (scroll) scroll.scrollTop = 0;
        return () => {
            dialog?.close();
            document.body.style.overflow = previous;
        };
    }, [path]);

    const file = path ? byPath.get(path) : undefined;
    const lines = useMemo(() => source?.split('\n'), [source]);
    const isMarkdown = /\.(md|markdown|mdx)$/i.test(path ?? '');

    useEffect(() => {
        if (source === undefined || scrollRestore.current === undefined) return;
        const scroll = panel.current?.querySelector('.source-scroll');
        if (scroll) scroll.scrollTop = scrollRestore.current;
        scrollRestore.current = undefined;
    }, [source]);

    // The line a technique quote starts on, so the tray can open where it is cited.
    const markedLine = useMemo(() => {
        if (!lines) return -1;
        if (request?.startLine !== undefined) return request.startLine - 1;
        if (!request?.match) return -1;
        const needle = request.match.trim().split('\n')[0].trim();
        if (needle.length === 0) return -1;
        return lines.findIndex((line) => line.includes(needle));
    }, [lines, request?.match, request?.startLine]);

    useEffect(() => {
        if (markedLine < 0 || view !== 'raw' || comparePath || source === undefined) return;
        panel.current?.querySelector(`[data-line="${markedLine}"]`)?.scrollIntoView({ block: 'center' });
    }, [markedLine, view, comparePath, source]);

    const markedCount = request?.lineCount ?? request?.match?.trimEnd().split('\n').length ?? 0;
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
                            <div className="source-file-title">
                                {instructionFiles.some((item) => item.path === path) && instructionFiles.length > 1 ? (
                                    <select
                                        aria-label="Instruction file"
                                        value={path}
                                        className="source-file-select"
                                        onChange={(event) => open({ path: event.target.value })}
                                    >
                                        {instructionFiles.map((item) => (
                                            <option key={item.path} value={item.path}>
                                                {item.path}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="break-all font-mono text-sm">{path}</p>
                                )}
                            </div>
                            <div className="source-actions">
                                {isMarkdown && !comparePath ? (
                                    <select
                                        aria-label="File view"
                                        value={view}
                                        onChange={(event) => setView(event.target.value as 'markdown' | 'raw')}
                                        className="source-view-select"
                                    >
                                        <option value="markdown">Markdown</option>
                                        <option value="raw">Raw</option>
                                    </select>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={copySource}
                                    disabled={source === undefined || failed}
                                    className="source-control source-copy disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label={file?.truncated ? 'Copy displayed source' : 'Copy source file'}
                                >
                                    <svg
                                        aria-hidden="true"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.75"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        {copyStatus === 'copied' ? (
                                            <path d="m5 12 4 4L19 6" />
                                        ) : (
                                            <>
                                                <rect x="8" y="3" width="8" height="4" rx="1" />
                                                <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                                            </>
                                        )}
                                    </svg>
                                    {copyStatus === 'copied' ? 'Copied' : 'Copy'}
                                </button>
                                <a
                                    href={sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="source-control source-icon"
                                    aria-label="View on GitHub"
                                    title="View on GitHub"
                                >
                                    <span className="sr-only">View on GitHub</span>
                                    <svg
                                        aria-hidden="true"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.75"
                                    >
                                        <path d="M14 3h7v7M21 3 10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
                                    </svg>
                                </a>
                                <button
                                    type="button"
                                    data-close-file
                                    onClick={close}
                                    className="source-control source-icon"
                                    aria-label="Close source file"
                                    title="Close source file"
                                >
                                    <svg
                                        aria-hidden="true"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.75"
                                    >
                                        <path d="m6 6 12 12M6 18 18 6" />
                                    </svg>
                                </button>
                            </div>
                        </header>
                        {returnDocument ? (
                            <div className="border-gray-750 border-b px-4 py-2 sm:px-6">
                                <button
                                    type="button"
                                    data-back-source
                                    onClick={backToDocument}
                                    className="min-h-9 break-all text-left text-teal text-xs"
                                >
                                    ← Back to {returnDocument.request.path}
                                </button>
                            </div>
                        ) : null}
                        <div className="source-scroll" aria-busy={!failed && lines === undefined}>
                            <div className="source-context">
                                <div className="source-metadata">
                                    {file?.tokens !== undefined ? <span>{file.tokens.toLocaleString()} tokens</span> : null}
                                    {path === primaryFile && primaryFileModifiedAt ? (
                                        <time dateTime={primaryFileModifiedAt} title={`Last modified: ${primaryFileModifiedAt}`}>
                                            Modified {primaryFileModifiedAt.slice(0, 10)}
                                        </time>
                                    ) : null}
                                    <details className="source-info" key={path}>
                                        <summary aria-label="File information" title="File information">
                                            <svg
                                                aria-hidden="true"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.75"
                                            >
                                                <circle cx="12" cy="12" r="9" />
                                                <path d="M12 11v6M12 7v1" />
                                            </svg>
                                        </summary>
                                        <div className="source-info-panel">
                                            <p className="break-words font-mono text-xs leading-relaxed">
                                                {owner}/{repo} · {sha.slice(0, 7)}
                                                <br />
                                                {file ? `${formatBytes(file.bytes)} · ${file.lines} lines` : ''}
                                                <br />
                                                {file?.tokens !== undefined ? `${file.tokens.toLocaleString()} tokens · o200k_base` : ''}
                                                {license ? (
                                                    <>
                                                        <br />
                                                        {license}
                                                    </>
                                                ) : null}
                                            </p>
                                            {file?.imports?.length || file?.sameContentAs ? (
                                                <div className="mt-3 font-mono text-xs text-gray-600">
                                                    {file.sameContentAs ? <p>Same content as {file.sameContentAs}</p> : null}
                                                    {file.imports?.map((imported) => (
                                                        <p key={imported.target} className="py-1">
                                                            Imports{' '}
                                                            {imported.path && !imported.unavailable && readable.has(imported.path) ? (
                                                                <button
                                                                    type="button"
                                                                    className="text-teal hover:underline"
                                                                    onClick={() => {
                                                                        if (imported.path) open({ path: imported.path });
                                                                    }}
                                                                >
                                                                    {imported.target} ↗
                                                                </button>
                                                            ) : (
                                                                `${imported.target} · ${imported.unavailable ?? 'Unavailable'}`
                                                            )}
                                                        </p>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    </details>
                                </div>
                                {mentions[path]?.length ||
                                (!instructionFiles.some((item) => item.path === path) && path !== primaryFile) ? (
                                    <DocumentReferences
                                        key={path}
                                        path={path}
                                        primaryFile={primaryFile}
                                        mentions={mentions[path] ?? []}
                                        canOpen={true}
                                        onOpen={visitMention}
                                        expanded={expandedReferences[path] ?? false}
                                        onExpandedChange={(expanded) =>
                                            setExpandedReferences((previous) =>
                                                previous[path] === expanded ? previous : { ...previous, [path]: expanded },
                                            )
                                        }
                                    />
                                ) : null}
                                {instructionFiles.some((item) => item.path === path) && alternatives.length > 0 ? (
                                    <button
                                        type="button"
                                        className="source-compare"
                                        onClick={() => setComparePath(comparePath ? undefined : alternatives[0]?.path)}
                                    >
                                        {comparePath ? 'Close comparison' : 'Compare files'}
                                    </button>
                                ) : null}
                            </div>
                            {request.via ? (
                                <p className="px-4 pb-2 font-mono text-xs text-gray-600 sm:px-6">Opened via {request.via} symlink</p>
                            ) : null}
                            {comparePath ? (
                                <label className="flex items-center gap-2 px-4 py-2 text-gray-550 text-xs sm:px-6">
                                    Compare with
                                    <select
                                        aria-label="Compare with"
                                        value={comparePath}
                                        className="source-file-select"
                                        onChange={(event) => setComparePath(event.target.value)}
                                    >
                                        {alternatives.map((item) => (
                                            <option key={item.path} value={item.path}>
                                                {item.path}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            ) : null}
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
                            ) : comparePath && source !== undefined ? (
                                <SourceComparison
                                    slug={slug}
                                    leftPath={path}
                                    left={source}
                                    rightPath={comparePath}
                                    rightTruncated={byPath.get(comparePath)?.truncated}
                                />
                            ) : isMarkdown && view === 'markdown' && source !== undefined ? (
                                <InstructionMarkdown
                                    source={source}
                                    sourceUrl={sourceUrl}
                                    readable={readable}
                                    onOpen={(path) => open({ path })}
                                />
                            ) : (
                                <HighlightedSource
                                    source={source ?? ''}
                                    language={isMarkdown ? 'markdown' : (path.split('.').pop() ?? 'text')}
                                    numbered
                                    markedLine={markedLine}
                                    markedCount={markedCount}
                                />
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
                <span className="text-gray-700"> · unavailable at this commit</span>
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
export function QuoteLink({ quote, sourcePath, children }: { quote: string; sourcePath?: string; children: React.ReactNode }) {
    const tray = useFileTray();

    const path = sourcePath ?? tray?.primaryFile ?? 'AGENTS.md';
    if (!tray?.readable.has(path)) return <>{children}</>;

    return (
        <div className="quote-block">
            {children}
            <button type="button" onClick={() => tray.open({ path, match: quote })} className="quote-open">
                {path} · View in source <span aria-hidden>↗</span>
            </button>
        </div>
    );
}
