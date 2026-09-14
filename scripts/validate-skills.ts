import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseSkill, type SkillManifest, safeRelativePath, skillId } from '../lib/skill-schema';

const directory = path.join(process.cwd(), 'content/skills');
let count = 0;
if (fs.existsSync(directory)) {
    for (const name of fs.readdirSync(directory).filter((name) => name.endsWith('.json'))) {
        const m = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')) as SkillManifest;
        assert.equal(m.version, 1);
        assert.equal(name, `${m.slug}.json`);
        assert.match(m.sha, /^[a-f0-9]{40}$/);
        assert.ok(fs.existsSync(path.join(process.cwd(), 'content/projects', name)));
        assert.equal(new Set(m.skills.map((s) => s.id)).size, m.skills.length);
        for (const skill of m.skills) {
            assert.ok(safeRelativePath(skill.path));
            assert.equal(skill.id, skillId(skill.path));
            assert.equal(new Set(skill.files.map((f) => f.path)).size, skill.files.length);
            const root = skill.files.find((f) => f.path === 'SKILL.md');
            assert.ok(root && !root.omitted && root.text);
            const source = fs.readFileSync(path.join(process.cwd(), 'content/skill-files', m.slug, root.blob), 'utf8');
            const metadata = parseSkill(source);
            assert.equal(skill.name, metadata.name);
            assert.equal(skill.description, metadata.description);
            count++;
        }
        const files = [...m.skills.flatMap((s) => s.files), ...[m.agentsFile, m.repositoryLicense].filter((f) => !!f)];
        for (const file of files) {
            assert.ok(safeRelativePath(file.path));
            assert.match(file.blob, /^[a-f0-9]{40}$/);
            if (file.omitted) continue;
            const bytes = fs.readFileSync(path.join(process.cwd(), 'content/skill-files', m.slug, file.blob));
            assert.equal(bytes.length, file.bytes);
            assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), file.blob);
            if (file.text) new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        }
    }
}
console.log(`Validated ${count} skill bundles and pinned source hashes.`);
