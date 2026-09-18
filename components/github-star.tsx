'use client';

import { useEffect, useState } from 'react';

// Share one request across page navigations. A failed request leaves the Star CTA usable.
let starCount: Promise<number | null> | undefined;
function getStarCount() {
    starCount ??= fetch('https://api.github.com/repos/modem-dev/ossrules', { signal: AbortSignal.timeout(5000) })
        .then(async (response) => {
            if (!response.ok) return null;
            const data = await response.json();
            return Number.isSafeInteger(data.stargazers_count) && data.stargazers_count >= 0 ? (data.stargazers_count as number) : null;
        })
        .catch(() => null);
    return starCount;
}

export function GitHubStar() {
    const [count, setCount] = useState<number | null>(null);
    useEffect(() => {
        let active = true;
        void getStarCount().then((value) => {
            if (active) setCount(value);
        });
        return () => {
            active = false;
        };
    }, []);

    const formatted = count === null ? '…' : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(count);
    return (
        <a
            href="https://github.com/modem-dev/ossrules"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Star ossrules on GitHub${count === null ? '' : `, ${count.toLocaleString('en')} stars`} (opens in a new tab)`}
            title="Star ossrules on GitHub"
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 text-gray-550 transition-colors hover:text-teal"
        >
            <span className="sr-only">Star ossrules on GitHub</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            <span className="min-w-5 text-center font-mono text-[11px] tabular-nums" aria-hidden="true">
                {formatted}
            </span>
        </a>
    );
}
