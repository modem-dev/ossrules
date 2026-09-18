import { cacheLife } from 'next/cache';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { type ReactNode, Suspense } from 'react';
import {
    type AgentsProject,
    agentsFileCommitUrl,
    formatStars,
    logoSrc,
    PATTERNS_BY_ID,
    rawAgentsFileUrl,
    repoFileUrl,
    STATS_AS_OF,
} from '@/components/agents-md-data';
import { DocTree } from '@/components/doc-tree';
import { FileLink, FileTrayProvider, QuoteLink } from '@/components/file-tray';
import { JsonLd } from '@/components/json-ld';
import { RelativeTime } from '@/components/last-updated';
import { ModemSponsor } from '@/components/modem-sponsor';
import { Excerpt, PatternBadge } from '@/components/primitives';
import { ProjectRepositoryLink } from '@/components/project-repository-link';
import { ProjectTabs } from '@/components/project-tabs';
import { ProjectTitle } from '@/components/project-title';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SkillContributors } from '@/components/skill-contributors';
import { TokenLabel } from '@/components/token-label';
import {
    getAgentsProject,
    getAgentsProjectByRepository,
    getAgentsProjects,
    getAgentsSource,
    getDocumentSource,
    getInstructionDocuments,
    getVendoredFiles,
    sourceExcerpt,
} from '@/lib/agents-md';
import { getInstructionContributions } from '@/lib/instruction-contributors';
import { ogImageUrl } from '@/lib/og';
import { type ProjectSearchParams, projectListing, projectNeighbors, projectSearchString, withProjectSearch } from '@/lib/project-list';
import { projectHref } from '@/lib/project-paths';
import { webPageSchema } from '@/lib/schema';
import { getSkillManifest } from '@/lib/skills';
import { countSourceTokens } from '@/lib/token-count';

