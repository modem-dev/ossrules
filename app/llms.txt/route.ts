import { agentGuide } from '@/lib/agent-api';

export function GET() {
    return new Response(agentGuide(), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
    });
}
