import assert from 'node:assert/strict';
import test from 'node:test';
import { bundleFilePath, excludedSkillPath, parseSkill, safeRelativePath, skillId } from './skill-schema';

test('YAML metadata preserves multiline descriptions and rejects malformed/duplicate fields', () => {
    assert.equal(
        parseSkill('---\r\nname: review\r\ndescription: >-\r\n  Review the\r\n  current change.\r\n---\r\nBody').description,
        'Review the current change.',
    );
    assert.throws(() => parseSkill('---\nname: a\nname: b\ndescription: x\n---\n'));
    assert.throws(() => parseSkill('---\nname: a\ndescription: [a, b]\n---\n'));
    assert.throws(() => parseSkill('# Missing metadata'));
});
test('same names in different directories keep distinct stable identities', () => {
    assert.notEqual(skillId('.agents/skills/review/SKILL.md'), skillId('packages/a/skills/review/SKILL.md'));
    assert.equal(skillId('.agents/skills/review/SKILL.md'), skillId('.agents/skills/review/SKILL.md'));
});
test('optional tags and platforms preserve explicit declarations from pinned frontmatter', () => {
    const skill = parseSkill(`---
name: video
description: Make videos.
platforms: [linux, macos, windows]
tags: [Video]
metadata:
  tags: [Animation]
  hermes:
    tags: [Manim, Animation, Math, Video]
---
`);
    assert.deepEqual(skill.tags, ['Video', 'Animation', 'Manim', 'Math']);
    assert.deepEqual(skill.platforms, ['linux', 'macos', 'windows']);
});
test('missing or malformed optional metadata never implies tags or platform support', () => {
    for (const metadata of ['', 'metadata: []', 'tags: [Video, 42]\nplatforms: all', 'metadata:\n  hermes: [linux]']) {
        const skill = parseSkill(`---\nname: video\ndescription: Make videos.\n${metadata}\n---\n`);
        assert.equal(skill.tags, undefined);
        assert.equal(skill.platforms, undefined);
    }
    const skill = parseSkill('---\nname: video\ndescription: Make videos.\ntags: [Video, " Video ", ""]\n---\n');
    assert.deepEqual(skill.tags, ['Video']);
});
test('scope excludes test fixtures but includes hidden and project-specific skill directories', () => {
    assert.equal(excludedSkillPath('packages/a/tests/fixtures/sample/SKILL.md'), true);
    assert.equal(excludedSkillPath('.agents/skills/testing/SKILL.md'), false);
    assert.equal(excludedSkillPath('packages/a/skills/review/SKILL.md'), false);
});
test('bundle navigation resolves relative files without escaping the skill directory', () => {
    assert.equal(bundleFilePath('references/checklist.md', '../SKILL.md'), 'SKILL.md');
    assert.equal(bundleFilePath('SKILL.md', './references/guide.md#usage'), 'references/guide.md');
    for (const input of ['../../secret', '%2e%2e/secret', 'https://example.com', '//example.com', '/absolute', '#heading']) {
        assert.equal(bundleFilePath('SKILL.md', input), undefined);
    }
    assert.equal(safeRelativePath('../outside'), false);
    assert.equal(safeRelativePath('x\\y'), false);
});
