import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { SITE_URL } from '@/lib/schema';
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
    metadataBase: new URL(SITE_URL),
    title: {
        default: 'ossrules.md — agent instructions and skills from open source projects',
        template: '%s | ossrules.md',
    },
    description:
        'A reference library of agent instructions and skills from open source projects, with original source, analysis, and bundled resources.',
    openGraph: { siteName: 'ossrules.md', type: 'website' },
    twitter: { card: 'summary_large_image' },
    icons: {
        icon: [
            { url: '/favicon.ico?v=bookmark', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
            { url: '/icon.png?v=bookmark', sizes: '96x96', type: 'image/png' },
            { url: '/logos/ossrules.svg?v=bookmark', sizes: 'any', type: 'image/svg+xml' },
        ],
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${jetbrains.variable} antialiased`}>
                {children}
                <Analytics />
            </body>
        </html>
    );
}
