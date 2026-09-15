import assert from 'node:assert/strict';
import test from 'node:test';
import { type ContributorCommit, summarizeContributors } from './skill-contributors';

const commit = (sha: string, id: number, login: string, type = 'User'): ContributorCommit => ({
    sha,
    author: { id, login, type },
    commit: { author: { name: login } },
});

test('deduplicates commits across pages and groups renamed accounts by GitHub id', () => {
    const result = summarizeContributors([
        commit('new', 1, 'new-name'),
        commit('new', 1, 'new-name'),
        commit('old', 1, 'old-name'),
        commit('other', 2, 'another'),
    ]);
    assert.deepEqual(result.contributors, [
        { id: 1, login: 'new-name', commits: 2 },
        { id: 2, login: 'another', commits: 1 },
    ]);
});

test('excludes identified automation and preserves missing-account coverage', () => {
    const result = summarizeContributors([
        commit('bot', 3, 'automation', 'Bot'),
        commit('suffix', 4, 'release[bot]'),
        commit('account', 5, 'omarchybot'),
        { sha: 'missing', author: null, commit: { author: { name: 'Unlinked author' } } },
        { sha: 'missing-again', author: null, commit: { author: { name: 'Unlinked author' } } },
        commit('human', 6, 'contributor'),
    ]);
    assert.deepEqual(result, { contributors: [{ id: 6, login: 'contributor', commits: 1 }], unlinkedAuthors: 1 });
    assert.deepEqual(summarizeContributors([]), { contributors: [], unlinkedAuthors: 0 });
});
