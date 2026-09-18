import { PATTERNS } from '@/components/agents-md-data';
import { absoluteUrl } from '@/lib/agent-api';
import { getAgentsProjects } from '@/lib/agents-md';

export const dynamic = 'force-static';

export function GET() {
    return Response.json({
        version: 1,
        total: PATTERNS.length,
        items: PATTERNS.map((pattern) => ({
            id: pattern.id,
            name: pattern.name,
            summary: pattern.summary,
            projectCount: getAgentsProjects().filter((project) => project.patterns.includes(pattern.id)).length,
            apiUrl: absoluteUrl(`/api/v1/patterns/${pattern.id}`),
            projectsUrl: absoluteUrl(`/api/v1/projects?pattern=${pattern.id}`),
        })),
    });
}
