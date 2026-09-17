import type { RepositoryIdentity } from '@/lib/project-paths';
import { formatStars, STATS_AS_OF } from './agents-md-data';

export function ProjectRepositoryLink({ project }: { project: RepositoryIdentity & { stars: number } }) {
    return (
        <a
            href={`https://github.com/${project.owner}/${project.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 items-center gap-2 hover:text-teal"
            aria-label={`${project.owner}/${project.repo} on GitHub, ${project.stars.toLocaleString('en')} stars (opens in a new tab)`}
            title={`${project.stars.toLocaleString('en')} GitHub stars · ${STATS_AS_OF} snapshot`}
        >
            <span className="min-w-0 break-all">
                {project.owner}/{project.repo}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-gray-550">
                <span aria-hidden>☆</span>
                {formatStars(project.stars)}
            </span>
        </a>
    );
}
