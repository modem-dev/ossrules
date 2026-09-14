import type { ReactNode } from 'react';

export default function CTAButton({
    children,
    className = '',
    href = 'https://modem.dev',
}: {
    children: ReactNode;
    className?: string;
    href?: string;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-block rounded-md bg-teal px-4 py-2 font-inter font-semibold text-base text-marketing-black transition-colors hover:bg-teal-dark lg:rounded-xl lg:px-8 lg:py-4 ${className}`}
        >
            {children}
        </a>
    );
}
