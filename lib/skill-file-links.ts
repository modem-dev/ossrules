import path from 'node:path';

interface MarkdownNode {
    type: string;
    value?: string;
    url?: string;
    children?: MarkdownNode[];
}

interface FileLinkOptions {
    currentFile: string;
    files: string[];
}

/** Link exact relative paths in prose and inline code, never examples in code blocks. */
export function remarkSkillFileLinks({ currentFile, files }: FileLinkOptions) {
    const paths = files
        .map((file) => path.posix.relative(path.posix.dirname(currentFile), file))
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)
        .map((file) => file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!paths.length) return () => {};
    // Path boundaries prevent links inside URLs, longer paths, or backup filenames.
    const pattern = new RegExp(
        `(?<![\\p{L}\\p{N}_./\\\\~:@%+*?-])(?:\\./)?(?:${paths.join('|')})(?:#[\\p{L}\\p{N}_%+-]+)?(?![\\p{L}\\p{N}_/\\\\~@%+*?\\[-]|\\.[\\p{L}\\p{N}_.-])`,
        'gu',
    );

    function visit(node: MarkdownNode) {
        // Existing links keep their author-supplied destination and label.
        if (['link', 'linkReference', 'code', 'html', 'image', 'imageReference'].includes(node.type) || !node.children) return;
        node.children = node.children.flatMap((child) => {
            if ((child.type !== 'text' && child.type !== 'inlineCode') || !child.value) {
                visit(child);
                return [child];
            }
            const result: MarkdownNode[] = [];
            let offset = 0;
            for (const match of child.value.matchAll(pattern)) {
                if (match.index > offset) result.push({ type: child.type, value: child.value.slice(offset, match.index) });
                result.push({ type: 'link', url: match[0], children: [{ type: child.type, value: match[0] }] });
                offset = match.index + match[0].length;
            }
            if (!offset) return [child];
            if (offset < child.value.length) result.push({ type: child.type, value: child.value.slice(offset) });
            return result;
        });
    }

    return visit;
}
