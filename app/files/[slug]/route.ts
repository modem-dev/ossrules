import { getAgentsProject, getDocumentSource } from '@/lib/agents-md';
import { isInstructionSourcePath } from '@/lib/instruction-path';

/** Manifest-listed source only; this also serves dotfiles that static hosting rejects. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    if (!getAgentsProject(slug)) return new Response('Project not found', { status: 404 });
    const filePath = new URL(request.url).searchParams.get('path');
    const source = isInstructionSourcePath(filePath) ? getDocumentSource(slug, filePath) : undefined;
    if (source === undefined) return new Response('File not found', { status: 404 });
    return new Response(source, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
