import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import type { agentCatalog, agentInstructions, agentProject, agentProjects, agentSkill, agentSkills } from '../lib/agent-api';
import type { pageItems } from '../lib/agent-api-query';

const origin = process.env.BASE_URL ?? 'http://localhost:3001';
const local = (url: string) => new URL(new URL(url, origin).pathname + new URL(url, origin).search, origin);
const get = async (url: string) => {
    const response = await fetch(local(url));
    assert.equal(response.status, 200, url);
    return response;
};
async function json<T>(url: string, maxBytes?: number): Promise<T> {
    const text = await (await get(url)).text();
    if (maxBytes) assert.ok(Buffer.byteLength(text) < maxBytes, `${url} exceeds ${maxBytes} bytes`);
    return JSON.parse(text);
}
async function collect<T>(url: string) {
    const items: T[] = [];
    const seen = new Set<string>();
    let next: string | null = url;
    let total = 0;
    while (next) {
        assert.ok(!seen.has(next), 'Pagination must not cycle');
        seen.add(next);
        const page: ReturnType<typeof pageItems<T>> = await json(next);
        total = page.total;
        assert.ok(page.items.length <= page.limit);
        items.push(...page.items);
        next = page.nextUrl;
    }
    assert.equal(items.length, total);
    return items;
}

