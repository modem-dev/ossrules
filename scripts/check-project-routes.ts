/** Exercise the public routing contract against a running dev or production server. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { unzipSync } from 'fflate';
import { type AgentsProject, PATTERNS } from '../components/agents-md-data';
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
function skillLinks(html: string) {
    return [...html.matchAll(/<li class="skill-entry"><a\b[^>]*href="([^"]+)"/g)].map((match) => match[1]);
}
function isNoindex(html: string) {
    return /<meta\b[^>]*name="robots"[^>]*content="[^"]*\bnoindex\b/.test(html);
}
async function checkPagination(root: string, expected: string[]) {
    const collected: string[] = [];
    const count = Math.max(1, Math.ceil(expected.length / 50));
    for (let number = 1; number <= count; number++) {
        const url = `${root}${number === 1 ? '' : `?page=${number}`}`;
        const html = await page(url);
        const links = skillLinks(html);
        assert.deepEqual(links, expected.slice((number - 1) * 50, number * 50), `initial HTML: ${url}`);
        assert.equal(isNoindex(html), expected.length === 0, `indexing: ${url}`);
        if (number < count) assert.ok(html.includes(`href="?page=${number + 1}"`), `next page: ${url}`);
        collected.push(...links);
    }
    assert.deepEqual(collected, expected, `complete listing: ${root}`);
}
async function main() {
    const home = await page('/');
    const projectLinks = (html: string) =>
        [...html.matchAll(/<a\b(?=[^>]*class="project-entry group")[^>]*href="([^"]+)"/g)].map((match) =>
            match[1].replaceAll('&amp;', '&'),
        );
    const collection = 'language=TypeScript&sort=name';
    const sortedProjects = projects
        .filter((project) => project.language === 'TypeScript')
        .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
    const selected = await page(`/?${collection}`, '/');
    assert.deepEqual(
        projectLinks(selected),
        sortedProjects.map((project) => `/${project.owner}/${project.repo}?${collection}`),
        'directory renders the requested collection in initial HTML',
    );
    assert.ok(isNoindex(selected), 'filtered project collections are not indexed');
    assert.deepEqual(
        projectLinks(await page('/?language=unknown&sort=bad&technique=bad', '/')),
        projectLinks(home),
        'invalid project filters normalize to defaults',
    );
    const firstProject = sortedProjects[0];
    const firstPath = `/${firstProject.owner}/${firstProject.repo}`;
    const selectedProject = await page(`${firstPath}?${collection}`, firstPath);
    const nextProject = sortedProjects[1];
    assert.ok(
        selectedProject.includes(`href="/${nextProject.owner}/${nextProject.repo}?language=TypeScript&amp;sort=name"`),
        'next project retains the collection',
    );
    assert.ok(selectedProject.includes('href="/?language=TypeScript&amp;sort=name"'), 'breadcrumb returns to the collection');
    await page(
        `${firstPath}?source=${encodeURIComponent(firstProject.instructionFile ?? 'AGENTS.md')}&rev=${firstProject.lastCommit.sha}&line=2&view=raw`,
        firstPath,
    );
    const rules = await page('/agent-rules');
    for (const pattern of PATTERNS) {
        const root = `/agent-rules/${pattern.id}`;
        assert.ok(rules.includes(`href="${root}"`), `pattern linked from index: ${root}`);
        const html = await page(root);
        assert.ok(html.includes(pattern.name), `pattern heading: ${root}`);
        assert.ok(html.includes('How it works') && html.includes('Examples from real projects'), `pattern content: ${root}`);
        const sourceLinks = [...html.matchAll(/href="([^"]+\?technique=[^"]+&amp;source=[^"]+)"/g)].map((match) =>
            match[1].replaceAll('&amp;', '&'),
        );
        assert.ok(sourceLinks.length >= 2, `multiple source examples: ${root}`);
        for (const href of sourceLinks) {
            const url = new URL(href, base);
            const project = projects.find((item) => `/${item.owner}/${item.repo}` === url.pathname);
            assert.ok(project, `source project exists: ${href}`);
            assert.ok(project.patterns.includes(pattern.id), `source project uses pattern: ${href}`);
            assert.equal(url.searchParams.get('rev'), project.lastCommit.sha, `source revision: ${href}`);
            const manifest = JSON.parse(fs.readFileSync(`public/files/${project.slug}/manifest.json`, 'utf8'));
            const file = manifest.files.find((item: { path: string }) => item.path === url.searchParams.get('source'));
            assert.ok(file && !file.missing && !file.unavailable, `readable source: ${href}`);
            const source = fs.readFileSync(`public/files/${project.slug}/${file.resolvedPath ?? file.path}`, 'utf8').split('\n');
            const start = Number(url.searchParams.get('line'));
            const end = Number(url.searchParams.get('end') ?? start);
            assert.ok(start > 0 && end >= start && end <= source.length, `valid source range: ${href}`);
            const quote = source
                .slice(start - 1, end)
                .join('\n')
                .replace(/\s+/g, ' ');
            assert.ok(
                project.techniques.some(
                    (item) => item.pattern === pattern.id && item.quote && quote.includes(item.quote.replace(/\s+/g, ' ')),
                ),
                `range contains tagged quote: ${href}`,
            );
        }
        for (const project of projects.filter((item) => item.patterns.includes(pattern.id))) {
            assert.ok(
                html.includes(`href="/${project.owner}/${project.repo}?technique=${pattern.id}"`),
                `pattern project listing: ${project.slug}`,
            );
        }
    }
    assert.equal((await response('/agent-rules/not-a-pattern')).status, 404);
    assert.equal((await response('/agent-rules/toString')).status, 404);
    const skillsIndex = await page('/skills');
    // The global directory sorts project input by stars before its stable skill-name sort.
    const allSkills = [...projects]
        .sort((a, b) => b.stars - a.stars)
        .flatMap((project) => {
            const manifest = JSON.parse(fs.readFileSync(`content/skills/${project.slug}.json`, 'utf8')) as SkillManifest;
            return manifest.skills.map((skill) => ({ ...skill, href: `/${project.owner}/${project.repo}/skills/${skill.id}` }));
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    const skillPaths = new Set(allSkills.map((skill) => skill.href));
    const initialSkillLinks = skillLinks(skillsIndex);
    assert.equal(initialSkillLinks.length, Math.min(50, skillPaths.size), 'skills index renders one page');
    assert.equal(new Set(initialSkillLinks).size, initialSkillLinks.length, 'skills index has no duplicate entries');
    for (const href of initialSkillLinks) assert.ok(skillPaths.has(href), `skills index repository link: ${href}`);
    await checkPagination(
        '/skills',
        allSkills.map((skill) => skill.href),
    );
    for (const value of ['1', '0', '-1', 'bad', '1.5', 'Infinity']) {
        assert.deepEqual(skillLinks(await page(`/skills?page=${value}`, '/skills')), initialSkillLinks);
    }
    const finalPage = Math.max(1, Math.ceil(allSkills.length / 50));
    const finalCanonical = finalPage === 1 ? '/skills' : `/skills?page=${finalPage}`;
    assert.deepEqual(
        skillLinks(await page('/skills?page=999999', finalCanonical)),
        allSkills.slice((finalPage - 1) * 50).map((skill) => skill.href),
    );
    await page('/skills?page=1&page=2&utm_source=test', '/skills');
    const filtered = await page('/skills?resources=1');
    assert.ok(isNoindex(filtered), 'arbitrary filters are not indexed');
    assert.deepEqual(
        skillLinks(filtered),
        allSkills
            .filter((skill) => skill.files.length > 1)
            .slice(0, 50)
            .map((skill) => skill.href),
    );
    const empty = await page('/skills?q=ossrules-no-such-skill-829104');
    assert.ok(isNoindex(empty), 'search results are not indexed');
    assert.deepEqual(skillLinks(empty), []);

    const robotsResponse = await response('/robots.txt');
    assert.equal(robotsResponse.status, 200);
    assert.match(robotsResponse.headers.get('content-type') ?? '', /text\/plain/);
    const robots = await robotsResponse.text();
    assert.match(robots, /User-Agent: \*/i);
    assert.match(robots, /Allow: \/\s/);
    assert.match(robots, /Sitemap: https:\/\/ossrules\.md\/sitemap\.xml/);
    const sitemapResponse = await response('/sitemap.xml');
    assert.equal(sitemapResponse.status, 200);
    assert.match(sitemapResponse.headers.get('content-type') ?? '', /xml/);
    const sitemap = await sitemapResponse.text();
    const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    const expectedSitemap = new Set(['https://ossrules.md/', 'https://ossrules.md/agent-rules', 'https://ossrules.md/skills']);
    for (const pattern of PATTERNS) expectedSitemap.add(`https://ossrules.md/agent-rules/${pattern.id}`);
    for (const href of skillPaths) expectedSitemap.add(`https://ossrules.md${href}`);
    // Rules show a capped sample of projects, so a larger corpus need not appear in full.
    const projectPaths = new Set(projects.map((project) => `/${project.owner}/${project.repo}`));
    const ruleProjectLinks = [...rules.matchAll(/<a\b[^>]*href="(\/[^"?#]+\/[^"?#]+)"/g)].map((match) => match[1]);
    assert.ok(ruleProjectLinks.length > 0, 'rules include project examples');
    for (const href of ruleProjectLinks) {
        assert.ok(
            projectPaths.has(href) || PATTERNS.some((pattern) => href === `/agent-rules/${pattern.id}`),
            `rules destination: ${href}`,
        );
    }
    for (const project of projects) {
        // Deliberately independent of URL helpers so changes to those cannot hide a regression.
        const root = `/${project.owner}/${project.repo}`;
        expectedSitemap.add(`https://ossrules.md${root}`);
        assert.ok(home.includes(`href="${root}"`), `directory: ${root}`);
        assert.ok(!rules.includes(`href="/${project.slug}"`), `rules must not use legacy URLs: ${project.slug}`);
        const html = await page(root);
        assert.ok(html.includes(`href="${root}/skills"`), `project tabs: ${root}`);
        const instructionPath = project.instructionFile ?? 'AGENTS.md';
        const instruction = await response(`/files/${project.slug}?path=${encodeURIComponent(instructionPath)}`);
        assert.equal(instruction.status, 200, `instruction source: ${root}`);
        assert.match(instruction.headers.get('content-type') ?? '', /text\/plain/);
        assert.equal(instruction.headers.get('x-content-type-options'), 'nosniff');
        assert.deepEqual(
            Buffer.from(await instruction.arrayBuffer()),
            fs.readFileSync(path.join('public/files', project.slug, instructionPath)),
            `instruction bytes: ${root}`,
        );
        await redirected(`/${project.slug}?ref=legacy`, `${root}?ref=legacy`);
        await redirected(`/${project.slug}/skills?q=review`, `${root}/skills?q=review`);
        const manifest = JSON.parse(fs.readFileSync(`content/skills/${project.slug}.json`, 'utf8')) as SkillManifest;
        if (manifest.skills.length) expectedSitemap.add(`https://ossrules.md${root}/skills`);
        await checkPagination(
            `${root}/skills`,
            manifest.skills.map((skill) => `${root}/skills/${skill.id}`),
        );
        const skill = manifest.skills[0];
        if (skill) {
            const detail = `${root}/skills/${skill.id}`;
            const legacy = `/${project.slug}/skills/${skill.id}`;
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
    assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, 'no duplicate sitemap URLs');
    assert.deepEqual(new Set(sitemapUrls), expectedSitemap, 'sitemap covers readers and useful indexes only, on the apex domain');
    assert.ok(!sitemap.includes('<lastmod>'), 'do not invent page modification dates from source scan times');
    // A known repo name under the wrong owner must not resolve by basename or internal slug.
    assert.equal((await response('/not-the-owner/fresh')).status, 404);
    assert.equal((await response('/freshframework/does-not-exist')).status, 404);
    assert.equal((await response('/not-the-owner/fresh/skills')).status, 404);
    assert.equal((await response('/not-the-owner/fresh/skills/missing/file?path=SKILL.md')).status, 404);
    assert.equal((await response('/not-the-owner/fresh/skills/missing/download')).status, 404);
    for (const sourcePath of ['', '../AGENTS.md', '/etc/passwd', 'manifest.json', 'not-vendored.md']) {
        assert.equal((await response(`/files/zed?path=${encodeURIComponent(sourcePath)}`)).status, 404, sourcePath);
    }
    assert.equal((await response('/files/not-a-project?path=AGENTS.md')).status, 404);
    assert.equal((await response('/files/prisma?path=.agents/skills/publish-npm-version/SKILL.md')).status, 404);
    assert.equal(
        await (await response('/files/zed?path=AGENTS.md')).text(),
        fs.readFileSync('public/files/zed/.rules', 'utf8'),
        'instruction symlink serves resolved contents',
    );
    console.log(
        `Verified ${projects.length} repository namespaces, ${skillPaths.size} paginated skills, ${sitemapUrls.length} sitemap URLs, robots, and 404s.`,
    );
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
