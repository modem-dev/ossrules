import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isInstructionPath, isInstructionSourcePath } from './instruction-path';

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

test('allows explicit symlink targets without discovering unrelated documents as instructions', () => {
    for (const value of ['.rules', 'CONTRIBUTING.md', 'docs/contributing.md']) {
        assert.equal(isInstructionSourcePath(value), true, value);
        assert.equal(isInstructionPath(value), false, value);
    }
    for (const value of [
        '',
        '../.rules',
        '/.rules',
        'docs/../.rules',
        'docs//.rules',
        'C:/.rules',
        'https://example.com/.rules',
        '.rules?raw=1',
        '.rules#section',
        '.rules\0',
        undefined,
    ]) {
        assert.equal(isInstructionSourcePath(value), false, String(value));
    }
});
