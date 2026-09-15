'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SiteHeader() {
    const pathname = usePathname();
    const techniques = pathname === '/agent-rules';
    const skills = pathname === '/skills';

    return (
        <header className="site-header modem-surface sticky inset-x-0 top-0 z-40">
            <a href="#main" className="skip-link action-link">
                Skip to content
            </a>
            <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 sm:px-12">
                <Link href="/" className="font-mono font-medium text-[17px] tracking-tight transition-colors hover:text-teal sm:text-lg">
                    ossrules<span className="text-teal">.md</span>
                </Link>
                <nav aria-label="Main navigation" className="flex items-center gap-6 text-[13px]">
                    <Link
                        href="/"
                        aria-current={pathname === '/' ? 'page' : undefined}
                        className={`border-b-2 py-2 transition-colors hover:text-light-cream ${!techniques && !skills ? 'border-teal text-light-cream' : 'border-transparent text-gray-550'}`}
                    >
                        Projects
                    </Link>
                    <Link
                        href="/agent-rules"
                        aria-current={techniques ? 'page' : undefined}
                        className={`border-b-2 py-2 transition-colors hover:text-light-cream ${techniques ? 'border-teal text-light-cream' : 'border-transparent text-gray-550'}`}
                    >
                        Agent Rules
                    </Link>
                    <Link
                        href="/skills"
                        aria-current={skills ? 'page' : undefined}
                        className={`border-b-2 py-2 transition-colors hover:text-light-cream ${skills ? 'border-teal text-light-cream' : 'border-transparent text-gray-550'}`}
                    >
                        Skills
                    </Link>
                </nav>
            </div>
        </header>
    );
}
