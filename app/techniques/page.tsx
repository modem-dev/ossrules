import Image from 'next/image';
import Link from 'next/link';
import { logoSrc, PATTERNS } from '@/components/agents-md-data';
import { JsonLd } from '@/components/json-ld';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { TechniqueIcon } from '@/components/technique-icons';
import { getAgentsProjects, projectsWithPattern } from '@/lib/agents-md';
import { ogImageUrl } from '@/lib/og';
import { collectionPageSchema } from '@/lib/schema';

const title = 'AGENTS.md techniques';
const description =
    'The techniques that recur across AGENTS.md files: hard prohibitions, router files, verification by change type, ratchets, scope layering, and more, with the projects that use each one.';

export const metadata = {
    title,
    description,
    alternates: { canonical: '/techniques' },
    openGraph: {
        title,
        description,
        images: [{ url: ogImageUrl('AGENTS.md techniques'), width: 1200, height: 630 }],
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl('AGENTS.md techniques')],
    },
};

export default function TechniquesPage() {
    const projects = getAgentsProjects();

    return (
        <div className="min-h-screen bg-dark-gray flex flex-col">
            <JsonLd
                data={collectionPageSchema({
                    title,
                    description,
                    path: '/techniques',
                    items: PATTERNS.map((pattern) => ({ name: pattern.name, path: `/techniques#${pattern.id}` })),
                })}
            />
            <SiteHeader />

            <main id="main" className="page-shell flex-1">
                <header className="max-w-3xl">
                    <p className="eyebrow">The transferable part / {PATTERNS.length} techniques</p>
                    <h1 className="page-title mt-5">Patterns worth borrowing.</h1>
                    <p className="mt-5 max-w-2xl text-gray-550 text-base leading-relaxed">
                        Different projects. Recurring ideas. Find a technique, then see how real projects put it to work.
                    </p>
                </header>

                <details className="technique-jump mt-8">
                    <summary className="text-gray-550 text-sm">Jump to a technique</summary>
                    <nav aria-label="Techniques" className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {PATTERNS.map((pattern) => (
                            <a key={pattern.id} href={`#${pattern.id}`} className="py-2 text-gray-500 text-xs hover:text-teal">
                                {pattern.name} <span aria-hidden>↗</span>
                            </a>
                        ))}
                    </nav>
                </details>

                <div className="mt-8 grid items-start gap-5 md:grid-cols-2">
                    {PATTERNS.map((pattern, index) => {
                        const used = projectsWithPattern(pattern.id);
                        return (
                            <section key={pattern.id} id={pattern.id} className="technique-card">
                                <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-gray-600">
                                    <span className="inline-flex items-center gap-2 text-teal">
                                        <TechniqueIcon pattern={pattern.id} className="size-4" />
                                        {String(index + 1).padStart(2, '0')} / TECHNIQUE
                                    </span>
                                    <span>
                                        {used.length} of {projects.length} projects
                                    </span>
                                </div>
                                <h2 className="section-title mt-5">{pattern.name}</h2>
                                <p className="mt-3 text-gray-500 text-sm leading-relaxed">{pattern.summary}</p>
                                <details className="mt-4">
                                    <summary className="inline-summary text-gray-550 text-xs">Why it works</summary>
                                    <p className="mt-3 text-gray-550 text-sm leading-relaxed">{pattern.detail}</p>
                                </details>
                                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-gray-750 border-t pt-5">
                                    <ul className="flex gap-1.5" aria-label="Example projects">
                                        {used.slice(0, 5).map((project) => (
                                            <li key={project.slug}>
                                                <Link
                                                    href={`/${project.slug}`}
                                                    className="block rounded-md transition-opacity hover:opacity-75"
                                                    title={project.name}
                                                >
                                                    <Image
                                                        src={logoSrc(project)}
                                                        alt={project.name}
                                                        width={28}
                                                        height={28}
                                                        className="size-7 rounded-md bg-gray-800 object-cover"
                                                    />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href={`/?technique=${pattern.id}#projects`}
                                        className="inline-flex min-h-9 items-center text-teal text-xs hover:underline"
                                    >
                                        Explore {used.length} {used.length === 1 ? 'project' : 'projects'}{' '}
                                        <span aria-hidden className="ml-1.5">
                                            →
                                        </span>
                                    </Link>
                                </div>
                            </section>
                        );
                    })}
                </div>
                <p className="mt-8 font-mono text-[11px] text-gray-600">
                    Ordered roughly from easiest to adopt to more specialized techniques.
                </p>
            </main>

            <SiteFooter />
        </div>
    );
}
