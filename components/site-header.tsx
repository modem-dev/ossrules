import Link from 'next/link';

/** The site's own nav. Two links and a wordmark — this is a reference site. */
export function SiteHeader() {
    return (
        <header className="fixed inset-x-0 top-0 z-40 border-gray-750/60 border-b bg-dark-gray/95 backdrop-blur">
            <div className="mx-auto flex max-w-container items-center justify-between gap-6 px-6 py-4 sm:px-12">
                <Link href="/" className="font-unit-medium text-light-cream text-lg transition-colors hover:text-teal">
                    OSS Rules<span className="text-teal">.md</span>
                </Link>
                <nav className="flex items-center gap-5 font-inter text-sm">
                    <Link href="/" className="text-gray-550 transition-colors hover:text-light-cream">
                        Projects
                    </Link>
                    <Link href="/techniques" className="text-gray-550 transition-colors hover:text-light-cream">
                        Techniques
                    </Link>
                </nav>
            </div>
        </header>
    );
}
