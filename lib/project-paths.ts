/** Public URLs follow GitHub's owner/repository identity; slugs remain internal corpus IDs. */
export interface RepositoryIdentity {
    owner: string;
    repo: string;
}

export function projectHref(project: RepositoryIdentity) {
    return `/${encodeURIComponent(project.owner)}/${encodeURIComponent(project.repo)}`;
}

export function projectSkillsHref(project: RepositoryIdentity) {
    return `${projectHref(project)}/skills`;
}

export function skillHref(project: RepositoryIdentity, id: string) {
    return `${projectSkillsHref(project)}/${encodeURIComponent(id)}`;
}
