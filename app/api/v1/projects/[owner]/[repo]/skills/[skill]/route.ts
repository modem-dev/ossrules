import { agentSkill } from '@/lib/agent-api';
import { getAgentsProjectByRepository } from '@/lib/agents-md';
import { getSkillManifest } from '@/lib/skills';

export async function GET(_request: Request, { params }: { params: Promise<{ owner: string; repo: string; skill: string }> }) {
    const { owner, repo, skill: id } = await params;
    const project = getAgentsProjectByRepository(owner, repo);
    const manifest = project && getSkillManifest(project.slug);
    const skill = manifest?.skills.find((item) => item.id === id);
    if (!project || !manifest || !skill) return Response.json({ error: 'Skill not found' }, { status: 404 });
    return Response.json(agentSkill(project, skill, manifest));
}
