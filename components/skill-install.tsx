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
            <div className="modem-surface absolute left-0 top-full z-30 mt-2 w-[min(44rem,calc(100vw-3rem))] overflow-hidden rounded border border-gray-750 shadow-lg sm:left-auto sm:right-0">
                <div className="flex items-center justify-between gap-3 border-b border-gray-750 px-4 py-3">
                    <p className="flex items-center gap-2 font-mono text-xs text-gray-550">
                        <span aria-hidden className="text-teal">
                            &gt;_
                        </span>
                        Run in your terminal
                    </p>
                    <CopySource source={command} label="Copy install command" iconAfter />
                </div>
                <div className="flex items-start gap-3 px-4 py-4 font-mono text-xs leading-6">
                    <span aria-hidden className="shrink-0 select-none text-teal">
                        $
                    </span>
                    <section
                        // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users need to scroll the single-line command.
                        tabIndex={0}
                        aria-label="Install command"
                        className="min-w-0 flex-1 overflow-x-auto whitespace-pre text-light-cream"
                    >
                        <code>{command}</code>
                    </section>
                </div>
            </div>
        </details>
    );
}
