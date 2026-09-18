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

    const formatted =
        count === null ? 'Star' : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(count);
    return (
        <a
            href="https://github.com/modem-dev/ossrules"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Star ossrules on GitHub${count === null ? '' : `, ${count.toLocaleString('en')} stars`} (opens in a new tab)`}
            title="Star ossrules on GitHub"
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded border border-current/30 px-2 text-light-cream transition-colors hover:border-teal hover:text-teal"
        >
            <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="m10 2 2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8Z" />
            </svg>
            {count !== null ? <span className="hidden sm:inline">Star</span> : null}
            <span className="min-w-5 text-center font-mono text-[11px] tabular-nums" aria-hidden="true">
                {formatted}
            </span>
        </a>
    );
}
