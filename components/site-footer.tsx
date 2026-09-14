import Link from 'next/link';

export function SiteFooter() {
    return (
        <footer className="relative z-10 mt-24 border-gray-750/60 border-t">
            <div className="mx-auto flex max-w-container flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-12">
                <p className="font-inter text-gray-550 text-sm">
                    Built by{' '}
                    <a
                        href="https://modem.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal transition-colors hover:underline"
                    >
                        Modem
                    </a>
                    . Every file is quoted verbatim and linked to its source.
                </p>
                <nav className="flex flex-wrap items-center gap-5 font-inter text-gray-550 text-sm">
                    <Link href="/techniques" className="transition-colors hover:text-light-cream">
                        Techniques
                    </Link>
                    <a
                        href="https://github.com/modem-dev/ossrules"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-light-cream"
                    >
                        Add a project
                    </a>
                </nav>
            </div>
        </footer>
    );
}
