import { STATS_AS_OF } from '@/components/agents-md-data';
import { agentInstructions, agentProject, agentSkillDiscovery } from '@/lib/agent-api';
import { getAgentsProjectByRepository } from '@/lib/agents-md';

export async function GET(request: Request, { params }: { params: Promise<{ owner: string; repo: string }> }) {
    const { owner, repo } = await params;
    const project = getAgentsProjectByRepository(owner, repo);
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });
    const query = new URL(request.url).searchParams;
    if ([...query.keys()].some((key) => key !== 'view') || query.getAll('view').length > 1) {
        return Response.json({ error: 'Only one view parameter is supported.' }, { status: 400 });
    }
    switch (query.get('view') ?? 'overview') {
        case 'overview':
            return Response.json(agentProject(project));
        case 'analysis':
            return Response.json({ version: 1, statsAsOf: STATS_AS_OF, analysis: project });
        case 'instructions':
            return Response.json(agentInstructions(project));
        case 'skill-discovery':
            return Response.json(agentSkillDiscovery(project));
        default:
            return Response.json({ error: 'view must be overview, analysis, instructions, or skill-discovery.' }, { status: 400 });
    }
}
