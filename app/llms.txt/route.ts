import { agentGuide } from '@/lib/agent-api';

export const dynamic = 'force-static';

export function GET() {
    return new Response(agentGuide(), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
    });
}
