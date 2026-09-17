import Image from 'next/image';
import type { ReactNode } from 'react';

export function ModemSponsor({ children }: { children: ReactNode }) {
    return (
        <section aria-label="Sponsored by Modem" className="modem-sponsor modem-surface mt-16">
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="font-mono text-gray-550 text-xs">Sponsored by</span>
                <a href="https://modem.dev" target="_blank" rel="noopener noreferrer">
                    <Image src="/logos/modem-full-dark.svg" alt="Modem" width={800} height={146} className="h-5 w-auto" />
                </a>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="min-w-0 max-w-2xl flex-1 basis-80">
                    <h2 className="section-title">Give agents the context instructions miss</h2>
                    <p className="mt-3 text-gray-550 text-base leading-relaxed">{children}</p>
                </div>
                <a href="https://modem.dev" target="_blank" rel="noopener noreferrer" className="action-link action-primary shrink-0">
                    Try Modem <span aria-hidden>↗</span>
                </a>
            </div>
        </section>
    );
}
