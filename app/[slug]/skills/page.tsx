import { notFound } from 'next/navigation';
import { ProjectSkillsShell } from '@/components/project-skills-shell';
import { SkillExplorer } from '@/components/skill-explorer';
import { getAgentsProject, getAgentsProjects } from '@/lib/agents-md';
import { skillEntry } from '@/lib/skill-entries';
import { getSkillManifest } from '@/lib/skills';

export function generateStaticParams() {
    return getAgentsProjects().map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const project = getAgentsProject(slug);
    return { title: `${project?.name ?? 'Project'} skills`, alternates: { canonical: `/${slug}/skills` } };
}
export default async function ProjectSkillsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const project = getAgentsProject(slug);
    if (!project) notFound();
    const manifest = getSkillManifest(slug);
    return (
        <ProjectSkillsShell project={project} count={manifest?.skills.length}>
            {!manifest ? (
                <p className="prose-copy">Skills have not been scanned for this project yet.</p>
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
                    {manifest.skills.length ? (
                        <SkillExplorer projectOnly entries={manifest.skills.map((skill) => skillEntry(skill, project))} />
                    ) : (
                        <p className="prose-copy">No skills found in this snapshot’s scan scope.</p>
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
