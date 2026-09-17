import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { type AgentsProject, logoSrc, PATTERNS, type PatternId } from '@/components/agents-md-data';
import { JsonLd } from '@/components/json-ld';
import { Excerpt } from '@/components/primitives';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { TechniqueIcon } from '@/components/technique-icons';
import { getPatternGuide } from '@/lib/agent-rule-patterns';
import { getAgentsProjects, projectsWithPattern } from '@/lib/agents-md';
import { ogImageUrl } from '@/lib/og';
import { projectHref } from '@/lib/project-paths';
import { webPageSchema } from '@/lib/schema';

type Props = { params: Promise<{ pattern: string }> };

export function generateStaticParams() {
    return PATTERNS.map((pattern) => ({ pattern: pattern.id }));
}

export async function generateMetadata({ params }: Props) {
    const { pattern: id } = await params;
    const pattern = PATTERNS.find((item) => item.id === id);
    if (!pattern) notFound();
    const title = `${pattern.name}: Agent Rule Pattern`;
    const description = `${pattern.summary} Real examples from open-source projects, with source passages and ideas to borrow.`;
    return {
        title,
        description,
        alternates: { canonical: `/agent-rules/${pattern.id}` },
        openGraph: { title, description, images: [{ url: ogImageUrl(pattern.name), width: 1200, height: 630 }] },
        twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl(pattern.name)] },
    };
}

