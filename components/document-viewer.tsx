import type { ReactNode } from 'react';

/** Shared reading chrome; the caller owns routing, loading, and dialog behavior. */
export function DocumentViewer({
    picker,
    actions,
    tabs,
    facts,
    context,
    children,
    footer,
    busy = false,
    embedded = false,
}: {
    picker: ReactNode;
    actions: ReactNode;
    tabs?: ReactNode;
    facts?: ReactNode;
    context?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    busy?: boolean;
    embedded?: boolean;
}) {
    return (
        <>
            <header className="source-header">
                <div className="source-file-title">{picker}</div>
                {actions}
            </header>
            {context}
            <div className="source-view-bar">
                {tabs}
                <div className="source-facts">{facts}</div>
            </div>
            <div className={embedded ? 'document-body' : 'source-scroll'} aria-busy={busy}>
                {children}
            </div>
            {footer}
        </>
    );
}

export function DocumentActions({
    copyLink,
    copySource,
    linkStatus,
    copyStatus,
    sourceUrl,
    copyDisabled = false,
    copyLabel = 'Copy source file',
    onClose,
}: {
    copyLink: () => void;
    copySource: () => void;
    linkStatus: 'idle' | 'copied' | 'failed';
    copyStatus: 'idle' | 'copied' | 'failed';
    sourceUrl: string;
    copyDisabled?: boolean;
    copyLabel?: string;
    onClose?: () => void;
}) {
    return (
        <div className="source-actions">
            <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="source-control source-icon"
                aria-label="View on GitHub"
                title="View on GitHub"
            >
                <span className="sr-only">View on GitHub</span>
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M14 3h7v7M21 3 10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
                </svg>
            </a>
            <button type="button" className="source-control" onClick={copyLink} aria-label="Copy source link">
                {linkStatus === 'copied' ? 'Link copied' : 'Copy link'}
            </button>
            <button
                type="button"
                onClick={copySource}
                disabled={copyDisabled}
                className="source-control source-copy disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={copyLabel}
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
                <span className="hidden md:inline">{copyStatus === 'copied' ? 'Copied' : 'Copy'}</span>
            </button>
            {onClose ? (
                <button
                    type="button"
                    data-close-file
                    onClick={onClose}
                    className="source-control source-icon"
                    aria-label="Close source file"
                    title="Close source file"
                >
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="m6 6 12 12M6 18 18 6" />
                    </svg>
                </button>
            ) : null}
        </div>
    );
}
