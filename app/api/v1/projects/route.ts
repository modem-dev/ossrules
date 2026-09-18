import { agentProjects } from '@/lib/agent-api';
import { listResponse } from '@/lib/agent-api-query';

export function GET(request: Request) {
    return listResponse(request, agentProjects);
}
