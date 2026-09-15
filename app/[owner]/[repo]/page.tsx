import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    agentsFileCommitUrl,
    formatStars,
    logoSrc,
    PATTERNS_BY_ID,
    rawAgentsFileUrl,
    repoFileUrl,
    repoUrl,
    STATS_AS_OF,
} from '@/components/agents-md-data';
import { DocTree } from '@/components/doc-tree';
import { FileLink, FileTrayProvider, QuoteLink } from '@/components/file-tray';
import { JsonLd } from '@/components/json-ld';
import { RelativeTime } from '@/components/last-updated';
import { ModemSponsor } from '@/components/modem-sponsor';
import { Excerpt, FileStatGrid, PatternBadge } from '@/components/primitives';
import { ProjectTabs } from '@/components/project-tabs';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
    getAgentsProjectByRepository,
    getAgentsProjects,
    getAgentsSource,
    getDocumentSource,
    getInstructionDocuments,
    getVendoredFiles,
    sourceExcerpt,
} from '@/lib/agents-md';
import { ogImageUrl } from '@/lib/og';
import { projectHref } from '@/lib/project-paths';
import { webPageSchema } from '@/lib/schema';
import { getSkillManifest } from '@/lib/skills';
import { countSourceTokens } from '@/lib/token-count';

export async function generateStaticParams() {
    return getAgentsProjects().map((project) => ({ owner: project.owner, repo: project.repo }));
}

