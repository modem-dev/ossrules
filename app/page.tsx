import Link from 'next/link';
import { Suspense } from 'react';
import { PATTERNS } from '@/components/agents-md-data';
import { JsonLd } from '@/components/json-ld';
import { ProjectExplorer, ProjectExplorerContent } from '@/components/project-explorer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getAgentsProjects } from '@/lib/agents-md';
import { ogImageUrl } from '@/lib/og';
import { projectHref } from '@/lib/project-paths';
import { collectionPageSchema } from '@/lib/schema';
import { getAllSkills } from '@/lib/skills';

const title = 'Agent instructions and skills';
const description =
    'Browse agent instructions and skills from open source projects. Explore their source files, bundled resources, and patterns worth borrowing.';

export const metadata = {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: {
        title,
        description,
        images: [{ url: ogImageUrl(title), width: 1200, height: 630 }],
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl(title)],
    },
};

export default function AgentsMdPage() {
    const projects = getAgentsProjects();
    const skillCount = getAllSkills().length;
    const totalStars = projects.reduce((total, project) => total + project.stars, 0);
    const compactStars = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(totalStars);

    return (
        <div className="min-h-screen bg-dark-gray flex flex-col">
            <JsonLd
                data={collectionPageSchema({
                    title,
                    description,
                    path: '/',
                    items: projects.map((project) => ({ name: project.name, path: projectHref(project) })),
                })}
            />
            <SiteHeader />

            <main id="main" className="page-shell flex-1">
                <header className="directory-hero brand-masthead modem-surface">
                    <div>
                        <h1 className="page-title max-w-xl">Agent rules and skills from open source projects.</h1>
                        <p className="mt-5 text-gray-550 text-base leading-relaxed">Read the source. Borrow useful patterns.</p>
                    </div>
                    <dl className="directory-stats" aria-label="Library statistics">
                        <div>
                            <dt>Projects</dt>
                            <dd>{projects.length.toLocaleString('en')}</dd>
                        </div>
                        <div>
                            <dt>Skills</dt>
                            <dd>{skillCount.toLocaleString('en')}</dd>
                        </div>
                        <div
                            title={`${totalStars.toLocaleString('en')} GitHub stars across the listed repositories, from stored snapshots.`}
                        >
                            <dt>GitHub stars</dt>
                            <dd>{compactStars}</dd>
                        </div>
                    </dl>
                </header>
                <section id="projects" aria-label="Projects">
                    <Suspense fallback={<ProjectExplorerContent projects={projects} />}>
                        <ProjectExplorer projects={projects} />
                    </Suspense>
                </section>
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-gray-550 text-sm">Different projects. Recurring ideas.</p>
                    <Link href="/agent-rules" className="action-link">
                        Explore all {PATTERNS.length} techniques <span aria-hidden>→</span>
                    </Link>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
