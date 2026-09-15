import path from 'node:path';

export interface DocumentMention {
    sourcePath?: string;
    startLine: number;
    lines: string[];
}

/** Exact path mentions only: a basename or a pattern is not proof of a link. */
export function documentMentions(source: string | undefined, paths: string[], sourcePath?: string): Record<string, DocumentMention[]> {
    const result: Record<string, DocumentMention[]> = {};
    const lines = source?.split('\n') ?? [];
    for (const path of paths) {
        if (!path || path === (sourcePath ?? 'AGENTS.md')) continue;
        const mentionPath = sourcePath ? relativeMention(sourcePath, path) : path;
        const escaped = mentionPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(?<![\\w./-])(?:\\./)?${escaped}(?![\\w./-])`);
        const ranges: { start: number; end: number }[] = [];
        lines.forEach((line, index) => {
            if (!pattern.test(line)) return;
            const start = index > 0 && lines[index - 1].trim() ? index - 1 : index;
            const end = index + 1 < lines.length && lines[index + 1].trim() ? index + 1 : index;
            const previous = ranges.at(-1);
            if (previous && start <= previous.end) previous.end = end;
            else ranges.push({ start, end });
        });
        result[path] = ranges.map(({ start, end }) => ({
            ...(sourcePath ? { sourcePath } : {}),
            startLine: start + 1,
            lines: lines.slice(start, end + 1),
        }));
    }
    return result;
}

function relativeMention(sourcePath: string, target: string): string {
    return path.posix.relative(path.posix.dirname(sourcePath), target);
}
