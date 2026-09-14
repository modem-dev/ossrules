import Link from 'next/link';
import {
    AGENTS_PROJECTS_BY_STARS,
    COLLECTION_TOTALS,
    formatStars,
    PATTERNS,
    projectsWithPattern,
    STATS_AS_OF,
} from '@/components/agents-md/agents-md-data';
import { PatternCard, StatTile } from '@/components/agents-md/primitives';
import { ProjectCard } from '@/components/agents-md/project-card';
import { PatternBackground } from '@/components/blog/pattern-background';
import Footer from '@/components/footer';
import { JsonLd } from '@/components/json-ld';
import Navigation from '@/components/navigation';
import CTAButton from '@/components/ui/cta-button';
import { ogImageUrl } from '@/lib/og';
import { collectionPageSchema } from '@/lib/schema';

const title = 'The AGENTS.md Collection | Modem';
const description =
    'Read and compare the AGENTS.md files from herdr, Codex, Astro, Ghostty, Omarchy, opencode, Fresh, and hunk. Each one analyzed, with the techniques worth copying into your own repo.';

export const metadata = {
    title,
    description,
    alternates: { canonical: '/agents-md' },
    openGraph: {
        title,
        description,
        images: [{ url: ogImageUrl('The AGENTS.md Collection'), width: 1200, height: 630 }],
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl('The AGENTS.md Collection')],
    },
};

export default function AgentsMdPage() {
    const projects = AGENTS_PROJECTS_BY_STARS;

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
                    <div className="max-w-3xl">
                        <p className="font-inter text-sm text-teal mb-4">A curated collection</p>
                        <h1 className="font-unit-medium text-4xl sm:text-5xl text-light-cream mb-5 leading-tight tracking-tight">
                            The AGENTS.md files worth reading
                        </h1>
                        <p className="font-roboto text-lg text-light-cream/70 leading-relaxed">
                            Every serious open source project is writing instructions for coding agents now, and the good ones have figured
                            out things the rest of us have not. We read {COLLECTION_TOTALS.projects} of the best, counted what is in them,
                            and wrote down the techniques that transfer.
                        </p>
                        <p className="mt-4 font-roboto text-lg text-light-cream/70 leading-relaxed">
                            Start with the{' '}
                            <a href="#patterns" className="text-teal hover:underline">
                                {PATTERNS.length} recurring techniques
                            </a>{' '}
                            if you want the summary, or go straight to{' '}
                            <a href="#projects" className="text-teal hover:underline">
                                the projects
                            </a>
                            .
                        </p>
                    </div>

                    <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-3xl">
                        <StatTile value={String(COLLECTION_TOTALS.projects)} label="Projects analyzed" />
                        <StatTile value={formatStars(COLLECTION_TOTALS.stars)} label="Combined stars" hint={`as of ${STATS_AS_OF}`} />
                        <StatTile value={COLLECTION_TOTALS.lines.toLocaleString()} label="Lines of instructions" />
                        <StatTile value={String(PATTERNS.length)} label="Techniques identified" />
                    </div>

                    <section id="patterns" className="mt-24 scroll-mt-28">
                        <h2 className="font-unit-medium text-2xl sm:text-3xl text-light-cream leading-snug tracking-tight">
                            What the good ones have in common
                        </h2>
                        <p className="mt-3 max-w-3xl font-roboto text-base text-light-cream/70 leading-relaxed">
                            These files disagree about almost everything, including how long an AGENTS.md should be. Ghostty gets it done in
                            39 lines; herdr takes 317. But the same moves keep showing up, and those are the ones worth copying.
                        </p>

                        <div className="mt-8 grid gap-4 md:grid-cols-2">
                            {PATTERNS.map((pattern) => (
                                <PatternCard key={pattern.id} pattern={pattern} projects={projectsWithPattern(pattern.id)} />
                            ))}
                        </div>
                    </section>

                    <section id="projects" className="mt-24 scroll-mt-28">
                        <h2 className="font-unit-medium text-2xl sm:text-3xl text-light-cream leading-snug tracking-tight">The projects</h2>
                        <p className="mt-3 max-w-3xl font-roboto text-base text-light-cream/70 leading-relaxed">
                            Sorted by stars. Each page has the file measured, the techniques pulled out with the exact lines they come from,
                            and a short list of what to steal.
                        </p>

                        <ul className="mt-8 grid gap-4 lg:grid-cols-2">
                            {projects.map((project) => (
                                <ProjectCard key={project.slug} project={project} />
                            ))}
                        </ul>
                    </section>

                    <section className="mt-24 max-w-3xl">
                        <h2 className="font-unit-medium text-2xl sm:text-3xl text-light-cream leading-snug tracking-tight">Side by side</h2>
                        <p className="mt-3 font-roboto text-base text-light-cream/70 leading-relaxed">
                            There is no agreed length. The two files at the extremes are both good, and they are good for opposite reasons:
                            Ghostty answers only what an agent gets stuck on, Omarchy keeps itself short by sending the agent somewhere
                            else.
                        </p>

                        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-750/70">
                            <table className="w-full min-w-[560px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-gray-750/70 bg-medium-gray/40">
                                        <th className="px-4 py-3 font-inter text-xs font-semibold text-gray-400">Project</th>
                                        <th className="px-4 py-3 font-inter text-xs font-semibold text-gray-400 text-right">Lines</th>
                                        <th className="px-4 py-3 font-inter text-xs font-semibold text-gray-400 text-right">Words</th>
                                        <th className="px-4 py-3 font-inter text-xs font-semibold text-gray-400 text-right">Rules</th>
                                        <th className="px-4 py-3 font-inter text-xs font-semibold text-gray-400 text-right">Doc links</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...AGENTS_PROJECTS_BY_STARS]
                                        .sort((a, b) => b.file.lines - a.file.lines)
                                        .map((project) => (
                                            <tr key={project.slug} className="border-b border-gray-750/40 last:border-b-0">
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={`/agents-md/${project.slug}`}
                                                        className="font-roboto text-[15px] text-light-cream/90 hover:text-teal transition-colors"
                                                    >
                                                        {project.name}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-sm text-gray-500 tabular-nums">
                                                    {project.file.lines}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-sm text-gray-500 tabular-nums">
                                                    {project.file.words.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-sm text-gray-500 tabular-nums">
                                                    {project.file.bullets}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-sm text-gray-500 tabular-nums">
                                                    {project.file.docLinks}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3 font-inter text-xs text-gray-600 leading-relaxed">
                            Rules counts top-level bullet lines. Doc links counts relative links out to other files in the same repo, which
                            is what separates a router from a self-contained file.
                        </p>
                    </section>

                    <section className="mt-24 max-w-3xl rounded-xl border border-dark-teal/40 bg-medium-gray/40 p-6 sm:p-8">
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
