import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import type { AgentsProject, ProjectListingEntry } from '../components/agents-md-data';
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
    assert.equal(listing.canonicalSearch, 'language=TypeScript&sort=name');
    assert.deepEqual(projectListing(projects, listing.canonicalSearch).visible, listing.visible);
    assert.equal(
        withProjectSearch('/microsoft/playwright', listing.canonicalSearch),
        '/microsoft/playwright?language=TypeScript&sort=name',
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

test('all sorts default to descending while explicit ascending remains available', () => {
    for (const { id } of SORTS) {
        const listing = projectListing(projects, `sort=${id}`);
        assert.equal(listing.descending, true, id);
        const ascending = projectListing(projects, `sort=${id}&direction=asc`);
        assert.equal(ascending.descending, false, id);
        if (id !== 'skills')
            assert.deepEqual(
                listing.visible.map((project) => project.slug),
                ascending.visible.map((project) => project.slug).reverse(),
                id,
            );
        assert.equal(projectListing(projects, ascending.canonicalSearch).descending, false);
    }
    const byLines = projectListing(projects, 'sort=lines').visible;
    assert.ok(byLines[0].file.lines >= byLines[1].file.lines);
    const byDate = projectListing(projects, 'sort=updated').visible;
    assert.ok(Date.parse(byDate[0].lastCommit.date) >= Date.parse(byDate[1].lastCommit.date));
});

test('retired bullet sort URLs fall back to the default sort', () => {
    assert.equal(projectListing(projects, 'sort=rules').sort, 'stars');
    assert.equal(projectListing(projects, 'sort=rules').canonicalSearch, '');
});

test('skill count sorts known counts and keeps unscanned projects last in either direction', () => {
    const entries: ProjectListingEntry[] = [
        { ...toProjectListingEntry(projects[0]), slug: 'zero', skillCount: 0 },
        { ...toProjectListingEntry(projects[0]), slug: 'many', skillCount: 20 },
        { ...toProjectListingEntry(projects[0]), slug: 'unknown' },
        { ...toProjectListingEntry(projects[0]), slug: 'few', skillCount: 3 },
    ];
    assert.deepEqual(
        projectListing(entries, 'sort=skills').visible.map((p) => p.slug),
        ['many', 'few', 'zero', 'unknown'],
    );
    assert.deepEqual(
        projectListing(entries, 'sort=skills&direction=asc').visible.map((p) => p.slug),
        ['zero', 'few', 'many', 'unknown'],
    );
    assert.equal(projectNeighbors(entries, 'few', 'sort=skills').next?.slug, 'zero');
});
