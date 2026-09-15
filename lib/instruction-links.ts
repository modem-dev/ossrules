/** Resolve repository Markdown links at the same pinned commit as the open file. */
export function instructionLink(href: string, sourceUrl: string): { href: string; path?: string; anchor?: string } {
    try {
        if (href.startsWith('#')) return { href, anchor: decodeURIComponent(href.slice(1)) };
        const base = new URL(sourceUrl);
        const root = `${base.origin}${base.pathname.split('/').slice(0, 5).join('/')}/`;
        const url = new URL(href.startsWith('/') && !href.startsWith('//') ? `${root}${href.slice(1)}` : href, base);
        if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) return { href: '' };
        const path = url.href.startsWith(root) ? decodeURIComponent(url.pathname.slice(new URL(root).pathname.length)) : undefined;
        return { href: url.href, path };
    } catch {
        return { href: '' };
    }
}
