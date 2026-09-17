import assert from 'node:assert/strict';
import test from 'node:test';
import type { SkillEntry } from '../components/skill-explorer';
import { skillListing, skillListingMetadata, skillSearchString } from './skill-list';
import { classifySkillTasks } from './skill-task-classification';
import { SKILL_TASKS } from './skill-tasks';

const entry = (id: string, tasks: SkillEntry['tasks'], project = 'one', files = 1): SkillEntry => ({
    id,
    name: id,
    description: 'Example workflow',
    path: `${id}/SKILL.md`,
    href: `/owner/repo/skills/${id}`,
    files,
    complete: true,
    tasks,
    project: { slug: project, name: project, href: '/owner/repo/skills', logo: '', repository: 'owner/repo' },
});

test('task filters intersect with search, project, and supporting files', () => {
    const entries = [entry('fast', ['performance'], 'one', 2), entry('slow', ['performance'], 'two'), entry('docs', ['documentation'])];
    assert.deepEqual(
        skillListing(entries, 'task=performance&project=one&resources=1&q=fast').visible.map((e) => e.id),
        ['fast'],
    );
    assert.equal(skillListing(entries, 'task=performance&q=missing').visible.length, 0);
    assert.equal(skillListing(entries, 'task=database-changes').visible.length, 0);
});

test('task URLs survive serialization, pagination, and canonical metadata', () => {
    const entries = Array.from({ length: 51 }, (_, i) => entry(`skill-${i}`, ['code-review', 'git-prs']));
    const search = skillSearchString({ task: ['code-review', 'testing'], page: '2' });
    assert.equal(search, 'task=code-review&page=2');
    const listing = skillListing(entries, search);
    assert.equal(listing.pageEntries.length, 1);
    assert.equal(listing.canonicalSearch, search);
    assert.equal(skillListingMetadata('/skills', entries, search).alternates.canonical, `/skills?${search}`);
    assert.equal(skillListing(entries, 'task=unknown').task, '');
    assert.equal(skillListing(entries, 'task=unknown').canonicalSearch, '');
    assert.equal(skillListing(entries, 'task=testing&page=9').page, 1);
});

test('all skills includes unclassified records; project listings support tasks', () => {
    const entries = [entry('unclassified', undefined), entry('perf', ['performance'])];
    assert.equal(skillListing(entries).visible.length, 2);
    assert.equal(skillListing(entries, 'task=performance&project=ignored', true).visible.length, 1);
    assert.equal(SKILL_TASKS.length, 16);
    assert.equal(new Set(SKILL_TASKS.map((t) => t.id)).size, 16);
});

test('classify the main task without matching incidental tests or excluded triggers', () => {
    assert.deepEqual(classifySkillTasks({ name: 'code-review', description: 'Review code changes for correctness and test coverage.' }), [
        'code-review',
    ]);
    assert.deepEqual(
        classifySkillTasks({
            name: 'type-inference',
            description: 'Work on type inference, including profiling and tests. Do not use for deployment.',
        }),
        [],
    );
    assert.deepEqual(
        classifySkillTasks({
            name: 'tool',
            description: 'Manage project settings. Use when tests, deployments, or security audits need settings.',
        }),
        [],
    );
    assert.deepEqual(classifySkillTasks({ name: 'fitness-nutrition', description: 'Workout planning, macros, and body metrics.' }), []);
    assert.deepEqual(classifySkillTasks({ name: 'diagnostics-development', description: 'Design diagnostic presentation and APIs.' }), []);
});

test('recognize requested tasks and meaningful overlap', () => {
    for (const [name, task] of [
        ['imagegen', 'media-generation'],
        ['memory-benchmark', 'performance'],
        ['deployment', 'deployment'],
        ['n8n:db-migrations', 'database-changes'],
        ['writing-commit-messages', 'git-prs'],
    ] as const)
        assert.ok(classifySkillTasks({ name, description: '' }).includes(task));
    assert.deepEqual(classifySkillTasks({ name: 'frontend-unit-testing', description: 'Write behaviour-driven tests.' }), ['testing']);
    assert.deepEqual(classifySkillTasks({ name: 'security-review', description: 'Review code changes for security vulnerabilities.' }), [
        'security',
        'code-review',
    ]);
});
