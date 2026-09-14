import type { Metadata } from 'next';
import { Inter, Roboto } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter-variable', weight: ['400', '600'] });
const roboto = Roboto({ subsets: ['latin'], display: 'swap', variable: '--font-roboto-variable', weight: ['400', '700'] });

export const metadata: Metadata = {
    metadataBase: new URL('https://ossrules.md'),
    title: {
        default: 'OSS Rules — what open source projects put in their AGENTS.md',
        template: '%s | OSS Rules',
    },
    description:
        'A browsable directory of AGENTS.md files from open source projects, measured and read, so you can tell what is in one without opening it.',
    openGraph: { siteName: 'OSS Rules', type: 'website' },
    twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
                <link rel="stylesheet" href="https://use.typekit.net/vuf3cyd.css" />
            </head>
            <body className={`${inter.variable} ${roboto.variable} antialiased`}>{children}</body>
        </html>
    );
}