function ProjectPageNavigation() {
    return (
        <nav aria-label="On this page">
            <p className="eyebrow">On this page</p>
            <ul className="mt-3 space-y-1 text-gray-550 text-xs">
                {[
                    ['overview', 'Overview'],
                    ['documents', 'Documents'],
                    ['techniques', 'Techniques'],
                    ['takeaways', 'Ideas for your repo'],
                ].map(([id, label]) => (
                    <li key={id}>
                        <a href={`#${id}`} className="block py-2 hover:text-teal">
                            {label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

type CollectionProps = { project: AgentsProject; searchParams: Promise<ProjectSearchParams> };

// Only these links depend on the request. The analysis and source measurements
// can stay in the prerendered page and be prefetched before a reader clicks.
async function CollectionBreadcrumb({ searchParams }: Pick<CollectionProps, 'searchParams'>) {
    const listing = projectListing(getAgentsProjects(), projectSearchString(await searchParams));
    return (
        <Link href={withProjectSearch('/', listing.canonicalSearch)} className="text-teal hover:underline">
            Projects
        </Link>
    );
}

async function CollectionTabs({ project, searchParams }: CollectionProps) {
    const listing = projectListing(getAgentsProjects(), projectSearchString(await searchParams));
    return (
        <ProjectTabs
            project={project}
            skills={getSkillManifest(project.slug)?.skills.length}
            active="instructions"
            instructionSearch={listing.canonicalSearch}
        />
    );
}

async function MoreProjects({ project, searchParams }: CollectionProps) {
    const {
        previous,
        next,
        search: collectionSearch,
    } = projectNeighbors(getAgentsProjects(), project.slug, projectSearchString(await searchParams));
    return (
        <>
            {previous || next ? (
                <nav aria-label="More projects" className="mt-14 grid gap-4 sm:grid-cols-2">
                    {[
                        { project: previous, direction: 'Previous', arrow: '←' },
                        { project: next, direction: 'Next', arrow: '→' },
                    ].map(({ project: neighbor, direction, arrow }) =>
                        neighbor ? (
                            <Link
                                key={direction}
                                href={withProjectSearch(projectHref(neighbor), collectionSearch)}
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
                        ) : null,
                    )}
                </nav>
            ) : null}
        </>
    );
}

export async function generateStaticParams() {
    return getAgentsProjects().map((project) => ({ owner: project.owner, repo: project.repo }));
}

export async function generateMetadata({ params }: { params: Promise<{ owner: string; repo: string }> }) {
    const { owner, repo } = await params;
    const project = getAgentsProjectByRepository(owner, repo);

    if (!project) {
        return {};
    }

    const title = `${project.name} Agent Rules: ${project.instructionFile ?? 'AGENTS.md'} Explained`;
    const description = project.hook;

    return {
        title,
        description,
        alternates: { canonical: projectHref(project) },
        openGraph: {
            title,
            description,
            images: [{ url: ogImageUrl(`${project.name} Agent Rules`, project.slug), width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl(`${project.name} Agent Rules`, project.slug)],
        },
    };
}

export default async function AgentsMdProjectPage({
    params,
    searchParams,
}: {
    params: Promise<{ owner: string; repo: string }>;
    searchParams: Promise<ProjectSearchParams>;
}) {
    const { owner, repo } = await params;
    const project = getAgentsProjectByRepository(owner, repo);

    if (!project) {
        notFound();
    }

    return (
        <ProjectContent
            slug={project.slug}
            breadcrumb={<CollectionBreadcrumb searchParams={searchParams} />}
            tabs={<CollectionTabs project={project} searchParams={searchParams} />}
            neighbors={<MoreProjects project={project} searchParams={searchParams} />}
        />
    );
}

async function ProjectContent({
    slug,
    breadcrumb,
    tabs,
    neighbors,
}: {
    slug: string;
    breadcrumb: ReactNode;
    tabs: ReactNode;
    neighbors: ReactNode;
}) {
    'use cache';
    cacheLife('max');
    const project = getAgentsProject(slug);
    if (!project) notFound();

    // Local copies of the files this AGENTS.md reads, pinned to the same commit
    // the entry was measured at. See scripts/sync-agents-md-files.ts.
    const vendored = getVendoredFiles(project.slug);
    const licenseHref = vendored?.licensePath
        ? `https://github.com/${project.owner}/${project.repo}/blob/${vendored.sha}/${vendored.licensePath.split('/').map(encodeURIComponent).join('/')}`
        : undefined;
    const agentsSource = getAgentsSource(project.slug);
    const contributions = getInstructionContributions(project);
    const primaryFile = project.instructionFile ?? 'AGENTS.md';
    const documents = getInstructionDocuments(project.slug);
    const tokens = countSourceTokens(agentsSource);

    return (
        <FileTrayProvider
            key={project.slug}
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
                        title: `${project.name} Agent Rules: ${project.instructionFile ?? 'AGENTS.md'} Explained`,
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
                        <Suspense fallback={<span className="text-teal">Projects</span>}>{breadcrumb}</Suspense>
                        <span aria-hidden>/</span>
                        <ProjectRepositoryLink project={project} />
                    </nav>
                    <header className="project-heading">
                        <ProjectTitle project={project} section="Agent Rules" />
                        <FileLink path={primaryFile} href={agentsFileCommitUrl(project)} className="action-link action-primary shrink-0">
                            Read {primaryFile}
                        </FileLink>
                    </header>
                    <Suspense
                        fallback={
                            <ProjectTabs project={project} skills={getSkillManifest(project.slug)?.skills.length} active="instructions" />
                        }
                    >
                        {tabs}
                    </Suspense>

                    <div className="project-mobile-navigation">
                        <ProjectPageNavigation />
                    </div>
                    <div className="project-layout">
                        <div className="min-w-0">
                            <section id="overview" className="reading-section">
                                <h2 className="section-title">Overview</h2>
                                <p className="prose-copy mt-4">{project.summary}</p>
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {project.patterns.map((pattern) => (
                                        <PatternBadge key={pattern} pattern={pattern} href={`/agent-rules/${pattern}`} />
                                    ))}
                                </div>
                            </section>

                            <section id="documents" className="reading-section mt-8">
                                <h2 className="eyebrow mb-3">Documents</h2>
                                <DocTree
                                    references={project.references}
                                    rootLabel={primaryFile}
                                    files={documents.files}
                                    fileHref={(filePath) => repoFileUrl(project, filePath)}
                                />
                            </section>

                            <section id="techniques" className="reading-section mt-12">
                                <h2 className="section-title">Techniques in this file</h2>
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
                                                    {technique.pattern ? ` / ${PATTERNS_BY_ID[technique.pattern].name}` : ''}
                                                </p>
                                                <h3 className="mt-3 font-mono font-medium text-[17px] leading-relaxed tracking-tight">
                                                    {technique.title}
                                                </h3>
                                                <p className="prose-copy mt-3">{technique.body}</p>
                                                {excerpt ? (
                                                    <QuoteLink
                                                        quote={excerpt.text}
                                                        startLine={excerpt.startLine}
                                                        sourcePath={technique.sourcePath}
                                                    >
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
                                <h2 className="section-title">Ideas for your repo</h2>
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
                            <ProjectPageNavigation />
                            <section className="project-document-summary" aria-label="Document summary">
                                <h2 className="eyebrow [overflow-wrap:anywhere]">{primaryFile}</h2>
                                <dl className="document-facts mt-3">
                                    <div>
                                        <dt>Lines</dt>
                                        <dd>{project.file.lines.toLocaleString('en-US')}</dd>
                                    </div>
                                    <div>
                                        <dt>
                                            <TokenLabel />
                                        </dt>
                                        <dd>{tokens?.toLocaleString('en-US') ?? 'Unavailable'}</dd>
                                    </div>
                                    {contributions?.contributors.length ? (
                                        <div>
                                            <dt>Contributors</dt>
                                            <dd>
                                                <SkillContributors
                                                    contributions={contributions}
                                                    skillName={primaryFile}
                                                    fileName={primaryFile}
                                                    historyUrl={`https://github.com/${project.owner}/${project.repo}/commits/${project.lastCommit.sha}/${primaryFile.split('/').map(encodeURIComponent).join('/')}`}
                                                />
                                            </dd>
                                        </div>
                                    ) : null}
                                    <div>
                                        <dt>Last changed</dt>
                                        <dd>
                                            <RelativeTime iso={project.lastCommit.date} />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>License</dt>
                                        <dd className="min-w-0 [overflow-wrap:anywhere]">
                                            {licenseHref ? (
                                                <a
                                                    href={licenseHref}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-teal hover:underline"
                                                >
                                                    {vendored?.license ?? 'View terms'} ↗
                                                </a>
                                            ) : (
                                                (vendored?.license ?? 'Not recorded')
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </section>
                            <details className="project-facts-disclosure" open>
                                <summary>Source &amp; review</summary>
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
                                        <dt>Analysis written</dt>
                                        <dd>{project.evaluatedAt}</dd>
                                    </div>
                                    <div>
                                        <dt>Star snapshot</dt>
                                        <dd>{STATS_AS_OF}</dd>
                                    </div>
                                </dl>
                            </details>
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

                    <Suspense fallback={null}>{neighbors}</Suspense>
                    <ModemSponsor>
                        These instructions explain how to work in {project.name}. Modem shows your agents what customers said, who is
                        affected, and what changed.
                    </ModemSponsor>
                </main>

                <SiteFooter />
            </div>
        </FileTrayProvider>
    );
}
