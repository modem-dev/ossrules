import { execFileSync } from 'node:child_process';
import { type ContributorCommit, summarizeContributors } from '../lib/skill-contributors';

export function collectSkillContributors(repository: string, sha: string, filePath: string) {
    const query = new URLSearchParams({ sha, path: filePath, per_page: '100' });
    const pages = JSON.parse(
        execFileSync('gh', ['api', `repos/${repository}/commits?${query}`, '--paginate', '--slurp'], {
            maxBuffer: 64 * 1024 * 1024,
        }).toString(),
    ) as ContributorCommit[][];
    return summarizeContributors(pages.flat());
}
