import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SkillExplorer } from '@/components/skill-explorer';
import { getAgentsProjects } from '@/lib/agents-md';
import { skillEntry } from '@/lib/skill-entries';
import { type SkillSearchParams, skillListingMetadata, skillSearchString } from '@/lib/skill-list';
import { getAllSkills, getSkillManifest } from '@/lib/skills';

function getEntries() {
    return getAllSkills()
        .map(({ skill, project }) => skillEntry(skill, project))
        .sort((a, b) => a.name.localeCompare(b.name));
}

type Props = { searchParams: Promise<SkillSearchParams> };

export async function generateMetadata({ searchParams }: Props) {
    return {
        title: 'Skills from open-source projects',
        description: 'Explore agent skills, their original instructions, and bundled files from real open-source projects.',
        ...skillListingMetadata('/skills', getEntries(), skillSearchString(await searchParams)),
    };
}

export default async function SkillsPage({ searchParams }: Props) {
    const initialSearch = skillSearchString(await searchParams);
    const entries = getEntries();
    const manifests = getAgentsProjects()
        .map((p) => getSkillManifest(p.slug))
        .filter((m) => !!m);
    return (
        <div className="min-h-screen bg-dark-gray flex flex-col">
            <SiteHeader />
            <main id="main" className="page-shell flex-1">
                <header className="brand-masthead modem-surface">
                    <p className="eyebrow">Skills / From real projects</p>
                    <h1 className="page-title mt-5">Find the skill for the job.</h1>
                    <p className="mt-5 max-w-2xl text-gray-550 text-base leading-relaxed">
                        Explore task-specific agent workflows, their instructions, and the files they bring along.
                    </p>
                </header>
                <div className="mt-8">
                    <SkillExplorer entries={entries} initialSearch={initialSearch} />
                </div>
                <p className="mt-8 font-mono text-[11px] text-gray-600">
                    {manifests.length} project snapshots scanned. Descriptions come from each skill’s metadata.
                </p>
            </main>
            <SiteFooter />
        </div>
    );
}
