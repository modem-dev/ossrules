import { agentCatalog } from '@/lib/agent-api';

export const dynamic = 'force-static';

export function GET() {
    return Response.json(agentCatalog());
}
