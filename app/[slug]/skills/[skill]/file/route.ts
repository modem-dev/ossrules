import { getSkillManifest, readSkillFile } from '@/lib/skills';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string; skill: string }> }) {
    const { slug, skill: id } = await params;
    const skill = getSkillManifest(slug)?.skills.find((s) => s.id === id);
    const file = skill?.files.find((f) => f.path === new URL(request.url).searchParams.get('path'));
    if (!file || file.omitted) return new Response('File not found', { status: 404 });
    const bytes = readSkillFile(slug, file);
    if (!bytes) return new Response('File unavailable', { status: 404 });
    return new Response(new Uint8Array(bytes), {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.path.split('/').at(-1) ?? 'file')}`,
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
