import 'server-only';
import type { AgentsProject } from '@/components/agents-md-data';
import snapshots from '@/content/instruction-contributors.json';
import type { SkillContributions } from './skill-contributors';

type Snapshot = { repository: string; sha: string; path: string; contributions: SkillContributions };

export function getInstructionContributions(project: AgentsProject): SkillContributions | undefined {
    const snapshot = (snapshots as Record<string, Snapshot>)[project.slug];
    if (
        snapshot?.repository !== `${project.owner}/${project.repo}` ||
        snapshot.sha !== project.lastCommit.sha ||
        snapshot.path !== (project.instructionFile ?? 'AGENTS.md')
    )
        return undefined;
    return snapshot.contributions;
}
