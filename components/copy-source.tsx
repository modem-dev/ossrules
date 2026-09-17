'use client';

import { useState } from 'react';

export function CopySource({
    source,
    label = 'Copy file source',
    iconAfter = false,
}: {
    source: string;
    label?: string;
    iconAfter?: boolean;
}) {
    const [status, setStatus] = useState('Copy');
    async function copy() {
        try {
            await navigator.clipboard.writeText(source);
            setStatus('Copied');
        } catch {
            setStatus('Copy failed');
        }
    }
    return (
        <button type="button" onClick={copy} className="action-link action-primary text-xs" aria-label={label}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`size-4${iconAfter ? ' order-1' : ''}`}>
                <rect x="7" y="7" width="10" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M13 7V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span role="status">{status}</span>
        </button>
    );
}
