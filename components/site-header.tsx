'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SiteHeader() {
    const pathname = usePathname();
    const techniques = pathname === '/techniques';

    return (
        <header className="sticky inset-x-0 top-0 z-40 border-gray-750 border-b bg-dark-gray/95 backdrop-blur-md">
            <a href="#main" className="skip-link action-link">
                Skip to content
            </a>
            <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 sm:px-12">
                <Link href="/" className="font-mono font-medium text-[17px] tracking-tight transition-colors hover:text-teal sm:text-lg">
                    OSS Rules<span className="text-teal">.md</span>
                </Link>
                <nav aria-label="Main navigation" className="flex items-center gap-6 text-[13px]">
                    <Link
                        href="/"
                        aria-current={pathname === '/' ? 'page' : undefined}
                        className={`border-b-2 py-2 transition-colors hover:text-light-cream ${!techniques ? 'border-teal text-light-cream' : 'border-transparent text-gray-550'}`}
                    >
                        Projects
                    </Link>
                    <Link
                        href="/techniques"
                        aria-current={techniques ? 'page' : undefined}
                        className={`border-b-2 py-2 transition-colors hover:text-light-cream ${techniques ? 'border-teal text-light-cream' : 'border-transparent text-gray-550'}`}
                    >
                        Techniques
                    </Link>
                </nav>
            </div>
        </header>
    );
}
