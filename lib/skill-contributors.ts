export interface SkillContributor {
    id: number;
    login: string;
    commits: number;
}

export interface SkillContributions {
    contributors: SkillContributor[];
    unlinkedAuthors: number;
}

export interface ContributorCommit {
    sha: string;
    author: { id: number; login: string; type: string } | null;
    commit: { author: { name: string } | null };
}

/** File-path history at the skill snapshot; excludes committers and co-author trailers. */
export function summarizeContributors(commits: ContributorCommit[]): SkillContributions {
    const contributors = new Map<number, SkillContributor>();
    const unlinked = new Set<string>();
    const seen = new Set<string>();
    for (const commit of commits) {
        if (seen.has(commit.sha)) continue;
        seen.add(commit.sha);
        const author = commit.author;
        if (!author) {
            unlinked.add(commit.commit.author?.name ?? 'Unknown');
            continue;
        }
        if (author.type === 'Bot' || /(?:\[bot\]|[-_]bot|bot)$/i.test(author.login)) continue;
        const person = contributors.get(author.id) ?? { id: author.id, login: author.login, commits: 0 };
        person.commits++;
        contributors.set(author.id, person);
    }
    return {
        contributors: [...contributors.values()].sort((a, b) => b.commits - a.commits || a.login.localeCompare(b.login)),
        unlinkedAuthors: unlinked.size,
    };
}
