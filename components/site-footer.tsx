import Image from 'next/image';
import Link from 'next/link';

export function SiteFooter() {
    return (
        <footer className="relative z-10 mt-24 border-gray-750/60 border-t">
            <div className="mx-auto flex max-w-container flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-12">
                <nav className="flex flex-wrap items-center gap-5 font-inter text-gray-550 text-sm">
                    <Link href="/" className="transition-colors hover:text-light-cream">
                        Projects
                    </Link>
                    <Link href="/techniques" className="transition-colors hover:text-light-cream">
                        Techniques
                    </Link>
                </nav>
                <p className="font-inter text-gray-550 text-sm">
                    Built by{' '}
                    <a
                        href="https://modem.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex align-middle opacity-80 transition-opacity hover:opacity-100"
                    >
                        <Image src="/logos/modem-full-dark.svg" alt="Modem" width={800} height={146} className="h-[18px] w-auto" />
                    </a>
                </p>
            </div>
        </footer>
    );
}
