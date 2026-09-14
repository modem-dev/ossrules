import Link from 'next/link';

export function SiteFooter() {
    return (
        <footer className="border-gray-750 border-t">
            <div className="mx-auto flex max-w-container flex-col gap-6 px-5 py-8 sm:px-12 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="font-mono text-[13px] tracking-tight">Good instructions are worth sharing.</p>
                    <nav aria-label="Footer navigation" className="mt-3 flex gap-5 text-gray-550 text-xs">
                        <Link href="/" className="hover:text-teal">
                            Projects
                        </Link>
                        <Link href="/techniques" className="hover:text-teal">
                            Techniques
                        </Link>
                    </nav>
                </div>
                <a
                    href="https://modem.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group max-w-xs text-gray-550 text-xs leading-relaxed"
                >
                    From codebase context to customer context.
                    <span className="mt-1 block text-light-cream transition-colors group-hover:text-teal">A project by Modem ↗</span>
                </a>
            </div>
        </footer>
    );
}
