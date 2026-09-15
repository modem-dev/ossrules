import path from 'node:path';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { logoSrc } from '@/components/agents-md-data';
import { CopySource } from '@/components/copy-source';
import { Excerpt } from '@/components/primitives';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SkillMarkdown } from '@/components/skill-markdown';
import { getAgentsProject } from '@/lib/agents-md';
import { documentMentions } from '@/lib/document-mentions';
import { markdownBody } from '@/lib/skill-schema';
import { getSkillManifest, readSkillFile, skillHref, skillSourceUrl } from '@/lib/skills';
import { countSourceTokens } from '@/lib/token-count';

type Params = { slug: string; skill: string };
export async function generateMetadata({ params }: { params: Promise<Params> }) {
    const { slug, skill: id } = await params;
    const manifest = getSkillManifest(slug);
    const skill = manifest?.skills.find((skill) => skill.id === id);
    return {
        title: `${skill?.name ?? 'Skill'} · ${getAgentsProject(slug)?.name ?? 'Project'}`,
        description: skill?.description,
        alternates: { canonical: skillHref(slug, id) },
    };
}

export default async function SkillPage({
    params,
    searchParams,
}: {
    params: Promise<Params>;
    searchParams: Promise<{ file?: string; view?: string }>;
}) {
    const { slug, skill: id } = await params;
    const query = await searchParams;
    const project = getAgentsProject(slug);
    const manifest = getSkillManifest(slug);
    const skill = manifest?.skills.find((skill) => skill.id === id);
    if (!project || !manifest || !skill) notFound();
    const file = skill.files.find((file) => file.path === (query.file ?? 'SKILL.md'));
    if (!file) notFound();
    const bytes = readSkillFile(slug, file);
    const source = file.text && bytes ? bytes.toString('utf8') : undefined;
    const baseHref = skillHref(slug, id);
    const root = path.posix.dirname(skill.path);
    const selectedPath = path.posix.join(root, file.path);
    const sourceUrl = skillSourceUrl(manifest, selectedPath);
    const rendered = source !== undefined && /\.mdx?$/i.test(file.path) && query.view !== 'source';
    const complete = skill.files.every((file) => !file.omitted) && !manifest.repositoryLicense?.omitted;
    const agentsSource = manifest.agentsFile?.text ? readSkillFile(slug, manifest.agentsFile)?.toString('utf8') : undefined;
    const mentions = documentMentions(agentsSource, [skill.path])[skill.path] ?? [];
    const rootFile = skill.files.find((file) => file.path === 'SKILL.md');
    const rootSource = rootFile ? readSkillFile(slug, rootFile)?.toString('utf8') : undefined;
    const fileMentions = file.path !== 'SKILL.md' ? (documentMentions(rootSource, [file.path])[file.path] ?? []) : [];
    return (
        <div className="min-h-screen bg-dark-gray flex flex-col">
            <SiteHeader />
            <main id="main" className="page-shell flex-1">
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-gray-600">
                    <Link href="/" className="text-teal hover:underline">
                        Projects
                    </Link>
                    <span aria-hidden>/</span>
                    <Link href={`/${slug}`} className="inline-flex items-center gap-2 text-teal hover:underline">
                        <Image src={logoSrc(project)} alt="" width={22} height={22} className="size-5 rounded object-cover" />
                        {project.name}
                    </Link>
                    <span aria-hidden>/</span>
                    <Link href={`/${slug}/skills`} className="text-teal hover:underline">
                        Skills
                    </Link>
                </nav>
                <header className="mt-9 flex flex-col items-start justify-between gap-5 sm:flex-row">
                    <div className="min-w-0 flex-1">
                        <p className="eyebrow">{project.name} / Skill</p>
                        <h1 className="page-title mt-3 [overflow-wrap:anywhere]">{skill.name}</h1>
                        <p className="mt-4 max-w-3xl text-gray-500 text-sm leading-relaxed [overflow-wrap:anywhere]">{skill.description}</p>
                        <p className="mt-4 break-all font-mono text-[11px] text-gray-600">{skill.path}</p>
                    </div>
                    {complete ? (
                        <a href={`${baseHref}/download`} className="action-link shrink-0">
                            Download bundle ↓
                        </a>
                    ) : (
                        <span className="font-mono text-[11px] text-gray-600">Partial bundle · download unavailable</span>
                    )}
                </header>
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] text-gray-600">
                    <a href={`https://github.com/${manifest.repository}/tree/${manifest.sha}`} className="hover:text-teal">
                        {manifest.branch} · {manifest.sha.slice(0, 7)} ↗
                    </a>
                    <span>
                        {skill.files.length} bundle {skill.files.length === 1 ? 'file' : 'files'}
                    </span>
                    <span>Scanned {manifest.scannedAt.slice(0, 10)}</span>
                </div>
                <div className="skill-reader">
                    <aside className="skill-files" aria-label="Bundle files">
                        <p className="eyebrow mb-3">Files</p>
                        <nav aria-label="Skill files">
                            <ul>
                                {skill.files.map((item) => (
                                    <li key={item.path}>
                                        <Link
                                            href={`${baseHref}?file=${encodeURIComponent(item.path)}`}
                                            scroll={false}
                                            aria-current={item.path === file.path ? 'page' : undefined}
                                        >
                                            <span aria-hidden className="shrink-0">
                                                {item.path.endsWith('.sh') ? '>_' : '▤'}
                                            </span>
                                            <span className="min-w-0 [overflow-wrap:anywhere]">
                                                {item.path}
                                                {item.omitted ? <span className="block text-[10px]">Not bundled</span> : null}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                        <div className="mt-7 border-gray-750 border-t pt-5 font-mono text-[11px] text-gray-600">
                            <p className="eyebrow mb-2">License</p>
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
                        </div>
                    </aside>
                    <article className="min-w-0" aria-label={`${file.path} content`}>
                        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-gray-750 border-b pb-4">
                            <div className="min-w-0">
                                <h2 className="break-all font-mono text-sm">{file.path}</h2>
                                <p className="mt-2 font-mono text-[11px] text-gray-600">
                                    {source !== undefined
                                        ? `${countSourceTokens(source)?.toLocaleString('en-US')} tokens · o200k_base · `
                                        : ''}
                                    {file.bytes.toLocaleString('en-US')} bytes
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {source !== undefined && /\.mdx?$/i.test(file.path) ? (
                                    <Link
                                        className="text-teal text-xs hover:underline"
                                        scroll={false}
                                        href={`${baseHref}?file=${encodeURIComponent(file.path)}${rendered ? '&view=source' : ''}`}
                                    >
                                        {rendered ? 'Source' : 'Read'}
                                    </Link>
                                ) : null}
                                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-teal text-xs hover:underline">
                                    GitHub ↗
                                </a>
                                {source !== undefined ? <CopySource key={file.blob} source={source} /> : null}
                            </div>
                        </header>
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
                                <a href={`${baseHref}/file?path=${encodeURIComponent(file.path)}`} className="text-teal hover:underline">
                                    Download original file ↓
                                </a>
                            </p>
                        ) : rendered ? (
                            <SkillMarkdown
                                source={file.path === 'SKILL.md' ? markdownBody(source) : source}
                                currentFile={file.path}
                                files={skill.files.map((f) => f.path)}
                                baseHref={baseHref}
                                upstreamRoot={skillSourceUrl(manifest, `${root}/`)}
                            />
                        ) : (
                            <div className="skill-source">
                                <Excerpt text={source} startLine={1} />
                            </div>
                        )}
                        {fileMentions.length ? (
                            <details className="mt-10 border-gray-750 border-t pt-5">
                                <summary className="text-teal text-xs">Referenced from SKILL.md</summary>
                                <div className="mt-4 space-y-4">
                                    {fileMentions.map((mention) => (
                                        <Link
                                            key={mention.startLine}
                                            href={`${baseHref}?view=source`}
                                            className="block rounded border border-gray-750 bg-medium-gray p-4"
                                        >
                                            <Excerpt startLine={mention.startLine} text={mention.lines.join('\n')} />
                                        </Link>
                                    ))}
                                </div>
                            </details>
                        ) : null}
                        {file.path === 'SKILL.md' ? (
                            <details className="mt-10 border-gray-750 border-t pt-5">
                                <summary className="text-teal text-xs">
                                    {mentions.length ? 'Referenced from AGENTS.md' : 'Discovery context'}
                                </summary>
                                <p className="mt-4 text-gray-550 text-xs">
                                    {mentions.length
                                        ? 'These references come from AGENTS.md at the skill snapshot.'
                                        : agentsSource === undefined
                                          ? 'Discovered by repository scan. AGENTS.md was unavailable for reference checking.'
                                          : 'Discovered by repository scan. No exact path reference found in the snapshot’s root AGENTS.md.'}
                                </p>
                                {mentions.map((mention) => (
                                    <div key={mention.startLine} className="mt-4 rounded border border-gray-750 bg-medium-gray p-4">
                                        <Excerpt startLine={mention.startLine} text={mention.lines.join('\n')} />
                                        <a
                                            href={`${skillSourceUrl(manifest, 'AGENTS.md')}#L${mention.startLine}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-block text-teal text-xs"
                                        >
                                            AGENTS.md · same revision ↗
                                        </a>
                                    </div>
                                ))}
                            </details>
                        ) : null}
                    </article>
                </div>
                <div className="mt-12 flex flex-wrap justify-between gap-4 border-gray-750 border-t pt-6 text-teal text-sm">
                    <Link href={`/${slug}/skills`}>← All {project.name} skills</Link>
                    <Link href={`/${slug}`}>Project instructions →</Link>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
