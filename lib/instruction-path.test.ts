import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isInstructionPath } from './instruction-path';

test('recognizes root and nested instruction entry points without allowing path escapes', () => {
    for (const value of ['AGENTS.md', 'CLAUDE.md', '.agents/AGENTS.md', '.claude/CLAUDE.md', 'packages/core/AGENTS.md']) {
        assert.equal(isInstructionPath(value), true, value);
    }
    for (const value of [
        '../AGENTS.md',
        '/AGENTS.md',
        '.agents/../AGENTS.md',
        '.agents//AGENTS.md',
        'C:\\AGENTS.md',
        'AGENTS.md?raw=1',
        'README.md',
        '.agents/AGENTS.md\0',
        undefined,
        1,
    ]) {
        assert.equal(isInstructionPath(value), false, String(value));
    }
});
