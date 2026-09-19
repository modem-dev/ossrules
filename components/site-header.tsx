'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GitHubStar } from './github-star';

export function SiteHeader() {
    const pathname = usePathname();
    const patterns = pathname === '/agent-rules' || pathname.startsWith('/agent-rules/');
    const skills = pathname === '/skills';

    return (
        <header className="site-header modem-surface sticky inset-x-0 top-0 z-40">
            <a href="#main" className="skip-link action-link">
                Skip to content
            </a>
            <div className="mx-auto flex max-w-container items-center justify-between gap-2 px-2 min-[440px]:px-3 py-3 sm:px-12 sm:py-4">
                <Link
                    href="/"
                    aria-label="ossrules.md home"
                    className="inline-flex shrink-0 items-center gap-1.5 sm:gap-2.5 font-mono font-medium text-[14px] min-[440px]:text-[17px] tracking-tight transition-colors hover:text-teal sm:text-lg"
                >
                    <Image src="/logos/ossrules.svg" alt="" width={32} height={32} className="size-6 min-[440px]:size-8 shrink-0" />
                    <span>
                        ossrules<span className="text-teal">.md</span>
                    </span>
                </Link>
                <nav
                    aria-label="Main navigation"
                    className="flex items-center gap-1.5 min-[440px]:gap-3 whitespace-nowrap text-xs sm:gap-6 sm:text-[13px]"
                >
                    <Link
                        href="/"
                        aria-current={pathname === '/' ? 'page' : undefined}
                        className={`border-b-2 py-2 transition-colors hover:text-light-cream ${!patterns && !skills && pathname !== '/about' ? 'border-teal text-light-cream' : 'border-transparent text-gray-550'}`}
                    >
                        Projects
                    </Link>
                    <Link
                        href="/agent-rules"
                        aria-current={pathname === '/agent-rules' ? 'page' : patterns ? 'location' : undefined}
                        className={`border-b-2 py-2 transition-colors hover:text-light-cream ${patterns ? 'border-teal text-light-cream' : 'border-transparent text-gray-550'}`}
                    >
                        <span className="hidden sm:inline">Rule </span>Patterns
                    </Link>
                    <Link
                        href="/skills"
                        aria-current={skills ? 'page' : undefined}
                        className={`border-b-2 py-2 transition-colors hover:text-light-cream ${skills ? 'border-teal text-light-cream' : 'border-transparent text-gray-550'}`}
                    >
                        Skills
                    </Link>
                    <GitHubStar />
                </nav>
            </div>
        </header>
    );
}
