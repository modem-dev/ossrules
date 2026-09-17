export interface SourceLocation {
    path: string;
    via?: string;
    startLine?: number;
    lineCount?: number;
}

const SOURCE_KEYS = ['source', 'line', 'end', 'view', 'rev'] as const;

/** Only recorded, readable paths can be opened. Never interpret URL input as a filesystem path. */
export function readSourceLocation(
    search: string,
    files: { path: string; resolvedPath?: string; missing?: boolean; unavailable?: string }[],
    sha: string,
) {
    const params = new URLSearchParams(search);
    const file = files.find((file) => file.path === params.get('source') && !file.missing && !file.unavailable);
    const revision = params.get('rev');
    const mismatch = !!params.get('source') && !!revision && revision !== sha;
    if (!file || mismatch) return { request: undefined, view: 'markdown' as const, mismatch };
    const positive = (value: string | null) =>
        value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : undefined;
    const startLine = positive(params.get('line'));
    const end = positive(params.get('end'));
    const request: SourceLocation = {
        path: file.resolvedPath ?? file.path,
        ...(file.resolvedPath ? { via: file.path } : {}),
        ...(startLine ? { startLine, lineCount: end && end >= startLine ? end - startLine + 1 : 1 } : {}),
    };
    return {
        request,
        view: params.get('view') === 'raw' || (startLine && params.get('view') !== 'markdown') ? ('raw' as const) : ('markdown' as const),
        mismatch,
    };
}

export function writeSourceLocation(search: string, request: SourceLocation | undefined, view: 'markdown' | 'raw', sha: string) {
    const params = new URLSearchParams(search);
    for (const key of SOURCE_KEYS) params.delete(key);
    if (request) {
        params.set('source', request.via ?? request.path);
        params.set('rev', sha);
        params.set('view', view);
        if (request.startLine) {
            params.set('line', String(request.startLine));
            if (request.lineCount && request.lineCount > 1) params.set('end', String(request.startLine + request.lineCount - 1));
        }
    }
    return params.toString();
}
