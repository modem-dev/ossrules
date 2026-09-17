export const SKILL_TASKS = [
    { id: 'code-review', label: 'Code review' },
    { id: 'debugging', label: 'Debugging' },
    { id: 'testing', label: 'Testing & QA' },
    { id: 'git-prs', label: 'Git & PRs' },
    { id: 'documentation', label: 'Documentation' },
    { id: 'performance', label: 'Performance' },
    { id: 'deployment', label: 'Deployment' },
    { id: 'media-generation', label: 'Media generation' },
    { id: 'ci-builds', label: 'CI & builds' },
    { id: 'releases', label: 'Releases' },
    { id: 'planning', label: 'Planning & architecture' },
    { id: 'ui-design', label: 'UI & design' },
    { id: 'research', label: 'Research & extraction' },
    { id: 'security', label: 'Security' },
    { id: 'agent-tooling', label: 'Agent tooling' },
    { id: 'database-changes', label: 'Database changes' },
] as const;

export type SkillTask = (typeof SKILL_TASKS)[number]['id'];

export function isSkillTask(value: string | null): value is SkillTask {
    return SKILL_TASKS.some((task) => task.id === value);
}
