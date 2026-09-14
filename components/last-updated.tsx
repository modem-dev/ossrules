'use client';

import { useEffect, useState } from 'react';

/**
 * Relative age of a commit, computed in the browser.
 *
 * These pages are statically generated, so a relative string baked in at build
 * time would drift until the next deploy. The server renders the absolute date
 * inside a <time> element, which is correct forever and is what a crawler or a
 * reader without JavaScript sees; the browser then swaps in the relative form.
 */

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 24 * 3600],
    ['month', 30 * 24 * 3600],
    ['day', 24 * 3600],
    ['hour', 3600],
    ['minute', 60],
];

function relative(iso: string): string {
    const seconds = (Date.parse(iso) - Date.now()) / 1000;
    const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'narrow' });
    for (const [unit, size] of UNITS) {
        if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
    }
    return 'just now';
}

function absolute(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function RelativeTime({ iso }: { iso: string }) {
    const [text, setText] = useState(() => absolute(iso));
    useEffect(() => setText(relative(iso)), [iso]);
    return (
        <time dateTime={iso} title={absolute(iso)}>
            {text}
        </time>
    );
}
