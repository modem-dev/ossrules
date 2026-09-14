import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { logoSrc, PATTERNS } from '@/components/agents-md-data';
import { JsonLd } from '@/components/json-ld';
import { ProjectExplorer, ProjectExplorerContent } from '@/components/project-explorer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getAgentsProjects } from '@/lib/agents-md';
import { ogImageUrl } from '@/lib/og';
import { collectionPageSchema } from '@/lib/schema';

const title = 'AGENTS.md Directory';
const description =
    'Browse AGENTS.md files from open source projects. Sort by stars or file length, filter by language and technique, and read what each one does that the others do not.';

export const metadata = {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: {
        title,
        description,
        images: [{ url: ogImageUrl('AGENTS.md Directory'), width: 1200, height: 630 }],
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl('AGENTS.md Directory')],
    },
};

export default function AgentsMdPage() {
    const projects = getAgentsProjects();
    const featured = projects.find((project) => project.slug === 'ghostty');

    return (
        <div className="min-h-screen bg-dark-gray flex flex-col">
            <JsonLd
                data={collectionPageSchema({
                    title,
                    description,
                    path: '/',
                    items: projects.map((project) => ({ name: project.name, path: `/${project.slug}` })),
                })}
            />
            <SiteHeader />

            <main id="main" className="page-shell flex-1">
                <header className="directory-hero">
                    <div>
                        <p className="eyebrow">
                            {projects.length} projects / {PATTERNS.length} techniques / Open source
                        </p>
                        <h1 className="page-title mt-5">
                            Better instructions.
                            <br />
                            Better agents.
                        </h1>
                        <p className="mt-5 max-w-xl text-gray-550 text-base leading-relaxed">
                            Explore the AGENTS.md files behind open source projects. See what works, read the source, and take the useful
                            parts.
                        </p>
                    </div>
                    {featured ? (
                        <Link href={`/${featured.slug}`} className="directory-feature group">
                            <p className="eyebrow">A study in brevity</p>
                            <p className="mt-4 font-mono text-xl leading-relaxed tracking-tight">
                                {featured.file.lines} lines.
                                <br />
                                Two absolute rules.
                                <br />
                                One very clear brief.
                            </p>
                            <div className="mt-6 flex items-center gap-3 text-gray-550 text-xs">
                                <Image src={logoSrc(featured)} alt="" width={28} height={28} className="size-7 rounded-md" />
                                <span>Inside Ghostty’s AGENTS.md</span>
                                <span aria-hidden className="ml-auto text-teal">
                                    ↗
                                </span>
                            </div>
                        </Link>
                    ) : null}
                </header>
                <section id="projects" aria-label="Projects">
                    <Suspense fallback={<ProjectExplorerContent projects={projects} />}>
                        <ProjectExplorer projects={projects} />
                    </Suspense>
                </section>
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-gray-550 text-sm">Different projects. Recurring ideas.</p>
                    <Link href="/techniques" className="action-link">
                        Explore all {PATTERNS.length} techniques <span aria-hidden>→</span>
                    </Link>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
