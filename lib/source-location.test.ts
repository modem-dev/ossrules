import assert from 'node:assert/strict';
import test from 'node:test';
import { readSourceLocation, writeSourceLocation } from './source-location';

const sha = 'a'.repeat(40);
const files = [
    { path: 'AGENTS.md' },
    { path: 'docs/a & b.md' },
    { path: 'alias.md', resolvedPath: 'AGENTS.md' },
    { path: 'missing.md', missing: true },
];

test('source URLs round trip passages, escaped paths, revision, view, and collection context', () => {
    const request = { path: 'docs/a & b.md', startLine: 12, lineCount: 4 };
    const search = writeSourceLocation('language=Rust', request, 'raw', sha);
    assert.deepEqual(readSourceLocation(search, files, sha), { request, view: 'raw', mismatch: false });
    assert.equal(new URLSearchParams(search).get('rev'), sha);
    assert.equal(writeSourceLocation(search, undefined, 'markdown', sha), 'language=Rust');
    assert.equal(readSourceLocation('source=alias.md', files, sha).request?.path, 'AGENTS.md');
});

test('unavailable paths, malformed ranges, and changed snapshots cannot select misleading passages', () => {
    for (const path of ['../AGENTS.md', 'missing.md', 'https://example.com/x']) {
        assert.equal(readSourceLocation(`source=${encodeURIComponent(path)}`, files, sha).request, undefined);
    }
    for (const line of ['-1', '0', 'Infinity', '1.5', '9007199254740992']) {
        assert.equal(readSourceLocation(`source=AGENTS.md&line=${line}`, files, sha).request?.startLine, undefined);
    }
    assert.equal(readSourceLocation('source=AGENTS.md&line=10&end=2', files, sha).request?.lineCount, 1);
    const old = readSourceLocation(`source=AGENTS.md&line=2&rev=${'b'.repeat(40)}`, files, sha);
    assert.equal(old.mismatch, true);
    assert.equal(old.request, undefined);
});
