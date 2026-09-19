import assert from 'node:assert/strict';
import test from 'node:test';
import type { SkillEntry } from '../components/skill-explorer';
import { skillListing, skillSearchString } from './skill-list';
import { hasSkillScripts } from './skill-scripts';

const file = (path: string, mode = '100644') => ({ path, mode, text: true });
test('script detection excludes prose, config, archives, omitted files and symlinks', () => {
    for (const path of ['SKILL.md', 'scripts/guide.md', 'notes.mdx', 'package.json', 'config.yaml', 'diagram.svg', 'bundle.zip']) {
        assert.equal(hasSkillScripts([file(path, '100755')]), false, path);
    }
    for (const path of ['scripts/run.py', 'tools/check.sh', 'index.ts', 'example.go']) {
        assert.equal(hasSkillScripts([file(path)]), true, path);
    }
    assert.equal(hasSkillScripts([file('bin/run', '100755')]), true);
    assert.equal(hasSkillScripts([file('LICENSE', '100755')]), false);
    assert.equal(hasSkillScripts([{ ...file('run.py'), omitted: 'too large' }]), false);
    assert.equal(hasSkillScripts([file('run.py', '120000')]), false);
});
test('script filter intersects with search and survives canonical URLs', () => {
    const base = {
        name: 'Python tools',
        description: '',
        path: 'SKILL.md',
        files: 2,
        project: { slug: 'one', name: 'One', repository: 'one/repo' },
    };
    const entries = [
        { ...base, id: 'code', hasScripts: true },
        { ...base, id: 'docs', hasScripts: false },
    ] as SkillEntry[];
    const search = skillSearchString({ scripts: '1', q: 'Python', project: 'one' });
    const listing = skillListing(entries, search);
    assert.deepEqual(
        listing.visible.map((e) => e.id),
        ['code'],
    );
    assert.equal(skillListing(entries, listing.canonicalSearch).scripts, true);
    assert.equal(skillListing(entries, 'scripts=0').visible.length, 2);
});