export default async function PatternPage({ params }: Props) {
    const { pattern: id } = await params;
    const pattern = PATTERNS.find((item) => item.id === id);
    if (!pattern) notFound();
    const { application, moves, examples } = getPatternGuide(pattern.id);
    const projects = projectsWithPattern(pattern.id).sort((a, b) => a.name.localeCompare(b.name, 'en'));

    return (
        <div className="min-h-screen bg-dark-gray flex flex-col">
            <JsonLd data={webPageSchema({ title: pattern.name, description: pattern.summary, path: `/agent-rules/${pattern.id}` })} />
            <SiteHeader />
            <main id="main" className="page-shell flex-1">
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-gray-600">
                    <Link href="/agent-rules" className="text-teal hover:underline">
                        Agent Rules
                    </Link>
                    <span aria-hidden>/</span>
                    <span aria-current="page">{pattern.name}</span>
                </nav>
                <header className="pattern-heading">
                    <div>
                        <p className="eyebrow inline-flex items-center gap-2">
                            <TechniqueIcon pattern={pattern.id} className="size-4" /> Agent rule pattern
                        </p>
                        <h1 className="page-title mt-3">{pattern.name}</h1>
                        <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-500">{pattern.summary}</p>
                    </div>
                    <a href="#projects" className="pattern-usage hover:text-teal">
                        <span className="flex -space-x-2" aria-hidden>
                            {examples.map(({ project }) => (
                                <Image
                                    key={project.slug}
                                    src={logoSrc(project)}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="size-8 rounded-full border-2 border-dark-gray bg-gray-800"
                                />
                            ))}
                        </span>
                        <span>
                            {projects.length} of {getAgentsProjects().length} projects <span aria-hidden>↓</span>
                        </span>
                    </a>
                </header>

                <section id="how-it-works" className="pattern-anatomy reading-section" aria-labelledby="pattern-anatomy-title">
                    <h2 id="pattern-anatomy-title" className="eyebrow">
                        The shape of the rule
                    </h2>
                    <ol className="pattern-moves">
                        {moves.map((move, index) => (
                            <li key={move}>
                                <span className="pattern-move-number" aria-hidden>
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <span>{move}</span>
                                {index < moves.length - 1 ? (
                                    <span className="pattern-move-arrow" aria-hidden>
                                        →
                                    </span>
                                ) : null}
                            </li>
                        ))}
                    </ol>
                    <details className="pattern-explanation">
                        <summary>How it works & what to borrow</summary>
                        <div className="mt-3 grid gap-4 md:grid-cols-2">
                            <p>{pattern.detail}</p>
                            <p>{application}</p>
                        </div>
                    </details>
                </section>

                <section id="examples" className="reading-section mt-8">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                        <h2 className="section-title">Examples from real projects</h2>
                        <span className="font-mono text-[11px] text-gray-600">{examples.length} examples · Pinned source</span>
                    </div>
                    <div className="mt-5">
                        {examples.map(({ project, technique, excerpt, path, endLine, sourceHref, upstreamHref }, index) => (
                            <article key={project.slug} className="pattern-example">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs text-gray-600" aria-hidden>
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <Link
                                            href={`${projectHref(project)}?technique=${pattern.id}`}
                                            className="inline-flex items-center gap-2 font-mono text-xs text-teal hover:underline"
                                        >
                                            <Image
                                                src={logoSrc(project)}
                                                alt=""
                                                width={24}
                                                height={24}
                                                className="size-6 rounded bg-gray-800 object-cover"
                                            />
                                            {project.name} <span aria-hidden>→</span>
                                        </Link>
                                    </div>
                                    <h3 className="mt-3 font-mono text-[17px] font-medium leading-snug">{technique.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-gray-550">{technique.body}</p>
                                </div>
                                <div className="min-w-0">
                                    <div className="pattern-source">
                                        <div className="pattern-source-label">
                                            <span className="[overflow-wrap:anywhere]">{path}</span>
                                            <span>
                                                {excerpt.startLine === endLine ? `L${endLine}` : `L${excerpt.startLine}–${endLine}`}
                                            </span>
                                        </div>
                                        <div className="pattern-source-text">
                                            {excerpt.text.split('\n').length > 10 ? (
                                                <>
                                                    <Excerpt
                                                        text={excerpt.text.split('\n').slice(0, 5).join('\n')}
                                                        startLine={excerpt.startLine}
                                                    />
                                                    <details className="pattern-more-source">
                                                        <summary>Show remaining {excerpt.text.split('\n').length - 5} lines</summary>
                                                        <Excerpt
                                                            text={excerpt.text.split('\n').slice(5).join('\n')}
                                                            startLine={excerpt.startLine + 5}
                                                        />
                                                    </details>
                                                </>
                                            ) : (
                                                <Excerpt {...excerpt} />
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 font-mono text-[11px] text-gray-550">
                                        <Link
                                            href={sourceHref}
                                            className="py-2 text-teal hover:underline"
                                            aria-label={`Read ${project.name} source in context`}
                                        >
                                            Read in context →
                                        </Link>
                                        <a
                                            href={upstreamHref}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="py-2 hover:text-teal"
                                            aria-label={`View ${project.name} pinned source on GitHub (opens in a new tab)`}
                                        >
                                            {project.lastCommit.sha.slice(0, 7)} · GitHub ↗
                                        </a>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="projects" className="reading-section mt-9">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h2 className="section-title">
                            Projects using this pattern <span className="text-gray-600">({projects.length})</span>
                        </h2>
                        <Link href={`/?technique=${pattern.id}#projects`} className="py-2 text-xs text-teal hover:underline">
                            Browse in directory →
                        </Link>
                    </div>
                    <ul className="pattern-projects mt-4">
                        {projects.slice(0, 8).map((project) => (
                            <PatternProject key={project.slug} project={project} pattern={pattern.id} />
                        ))}
                    </ul>
                    {projects.length > 8 ? (
                        <details className="pattern-more-projects">
                            <summary>Show {projects.length - 8} more projects</summary>
                            <ul className="pattern-projects">
                                {projects.slice(8).map((project) => (
                                    <PatternProject key={project.slug} project={project} pattern={pattern.id} />
                                ))}
                            </ul>
                        </details>
                    ) : null}
                </section>
                <Link href="/agent-rules" className="mt-10 inline-block py-2 text-sm text-teal hover:underline">
                    ← All agent rule patterns
                </Link>
            </main>
            <SiteFooter />
        </div>
    );
}

function PatternProject({ project, pattern }: { project: AgentsProject; pattern: PatternId }) {
    return (
        <li>
            <Link href={`${projectHref(project)}?technique=${pattern}`} className="pattern-project">
                <Image src={logoSrc(project)} alt="" width={28} height={28} className="size-7 rounded bg-gray-800 object-cover" />
                <span className="min-w-0">
                    <span className="font-mono text-sm">{project.name}</span>
                    <span className="mt-1 block text-xs text-gray-550">
                        {project.techniques.find((item) => item.pattern === pattern)?.title ?? `${project.owner}/${project.repo}`}
                    </span>
                </span>
                <span aria-hidden className="ml-auto text-teal">
                    →
                </span>
            </Link>
        </li>
    );
}