async function main() {
    const response = await get('/llms.txt');
    assert.match(response.headers.get('content-type') ?? '', /text\/plain/);
    assert.match(response.headers.get('link') ?? '', /llms\.txt.*describedby/);
    for (const match of (await response.text()).matchAll(/\]\((https:\/\/ossrules\.md[^)]+)\)/g)) await get(match[1]);
    const catalog = await json<ReturnType<typeof agentCatalog>>('/api/v1/catalog', 4000);
    const projects = await collect<ReturnType<typeof agentProjects>['items'][number]>(catalog.links.projects);
    const skills = await collect<ReturnType<typeof agentSkills>['items'][number]>(`${catalog.links.skills}?limit=50`);
    assert.equal(projects.length, catalog.totals.projects);
    assert.equal(skills.length, catalog.totals.skills);
    assert.equal(new Set(projects.map((project) => project.apiUrl)).size, projects.length);
    assert.equal(new Set(skills.map((skill) => skill.apiUrl)).size, skills.length);
    const sourceProjects = fs
        .readdirSync('content/projects')
        .filter((name) => name.endsWith('.json'))
        .map((name) => JSON.parse(fs.readFileSync(`content/projects/${name}`, 'utf8')));
    assert.equal(projects.length, sourceProjects.length);
    const manifests = fs
        .readdirSync('content/skills')
        .filter((name) => name.endsWith('.json'))
        .map((name) => JSON.parse(fs.readFileSync(`content/skills/${name}`, 'utf8')));
    assert.equal(
        skills.length,
        manifests.reduce((sum, manifest) => sum + manifest.skills.length, 0),
    );
    await json(catalog.links.projects, 12000);
    await json(catalog.links.skills, 12000);
    for (const project of projects) {
        assert.ok(!('skills' in project) && !('analysis' in project));
        const overview = await json<ReturnType<typeof agentProject>>(project.apiUrl, 6000);
        assert.ok(!('analysis' in overview));
        assert.ok(!overview.skillDiscovery || !('skills' in overview.skillDiscovery));
    }
    const filtered = await collect<ReturnType<typeof agentProjects>['items'][number]>(
        `${catalog.links.projects}?language=pYtHoN&pattern=hard-prohibition&limit=2`,
    );
    const expected = sourceProjects.filter((project) => project.language === 'Python' && project.patterns.includes('hard-prohibition'));
    assert.deepEqual(filtered.map((p) => p.repository).sort(), expected.map((p) => `${p.owner}/${p.repo}`).sort());
    const empty = await json<ReturnType<typeof agentProjects>>(`${catalog.links.projects}?q=does-not-exist-12345`);
    assert.equal(empty.total, 0);
    assert.deepEqual(empty.items, []);
    assert.equal(empty.nextUrl, null);

    const project = projects.find((entry) => entry.repository === 'langflow-ai/langflow');
    assert.ok(project);
    const overview = await json<ReturnType<typeof agentProject>>(project.apiUrl);
    const analysis = await json<{ analysis: { slug: string; lastCommit: { sha: string } } }>(overview.links.analysis);
    assert.deepEqual(analysis.analysis, JSON.parse(fs.readFileSync(`content/projects/${analysis.analysis.slug}.json`, 'utf8')));
    const instructions = (await json<ReturnType<typeof agentInstructions>>(overview.links.instructions)).instructions;
    assert.ok(instructions);
    assert.equal(instructions.sha, analysis.analysis.lastCommit.sha);
    for (const file of instructions.files) {
        assert.equal(file.rawUrl === null, !!(file.missing || file.unavailable));
        if (file.rawUrl)
            assert.equal(
                await (await get(file.rawUrl)).text(),
                fs.readFileSync(`public/files/${analysis.analysis.slug}/${file.resolvedPath ?? file.path}`, 'utf8'),
            );
    }
    const scan = await json<{ skillDiscovery: { skills?: unknown; sha: string } }>(overview.links.skillDiscovery);
    assert.equal(scan.skillDiscovery.sha, overview.skillDiscovery?.sha);
    assert.equal(scan.skillDiscovery.skills, undefined);
    const selected = await collect<ReturnType<typeof agentSkills>['items'][number]>(
        `${catalog.links.skills}?q=autoreview&repository=OPENCLAW%2FOPENCLAW&limit=1`,
    );
    assert.ok(selected.length > 0);
    for (const entry of selected) {
        assert.equal(entry.repository, 'openclaw/openclaw');
        const detail = await json<ReturnType<typeof agentSkill>>(entry.apiUrl);
        assert.equal(detail.complete, entry.complete);
        assert.equal(detail.downloadUrl !== null, detail.complete);
        assert.equal(detail.complete, detail.files.every((file) => !file.omitted) && !detail.repositoryLicense?.omitted);
        assert.ok(detail.sourceUrl.includes(detail.sha));
        for (const file of detail.files) {
            assert.equal(file.rawUrl === null, !!file.omitted);
            if (!file.rawUrl) continue;
            const bytes = Buffer.from(await (await get(file.rawUrl)).arrayBuffer());
            const hash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
            assert.equal(hash, file.blob);
            assert.ok(file.sourceUrl.includes(detail.sha));
        }
    }
    const patterns = await json<{ total: number; items: { apiUrl: string }[] }>(catalog.links.patterns, 12000);
    assert.equal(patterns.total, catalog.totals.patterns);
    for (const pattern of patterns.items) {
        const detail = await json<{
            examples: { projectApiUrl: string; path: string; excerpt: { startLine: number; text: string }; endLine: number }[];
        }>(pattern.apiUrl);
        for (const example of detail.examples) {
            const sourceProject = sourceProjects.find((p) => example.projectApiUrl.endsWith(`/${p.owner}/${p.repo}`));
            assert.ok(sourceProject);
            const source = fs.readFileSync(`public/files/${sourceProject.slug}/${example.path}`, 'utf8');
            assert.equal(
                source
                    .split('\n')
                    .slice(example.excerpt.startLine - 1, example.endLine)
                    .join('\n'),
                example.excerpt.text,
            );
        }
    }
    for (const url of [
        '/api/v1/projects?limit=51',
        '/api/v1/skills?offset=-1',
        '/api/v1/skills?q=a&q=b',
        '/api/v1/projects?search=x',
        `${project.apiUrl}?view=bad`,
    ]) {
        const invalid = await fetch(local(url));
        assert.equal(invalid.status, 400, url);
        assert.ok((await invalid.json()).error);
    }
    for (const url of [
        '/api/v1/projects/not-a-project/not-a-repo',
        '/api/v1/patterns/not-a-pattern',
        `${project.apiUrl}/skills/not-a-skill`,
    ]) {
        const missing = await fetch(local(url));
        assert.equal(missing.status, 404, url);
        assert.ok((await missing.json()).error);
    }
    console.log(
        `Agent API verified: ${projects.length} projects, ${skills.length} skills, ${patterns.total} patterns; pagination, filters, response budgets, details, and raw sources.`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