export async function generateMetadata({ params }: { params: Promise<{ owner: string; repo: string }> }) {
    const { owner, repo } = await params;
    const project = getAgentsProjectByRepository(owner, repo);

    if (!project) {
        return {};
    }

    const title = `${project.name}'s ${project.instructionFile ?? 'AGENTS.md'}, explained`;
    const description = `${project.hook} A breakdown of ${project.instructionFile ?? 'AGENTS.md'} in ${project.owner}/${project.repo}, with the techniques worth copying.`;

    return {
        title,
        description,
        alternates: { canonical: projectHref(project) },
        openGraph: {
            title,
            description,
            images: [{ url: ogImageUrl(`${project.name}'s ${project.instructionFile ?? 'AGENTS.md'}`), width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl(`${project.name}'s ${project.instructionFile ?? 'AGENTS.md'}`)],
        },
    };
}

export default async function AgentsMdProjectPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
    const { owner, repo } = await params;
    const project = getAgentsProjectByRepository(owner, repo);

    if (!project) {
        notFound();
    }

    // Previous and next follow the list order on the index, so paging through
    // the collection matches the order the reader just saw, wrapping at either end.
    const ordered = getAgentsProjects();
    const index = ordered.findIndex((entry) => entry.slug === project.slug);
    const previous = ordered[(index - 1 + ordered.length) % ordered.length];
    const next = ordered[(index + 1) % ordered.length];

    // Local copies of the files this AGENTS.md reads, pinned to the same commit
    // the entry was measured at. See scripts/sync-agents-md-files.ts.
    const vendored = getVendoredFiles(project.slug);
    const agentsSource = getAgentsSource(project.slug);
    const primaryFile = project.instructionFile ?? 'AGENTS.md';
    const documents = getInstructionDocuments(project.slug);

    return (
        <FileTrayProvider
            slug={project.slug}
            owner={project.owner}
            repo={project.repo}
            sha={project.lastCommit.sha}
            primaryFile={primaryFile}
            primaryFileModifiedAt={project.lastCommit.date}
            files={documents.files}
            mentions={documents.mentions}
            license={vendored?.license}
            licensePath={vendored?.licensePath}
        >
            <div className="min-h-screen bg-dark-gray flex flex-col">
                <JsonLd
                    data={webPageSchema({
                        title: `${project.name}'s ${project.instructionFile ?? 'AGENTS.md'}, explained`,
                        description: project.hook,
                        path: projectHref(project),
                    })}
                />
                <SiteHeader />

                <main id="main" className="page-shell flex-1">
                    <nav
                        aria-label="Breadcrumb"
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-gray-600"
                    >
                        <Link href="/" className="text-teal hover:underline">
                            Projects
                        </Link>
                        <span aria-hidden>/</span>
                        <a href={repoUrl(project)} target="_blank" rel="noopener noreferrer" className="break-all hover:text-teal">
                            {project.owner}/{project.repo} ↗
                        </a>
                    </nav>
                    <header className="project-heading">
                        <div className="min-w-0">
                            <div className="flex items-center gap-4">
                                <Image
                                    src={logoSrc(project)}
                                    alt=""
                                    width={56}
                                    height={56}
                                    className="size-14 shrink-0 rounded-xl bg-gray-800 object-cover"
                                />
                                <h1 className="page-title">{project.name}</h1>
                            </div>
                            <p className="mt-4 max-w-2xl text-gray-550 text-sm leading-relaxed">{project.tagline}</p>
                        </div>
                        <FileLink path={primaryFile} href={agentsFileCommitUrl(project)} className="action-link action-primary shrink-0">
                            Read {primaryFile} <span aria-hidden>↗</span>
                        </FileLink>
                    </header>
                    <ProjectTabs project={project} skills={getSkillManifest(project.slug)?.skills.length} active="instructions" />
                    <p className="max-w-3xl text-gray-400 text-lg leading-relaxed">{project.hook}</p>

                    <div className="project-layout">
                        <div className="min-w-0">
                            <section id="documents" className="reading-section mb-8">
                                <h2 className="eyebrow mb-3">Documents</h2>
                                <DocTree
                                    references={project.references}
                                    rootLabel={primaryFile}
                                    files={documents.files}
                                    fileHref={(filePath) => repoFileUrl(project, filePath)}
                                />
                            </section>

                            <section id="overview" className="reading-section">
                                <p className="eyebrow">The file, explained</p>
                                <h2 className="section-title mt-3">What makes it useful</h2>
                                <p className="prose-copy mt-4">{project.summary}</p>
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {project.patterns.map((pattern) => (
                                        <PatternBadge key={pattern} pattern={pattern} href={`/agent-rules#${pattern}`} />
                                    ))}
                                </div>
                            </section>

                            <section id="techniques" className="reading-section mt-12">
                                <h2 className="section-title">Techniques in this file</h2>
                                <p className="mt-3 text-gray-600 text-xs leading-relaxed">
                                    Quoted passages are verbatim. Open one to see it in the source.
                                </p>
                                <div className="mt-8 space-y-9">
                                    {project.techniques.map((technique, position) => {
                                        const excerpt = technique.quote
                                            ? sourceExcerpt(
                                                  technique.sourcePath
                                                      ? getDocumentSource(project.slug, technique.sourcePath)
                                                      : agentsSource,
                                                  technique.quote,
                                              )
                                            : undefined;
                                        return (
                                            <article key={technique.title}>
                                                <p className="eyebrow">
                                                    {String(position + 1).padStart(2, '0')}
                                                    {technique.pattern
                                                        ? ` / ${PATTERNS_BY_ID[technique.pattern].name}`
                                                        : ' / From this file'}
                                                </p>
                                                <h3 className="mt-3 font-mono font-medium text-[17px] leading-relaxed tracking-tight">
                                                    {technique.title}
                                                </h3>
                                                <p className="prose-copy mt-3">{technique.body}</p>
                                                {excerpt ? (
                                                    <QuoteLink quote={excerpt.text} sourcePath={technique.sourcePath}>
                                                        <Excerpt {...excerpt} />
                                                    </QuoteLink>
                                                ) : null}
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>

                            <section
                                id="takeaways"
                                className="reading-section mt-12 rounded-lg border border-gray-750 bg-dark-teal/40 p-6 sm:p-7"
                            >
                                <p className="eyebrow">Put it to work</p>
                                <h2 className="section-title mt-3">Borrow this for your repo</h2>
                                <ol className="mt-5 space-y-4">
                                    {project.steal.map((item, position) => (
                                        <li key={item} className="flex gap-4">
                                            <span aria-hidden className="pt-1 font-mono text-teal text-xs">
                                                {String(position + 1).padStart(2, '0')}
                                            </span>
                                            <span className="text-gray-400 text-[15px] leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        </div>

                        <aside className="project-facts" aria-label="File facts and page navigation">
                            <h2 className="eyebrow">{primaryFile} at a glance</h2>
                            <div className="mt-3">
                                <FileStatGrid project={project} tokens={countSourceTokens(agentsSource)} />
                            </div>
                            <dl className="provenance">
                                <div>
                                    <dt>Measured on</dt>
                                    <dd>
                                        {project.defaultBranch} ·{' '}
                                        <a
                                            href={agentsFileCommitUrl(project)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-teal hover:underline"
                                        >
                                            {project.lastCommit.sha.slice(0, 7)}
                                        </a>
                                    </dd>
                                </div>
                                <div>
                                    <dt>File changed</dt>
                                    <dd>
                                        <RelativeTime iso={project.lastCommit.date} />
                                    </dd>
                                </div>
                                <div>
                                    <dt>Analysis written</dt>
                                    <dd>{project.evaluatedAt}</dd>
                                </div>
                                <div>
                                    <dt>Star snapshot</dt>
                                    <dd>{STATS_AS_OF}</dd>
                                </div>
                            </dl>
                            <nav aria-label="On this page" className="mt-7">
                                <p className="eyebrow">On this page</p>
                                <ul className="mt-3 space-y-1 text-gray-550 text-xs">
                                    <li>
                                        <a href="#documents" className="block py-2 hover:text-teal">
                                            Documents
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#overview" className="block py-2 hover:text-teal">
                                            Overview
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#techniques" className="block py-2 hover:text-teal">
                                            Techniques
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#takeaways" className="block py-2 hover:text-teal">
                                            Takeaways
                                        </a>
                                    </li>
                                </ul>
                            </nav>
                            <a
                                href={rawAgentsFileUrl(project)}
                                className="mt-5 inline-block text-gray-600 text-xs hover:text-teal"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Latest raw file ↗
                            </a>
                        </aside>
                    </div>

                    <nav aria-label="More projects" className="mt-14 grid gap-4 sm:grid-cols-2">
                        {[
                            { project: previous, direction: 'Previous', arrow: '←' },
                            { project: next, direction: 'Next', arrow: '→' },
                        ].map(({ project: neighbor, direction, arrow }) => (
                            <Link
                                key={direction}
                                href={projectHref(neighbor)}
                                rel={direction === 'Previous' ? 'prev' : 'next'}
                                className="group min-w-0 rounded-md border border-gray-750 bg-medium-gray p-5 transition-colors hover:border-teal"
                            >
                                <span className={`eyebrow flex items-center gap-2 ${direction === 'Next' ? 'justify-end' : ''}`}>
                                    {direction === 'Previous' ? <span aria-hidden>{arrow}</span> : null}
                                    {direction}
                                    {direction === 'Next' ? <span aria-hidden>{arrow}</span> : null}
                                </span>
                                <span className="mt-4 flex items-center gap-3">
                                    <Image
                                        src={logoSrc(neighbor)}
                                        alt=""
                                        width={40}
                                        height={40}
                                        className="size-10 shrink-0 rounded-md bg-gray-800 object-cover"
                                    />
                                    <span className="min-w-0">
                                        <span className="block font-mono text-base transition-colors group-hover:text-teal">
                                            {neighbor.name}
                                        </span>
                                        <span className="mt-1 block truncate font-mono text-[11px] text-gray-600">
                                            {neighbor.owner}/{neighbor.repo}
                                        </span>
                                    </span>
                                </span>
                                <span className="mt-4 line-clamp-2 text-gray-550 text-sm leading-relaxed">{neighbor.tagline}</span>
                                <span className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-gray-600">
                                    <span>{neighbor.file.lines.toLocaleString('en-US')} lines</span>
                                    <span>{formatStars(neighbor.stars)} stars</span>
                                </span>
                            </Link>
                        ))}
                    </nav>
                    <ModemSponsor>
                        {project.name}&apos;s file tells an agent how the codebase works. It cannot tell it which bug three customers hit
                        this week. Modem keeps that context current and attaches it to the work.
                    </ModemSponsor>
                </main>

                <SiteFooter />
            </div>
        </FileTrayProvider>
    );
}
