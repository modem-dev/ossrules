import type { SkillTask } from '@/lib/skill-tasks';

const paths: Record<SkillTask, string> = {
    'code-review': 'M5 4 1 8l4 4M9 4l4 4-4 4M11 15l2 2 5-5',
    debugging: 'M6 8h8v5a4 4 0 0 1-8 0zM7 8V6a3 3 0 0 1 6 0v2M3 9h3M14 9h3M3 14h3M14 14h3M5 3l2 2M15 3l-2 2M10 9v7',
    testing: 'M7 2h6M8 2v5l-5 9a1 1 0 0 0 1 2h12a1 1 0 0 0 1-2l-5-9V2M6 12h8M8 15l1.5 1.5L13 13',
    'git-prs':
        'M5 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM5 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM15 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM5 6v8M15 14V7a3 3 0 0 0-3-3h-2M12 2l-2 2 2 2',
    documentation: 'M3 3h5l2 2 2-2h5v14h-5l-2 1-2-1H3zM10 5v13M5 7h2M5 10h2M13 7h2M13 10h2',
    performance: 'M3 16a8 8 0 1 1 14 0M10 12l4-6M5 10H3M10 4V2M15 10h2M6 17h8',
    deployment: 'M10 13V2M6 6l4-4 4 4M3 11v6h14v-6',
    'media-generation': 'M2 5h12v13H2zM3 16l4-5 3 3 3-2M16 1v6M13 4h6',
    'ci-builds': 'M3 5h4v4H3zM13 11h4v4h-4zM7 7h5a3 3 0 0 1 3 3v1M13 13H8a3 3 0 0 1-3-3V9',
    releases: 'M2 3h8l8 8-7 7-9-9zM6 6h.01',
    planning: 'M7 2h6v4H7zM2 14h6v4H2zM12 14h6v4h-6zM10 6v4M5 14v-4h10v4',
    'ui-design': 'M2 3h16v14H2zM2 7h16M7 7v10M4 5h.01M6 5h.01',
    research: 'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2ZM12.5 12.5 18 18M5 6h6M5 9h4',
    security: 'M10 2l7 3v5c0 4-7 8-7 8s-7-4-7-8V5zM7 10l2 2 4-4',
    'agent-tooling': 'M4 6h12v11H4zM10 6V3M8 3h4M1 9v5M19 9v5M7 10h.01M13 10h.01M7 14h6',
    'database-changes': 'M3 5c0-4 14-4 14 0s-14 4-14 0ZM3 5v10c0 4 14 4 14 0V5M3 10c0 4 14 4 14 0',
};

export function SkillTaskIcon({ task }: { task: SkillTask }) {
    return (
        <svg
            viewBox="0 0 20 20"
            className="size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            <path d={paths[task]} />
        </svg>
    );
}
