'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SiteHeader() {
    const pathname = usePathname();
    const techniques = pathname === '/agent-rules' || pathname.startsWith('/agent-rules/');
    const skills = pathname === '/skills';

    return (
        <header className="site-header modem-surface sticky inset-x-0 top-0 z-40">
            <a href="#main" className="skip-link action-link">
                Skip to content
            </a>
            <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 sm:px-12">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2.5 font-mono font-medium text-[17px] tracking-tight transition-colors hover:text-teal sm:text-lg"
                >
                    <Image src="/logos/ossrules.svg" alt="" width={32} height={32} className="size-8 shrink-0" />
                    <span>
                        ossrules<span className="text-teal">.md</span>
                    </span>
                </Link>
                <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] sm:gap-x-6">
                    <Link
                        href="/"
                        aria-current={pathname === '/' ? 'page' : undefined}
                        className={`border-b-2 py-2 transition-colors hover:text-light-cream ${!techniques && !skills ? 'border-teal text-light-cream' : 'border-transparent text-gray-550'}`}
                    >
                        Projects
                    </Link>
                    <Link
                        href="/agent-rules"
                        aria-current={pathname === '/agent-rules' ? 'page' : techniques ? 'location' : undefined}
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
                    <a
                        href="https://github.com/modem-dev/ossrules"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub repository (opens in a new tab)"
                        className="inline-flex items-center gap-1 border-transparent border-b-2 py-2 text-gray-550 transition-colors hover:text-light-cream"
                    >
                        GitHub <span aria-hidden="true">↗</span>
                    </a>
                </nav>
            </div>
        </header>
    );
}
