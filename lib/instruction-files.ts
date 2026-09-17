import path from 'node:path';

/** Resolve only repository-local targets. Never dereference paths on the host. */
export function localTarget(from: string, target: string): string | undefined {
    if (!target || /^(?:[a-z]+:|[~/\\])/i.test(target) || target.includes('\\') || target.includes('\0')) return undefined;
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(from), target));
    return resolved === '..' || resolved.startsWith('../') || resolved === '.' ? undefined : resolved;
}

export interface InstructionImport {
    target: string;
    path?: string;
    unavailable?: string;
}

/** Import directives in prose only; code examples and inline literals are not imports. */
export function instructionImports(sourcePath: string, source: string, available?: Set<string>): InstructionImport[] {
    const found = new Map<string, InstructionImport>();
    let fence: string | undefined;
    for (const line of source.split('\n')) {
        const content = line.replace(/^(?:[ \t]*>[ \t]?)+/, '');
        const marker = /^\s*(`{3,}|~{3,})/.exec(content)?.[1];
        if (marker) {
            if (!fence) fence = marker;
            else if (marker[0] === fence[0] && marker.length >= fence.length) fence = undefined;
            continue;
        }
        if (fence) continue;
        const prose = content.replace(/(`+)[\s\S]*?\1/g, '');
        for (const match of prose.matchAll(/(?<![\w@])@([^\s`"'<>()[\],;]+)/g)) {
            // Prose can name a Python decorator without marking it as inline code.
            if (/\bdecorator(?:\s+with)?\s+$/i.test(prose.slice(0, match.index))) continue;
            const target = match[1].replace(/[.!?:*]+$/, '');
            if (!target) continue;
            const resolved = localTarget(sourcePath, target);
            // Package names and social handles in prose are not evidence of an import.
            // Keep explicit directives, file-shaped paths, and paths in the pinned tree.
            if (
                !path.posix.basename(target).includes('.') &&
                !/^(README|LICENSE|COPYING)$/.test(path.posix.basename(target)) &&
                prose.trim() !== `@${target}` &&
                !(resolved && available?.has(resolved))
            )
                continue;
            found.set(target, { target, ...(resolved ? { path: resolved } : { unavailable: 'Outside the repository snapshot' }) });
        }
    }
    return [...found.values()];
}

export function resolveSymlink(from: string, links: Map<string, string>, available: Set<string>): { path?: string; unavailable?: string } {
    const seen = new Set<string>();
    let current = from;
    while (links.has(current)) {
        if (seen.has(current)) return { unavailable: 'Circular symlink' };
        seen.add(current);
        const next = localTarget(current, links.get(current) ?? '');
        if (!next) return { unavailable: 'Symlink points outside the repository snapshot' };
        current = next;
    }
    return available.has(current) ? { path: current } : { unavailable: 'Symlink target is not in this snapshot' };
}
