import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';

export interface SkillHeading {
    id: string;
    text: string;
    depth: number;
    line: number;
}

interface MarkdownNode {
    type: string;
    value?: string;
    alt?: string | null;
    depth?: number;
    children?: MarkdownNode[];
    position?: { start: { line: number } };
}

function headingText(node: MarkdownNode): string {
    if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? '';
    if (node.type === 'image' || node.type === 'imageReference') return node.alt ?? '';
    if (node.type === 'break') return ' ';
    return node.children?.map(headingText).join('') ?? '';
}

/** Parse the same GFM dialect as the reader. Positions also identify rendered headings. */
export function skillHeadings(source: string): SkillHeading[] {
    const tree = fromMarkdown(source, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] });
    const headings: SkillHeading[] = [];
    const used = new Set(['main', 'skill-document-title']);
    function visit(node: MarkdownNode) {
        if (node.type === 'heading' && node.position && node.depth) {
            const text = headingText(node).trim();
            const slug =
                text
                    .toLowerCase()
                    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
                    .replace(/\s/g, '-') || 'section';
            let id = slug;
            for (let suffix = 1; used.has(id); suffix++) id = `${slug}-${suffix}`;
            used.add(id);
            headings.push({ id, text: text || 'Untitled section', depth: node.depth, line: node.position.start.line });
        }
        // Footnotes are rendered outside document order and aren't part of its outline.
        if (node.type !== 'footnoteDefinition') node.children?.forEach(visit);
    }
    visit(tree);
    return headings;
}

/** Omit a lone document title, then show sections and one level of subsections. */
export function skillOutline(headings: SkillHeading[]) {
    const first = headings[0];
    const sections =
        first?.depth === 1 && headings.length > 1 && headings.slice(1).every((heading) => heading.depth > 1) ? headings.slice(1) : headings;
    const depth = Math.min(...sections.map((heading) => heading.depth));
    return sections.filter((heading) => heading.depth <= depth + 1);
}
