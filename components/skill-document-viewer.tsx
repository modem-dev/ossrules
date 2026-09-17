'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { DocumentFilePicker } from './document-file-picker';
import { DocumentActions, DocumentViewer } from './document-viewer';

export function SkillDocumentViewer({
    files,
    path,
    baseHref,
    source,
    sourceUrl,
    rendered,
    tokens,
    bytes,
    sha,
    children,
}: {
    files: { path: string; omitted?: string }[];
    path: string;
    baseHref: string;
    source?: string;
    sourceUrl: string;
    rendered: boolean;
    tokens?: number;
    bytes: number;
    sha: string;
    children: ReactNode;
}) {
    const router = useRouter();
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
    const [linkStatus, setLinkStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
    // biome-ignore lint/correctness/useExhaustiveDependencies: reset feedback when the selected document or view changes.
    useEffect(() => {
        setCopyStatus('idle');
        setLinkStatus('idle');
    }, [path, rendered]);
    const markdown = source !== undefined && /\.mdx?$/i.test(path);
    const view = rendered ? 'markdown' : 'raw';
    async function copy(value: string, link = false) {
        const setStatus = link ? setLinkStatus : setCopyStatus;
        try {
            await navigator.clipboard.writeText(value);
            setStatus('copied');
        } catch {
            setStatus('failed');
        }
    }
    return (
        <Tabs.Root
            className="document-viewer-embedded"
            value={view}
            onValueChange={(mode) => {
                router.push(`${baseHref}?file=${encodeURIComponent(path)}${mode === 'raw' ? '&view=source' : ''}`, { scroll: false });
            }}
        >
            <DocumentViewer
                embedded
                picker={
                    <>
                        <h2 id="skill-document-title" tabIndex={-1} className="sr-only">
                            {path}
                        </h2>
                        <DocumentFilePicker files={files} selectedPath={path} baseHref={baseHref} />
                    </>
                }
                actions={
                    <DocumentActions
                        sourceUrl={sourceUrl}
                        copyStatus={copyStatus}
                        linkStatus={linkStatus}
                        copyDisabled={source === undefined}
                        copySource={() => {
                            if (source !== undefined) void copy(source);
                        }}
                        copyLink={() => void copy(window.location.href, true)}
                    />
                }
                tabs={
                    markdown ? (
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
                    <div className="source-metadata">
                        {tokens !== undefined ? <span>{tokens.toLocaleString('en')} tokens</span> : null}
                        <details className="source-info">
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
                                <p className="font-mono text-xs leading-relaxed">
                                    {bytes.toLocaleString('en')} bytes
                                    <br />
                                    {tokens !== undefined ? 'Token encoding: o200k_base' : null}
                                    <br />
                                    Snapshot {sha.slice(0, 7)}
                                </p>
                            </div>
                        </details>
                    </div>
                }
                footer={
                    <div role="status" className={copyStatus === 'failed' || linkStatus === 'failed' ? 'source-footer' : 'sr-only'}>
                        {copyStatus === 'failed' || linkStatus === 'failed'
                            ? 'Could not copy. Select the text or copy the browser address.'
                            : copyStatus === 'copied'
                              ? 'Source copied.'
                              : linkStatus === 'copied'
                                ? 'Link copied.'
                                : ''}
                    </div>
                }
            >
                {markdown ? (
                    <Tabs.Content value={view} className="source-view-panel">
                        {children}
                    </Tabs.Content>
                ) : (
                    children
                )}
            </DocumentViewer>
        </Tabs.Root>
    );
}
