import { PATTERNS } from '@/components/agents-md-data';
import { absoluteUrl, projectApiUrl } from '@/lib/agent-api';
import { getPatternGuide } from '@/lib/agent-rule-patterns';

export async function GET(_request: Request, { params }: { params: Promise<{ pattern: string }> }) {
    const { pattern: id } = await params;
    const pattern = PATTERNS.find((item) => item.id === id);
    if (!pattern) return Response.json({ error: 'Pattern not found' }, { status: 404 });
    const guide = getPatternGuide(pattern.id);
    return Response.json({
        version: 1,
        ...pattern,
        url: absoluteUrl(`/agent-rules/${pattern.id}`),
        projectsUrl: absoluteUrl(`/api/v1/projects?pattern=${pattern.id}`),
        application: guide.application,
        moves: guide.moves,
        examples: guide.examples.map((example) => ({
            projectApiUrl: projectApiUrl(example.project),
            technique: example.technique,
            excerpt: example.excerpt,
            path: example.path,
            endLine: example.endLine,
            sha: example.project.lastCommit.sha,
            sourceUrl: example.upstreamHref,
        })),
    });
}
