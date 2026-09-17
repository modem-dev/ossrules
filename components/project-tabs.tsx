import Link from 'next/link';
import { withProjectSearch } from '@/lib/project-list';
import { projectHref, projectSkillsHref, type RepositoryIdentity } from '@/lib/project-paths';

export function ProjectTabs({
    project,
    skills,
    active,
    instructionSearch = '',
}: {
    project: RepositoryIdentity;
    skills?: number;
    active: 'instructions' | 'skills';
    instructionSearch?: string;
}) {
    return (
        <nav aria-label="Project sections" className="project-tabs">
            <Link
                href={withProjectSearch(projectHref(project), instructionSearch)}
                aria-current={active === 'instructions' ? 'page' : undefined}
            >
                Instructions
            </Link>
            <Link href={projectSkillsHref(project)} aria-current={active === 'skills' ? 'page' : undefined}>
                Skills {skills !== undefined ? <span className="font-mono text-[11px]">{skills}</span> : null}
            </Link>
        </nav>
    );
}
