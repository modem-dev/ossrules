import path from 'node:path';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatStars, logoSrc, STATS_AS_OF } from '@/components/agents-md-data';
import { HighlightedSource } from '@/components/highlighted-source';
import { Excerpt } from '@/components/primitives';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SkillContributors } from '@/components/skill-contributors';
import { SkillDocumentViewer } from '@/components/skill-document-viewer';
import { SkillInstall } from '@/components/skill-install';
import { SkillMarkdown } from '@/components/skill-markdown';
import { SkillOutline } from '@/components/skill-outline';
import { getAgentsProjectByRepository } from '@/lib/agents-md';
import { documentMentions } from '@/lib/document-mentions';
import { ogImageUrl } from '@/lib/og';
import { projectHref, projectSkillsHref, skillHref } from '@/lib/project-paths';
import { skillHeadings, skillOutline } from '@/lib/skill-outline';
import { markdownBody, parseSkill } from '@/lib/skill-schema';
import { getAllSkills, getSkillManifest, readSkillFile, skillSourceUrl } from '@/lib/skills';
import { countSourceTokens } from '@/lib/token-count';

// Keep the existing document visible while a file or view change is prepared.
export const instant = false;

type Params = { owner: string; repo: string; skill: string };

export function generateStaticParams() {
    return getAllSkills().map(({ project, skill }) => ({ owner: project.owner, repo: project.repo, skill: skill.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
    const { owner, repo, skill: id } = await params;
    const project = getAgentsProjectByRepository(owner, repo);
    if (!project) notFound();
    const manifest = getSkillManifest(project.slug);
    const skill = manifest?.skills.find((skill) => skill.id === id);
    if (!skill) notFound();
    const title = `${skill.name}: ${project.name} Agent Skill`;
    const image = ogImageUrl(skill.name, project.slug, `${project.name} / Agent skill`);
    return {
        title,
        description: skill.description,
        openGraph: {
            title,
            description: skill.description,
            images: [{ url: image, width: 1200, height: 630 }],
        },
        twitter: { card: 'summary_large_image', title, description: skill.description, images: [image] },
        alternates: { canonical: skillHref(project, id) },
    };
}

export default async function SkillPage({
    params,
    searchParams,
}: {
    params: Promise<Params>;
    searchParams: Promise<{ file?: string; view?: string }>;
}) {
    const { owner, repo, skill: id } = await params;
    const query = await searchParams;
    const project = getAgentsProjectByRepository(owner, repo);
    if (!project) notFound();
    const slug = project.slug;
    const manifest = getSkillManifest(slug);
    const skill = manifest?.skills.find((skill) => skill.id === id);
    if (!manifest || !skill) notFound();
    const file = skill.files.find((file) => file.path === (query.file ?? 'SKILL.md'));
    if (!file) notFound();
    const bytes = readSkillFile(slug, file);
    const source = file.text && bytes ? bytes.toString('utf8') : undefined;
    const baseHref = skillHref(project, id);
    const root = path.posix.dirname(skill.path);
    const installUrl = `https://github.com/${manifest.repository}/tree/${encodeURIComponent(manifest.branch)}/${root.split('/').map(encodeURIComponent).join('/')}`;
    const installCommand = `npx skills add '${installUrl.replaceAll("'", "'\\''")}'`;
    const selectedPath = path.posix.join(root, file.path);
    const sourceUrl = skillSourceUrl(manifest, selectedPath);
    const rendered = source !== undefined && /\.mdx?$/i.test(file.path) && query.view !== 'source';
    const complete = skill.files.every((file) => !file.omitted) && !manifest.repositoryLicense?.omitted;
    const instructionPath = manifest.agentsFile?.path ?? project.instructionFile ?? 'AGENTS.md';
    const agentsSource = manifest.agentsFile?.text ? readSkillFile(slug, manifest.agentsFile)?.toString('utf8') : undefined;
    const mentions = documentMentions(agentsSource, [skill.path], instructionPath)[skill.path] ?? [];
    const rootFile = skill.files.find((file) => file.path === 'SKILL.md');
    const rootSource = rootFile ? readSkillFile(slug, rootFile)?.toString('utf8') : undefined;
    const fileMentions = file.path !== 'SKILL.md' ? (documentMentions(rootSource, [file.path])[file.path] ?? []) : [];
    const metadata = rootSource ? parseSkill(rootSource) : undefined;
    const body = rendered ? (file.path === 'SKILL.md' ? markdownBody(source) : source) : '';
    const headings = skillHeadings(body);
    return (
        <div className="min-h-screen bg-dark-gray flex flex-col">
            <SiteHeader />
            <main id="main" className="page-shell flex-1">
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-gray-600">
                    <Link href="/" className="text-teal hover:underline">
                        Projects
                    </Link>
                    <span aria-hidden>/</span>
                    <span className="inline-flex min-w-0 items-center gap-2">
                        <Link href={projectHref(project)} className="min-w-0 break-all text-teal hover:underline">
                            {project.owner}/{project.repo}
                        </Link>
                        <a
                            href={`https://github.com/${project.owner}/${project.repo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 text-gray-550 hover:text-teal"
                            aria-label={`${project.stars.toLocaleString('en')} GitHub stars (opens in a new tab)`}
                            title={`${project.stars.toLocaleString('en')} GitHub stars · ${STATS_AS_OF} snapshot`}
                        >
                            <span aria-hidden>☆</span>
                            {formatStars(project.stars)}
                        </a>
                    </span>
                    <span aria-hidden>/</span>
                    <Link href={projectSkillsHref(project)} className="text-teal hover:underline">
                        Skills
                    </Link>
                </nav>
                <header className="skill-page-header mt-9 flex flex-col items-start justify-between gap-5 sm:flex-row">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <Image
                                src={logoSrc(project)}
                                alt=""
                                width={48}
                                height={48}
                                className="size-9 shrink-0 rounded object-cover sm:size-12"
                            />
                            <h1 className="page-title min-w-0 [overflow-wrap:anywhere]">{skill.name}</h1>
                        </div>
                        <p className="mt-4 max-w-3xl text-gray-500 text-sm leading-relaxed [overflow-wrap:anywhere]">{skill.description}</p>
                        {metadata?.tags?.length ? (
                            <ul className="skill-tags" aria-label="Tags declared in SKILL.md">
                                {metadata.tags.map((tag) => (
                                    <li key={tag}>{tag}</li>
                                ))}
                            </ul>
                        ) : null}
                        {metadata?.platforms?.length ? (
                            <p className="mt-3 font-mono text-[11px] leading-relaxed text-gray-550 [overflow-wrap:anywhere]">
                                Declared platforms: {metadata.platforms.join(' · ')}
                            </p>
                        ) : null}
                    </div>
                    <div className="relative flex shrink-0 flex-wrap items-center gap-2">
                        <SkillInstall command={installCommand} />
                        {complete ? (
                            <a href={`${baseHref}/download`} className="action-link shrink-0">
                                Download bundle ↓
                            </a>
                        ) : (
                            <span className="font-mono text-[11px] text-gray-600">Partial bundle · download unavailable</span>
                        )}
                    </div>
                </header>
                <div className="skill-snapshot mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-gray-600">
                    <a href={`https://github.com/${manifest.repository}/tree/${manifest.sha}`} className="hover:text-teal">
                        {manifest.branch} · {manifest.sha.slice(0, 7)} ↗
                    </a>
                    <span>Scanned {manifest.scannedAt.slice(0, 10)}</span>
                    <SkillContributors
                        contributions={skill.contributions}
                        historyUrl={`https://github.com/${manifest.repository}/commits/${manifest.sha}/${skill.path.split('/').map(encodeURIComponent).join('/')}`}
                        skillName={skill.name}
                        align="start"
                    />
                </div>
                <div className="skill-reader">
                    <aside className="skill-outline" aria-label="Document navigation">
                        <SkillOutline
                            key={`${file.path}:${rendered}`}
                            headings={skillOutline(headings)}
                            readHref={
                                !rendered && source !== undefined && /\.mdx?$/i.test(file.path)
                                    ? `${baseHref}?file=${encodeURIComponent(file.path)}`
                                    : undefined
                            }
                        />
                        <section className="skill-file-metadata font-mono text-[11px] text-gray-600" aria-label="Source and license">
                            <details>
                                <summary className="text-teal">Source &amp; attribution</summary>
                                <p className="mt-4 [overflow-wrap:anywhere]">{skill.path}</p>
                                <a
                                    href={`https://github.com/${manifest.repository}/tree/${manifest.sha}`}
                                    className="mt-3 block text-teal hover:underline"
                                >
                                    {manifest.branch} · {manifest.sha.slice(0, 7)} ↗
                                </a>
                                <p className="mt-3">Scanned {manifest.scannedAt.slice(0, 10)}</p>
                                <p className="eyebrow mt-6 mb-2">License</p>
                                {skill.license ? <p className="[overflow-wrap:anywhere]">{skill.license}</p> : null}
                                {manifest.repositoryLicense ? (
                                    <a
                                        href={skillSourceUrl(manifest, manifest.repositoryLicense.path)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 block text-teal hover:underline"
                                    >
                                        Repository license ↗
                                    </a>
                                ) : (
                                    <p>Not declared in the snapshot.</p>
                                )}
                                {skill.compatibility ? (
                                    <>
                                        <p className="eyebrow mt-6 mb-2">Compatibility</p>
                                        <p className="[overflow-wrap:anywhere]">{skill.compatibility}</p>
                                    </>
                                ) : null}
                            </details>
                        </section>
                    </aside>
                    <article className="skill-document min-w-0" aria-label={`${file.path} content`}>
                        <SkillDocumentViewer
                            files={skill.files.map(({ path, omitted }) => ({ path, omitted }))}
                            path={file.path}
                            baseHref={baseHref}
                            source={source}
                            sourceUrl={sourceUrl}
                            rendered={rendered}
                            tokens={source !== undefined ? countSourceTokens(source) : undefined}
                            bytes={file.bytes}
                            sha={manifest.sha}
                        >
                            {file.path !== 'SKILL.md' ? (
                                <Link href={baseHref} className="mx-5 mt-5 inline-block text-teal text-xs hover:underline">
                                    ← Back to SKILL.md
                                </Link>
                            ) : null}
                            {file.omitted ? (
                                <p className="prose-copy">
                                    {file.omitted}{' '}
                                    <a href={sourceUrl} className="text-teal hover:underline">
                                        View upstream ↗
                                    </a>
                                </p>
                            ) : source === undefined ? (
                                <p className="prose-copy">
                                    Binary file.{' '}
                                    <a
                                        href={`${baseHref}/file?path=${encodeURIComponent(file.path)}`}
                                        className="text-teal hover:underline"
                                    >
                                        Download original file ↓
                                    </a>
                                </p>
                            ) : rendered ? (
                                <SkillMarkdown
                                    source={body}
                                    currentFile={file.path}
                                    files={skill.files.map((f) => f.path)}
                                    baseHref={baseHref}
                                    upstreamRoot={skillSourceUrl(manifest, `${root}/`)}
                                    headings={headings}
                                />
                            ) : (
                                <HighlightedSource
                                    source={source}
                                    language={/\.mdx?$/i.test(file.path) ? 'markdown' : (file.path.split('.').pop() ?? 'text')}
                                    numbered
                                />
                            )}
                        </SkillDocumentViewer>
                        {fileMentions.length ? (
                            <details className="mt-10">
                                <summary className="text-teal text-xs">Referenced from SKILL.md</summary>
                                <div className="mt-4 space-y-4">
                                    {fileMentions.map((mention) => (
                                        <Link key={mention.startLine} href={`${baseHref}?view=source`} className="source-excerpt block">
                                            <span className="source-excerpt-header">
                                                <span>SKILL.md</span>
                                                <span>View in source ↗</span>
                                            </span>
                                            <Excerpt startLine={mention.startLine} text={mention.lines.join('\n')} />
                                        </Link>
                                    ))}
                                </div>
                            </details>
                        ) : null}
                        {file.path === 'SKILL.md' ? (
                            <details className="mt-10">
                                <summary className="text-teal text-xs">
                                    {mentions.length ? `Referenced from ${instructionPath}` : 'Discovery context'}
                                </summary>
                                <p className="mt-4 text-gray-550 text-xs">
                                    {mentions.length
                                        ? `These references come from ${instructionPath} at the skill snapshot.`
                                        : agentsSource === undefined
                                          ? `Discovered by repository scan. ${instructionPath} was unavailable for reference checking.`
                                          : `Discovered by repository scan. No exact path reference found in the snapshot’s root ${instructionPath}.`}
                                </p>
                                {mentions.map((mention) => (
                                    <div key={mention.startLine} className="source-excerpt mt-4">
                                        <a
                                            href={`${skillSourceUrl(manifest, instructionPath)}#L${mention.startLine}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="source-excerpt-header hover:underline"
                                        >
                                            {instructionPath} · same revision ↗
                                        </a>
                                        <Excerpt startLine={mention.startLine} text={mention.lines.join('\n')} />
                                    </div>
                                ))}
                            </details>
                        ) : null}
                    </article>
                </div>
                <div className="mt-12 flex flex-wrap justify-between gap-4 text-teal text-sm">
                    <Link href={projectSkillsHref(project)}>← All {project.name} skills</Link>
                    <Link href={projectHref(project)}>Project instructions →</Link>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
