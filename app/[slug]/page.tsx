import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    agentsFileCommitUrl,
    agentsFileUrl,
    formatStars,
    logoSrc,
    PATTERNS_BY_ID,
    rawAgentsFileUrl,
    repoFileUrl,
    repoUrl,
    STATS_AS_OF,
} from '@/components/agents-md-data';
import CTAButton from '@/components/cta-button';
import { DocTree } from '@/components/doc-tree';
import { FileLink, FileTrayProvider, QuoteLink } from '@/components/file-tray';
import { JsonLd } from '@/components/json-ld';
import { RelativeTime } from '@/components/last-updated';
import { Excerpt, FileStatGrid, PatternBadge } from '@/components/primitives';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getAgentsProject, getAgentsProjects, getVendoredFiles } from '@/lib/agents-md';
import { ogImageUrl } from '@/lib/og';
import { webPageSchema } from '@/lib/schema';

export async function generateStaticParams() {
    return getAgentsProjects().map((project) => ({ slug: project.slug }));
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
        alternates: { canonical: `/${project.slug}` },
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
    const ordered = getAgentsProjects();
    const index = ordered.findIndex((entry) => entry.slug === project.slug);
    const previous = index > 0 ? ordered[index - 1] : undefined;
    const next = index < ordered.length - 1 ? ordered[index + 1] : undefined;

    // Local copies of the files this AGENTS.md reads, pinned to the same commit
    // the entry was measured at. See scripts/sync-agents-md-files.ts.
    const vendored = getVendoredFiles(project.slug);

    return (
        <FileTrayProvider
            slug={project.slug}
            owner={project.owner}
            repo={project.repo}
            sha={project.lastCommit.sha}
            files={vendored?.files ?? []}
            license={vendored?.license}
            licensePath={vendored?.licensePath}
        >
            <div className="min-h-screen bg-dark-gray flex flex-col">
                <JsonLd
                    data={webPageSchema({
                        title: `${project.name}'s AGENTS.md, explained`,
                        description: project.hook,
                        path: `/${project.slug}`,
                    })}
                />
                <SiteHeader />

                <main id="main" className="relative z-10 flex-1">
                    <div className="max-w-container mx-auto px-6 sm:px-12 pt-14 pb-20">
                        <div className="max-w-3xl mx-auto">
                            <Link href="/" className="font-inter text-sm text-teal hover:underline">
                                AGENTS.md directory
                            </Link>

                            <header className="mt-6">
                                <div className="flex items-center gap-4">
                                    <Image
                                        src={logoSrc(project)}
                                        alt=""
                                        width={56}
                                        height={56}
                                        className="size-14 shrink-0 rounded-lg bg-gray-800 object-cover"
                                    />
                                    <h1 className="font-unit-medium text-4xl sm:text-5xl text-light-cream leading-tight tracking-tight">
                                        {project.name}
                                    </h1>
                                </div>
                                <p className="mt-3 font-roboto text-lg text-light-cream/70 leading-relaxed">{project.tagline}</p>

                                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-inter text-sm">
                                    <a
                                        href={repoUrl(project)}
                                        className="text-teal hover:underline"
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        {project.owner}/{project.repo}
                                    </a>
                                    <span aria-hidden className="text-gray-750">
                                        /
                                    </span>
                                    <FileLink
                                        path="AGENTS.md"
                                        href={agentsFileUrl(project)}
                                        className="cursor-pointer text-teal hover:underline"
                                    >
                                        Read the AGENTS.md
                                    </FileLink>
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
                                    <span aria-hidden className="text-gray-750">
                                        /
                                    </span>
                                    <a
                                        href={agentsFileCommitUrl(project)}
                                        className="text-gray-550 hover:text-teal transition-colors"
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        Last updated <RelativeTime iso={project.lastCommit.date} />
                                    </a>
                                </div>
                            </header>

                            <p className="mt-8 font-roboto text-lg text-light-cream/90 leading-relaxed">{project.hook}</p>

                            {project.references.length > 0 ? (
                                <section className="mt-10">
                                    <h2 className="font-inter text-xs font-semibold uppercase tracking-wider text-gray-550">
                                        Documents it routes to
                                    </h2>
                                    <p className="mt-2 font-inter text-sm text-gray-550 leading-relaxed">
                                        This file points the agent at {project.references.length} other{' '}
                                        {project.references.length === 1 ? 'document' : 'documents'} in the repository. Open any of them to
                                        read it here, as it was at this commit.
                                    </p>
                                    <div className="mt-4">
                                        <DocTree
                                            references={project.references}
                                            rootLabel="AGENTS.md"
                                            fileHref={(filePath) => repoFileUrl(project, filePath)}
                                        />
                                    </div>
                                </section>
                            ) : null}

                            <section className="mt-10">
                                <h2 className="font-inter text-xs font-semibold uppercase tracking-wider text-gray-550">By the numbers</h2>
                                <div className="mt-4">
                                    <FileStatGrid project={project} />
                                </div>
                                <p className="mt-3 font-inter text-xs text-gray-600 leading-relaxed">
                                    File measured on <code className="font-mono text-gray-550">{project.defaultBranch}</code> at commit{' '}
                                    <a
                                        href={agentsFileCommitUrl(project)}
                                        className="font-mono text-gray-550 hover:text-teal"
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        {project.lastCommit.sha.slice(0, 7)}
                                    </a>
                                    . Analysis written {project.evaluatedAt}. Star count is a snapshot from {STATS_AS_OF}.
                                </p>
                            </section>

                            <section className="mt-14">
                                <h2 className="font-unit-medium text-2xl sm:text-3xl text-light-cream leading-snug tracking-tight">
                                    What kind of file this is
                                </h2>
                                <p className="mt-3 font-roboto text-[17px] text-light-cream/80 leading-relaxed">{project.summary}</p>

                                <div className="mt-5 flex flex-wrap gap-1.5">
                                    {project.patterns.map((pattern) => (
                                        <PatternBadge key={pattern} pattern={pattern} href={`/techniques#${pattern}`} />
                                    ))}
                                </div>
                            </section>

                            <section className="mt-14">
                                <h2 className="font-unit-medium text-2xl sm:text-3xl text-light-cream leading-snug tracking-tight">
                                    Techniques in this file
                                </h2>
                                <p className="mt-2 font-inter text-sm text-gray-550 leading-relaxed">
                                    Quoted lines are verbatim from the file. Open one to see it where it sits.
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
                                            {technique.quote ? (
                                                <QuoteLink quote={technique.quote}>
                                                    <Excerpt>{technique.quote}</Excerpt>
                                                </QuoteLink>
                                            ) : null}
                                        </article>
                                    ))}
                                </div>
                            </section>

                            <section className="mt-14 rounded-xl border border-dark-teal/40 bg-medium-gray/40 p-6 sm:p-8">
                                <h2 className="font-unit-medium text-2xl text-light-cream leading-snug tracking-tight">
                                    Takeaways for your own repo
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
                                    <Link href={`/${previous.slug}`} className="group block">
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
                                    <Link href={`/${next.slug}`} className="group block sm:text-right">
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

                <SiteFooter />
            </div>
        </FileTrayProvider>
    );
}
