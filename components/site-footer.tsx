import Image from 'next/image';
import Link from 'next/link';

export function SiteFooter() {
    return (
        <footer className="site-footer modem-surface">
            <div className="mx-auto flex max-w-container flex-col gap-6 px-5 py-8 sm:px-12 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="font-mono text-[13px] tracking-tight">Open-source agent instructions, explained.</p>
                    <nav aria-label="Footer navigation" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-gray-550 text-xs">
                        <Link href="/" className="hover:text-teal">
                            Projects
                        </Link>
                        <Link href="/agent-rules" className="hover:text-teal">
                            Agent Rules
                        </Link>
                        <Link href="/skills" className="hover:text-teal">
                            Skills
                        </Link>
                        <a
                            href="https://github.com/modem-dev/ossrules"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub repository (opens in a new tab)"
                            className="inline-flex items-center gap-1 hover:text-teal"
                        >
                            GitHub <span aria-hidden="true">↗</span>
                        </a>
                    </nav>
                </div>
                <p className="flex items-center gap-2.5 self-end font-mono text-gray-550 text-xs md:self-auto">
                    Built by
                    <a
                        href="https://modem.dev?utm_source=referral&utm_medium=referral&utm_campaign=oss_ossrules&utm_content=site_footer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center opacity-90 transition-opacity hover:opacity-100"
                    >
                        <Image src="/logos/modem-full-dark.svg" alt="Modem" width={800} height={146} className="h-[18px] w-auto" />
                    </a>
                </p>
            </div>
        </footer>
    );
}
