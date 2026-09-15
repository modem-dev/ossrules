import assert from 'node:assert/strict';
import test from 'node:test';
import { instructionImports, localTarget, resolveSymlink } from './instruction-files';

test('imports preserve their source-relative path and skip code examples', () => {
    const source = ['@../AGENTS.md', '`@example.md`', '```md', '@not-loaded.md', '```', 'See @docs/setup.md.', '@../AGENTS.md'].join('\n');
    assert.deepEqual(instructionImports('.claude/CLAUDE.md', source), [
        { target: '../AGENTS.md', path: 'AGENTS.md' },
        { target: 'docs/setup.md', path: '.claude/docs/setup.md' },
    ]);
    assert.deepEqual(instructionImports('docs/shared.md', '@../config.toml'), [{ target: '../config.toml', path: 'config.toml' }]);
    assert.deepEqual(instructionImports('CLAUDE.md', 'Uses @n8n/tool and **@xyflow/react** for @env-spec.'), []);
});
test('external imports remain visible without reading host paths', () => {
    const imports = instructionImports('CLAUDE.md', '@../../outside.md\n@~/.claude/local.md\n@https://example.com/rules.md');
    assert.equal(imports.length, 3);
    assert.ok(imports.every((item) => item.unavailable && !item.path));
    for (const target of ['/tmp/private.md', '../outside.md', 'C:\\private.md', 'a\\b.md'])
        assert.equal(localTarget('CLAUDE.md', target), undefined);
});
test('symlink chains resolve within the pinned tree', () => {
    const links = new Map([
        ['AGENTS.md', '.claude/shared.md'],
        ['.claude/shared.md', '../CLAUDE.md'],
    ]);
    assert.deepEqual(resolveSymlink('AGENTS.md', links, new Set(['AGENTS.md', '.claude/shared.md', 'CLAUDE.md'])), { path: 'CLAUDE.md' });
});
test('cycles, missing targets, and escapes stay unresolved', () => {
    assert.equal(
        resolveSymlink(
            'AGENTS.md',
            new Map([
                ['AGENTS.md', 'CLAUDE.md'],
                ['CLAUDE.md', 'AGENTS.md'],
            ]),
            new Set(),
        ).unavailable,
        'Circular symlink',
    );
    assert.ok(resolveSymlink('AGENTS.md', new Map([['AGENTS.md', 'missing.md']]), new Set()).unavailable);
    assert.ok(resolveSymlink('AGENTS.md', new Map([['AGENTS.md', '../private.md']]), new Set()).unavailable);
});
