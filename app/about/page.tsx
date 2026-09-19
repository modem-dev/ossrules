import Image from 'next/image';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { ogImageUrl } from '@/lib/og';

const title = 'About';
const description = 'Why we built ossrules.md, who is behind it, and more open-source tools from Modem.';

export const metadata = {
    title,
    description,
    alternates: { canonical: '/about' },
    openGraph: { title, description, images: [{ url: ogImageUrl(title), width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl(title)] },
};

const team: { name: string; image: string; github?: string; x?: string }[] = [
    { name: 'Ben Vinegar', image: 'benvinegar.png', github: 'benvinegar', x: 'bentlegen' },
    { name: 'Mike Clarke', image: 'mikeclarke.png', github: 'mikeclarke', x: 'mikeclarke' },
    { name: 'Cody Brouwers', image: 'codybrouwers.png', github: 'codybrouwers', x: 'codybrouwers' },
    { name: 'Chris Clark', image: 'Chrissy.png', github: 'Chrissy' },
    { name: 'Justin Giancola', image: 'elucid.png', github: 'elucid', x: 'elucid_ont' },
    { name: 'James Kranz', image: 'jameskranz.png', github: 'jameskranz', x: 'jameskranz' },
];

function SocialIcon({ network }: { network: 'github' | 'x' }) {
    return (
        <svg
            width="16"
            height="16"
            viewBox={network === 'github' ? '0 0 16 16' : '0 0 24 24'}
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
        >
            <path
                d={
                    network === 'github'
                        ? 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z'
                        : 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933Zm-1.29 19.49h2.039L6.487 3.24H4.3l13.31 17.403Z'
                }
            />
        </svg>
    );
}

const projects = [
    {
        name: 'Hunk',
        href: 'https://hunk.dev',
        label: 'hunk.dev',
        description:
            'Review code changes in your terminal, with side-by-side diffs, a file sidebar, and agent notes beside the code they explain.',
        image: '/images/about/hunk.webp',
        alt: 'Hunk showing a split diff with a file sidebar and inline agent notes.',
    },
    {
        name: 'Sideshow',
        href: 'https://sideshow.sh',
        label: 'sideshow.sh',
        description:
            'Give your coding agent a visual workspace. See mockups, diagrams, and diffs in your browser, then leave feedback to steer the work.',
        image: '/images/about/sideshow.png',
        alt: 'Sideshow showing agent sessions, a flow diagram, and a comment thread.',
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-dark-gray flex flex-col">
            <SiteHeader />
            <main id="main" className="page-shell flex-1">
                <header className="max-w-3xl">
                    <p className="eyebrow">About ossrules.md</p>
                    <h1 className="page-title mt-5">Better agent instructions start with real examples.</h1>
                    <p className="mt-5 text-gray-550 text-base leading-relaxed">
                        ossrules.md is a reference library of agent instructions and skills from open-source projects. We explain what they
                        do, link to the original source, and surface techniques you can borrow for your own repository.
                    </p>
                </header>

                <section
                    aria-label="Built and sponsored by Modem"
                    className="mt-8 grid gap-6 border-t-2 border-teal pt-7 lg:grid-cols-[1fr_1.7fr] lg:gap-10"
                >
                    <div>
                        <p className="eyebrow">Built and sponsored by</p>
                        <a href="https://modem.dev" className="mt-3 inline-flex py-2">
                            <Image src="/logos/modem-full-dark.svg" alt="Modem" width={800} height={146} className="h-6 w-auto invert" />
                        </a>
                        <p className="mt-3 max-w-sm text-gray-550 text-sm leading-relaxed">
                            We build tools that help developers give coding agents useful context and work more closely with them.
                        </p>
                        <a href="https://modem.dev" className="action-link action-primary mt-5">
                            Visit Modem{' '}
                            <span aria-hidden="true" className="ml-1">
                                ↗
                            </span>
                        </a>
                    </div>
                    <ul aria-label="Modem team" className="grid gap-x-7 sm:grid-cols-2">
                        {team.map((person) => (
                            <li key={person.name} className="flex items-center gap-3 border-b border-gray-750 py-3">
                                <Image
                                    src={`/images/about/${person.image}`}
                                    alt=""
                                    width={40}
                                    height={40}
                                    className="size-10 shrink-0 rounded-full object-cover"
                                />
                                <div>
                                    <p className="font-mono text-sm">{person.name}</p>
                                    <div className="-ml-1 flex min-h-9 items-center">
                                        {person.github && (
                                            <a
                                                href={`https://github.com/${person.github}`}
                                                aria-label={`${person.name} on GitHub`}
                                                title={`${person.name} on GitHub`}
                                                className="inline-flex h-9 w-6 items-center justify-center text-gray-550 hover:text-teal"
                                            >
                                                <SocialIcon network="github" />
                                            </a>
                                        )}
                                        {person.x && (
                                            <a
                                                href={`https://x.com/${person.x}`}
                                                aria-label={`${person.name} on X`}
                                                title={`${person.name} on X`}
                                                className="inline-flex h-9 w-6 items-center justify-center text-gray-550 hover:text-teal"
                                            >
                                                <SocialIcon network="x" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <section aria-labelledby="other-projects" className="mt-12">
                    <h2 id="other-projects" className="section-title">
                        Our other open source projects
                    </h2>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        {projects.map((project) => (
                            <a
                                key={project.name}
                                href={project.href}
                                className="group flex flex-col overflow-hidden border border-gray-750 transition-colors hover:border-teal"
                            >
                                <div className="relative aspect-[1.85] shrink-0 bg-[#161b1a]">
                                    <Image
                                        src={project.image}
                                        alt={project.alt}
                                        fill
                                        sizes="(max-width: 767px) 100vw, 50vw"
                                        className="object-contain p-3 sm:p-4"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col p-6">
                                    <h3 className="section-title group-hover:text-teal">{project.name}</h3>
                                    <p className="mt-3 text-gray-550 text-sm leading-relaxed">{project.description}</p>
                                    <span className="mt-auto pt-5 font-mono text-teal text-xs">
                                        {project.label} <span aria-hidden="true">↗</span>
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}
