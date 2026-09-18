import { agentCatalog } from '@/lib/agent-api';

export function GET() {
    return Response.json(agentCatalog());
}
