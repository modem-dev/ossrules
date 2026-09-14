import Link from 'next/link';
import { STATS_AS_OF } from '@/components/agents-md/agents-md-data';
import { ProjectExplorer } from '@/components/agents-md/project-explorer';
import { PatternBackground } from '@/components/blog/pattern-background';
import Footer from '@/components/footer';
import { JsonLd } from '@/components/json-ld';
import Navigation from '@/components/navigation';
import CTAButton from '@/components/ui/cta-button';
import { getAgentsProjects } from '@/lib/agents-md';
import { ogImageUrl } from '@/lib/og';
import { collectionPageSchema } from '@/lib/schema';

const title = 'AGENTS.md Directory | Modem';
const description =
    'Browse AGENTS.md files from open source projects. Sort by stars or file length, filter by language and technique, and read what each one does that the others do not.';

export const metadata = {
    title,
    description,
    alternates: { canonical: '/agents-md' },
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

    return (
        <div className="min-h-screen bg-dark-gray flex flex-col">
            <JsonLd
                data={collectionPageSchema({
                    title,
                    description,
                    path: '/agents-md',
                    items: projects.map((project) => ({ name: project.name, path: `/agents-md/${project.slug}` })),
                })}
            />
            <Navigation />
            <PatternBackground fade />

            <main className="relative z-10 flex-1">
                <div className="max-w-container mx-auto px-6 sm:px-12 pt-32 pb-24">
                    <header className="max-w-3xl">
                        <h1 className="font-unit-medium text-4xl sm:text-5xl text-light-cream leading-tight tracking-tight">
                            AGENTS.md directory
                        </h1>
                        <p className="mt-4 font-roboto text-lg text-light-cream/70 leading-relaxed">
                            Instruction files from open source projects, measured and read. Every entry has the file broken down and the
                            techniques worth copying pulled out, so you can tell what is in one without opening it.
                        </p>
                        <p className="mt-4 font-inter text-sm text-gray-550">
                            <Link href="/agents-md/techniques" className="text-teal hover:underline">
                                Browse by technique
                            </Link>{' '}
                            for the moves that recur across the files. Star counts are a snapshot from {STATS_AS_OF}.
                        </p>
                    </header>

                    <section className="mt-12" aria-label="Projects">
                        <ProjectExplorer projects={projects} />
                    </section>

                    <section className="mt-16 max-w-3xl rounded-xl border border-dark-teal/40 bg-medium-gray/40 p-6 sm:p-8">
                        <h2 className="font-unit-medium text-2xl text-light-cream leading-snug tracking-tight">
                            Your agents are only as good as their context
                        </h2>
                        <p className="mt-3 font-roboto text-base text-light-cream/70 leading-relaxed">
                            A good AGENTS.md tells an agent how your codebase works. It cannot tell it which bug three customers hit this
                            week, or which request is blocking a renewal. Modem keeps that context current and hands it to the agent with
                            the ticket.
                        </p>
                        <div className="mt-6">
                            <CTAButton>Try Modem</CTAButton>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
