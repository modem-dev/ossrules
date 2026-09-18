import { notFound } from 'next/navigation';
import { ProjectLicense } from '@/components/project-license';
import { ProjectSkillsShell } from '@/components/project-skills-shell';
import { SkillExplorer } from '@/components/skill-explorer';
import { getAgentsProjectByRepository, getAgentsProjects } from '@/lib/agents-md';
import { identifyLicense } from '@/lib/license';
import { ogImageUrl } from '@/lib/og';
import { projectSkillsHref } from '@/lib/project-paths';
import { skillEntry } from '@/lib/skill-entries';
import { type SkillSearchParams, skillListingMetadata, skillSearchString } from '@/lib/skill-list';
import { getSkillManifest, readSkillFile, skillSourceUrl } from '@/lib/skills';

export function generateStaticParams() {
    return getAgentsProjects().map(({ owner, repo }) => ({ owner, repo }));
}
// Keep navigation on the current page until the requested content is ready.
export const instant = false;

type Props = { params: Promise<{ owner: string; repo: string }>; searchParams: Promise<SkillSearchParams> };

export async function generateMetadata({ params, searchParams }: Props) {
    const { owner, repo } = await params;
    const project = getAgentsProjectByRepository(owner, repo);
    if (!project) return {};
    const entries = (getSkillManifest(project.slug)?.skills ?? []).map((skill) => skillEntry(skill, project));
    const title = `${project.name} Agent Skills`;
    const description = `Browse agent skills from ${project.owner}/${project.repo}, including their instructions, supporting files, and pinned sources.`;
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [{ url: ogImageUrl(title, project.slug), width: 1200, height: 630 }],
        },
        twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl(title, project.slug)] },
        ...skillListingMetadata(projectSkillsHref(project), entries, skillSearchString(await searchParams), true),
    };
}
export default async function ProjectSkillsPage({ params, searchParams }: Props) {
    const { owner, repo } = await params;
    const project = getAgentsProjectByRepository(owner, repo);
    if (!project) notFound();
    const manifest = getSkillManifest(project.slug);
    const licenseSource = manifest?.repositoryLicense
        ? readSkillFile(project.slug, manifest.repositoryLicense)?.toString('utf8')
        : undefined;
    const initialSearch = skillSearchString(await searchParams);
    return (
        <ProjectSkillsShell project={project} count={manifest?.skills.length}>
            {!manifest ? (
                <p className="prose-copy">This project has not been scanned for skills yet.</p>
            ) : (
                <>
                    <div className="mb-6 flex flex-wrap justify-between gap-3 font-mono text-[11px] text-gray-600">
                        <p>
                            Repository snapshot ·{' '}
                            <a
                                className="text-teal hover:underline"
                                href={`https://github.com/${manifest.repository}/tree/${manifest.sha}`}
                            >
                                {manifest.branch} · {manifest.sha.slice(0, 7)}
                            </a>
                        </p>
                        <p>Scanned {manifest.scannedAt.slice(0, 10)}</p>
                    </div>
                    <ProjectLicense
                        license={licenseSource ? identifyLicense(licenseSource) : undefined}
                        href={manifest.repositoryLicense ? skillSourceUrl(manifest, manifest.repositoryLicense.path) : undefined}
                    />
                    {manifest.skills.length ? (
                        <SkillExplorer
                            projectOnly
                            entries={manifest.skills.map((skill) => skillEntry(skill, project))}
                            initialSearch={initialSearch}
                        />
                    ) : (
                        <p className="prose-copy">The scan found no skills in its configured paths.</p>
                    )}
                    <details className="mt-8 text-gray-550 text-xs">
                        <summary>
                            Discovery details{manifest.invalid.length ? ` · ${manifest.invalid.length} files with invalid metadata` : ''}
                        </summary>
                        <p className="mt-4">{manifest.scope} The Instructions analysis keeps its own pinned revision.</p>
                        {manifest.invalid.length ? (
                            <ul className="mt-4 space-y-2">
                                {manifest.invalid.map((item) => (
                                    <li key={item.path} className="break-words">
                                        <code>{item.path}</code>: {item.reason}
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                        {manifest.excluded.length ? <p className="mt-4">Excluded paths: {manifest.excluded.join(', ')}</p> : null}
                    </details>
                </>
            )}
        </ProjectSkillsShell>
    );
}
