import { createHash } from 'node:crypto';
import path from 'node:path';
import { parseDocument } from 'yaml';
import type { SkillContributions } from './skill-contributors';

export interface SkillFile {
    path: string;
    blob: string;
    bytes: number;
    text: boolean;
    mode: string;
    omitted?: string;
}

export interface SkillRecord {
    id: string;
    path: string;
    name: string;
    description: string;
    license?: string;
    compatibility?: string;
    files: SkillFile[];
    contributions?: SkillContributions;
}

export interface SkillManifest {
    version: 1;
    slug: string;
    repository: string;
    branch: string;
    sha: string;
    scannedAt: string;
    scope: string;
    excluded: string[];
    invalid: { path: string; reason: string }[];
    skills: SkillRecord[];
    agentsFile?: SkillFile;
    repositoryLicense?: SkillFile;
}

export const SCAN_SCOPE = 'Tracked SKILL.md files, excluding tests, fixtures, dependencies, and vendored directories.';
export function safeRelativePath(value: string): boolean {
    return (
        !!value &&
        !value.includes('\\') &&
        !value.includes('\0') &&
        value.split('/').every((part) => !!part && part !== '.' && part !== '..')
    );
}

export function excludedSkillPath(value: string): boolean {
    return /(^|\/)(__fixtures__|fixtures|__tests__|tests?|testdata|node_modules|vendor|third_party)(\/|$)/i.test(value);
}

/** Names can collide. The URL identity follows the repository path. */
export function skillId(filePath: string): string {
    const name =
        path.posix
            .basename(path.posix.dirname(filePath))
            .replace(/[^a-zA-Z0-9-]/g, '-')
            .slice(0, 60) || 'skill';
    return `${name}-${createHash('sha256').update(filePath).digest('hex').slice(0, 12)}`;
}

export function parseSkill(source: string): Pick<SkillRecord, 'name' | 'description' | 'license' | 'compatibility'> {
    const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
    if (!match) throw new Error('Missing YAML frontmatter.');
    const doc = parseDocument(match[1], { uniqueKeys: true });
    if (doc.errors.length) throw new Error('Invalid YAML frontmatter.');
    const data = doc.toJS({ maxAliasCount: 25 }) as Record<string, unknown> | null;
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Frontmatter must be a mapping.');
    if (typeof data.name !== 'string' || !data.name.trim() || data.name.length > 64) throw new Error('Missing or invalid skill name.');
    if (typeof data.description !== 'string' || !data.description.trim() || data.description.length > 1024) {
        throw new Error('Missing or invalid skill description.');
    }
    // Preserve upstream names; indexability is separate from strict authoring conformance.
    return {
        name: data.name,
        description: data.description,
        ...(typeof data.license === 'string' ? { license: data.license } : {}),
        ...(typeof data.compatibility === 'string' ? { compatibility: data.compatibility } : {}),
    };
}

export function markdownBody(source: string): string {
    return source.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
}

export function bundleFilePath(current: string, href: string): string | undefined {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(href)) return undefined;
    try {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(current), decodeURIComponent(href.split(/[?#]/)[0])));
        return safeRelativePath(resolved) ? resolved : undefined;
    } catch {
        return undefined;
    }
}
