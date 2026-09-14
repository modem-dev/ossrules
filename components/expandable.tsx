'use client';

import { useState } from 'react';

/**
 * Clips tall content to a fixed height with a fade, and a button to reveal it.
 *
 * The content is passed in as children from a server component, so every line is
 * in the prerendered HTML whether or not this is expanded; the collapse is a CSS
 * clip, not a shorter list. A <details> element cannot do this: it hides all
 * non-summary content when closed, so there is no partial preview to fade.
 *
 * `fadeFrom` must match the container's background for the gradient to land.
 */
export function Expandable({
    children,
    collapsedHeight,
    expandLabel,
    collapseLabel = 'Collapse',
    fadeFrom = 'from-gray-850',
}: {
    children: React.ReactNode;
    collapsedHeight: number;
    expandLabel: string;
    collapseLabel?: string;
    fadeFrom?: string;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <div className="relative">
                <div className="overflow-hidden" style={expanded ? undefined : { maxHeight: collapsedHeight }}>
                    {children}
                </div>
                {expanded ? null : (
                    <div
                        aria-hidden
                        className={`pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t ${fadeFrom} via-70% to-transparent`}
                    />
                )}
            </div>
            <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
                className="flex w-full cursor-pointer items-center gap-1.5 border-t border-gray-750/70 px-4 py-2.5 font-inter text-xs text-gray-550 transition-colors hover:text-teal"
            >
                <svg
                    viewBox="0 0 16 16"
                    aria-hidden
                    role="presentation"
                    className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                >
                    <path
                        d="M4 6l4 4 4-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                {expanded ? collapseLabel : expandLabel}
            </button>
        </>
    );
}
