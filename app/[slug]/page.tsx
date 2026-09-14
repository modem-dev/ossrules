import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    AGENTS_PROJECTS,
    AGENTS_PROJECTS_BY_STARS,
    agentsFileUrl,
    formatStars,
    getAgentsProject,
    PATTERNS_BY_ID,
    rawAgentsFileUrl,
    repoUrl,
    STATS_AS_OF,
} from '@/components/agents-md/agents-md-data';
import { Excerpt, FileStatGrid, PatternBadge } from '@/components/agents-md/primitives';
import { PatternBackground } from '@/components/blog/pattern-background';
import Footer from '@/components/footer';
import { JsonLd } from '@/components/json-ld';
import Navigation from '@/components/navigation';
import CTAButton from '@/components/ui/cta-button';
import { ogImageUrl } from '@/lib/og';
import { webPageSchema } from '@/lib/schema';

export async function generateStaticParams() {
    return AGENTS_PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const project = getAgentsProject(slug);

    if (!project) {
        return {};
    }

    const title = `${project.name}'s AGENTS.md, explained | Modem`;
    const description = `${project.hook} A breakdown of the AGENTS.md in ${project.owner}/${project.repo}, with the techniques worth copying.`;

    return {
        title,
        description,
        alternates: { canonical: `/agents-md/${project.slug}` },
        openGraph: {
            title,
            description,
            images: [{ url: ogImageUrl(`${project.name}'s AGENTS.md`), width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl(`${project.name}'s AGENTS.md`)],
        },
    };
}

export default async function AgentsMdProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const project = getAgentsProject(slug);

    if (!project) {
        notFound();
    }

    // Previous and next follow the list order on the index, so paging through
    // the collection matches the order the reader just saw.
    const ordered = AGENTS_PROJECTS_BY_STARS;
    const index = ordered.findIndex((entry) => entry.slug === project.slug);
    const previous = index > 0 ? ordered[index - 1] : undefined;
    const next = index < ordered.length - 1 ? ordered[index + 1] : undefined;

    return (
        <div className="min-h-screen bg-dark-gray flex flex-col">
            <JsonLd
                data={webPageSchema({
                    title: `${project.name}'s AGENTS.md, explained`,
                    description: project.hook,
                    path: `/agents-md/${project.slug}`,
                })}
            />
            <Navigation />
            <PatternBackground fade />

            <main className="relative z-10 flex-1">
                <div className="max-w-container mx-auto px-6 sm:px-12 pt-32 pb-24">
                    <div className="max-w-3xl mx-auto">
                        <Link href="/agents-md" className="font-inter text-sm text-teal hover:underline">
                            The AGENTS.md Collection
                        </Link>

                        <header className="mt-6">
                            <h1 className="font-unit-medium text-4xl sm:text-5xl text-light-cream leading-tight tracking-tight">
                                {project.name}
                            </h1>
                            <p className="mt-3 font-roboto text-lg text-light-cream/70 leading-relaxed">{project.tagline}</p>

                            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-inter text-sm">
                                <a href={repoUrl(project)} className="text-teal hover:underline" rel="noopener noreferrer" target="_blank">
                                    {project.owner}/{project.repo}
                                </a>
                                <span aria-hidden className="text-gray-750">
                                    /
                                </span>
                                <a
                                    href={agentsFileUrl(project)}
                                    className="text-teal hover:underline"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    Read the AGENTS.md
                                </a>
                                <span aria-hidden className="text-gray-750">
                                    /
                                </span>
                                <a
                                    href={rawAgentsFileUrl(project)}
                                    className="text-gray-550 hover:text-teal transition-colors"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    Raw
                                </a>
                            </div>
                        </header>

                        <p className="mt-8 font-roboto text-lg text-light-cream/90 leading-relaxed">{project.hook}</p>

                        <section className="mt-10">
                            <h2 className="font-inter text-xs font-semibold uppercase tracking-wider text-gray-550">By the numbers</h2>
                            <div className="mt-4">
                                <FileStatGrid project={project} />
                            </div>
                            <p className="mt-3 font-inter text-xs text-gray-600 leading-relaxed">
                                File measured on the <code className="font-mono text-gray-550">{project.defaultBranch}</code> branch. Star
                                count is a snapshot from {STATS_AS_OF}.
                            </p>
                        </section>

                        <section className="mt-14">
                            <h2 className="font-unit-medium text-2xl sm:text-3xl text-light-cream leading-snug tracking-tight">
                                What kind of file this is
                            </h2>
                            <p className="mt-3 font-roboto text-[17px] text-light-cream/80 leading-relaxed">{project.summary}</p>

                            <div className="mt-5 flex flex-wrap gap-1.5">
                                {project.patterns.map((pattern) => (
                                    <PatternBadge key={pattern} pattern={pattern} href="/agents-md#patterns" />
                                ))}
                            </div>
                        </section>

                        <section className="mt-14">
                            <h2 className="font-unit-medium text-2xl sm:text-3xl text-light-cream leading-snug tracking-tight">
                                What it does well
                            </h2>
                            <p className="mt-2 font-inter text-sm text-gray-550 leading-relaxed">
                                Quoted lines are verbatim from the file.
                            </p>

                            <div className="mt-8 space-y-10">
                                {project.techniques.map((technique) => (
                                    <article key={technique.title}>
                                        <h3 className="font-unit-medium text-xl text-light-cream leading-snug">{technique.title}</h3>
                                        {technique.pattern ? (
                                            <p className="mt-1.5 font-inter text-xs text-teal/80">
                                                {PATTERNS_BY_ID[technique.pattern].name}
                                            </p>
                                        ) : null}
                                        <p className="mt-2.5 font-roboto text-[17px] text-light-cream/80 leading-relaxed">
                                            {technique.body}
                                        </p>
                                        {technique.quote ? <Excerpt>{technique.quote}</Excerpt> : null}
                                    </article>
                                ))}
                            </div>
                        </section>

                        <section className="mt-14 rounded-xl border border-dark-teal/40 bg-medium-gray/40 p-6 sm:p-8">
                            <h2 className="font-unit-medium text-2xl text-light-cream leading-snug tracking-tight">
                                What to steal for your own repo
                            </h2>
                            <ul className="mt-4 space-y-3">
                                {project.steal.map((item) => (
                                    <li key={item} className="flex gap-3">
                                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                                        <span className="font-roboto text-[17px] text-light-cream/80 leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="mt-14">
                            <h2 className="font-unit-medium text-2xl sm:text-3xl text-light-cream leading-snug tracking-tight">
                                How the file is organized
                            </h2>
                            <ol className="mt-5 space-y-2">
                                {project.outline.map((section, position) => (
                                    <li key={section} className="flex gap-4">
                                        <span className="font-mono text-sm text-gray-650 tabular-nums">
                                            {String(position + 1).padStart(2, '0')}
                                        </span>
                                        <span className="font-roboto text-[15px] text-light-cream/75 leading-relaxed">{section}</span>
                                    </li>
                                ))}
                            </ol>
                            <a
                                href={agentsFileUrl(project)}
                                className="mt-6 inline-block font-inter text-sm text-teal hover:underline"
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                Read the full file on GitHub
                            </a>
                        </section>

                        <nav className="mt-16 grid gap-4 border-t border-gray-750/50 pt-8 sm:grid-cols-2">
                            {previous ? (
                                <Link href={`/agents-md/${previous.slug}`} className="group block">
                                    <span className="font-inter text-xs text-gray-600">Previous</span>
                                    <span className="mt-1 block font-roboto text-[17px] text-light-cream/90 transition-colors group-hover:text-teal">
                                        {previous.name}
                                    </span>
                                    <span className="mt-0.5 block font-inter text-xs text-gray-550 tabular-nums">
                                        {formatStars(previous.stars)} stars
                                    </span>
                                </Link>
                            ) : (
                                <span />
                            )}
                            {next ? (
                                <Link href={`/agents-md/${next.slug}`} className="group block sm:text-right">
                                    <span className="font-inter text-xs text-gray-600">Next</span>
                                    <span className="mt-1 block font-roboto text-[17px] text-light-cream/90 transition-colors group-hover:text-teal">
                                        {next.name}
                                    </span>
                                    <span className="mt-0.5 block font-inter text-xs text-gray-550 tabular-nums">
                                        {formatStars(next.stars)} stars
                                    </span>
                                </Link>
                            ) : null}
                        </nav>

                        <section className="mt-16 border-t border-gray-750/50 pt-10">
                            <h2 className="font-unit-medium text-2xl text-light-cream leading-snug tracking-tight">
                                Context your AGENTS.md cannot carry
                            </h2>
                            <p className="mt-3 font-roboto text-base text-light-cream/70 leading-relaxed">
                                {project.name}&apos;s file tells an agent how the codebase works. It cannot tell it which bug three
                                customers hit this week. Modem keeps that context current and attaches it to the work.
                            </p>
                            <div className="mt-6">
                                <CTAButton>Try Modem</CTAButton>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
