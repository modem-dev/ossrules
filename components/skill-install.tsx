'use client';

import { useEffect, useRef } from 'react';
import { CopySource } from './copy-source';

export function SkillInstall({ command }: { command: string }) {
    const disclosure = useRef<HTMLDetailsElement>(null);

    useEffect(() => {
        function outside(event: PointerEvent) {
            if (disclosure.current?.open && event.target instanceof Node && !disclosure.current.contains(event.target)) {
                disclosure.current.open = false;
            }
        }
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, []);

    return (
        <details
            ref={disclosure}
            className="group"
            suppressHydrationWarning
            onBlur={(event) => {
                if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
            }}
            onKeyDown={(event) => {
                if (event.key === 'Escape' && disclosure.current?.open) {
                    disclosure.current.open = false;
                    disclosure.current.querySelector('summary')?.focus();
                    event.stopPropagation();
                }
            }}
        >
            <summary className="action-link cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                Install
                <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4 group-open:rotate-180">
                    <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </summary>
            <div className="absolute left-0 top-full z-30 mt-2 flex w-[min(32rem,calc(100vw-3rem))] items-center gap-3 rounded border border-gray-750 bg-gray-850 p-3 shadow-lg sm:left-auto sm:right-0">
                <code className="min-w-0 flex-1 font-mono text-xs leading-relaxed text-gray-400 [overflow-wrap:anywhere]">{command}</code>
                <div className="shrink-0">
                    <CopySource source={command} label="Copy install command" iconAfter />
                </div>
            </div>
        </details>
    );
}
