import assert from 'node:assert/strict';
import { test } from 'node:test';
import { documentMentions } from './document-mentions';

test('keeps source line numbers, surrounding instructions, and path punctuation', () => {
    const source = '# Rules\n\nBefore changing the parser,\nread `docs/parser.md`.\nThen run the targeted tests.\n\n# Next';
    assert.deepEqual(documentMentions(source, ['docs/parser.md'])['docs/parser.md'], [
        { startLine: 3, lines: ['Before changing the parser,', 'read `docs/parser.md`.', 'Then run the targeted tests.'] },
    ]);
});

test('does not confuse nested paths, extensions, or a basename with a direct reference', () => {
    const source = 'nested/docs/a.md\ndocs/a.md.backup\ndocs/a.md-other\n`a.md`\n\nRead [guide](./docs/a.md).';
    assert.deepEqual(documentMentions(source, ['docs/a.md'])['docs/a.md'], [{ startLine: 6, lines: ['Read [guide](./docs/a.md).'] }]);
});

test('groups nearby repeated mentions and preserves separate passages', () => {
    const source = 'Read docs/a.md\nSee docs/a.md again\n\nUnrelated\n\nRead docs/a.md';
    assert.deepEqual(documentMentions(source, ['docs/a.md'])['docs/a.md'], [
        { startLine: 1, lines: ['Read docs/a.md', 'See docs/a.md again'] },
        { startLine: 6, lines: ['Read docs/a.md'] },
    ]);
});

test('leaves missing or indirect mentions unresolved', () => {
    assert.deepEqual(documentMentions(undefined, ['docs/a.md']), { 'docs/a.md': [] });
    assert.deepEqual(documentMentions('Read the nearest README.', ['docs/README.md', 'AGENTS.md']), { 'docs/README.md': [] });
});

test('attributes nested references to their actual source and resolves relative paths', () => {
    assert.deepEqual(documentMentions('@../AGENTS.md', ['AGENTS.md', '.claude/CLAUDE.md'], '.claude/CLAUDE.md'), {
        'AGENTS.md': [{ sourcePath: '.claude/CLAUDE.md', startLine: 1, lines: ['@../AGENTS.md'] }],
    });
});
