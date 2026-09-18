import Link from 'next/link';
import { PATTERNS } from '@/components/agents-md-data';
import { JsonLd } from '@/components/json-ld';
import { ProjectExplorer } from '@/components/project-explorer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getProjectListings } from '@/lib/agents-md';
import { ogImageUrl } from '@/lib/og';
import { type ProjectSearchParams, projectListing, projectSearchString } from '@/lib/project-list';
import { projectHref } from '@/lib/project-paths';
import { collectionPageSchema } from '@/lib/schema';
import { getAllSkills, getSkillManifest } from '@/lib/skills';

const title = 'AGENTS.md Examples & Agent Skills';
const socialTitle = 'OSS Agent Rules And Skill Files';
const description =
    'Explore real AGENTS.md and CLAUDE.md examples, agent skills, and original analysis from open source projects. Read the source and borrow useful patterns.';

const baseMetadata = {
    title: { absolute: `${title} | ossrules.md` },
    description,
    alternates: { canonical: '/' },
    openGraph: {
        title: socialTitle,
        description,
        images: [{ url: ogImageUrl(socialTitle), width: 1200, height: 630 }],
    },
    twitter: {
        card: 'summary_large_image',
        title: socialTitle,
        description,
        images: [ogImageUrl(socialTitle)],
    },
};

// Keep navigation on the current page until the requested content is ready.
export const instant = false;

type Props = { searchParams: Promise<ProjectSearchParams> };

function projectsWithSkillCounts() {
    return getProjectListings().map((project) => ({
        ...project,
        skillCount: getSkillManifest(project.slug)?.skills.length,
    }));
}

export async function generateMetadata({ searchParams }: Props) {
    const listing = projectListing(getProjectListings(), projectSearchString(await searchParams));
    return { ...baseMetadata, robots: { index: !listing.filtered, follow: true } };
}

export default async function AgentsMdPage({ searchParams }: Props) {
    const initialSearch = projectSearchString(await searchParams);
    const projects = projectsWithSkillCounts();
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
                        <h1 className="page-title max-w-xl">Agent rules and skills from open source.</h1>
                        <p className="mt-5 text-gray-550 text-base leading-relaxed">
                            Read real AGENTS.md and CLAUDE.md files. See what they do.
                        </p>
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
                    <ProjectExplorer projects={projects} initialSearch={initialSearch} />
                </section>
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-gray-550 text-sm">See the techniques these projects share.</p>
                    <Link href="/agent-rules" className="action-link">
                        View all {PATTERNS.length} techniques <span aria-hidden>→</span>
                    </Link>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
