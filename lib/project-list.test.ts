import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import type { AgentsProject } from '../components/agents-md-data';
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
