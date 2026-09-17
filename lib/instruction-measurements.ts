import { fromMarkdown } from 'mdast-util-from-markdown';

interface MarkdownNode {
    type: string;
    position?: { start: { offset?: number } };
    children?: MarkdownNode[];
}

export function countSourceLines(source: string) {
    return source ? source.split(/\r\n|\n|\r/).length - (/(?:\r\n|\n|\r)$/.test(source) ? 1 : 0) : 0;
}

/** Used by corpus scripts only. Source lines and words remain literal text measurements. */
export function measureInstructions(source: string) {
    let codeBlocks = 0;
    const visit = (node: MarkdownNode) => {
        const offset = node.position?.start.offset;
        if (node.type === 'code' && offset !== undefined && /^(?:`{3,}|~{3,})/.test(source.slice(offset))) codeBlocks++;
        for (const child of node.children ?? []) visit(child);
    };
    visit(fromMarkdown(source));
    const lines = source.split(/\r\n|\n|\r/);
    const count = (pattern: RegExp) => lines.filter((line) => pattern.test(line)).length;
    return {
        bytes: Buffer.byteLength(source, 'utf8'),
        lines: countSourceLines(source),
        words: source.split(/\s+/).filter(Boolean).length,
        headings: count(/^#{1,6} /),
        bullets: count(/^\s*[-*] /),
        codeBlocks,
        docLinks: (source.match(/\]\([^)h][^)]*\)/g) ?? []).length,
    };
}
