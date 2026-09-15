/** Exercise the public routing contract against a running dev or production server. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { unzipSync } from 'fflate';
import type { AgentsProject } from '../components/agents-md-data';
import type { SkillManifest } from '../lib/skill-schema';

const base = process.argv[2] ?? 'http://localhost:3001';
const projects: AgentsProject[] = fs
    .readdirSync('content/projects')
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(fs.readFileSync(path.join('content/projects', name), 'utf8')));
async function response(url: string) {
    return fetch(new URL(url, base), { redirect: 'manual' });
}
async function page(url: string, canonical = url) {
    const result = await response(url);
    assert.equal(result.status, 200, url);
    const html = await result.text();
    const canonicalTag = html.match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0];
    const href = canonicalTag?.match(/href="([^"]+)"/)?.[1];
    assert.ok(href, `canonical: ${url}`);
    assert.equal(new URL(href).href, new URL(canonical, 'https://ossrules.md').href, `canonical: ${url}`);
    return html;
}
async function redirected(from: string, to: string) {
    const result = await response(from);
    assert.equal(result.status, 308, `redirect: ${from}`);
    const destination = new URL(result.headers.get('location') ?? '', base);
    assert.equal(destination.pathname + destination.search, to, from);
}
async function main() {
    const home = await page('/');
    const rules = await page('/agent-rules');
    const skillsIndex = await page('/skills');
    // Rules show a capped sample of projects, so a larger corpus need not appear in full.
    const projectPaths = new Set(projects.map((project) => `/${project.owner}/${project.repo}`));
    const ruleProjectLinks = [...rules.matchAll(/<a\b[^>]*href="(\/[^"?#]+\/[^"?#]+)"/g)].map((match) => match[1]);
    assert.ok(ruleProjectLinks.length > 0, 'rules include project examples');
    for (const href of ruleProjectLinks) assert.ok(projectPaths.has(href), `rules repository link: ${href}`);
    for (const project of projects) {
        // Deliberately independent of URL helpers so changes to those cannot hide a regression.
        const root = `/${project.owner}/${project.repo}`;
        assert.ok(home.includes(`href="${root}"`), `directory: ${root}`);
        assert.ok(!rules.includes(`href="/${project.slug}"`), `rules must not use legacy URLs: ${project.slug}`);
        const html = await page(root);
        assert.ok(html.includes(`href="${root}/skills"`), `project tabs: ${root}`);
        await page(`${root}/skills`);
        await redirected(`/${project.slug}?ref=legacy`, `${root}?ref=legacy`);
        await redirected(`/${project.slug}/skills?q=review`, `${root}/skills?q=review`);
        const manifest = JSON.parse(fs.readFileSync(`content/skills/${project.slug}.json`, 'utf8')) as SkillManifest;
        const skill = manifest.skills[0];
        if (skill) {
            const detail = `${root}/skills/${skill.id}`;
            const legacy = `/${project.slug}/skills/${skill.id}`;
            assert.ok(skillsIndex.includes(`href="${detail}"`), `skills index: ${detail}`);
            await page(`${detail}?file=SKILL.md&view=source`, detail);
            await redirected(`${legacy}?file=SKILL.md&view=source`, `${detail}?file=SKILL.md&view=source`);
            await redirected(`${legacy}/file?path=SKILL.md`, `${detail}/file?path=SKILL.md`);
            await redirected(`${legacy}/download`, `${detail}/download`);
            const source = skill.files.find((file) => file.path === 'SKILL.md');
            assert.ok(source);
            const expected = fs.readFileSync(`content/skill-files/${project.slug}/${source.blob}`);
            const file = await response(`${detail}/file?path=SKILL.md`);
            assert.equal(file.status, 200);
            assert.deepEqual(Buffer.from(await file.arrayBuffer()), expected, `file bytes: ${detail}`);
            const download = await response(`${detail}/download`);
            const incomplete = skill.files.some((file) => file.omitted) || manifest.repositoryLicense?.omitted;
            assert.equal(download.status, incomplete ? 409 : 200, `download: ${detail}`);
            if (!incomplete) {
                const archive = unzipSync(new Uint8Array(await download.arrayBuffer()));
                const dirname = path.posix.basename(path.posix.dirname(skill.path));
                assert.deepEqual(Buffer.from(archive[`${dirname === '.' ? skill.id : dirname}/SKILL.md`]), expected);
            }
        }
        console.log(`Verified ${root}, legacy redirects, and available skill routes.`);
    }
    // A known repo name under the wrong owner must not resolve by basename or internal slug.
    assert.equal((await response('/not-the-owner/fresh')).status, 404);
    assert.equal((await response('/freshframework/does-not-exist')).status, 404);
    assert.equal((await response('/not-the-owner/fresh/skills')).status, 404);
    assert.equal((await response('/not-the-owner/fresh/skills/missing/file?path=SKILL.md')).status, 404);
    assert.equal((await response('/not-the-owner/fresh/skills/missing/download')).status, 404);
    console.log(`Verified ${projects.length} repository namespaces and unknown-repository 404s.`);
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
