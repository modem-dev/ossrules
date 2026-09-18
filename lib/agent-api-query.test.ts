import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiQueryError, pageItems, parseListQuery } from './agent-api-query';

const url = (query: string) => new URL(`/api/v1/skills?${query}`, 'http://localhost:3001');

test('pagination preserves encoded filters and terminates without duplicates', () => {
    const firstUrl = url('q=review+%26+test&repository=org%2Frepo&limit=2');
    const first = pageItems(['a', 'b', 'c'], firstUrl, parseListQuery(firstUrl, ['q', 'repository']));
    assert.deepEqual(first.items, ['a', 'b']);
    assert.equal(first.previousUrl, null);
    assert.ok(first.nextUrl);
    const next = new URL(first.nextUrl);
    assert.equal(next.searchParams.get('q'), 'review & test');
    assert.equal(next.searchParams.get('repository'), 'org/repo');
    const last = pageItems(['a', 'b', 'c'], next, parseListQuery(next, ['q', 'repository']));
    assert.deepEqual(last.items, ['c']);
    assert.equal(last.nextUrl, null);
    assert.equal(new URL(last.previousUrl ?? '').searchParams.get('offset'), '0');
});

test('invalid, duplicate and unrecognized query parameters are rejected', () => {
    for (const query of [
        'limit=0',
        'limit=51',
        'limit=1.5',
        'offset=-1',
        'offset=9007199254740992',
        'limit=',
        'q=a&q=b',
        'search=x',
        `q=${'x'.repeat(201)}`,
    ]) {
        assert.throws(() => parseListQuery(url(query), ['q']), ApiQueryError, query);
    }
});

test('defaults, normalized filters, empty and out-of-range pages', () => {
    const query = parseListQuery(url('q=%20Python%20'), ['q']);
    assert.equal(query.limit, 10);
    assert.equal(query.offset, 0);
    assert.equal(query.filter('q'), 'python');
    const empty = pageItems([], url(''), query);
    assert.deepEqual(empty.items, []);
    assert.equal(empty.nextUrl, null);
    assert.equal(empty.previousUrl, null);
    const pastEnd = pageItems(['a', 'b', 'c'], url('offset=100'), { limit: 2, offset: 100 });
    assert.deepEqual(pastEnd.items, []);
    assert.equal(pastEnd.nextUrl, null);
    assert.equal(new URL(pastEnd.previousUrl ?? '').searchParams.get('offset'), '2');
});
