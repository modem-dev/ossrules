import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import type { AgentsProject } from '../components/agents-md-data';
import { languageFacets, patternFacets, SORTS, toProjectListingEntry } from '../components/agents-md-data';
import { projectListing, projectNeighbors, projectSearchString, withProjectSearch } from './project-list';

const projects: AgentsProject[] = ['opencode', 'playwright', 'ghostty'].map((slug) =>
    JSON.parse(fs.readFileSync(`content/projects/${slug}.json`, 'utf8')),
);

test('directory URLs preserve combined filters and sort direction without unrelated parameters', () => {
    const search = projectSearchString({
        language: 'TypeScript',
        sort: 'name',
        direction: 'desc',
        q: [' ', 'ignored'],
        source: 'AGENTS.md',
    });
    const listing = projectListing(projects, search);
    assert.deepEqual(
        listing.visible.map((project) => project.slug),
        ['playwright', 'opencode'],
    );
    assert.equal(listing.canonicalSearch, 'language=TypeScript&sort=name&direction=desc');
    assert.deepEqual(projectListing(projects, listing.canonicalSearch).visible, listing.visible);
    assert.equal(
        withProjectSearch('/microsoft/playwright', listing.canonicalSearch),
        '/microsoft/playwright?language=TypeScript&sort=name&direction=desc',
    );
});

test('unknown filters normalize safely and valid queries can return no matches', () => {
    assert.equal(projectListing(projects, 'language=unknown&technique=__proto__&sort=bad&direction=sideways').canonicalSearch, '');
    assert.equal(projectListing(projects, 'q=no-such-project').visible.length, 0);
    assert.equal(projectListing(projects, 'technique=hard-prohibition').visible.length, 3);
});

test('neighbors follow the selected collection and single results do not link to themselves', () => {
    const neighbors = projectNeighbors(projects, 'opencode', 'language=TypeScript&sort=name');
    assert.equal(neighbors.next?.slug, 'playwright');
    assert.equal(neighbors.previous?.slug, 'playwright');
    assert.equal(neighbors.search, 'language=TypeScript&sort=name');
    assert.equal(projectNeighbors(projects, 'ghostty', 'language=Zig').next, undefined);
    assert.equal(projectNeighbors(projects, 'ghostty', 'q=opencode').search, '');
    assert.equal(projectNeighbors(projects, 'ghostty', 'q=opencode').next?.slug, 'opencode');
});

test('compact records preserve directory search, facets, and every sort across the corpus', () => {
    const full: AgentsProject[] = fs
        .readdirSync('content/projects')
        .filter((name) => name.endsWith('.json'))
        .map((name) => JSON.parse(fs.readFileSync(`content/projects/${name}`, 'utf8')));
    const compact = full.map(toProjectListingEntry);
    assert.deepEqual(languageFacets(compact), languageFacets(full));
    assert.deepEqual(patternFacets(compact), patternFacets(full));
    const searches = ['', 'q=testing', 'q=monorepo', 'q=wrong+version', 'language=Rust', 'technique=verification-matrix'];
    for (const { id } of SORTS) {
        for (const direction of ['asc', 'desc']) {
            for (const search of searches) {
                const params = `${search}&sort=${id}&direction=${direction}`;
                assert.deepEqual(
                    projectListing(compact, params).visible.map((project) => project.slug),
                    projectListing(full, params).visible.map((project) => project.slug),
                    params,
                );
            }
        }
    }
    const fullBytes = Buffer.byteLength(JSON.stringify(full));
    const compactBytes = Buffer.byteLength(JSON.stringify(compact));
    assert.ok(compactBytes < fullBytes / 4, `directory payload should omit detail prose: ${compactBytes}/${fullBytes} bytes`);
    console.log(
        `Directory data: ${fullBytes.toLocaleString('en')} → ${compactBytes.toLocaleString('en')} bytes before compression (${(100 * (1 - compactBytes / fullBytes)).toFixed(1)}% smaller).`,
    );
});
