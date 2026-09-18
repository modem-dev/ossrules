'use client';

import * as Tabs from '@radix-ui/react-tabs';
import dynamic from 'next/dynamic';
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { DocumentMention } from '@/lib/document-mentions';
import { readSourceLocation, writeSourceLocation } from '@/lib/source-location';
import type { VendoredFile } from './agents-md-data';
import { DocumentFilePicker } from './document-file-picker';
import { DocumentActions, DocumentViewer } from './document-viewer';
import { HighlightedSource } from './highlighted-source';
import { RelativeTime } from './last-updated';

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
            <div key={`${mention.sourcePath}:${mention.startLine}`} className="source-excerpt mt-3">
                {canOpen ? (
                    <button type="button" onClick={() => onOpen(mention)} className="source-excerpt-header min-h-9 hover:underline">
                        {label} <span aria-hidden>↗</span>
                    </button>
                ) : (
                    <p className="source-excerpt-header">{label}</p>
                )}
                <pre className="font-mono text-xs leading-6">
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
    const [view, setView] = useState<'markdown' | 'raw'>('markdown');
    const [source, setSource] = useState<string | undefined>();
    const [failed, setFailed] = useState(false);
    const [snapshotMismatch, setSnapshotMismatch] = useState(false);
    const [linkStatus, setLinkStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
    const [returnDocument, setReturnDocument] = useState<{ request: TrayRequest; scrollTop: number; view: 'markdown' | 'raw' }>();
    const [expandedReferences, setExpandedReferences] = useState<Record<string, boolean>>({});
    const scrollRestore = useRef<number | undefined>(undefined);
    const cache = useRef(new Map<string, string>());
    const panel = useRef<HTMLDialogElement>(null);
    const returnFocus = useRef<HTMLElement | null>(null);
    const setPanel = useCallback((node: HTMLDialogElement | null) => {
        panel.current = node;
    }, []);

    const byPath = useMemo(() => new Map(files.map((file) => [file.path, file])), [files]);
    const readable = useMemo(() => new Set(files.filter((file) => !file.missing && !file.unavailable).map((file) => file.path)), [files]);
    const missing = useMemo(() => new Set(files.filter((file) => file.missing || file.unavailable).map((file) => file.path)), [files]);

    const rememberSource = useCallback(
        (next: TrayRequest | undefined, mode: 'markdown' | 'raw', replace = false) => {
            const url = new URL(window.location.href);
            url.search = writeSourceLocation(url.search, next, mode, sha);
            if (replace) window.history.replaceState(null, '', url);
            else window.history.pushState(null, '', url);
            setSnapshotMismatch(false);
            setLinkStatus('idle');
        },
        [sha],
    );

    useEffect(() => {
        const restore = () => {
            const location = readSourceLocation(window.location.search, files, sha);
            if (!location.request && panel.current?.contains(document.activeElement)) {
                returnFocus.current?.focus({ preventScroll: true });
            }
            setRequest(location.request);
            setView(location.view);
            setSnapshotMismatch(location.mismatch);
            setReturnDocument(undefined);
            setLinkStatus('idle');
        };
        restore();
        window.addEventListener('popstate', restore);
        return () => window.removeEventListener('popstate', restore);
    }, [files, sha]);

    const open = useCallback(
        (next: TrayRequest) => {
            if (!panel.current?.contains(document.activeElement)) returnFocus.current = document.activeElement as HTMLElement | null;
            setCopyStatus('idle');
            setReturnDocument(undefined);
            scrollRestore.current = undefined;
            const resolvedPath = byPath.get(next.path)?.resolvedPath;
            const mode = next.startLine !== undefined || next.match ? 'raw' : 'markdown';
            const resolved = resolvedPath ? { ...next, via: next.path, path: resolvedPath } : next;
            setView(mode);
            setRequest(resolved);
            rememberSource(resolved, mode);
        },
        [byPath, rememberSource],
    );

    const close = useCallback(() => {
        const restoreFocus = panel.current?.contains(document.activeElement);
        panel.current?.close();
        setRequest(undefined);
        rememberSource(undefined, 'markdown');
        setReturnDocument(undefined);
        if (restoreFocus && returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true });
    }, [rememberSource]);

    const context = useMemo(() => ({ open, readable, missing, primaryFile }), [open, readable, missing, primaryFile]);
    const path = request?.path;
    const isOpen = Boolean(path);
    const instructionFiles = files.filter(
        (file) =>
            !file.symlink &&
            !file.missing &&
            !file.unavailable &&
            (file.path === primaryFile || /(^|\/)(AGENTS|CLAUDE)\.md$/.test(file.path)),
    );

    const visitMention = (mention: DocumentMention) => {
        if (!request) return;
        setReturnDocument({ request, scrollTop: panel.current?.querySelector('.source-scroll')?.scrollTop ?? 0, view });
        setView('raw');
        setSource(undefined);
        setCopyStatus('idle');
        const next = { path: mention.sourcePath ?? primaryFile, startLine: mention.startLine, lineCount: mention.lines.length };
        setRequest(next);
        rememberSource(next, 'raw');
    };

    const backToDocument = () => {
        if (!returnDocument) return;
        scrollRestore.current = returnDocument.scrollTop;
        setSource(undefined);
        setCopyStatus('idle');
        setRequest(returnDocument.request);
        setView(returnDocument.view);
        rememberSource(returnDocument.request, returnDocument.view);
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
        const url = `/files/${slug}?path=${encodeURIComponent(path)}`;
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

    // Keep the page usable beside the pane; a full-screen phone reader is modal.
    useEffect(() => {
        if (!isOpen) return;
        const dialog = panel.current;
        if (!dialog) return;
        const mobile = window.matchMedia('(max-width: 767px)');
        const previousOverflow = document.body.style.overflow;
        const syncMode = () => {
            const focused = dialog.contains(document.activeElement) ? (document.activeElement as HTMLElement) : undefined;
            if (dialog.open) dialog.close();
            document.body.style.overflow = mobile.matches ? 'hidden' : previousOverflow;
            if (mobile.matches) dialog.showModal();
            else dialog.show();
            (focused ?? dialog.querySelector<HTMLButtonElement>('[data-close-file]'))?.focus({ preventScroll: true });
        };
        syncMode();
        mobile.addEventListener('change', syncMode);
        return () => {
            mobile.removeEventListener('change', syncMode);
            dialog.close();
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onPointerDown = (event: PointerEvent) => {
            // Radix disables pointer events outside its menu, including on the trigger.
            // Let the open menu consume dismissal before considering the reader below it.
            if (panel.current?.querySelector('[role="combobox"][aria-expanded="true"]')) return;
            const target = event.target;
            if (!(target instanceof Element) || panel.current?.contains(target)) return;
            // Another source link replaces the pane's content instead of dismissing it.
            if (target.closest('[data-source-trigger]')) return;
            close();
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || event.defaultPrevented) return;
            event.preventDefault();
            close();
        };
        // Observe the open menu before Radix dismisses it during the bubble phase.
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [isOpen, close]);

    useEffect(() => {
        if (!path) return;
        const scroll = panel.current?.querySelector('.source-scroll');
        if (scroll) scroll.scrollTop = 0;
    }, [path]);

    const file = path ? byPath.get(path) : undefined;
    const lines = useMemo(() => source?.split('\n'), [source]);
    const isMarkdown = path === primaryFile || /\.(md|markdown|mdx)$/i.test(path ?? '');

    useEffect(() => {
        if (source === undefined || scrollRestore.current === undefined) return;
        const scroll = panel.current?.querySelector('.source-scroll');
        if (scroll) scroll.scrollTop = scrollRestore.current;
        scrollRestore.current = undefined;
    }, [source]);

    // The line a technique quote starts on, so the tray can open where it is cited.
    const markedLine = useMemo(() => {
        if (!lines) return -1;
        if (request?.startLine !== undefined) return request.startLine <= lines.length ? request.startLine - 1 : -1;
        if (!request?.match) return -1;
        const needle = request.match.trim().split('\n')[0].trim();
        if (needle.length === 0) return -1;
        return lines.findIndex((line) => line.includes(needle));
    }, [lines, request?.match, request?.startLine]);

    useEffect(() => {
        if (markedLine < 0 || view !== 'raw' || source === undefined) return;
        panel.current?.querySelector(`[data-line="${markedLine}"]`)?.scrollIntoView({ block: 'center' });
    }, [markedLine, view, source]);

    const markedCount = request?.lineCount ?? request?.match?.trimEnd().split('\n').length ?? 0;
    const copyLink = async () => {
        if (!request) return;
        const url = new URL(window.location.href);
        url.search = writeSourceLocation(
            url.search,
            { ...request, startLine: markedLine >= 0 ? markedLine + 1 : undefined, lineCount: markedCount },
            view,
            sha,
        );
        url.hash = '';
        try {
            await navigator.clipboard.writeText(url.href);
            setLinkStatus('copied');
        } catch {
            setLinkStatus('failed');
        }
    };
    const sourceUrl = `https://github.com/${owner}/${repo}/blob/${sha}/${path?.split('/').map(encodeURIComponent).join('/') ?? ''}`;

    const showReferences = Boolean(
        mentions[path ?? '']?.length || (path && !instructionFiles.some((item) => item.path === path) && path !== primaryFile),
    );
    const sourceContent = failed ? (
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
    ) : isMarkdown && view === 'markdown' && source !== undefined ? (
        <InstructionMarkdown source={source} sourceUrl={sourceUrl} readable={readable} onOpen={(path) => open({ path })} />
    ) : (
        <HighlightedSource
            source={source ?? ''}
            language={isMarkdown ? 'markdown' : (path?.split('.').pop() ?? 'text')}
            numbered
            markedLine={markedLine}
            markedCount={markedCount}
        />
    );

    return (
        <FileTrayContext.Provider value={context}>
            <div className="source-workspace" data-source-open={isOpen}>
                {snapshotMismatch ? (
                    <p role="alert" className="page-shell text-sm text-gray-550">
                        This source link refers to a different snapshot. The analysis below uses commit {sha.slice(0, 7)}. Open a source
                        file from this page to read that revision.
                    </p>
                ) : null}
                {children}
            </div>
            {path ? (
                <dialog
                    ref={setPanel}
                    aria-label={path}
                    className="source-dialog"
                    onCancel={(event) => {
                        event.preventDefault();
                        close();
                    }}
                >
                    <Tabs.Root
                        className="source-panel"
                        value={view}
                        onValueChange={(value) => {
                            const mode = value as 'markdown' | 'raw';
                            setView(mode);
                            rememberSource(request, mode);
                        }}
                    >
                        <DocumentViewer
                            picker={
                                <DocumentFilePicker
                                    files={files.filter((file) => readable.has(file.path)).map(({ path }) => ({ path }))}
                                    selectedPath={path}
                                    onSelect={(path) => open({ path })}
                                />
                            }
                            actions={
                                <DocumentActions
                                    copyLink={copyLink}
                                    copySource={copySource}
                                    linkStatus={linkStatus}
                                    copyStatus={copyStatus}
                                    sourceUrl={sourceUrl}
                                    copyDisabled={source === undefined || failed}
                                    copyLabel={file?.truncated ? 'Copy displayed source' : 'Copy source file'}
                                    onClose={close}
                                />
                            }
                            tabs={
                                isMarkdown ? (
                                    <Tabs.List className="source-view-tabs" aria-label="File view">
                                        <Tabs.Trigger className="source-view-tab" value="markdown">
                                            Markdown
                                        </Tabs.Trigger>
                                        <Tabs.Trigger className="source-view-tab" value="raw">
                                            Raw
                                        </Tabs.Trigger>
                                    </Tabs.List>
                                ) : null
                            }
                            facts={
                                <>
                                    <div className="source-metadata">
                                        {file?.tokens !== undefined ? <span>{file.tokens.toLocaleString()} tokens</span> : null}
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
                                                    {file?.tokens !== undefined
                                                        ? `${file.tokens.toLocaleString()} tokens · o200k_base`
                                                        : ''}
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
                                    {path === primaryFile && primaryFileModifiedAt ? (
                                        <span className="source-modified">
                                            Last modified <RelativeTime iso={primaryFileModifiedAt} />
                                        </span>
                                    ) : null}
                                </>
                            }
                            context={
                                <>
                                    {' '}
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
                                </>
                            }
                            busy={!failed && lines === undefined}
                            footer={
                                <footer className="source-footer">
                                    <p role="status" className={linkStatus === 'failed' ? 'mb-2' : 'sr-only'}>
                                        {linkStatus === 'copied'
                                            ? 'Source link copied to clipboard.'
                                            : linkStatus === 'failed'
                                              ? 'Could not copy the link. Copy the address from your browser instead.'
                                              : ''}
                                    </p>
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
                                            <a
                                                href={sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-teal hover:underline"
                                            >
                                                Read the rest on GitHub
                                            </a>
                                            .
                                        </p>
                                    ) : (
                                        <p>
                                            Copy stored at commit {sha.slice(0, 7)}.{' '}
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
                            }
                        >
                            {showReferences ? (
                                <div className="source-context">
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
                                </div>
                            ) : null}
                            {request.via ? (
                                <p className="px-4 pb-2 font-mono text-xs text-gray-600 sm:px-6">Opened via {request.via} symlink</p>
                            ) : null}
                            {isMarkdown
                                ? (['markdown', 'raw'] as const).map((mode) => (
                                      <Tabs.Content key={mode} value={mode} className="source-view-panel">
                                          {view === mode ? sourceContent : null}
                                      </Tabs.Content>
                                  ))
                                : sourceContent}
                        </DocumentViewer>
                    </Tabs.Root>
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
        <button type="button" data-source-trigger onClick={() => tray.open({ path })} className={className} title={label}>
            {children}
        </button>
    );
}

/**
 * Wraps a verbatim technique quote so it opens AGENTS.md at the line it came
 * from. Every quote in the corpus is character-for-character from the file, so
 * the first line of one is enough to find it.
 */
export function QuoteLink({
    quote,
    startLine,
    sourcePath,
    children,
}: {
    quote: string;
    startLine?: number;
    sourcePath?: string;
    children: React.ReactNode;
}) {
    const tray = useFileTray();
    const previewId = useId();
    const content = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [overflows, setOverflows] = useState(false);
    useEffect(() => {
        const element = content.current;
        if (!element) return;
        const measure = () => setOverflows(element.scrollHeight > 224);
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        measure();
        return () => observer.disconnect();
    }, []);

    const path = sourcePath ?? tray?.primaryFile ?? 'AGENTS.md';
    if (!tray?.readable.has(path)) return <>{children}</>;

    return (
        <div className="quote-block source-excerpt">
            <button
                type="button"
                data-source-trigger
                onClick={() => tray.open({ path, match: quote, startLine, lineCount: quote.trimEnd().split('\n').length })}
                className="quote-open source-excerpt-header"
            >
                <span>{path}</span>
                <span>
                    View in source <span aria-hidden>↗</span>
                </span>
            </button>
            <div id={previewId} className="quote-preview" data-expanded={expanded} data-collapsible={overflows}>
                <div ref={content}>{children}</div>
            </div>
            {overflows ? (
                <button
                    type="button"
                    className="quote-expand"
                    aria-expanded={expanded}
                    aria-controls={previewId}
                    onClick={() => setExpanded((value) => !value)}
                >
                    {expanded ? 'Show less' : 'Show full excerpt'}
                </button>
            ) : null}
        </div>
    );
}
