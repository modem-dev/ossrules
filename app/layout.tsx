import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter-variable', weight: ['400', '500', '600'] });
const jetbrains = localFont({
    src: [
        { path: '../public/fonts/JetBrainsMono-Regular.woff2', weight: '400', style: 'normal' },
        { path: '../public/fonts/JetBrainsMono-Medium.woff2', weight: '500', style: 'normal' },
    ],
    display: 'swap',
    variable: '--font-jetbrains-variable',
});

export const metadata: Metadata = {
    metadataBase: new URL('https://ossrules.md'),
    title: {
        default: 'OSS Rules — agent instructions and skills from open source projects',
        template: '%s | OSS Rules',
    },
    description:
        'A reference library of agent instructions and skills from open source projects, with original source, analysis, and bundled resources.',
    openGraph: { siteName: 'OSS Rules', type: 'website' },
    twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${jetbrains.variable} antialiased`}>{children}</body>
        </html>
    );
}
