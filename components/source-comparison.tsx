'use client';

import { useEffect, useState } from 'react';
import { HighlightedSource } from './highlighted-source';

/** Comparison reads the same pinned, verbatim files as the source tray. */
export function SourceComparison({
    slug,
    leftPath,
    left,
    rightPath,
    rightTruncated,
}: {
    slug: string;
    leftPath: string;
    left: string;
    rightPath: string;
    rightTruncated?: boolean;
}) {
    const [right, setRight] = useState<string>();
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        const abort = new AbortController();
        setRight(undefined);
        setFailed(false);
        fetch(`/files/${slug}/${rightPath.split('/').map(encodeURIComponent).join('/')}`, { signal: abort.signal })
            .then((response) => {
                if (!response.ok) throw new Error('Source unavailable');
                return response.text();
            })
            .then(setRight)
            .catch(() => {
                if (!abort.signal.aborted) setFailed(true);
            });
        return () => abort.abort();
    }, [slug, rightPath]);
    return (
        <section aria-label="Source comparison" className="grid gap-4 p-4 md:grid-cols-2">
            {[
                { path: leftPath, source: left },
                { path: rightPath, source: right },
            ].map(({ path, source }) => (
                <div key={path} className="min-w-0">
                    <h2 className="mb-3 break-all font-mono text-teal text-xs">{path}</h2>
                    {path === rightPath && rightTruncated ? (
                        <p className="mb-3 text-xs text-gray-600">Stored excerpt; the complete file is available on GitHub.</p>
                    ) : null}
                    {source === undefined ? (
                        <p role="status" className="text-xs text-gray-550">
                            {failed ? 'Could not load comparison file.' : 'Loading source…'}
                        </p>
                    ) : (
                        <HighlightedSource source={source} language="markdown" numbered />
                    )}
                </div>
            ))}
        </section>
    );
}
