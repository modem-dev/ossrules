import { type Zippable, zipSync } from 'fflate';
import { getSkillManifest, readSkillFile } from '@/lib/skills';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; skill: string }> }) {
    const { slug, skill: id } = await params;
    const manifest = getSkillManifest(slug);
    const skill = manifest?.skills.find((s) => s.id === id);
    if (!skill || !manifest) return new Response('Skill not found', { status: 404 });
    if (skill.files.some((file) => file.omitted) || manifest.repositoryLicense?.omitted)
        return new Response('Bundle is incomplete', { status: 409 });
    const files: Zippable = {};
    const directory = path.posix.basename(path.posix.dirname(skill.path));
    const bundleRoot = directory === '.' ? skill.id : directory;
    for (const file of skill.files) {
        const bytes = readSkillFile(slug, file);
        if (!bytes) return new Response('Bundle is incomplete', { status: 409 });
        files[`${bundleRoot}/${file.path}`] = [bytes, { os: 3, attrs: Number.parseInt(file.mode, 8) << 16 }];
    }
    if (manifest.repositoryLicense) {
        const bytes = readSkillFile(slug, manifest.repositoryLicense);
        if (bytes) files[`_repository/${manifest.repositoryLicense.path}`] = bytes;
    }
    files['_repository/source.json'] = new TextEncoder().encode(
        JSON.stringify({ repository: manifest.repository, sha: manifest.sha, path: skill.path }, null, 2),
    );
    return new Response(new Uint8Array(zipSync(files)), {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${skill.id}.zip"`,
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
