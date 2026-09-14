import { AGENTS_PROJECTS, PATTERNS, projectsWithPattern, STATS_AS_OF } from '@/components/agents-md/agents-md-data';
import { ProjectExplorer } from '@/components/agents-md/project-explorer';
import { PatternBackground } from '@/components/blog/pattern-background';
import Footer from '@/components/footer';
import { JsonLd } from '@/components/json-ld';
import Navigation from '@/components/navigation';
import CTAButton from '@/components/ui/cta-button';
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
    return (
        <div className="min-h-screen bg-dark-gray flex flex-col">
            <JsonLd
                data={collectionPageSchema({
                    title,
                    description,
                    path: '/agents-md',
                    items: AGENTS_PROJECTS.map((project) => ({ name: project.name, path: `/agents-md/${project.slug}` })),
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
                    </header>

                    <section className="mt-12" aria-label="Projects">
                        <ProjectExplorer projects={AGENTS_PROJECTS} />
                    </section>

                    <section id="techniques" className="mt-24 max-w-3xl scroll-mt-28 border-t border-gray-750/50 pt-12">
                        <p className="font-inter text-xs uppercase tracking-wider text-gray-600">Appendix</p>
                        <h2 className="mt-3 font-unit-medium text-2xl sm:text-3xl text-light-cream leading-snug tracking-tight">
                            The recurring techniques
                        </h2>
                        <p className="mt-3 font-roboto text-base text-light-cream/70 leading-relaxed">
                            These are the moves that keep showing up across the files, and the tags the technique filter above sorts on.
                            They are the transferable part: one file teaches you about one repo, but these apply to yours.
                        </p>

                        <div className="mt-8 space-y-8">
                            {PATTERNS.map((pattern) => {
                                const used = projectsWithPattern(pattern.id);
                                return (
                                    <div key={pattern.id}>
                                        <h3 className="font-unit-medium text-lg text-light-cream leading-snug">{pattern.name}</h3>
                                        <p className="mt-1.5 font-roboto text-[15px] text-light-cream/75 leading-relaxed">
                                            {pattern.summary}
                                        </p>
                                        <p className="mt-2 font-inter text-sm text-gray-550 leading-relaxed">{pattern.detail}</p>
                                        <p className="mt-2 font-inter text-xs text-gray-600">
                                            {used.length} {used.length === 1 ? 'project' : 'projects'}: {used.map((p) => p.name).join(', ')}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        <p className="mt-10 font-inter text-xs text-gray-600 leading-relaxed">
                            Star counts are a snapshot from {STATS_AS_OF}. File measurements are taken from each project&apos;s default
                            branch.
                        </p>
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
