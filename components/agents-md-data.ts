/**
 * Types, technique taxonomy and pure helpers for the /agents-md directory.
 *
 * The corpus itself lives in content/projects/*.json, one file per project,
 * loaded and validated by lib/agents-md.ts. The split is what lets entries be
 * produced independently: writing one is a JSON file plus an avatar, with no
 * code change. The procedure is in .claude/skills/agents-md-entry/SKILL.md.
 *
 * This module is client-safe on purpose, since the directory UI is a client
 * component.
 *
 * Editorial rules for entries:
 *
 * - `quote` fields are verbatim from the project's AGENTS.md. Never paraphrase
 *   inside a quote; paraphrase in `body` instead. A misquote here is the one
 *   error that makes the whole page untrustworthy.
 * - `file` stats are measured from the real file, not estimated. Re-measure
 *   when refreshing rather than adjusting by eye.
 * - `stars` is a dated snapshot (STATS_AS_OF). The GitHub API is not called at
 *   build time, so these numbers are honest only because they carry the date.
 * - Analysis describes what the file actually does. If a technique is not
 *   visible in the file, it does not belong in the entry.
 */

import catalog from '@/content/patterns/catalog.json';

/** The month the repo stats below were captured. Rendered next to star counts. */
export const STATS_AS_OF = 'September 2026';

export type PatternId =
    | 'scope-layering'
    | 'skill-routing'
    | 'behavioral-conditioning'
    | 'hard-prohibition'
    | 'verification-matrix'
    | 'context-budget'
    | 'ratchet'
    | 'architecture-narrative'
    | 'worked-examples'
    | 'generated-file-guard'
    | 'nested-instructions'
    | 'single-source'
    | 'house-vocabulary'
    | 'contribution-etiquette';

export interface Pattern {
    id: PatternId;
    /** Short label used on badges and headings. */
    name: string;
    /** One line: what the technique is. */
    summary: string;
    /** Two or three sentences: why it works, and the failure it prevents. */
    detail: string;
}

/**
 * The cross-cutting techniques. This is the reason the collection exists: one
 * file teaches you about one repo, but the same techniques recur across all of
 * them, and that is what transfers to your own project.
 *
 * Order is roughly "easiest to adopt" first.
 */
const patternCatalog: Record<PatternId, Omit<Pattern, 'id'>> = catalog;
export const PATTERNS: Pattern[] = Object.entries(patternCatalog).map(([id, pattern]) => ({ ...pattern, id: id as PatternId }));

/** Every valid technique id, for validating authored entries. */
export const PATTERN_IDS: string[] = PATTERNS.map((pattern) => pattern.id);

export const PATTERNS_BY_ID: Record<PatternId, Pattern> = Object.fromEntries(PATTERNS.map((p) => [p.id, p])) as Record<PatternId, Pattern>;

/** Measured from the file itself. Every number is a real count, never an estimate. */
export interface FileStats {
    bytes: number;
    lines: number;
    words: number;
    headings: number;
    bullets: number;
    codeBlocks: number;
    /** Relative links to other docs in the repo. A high count means a router file. */
    docLinks: number;
}

/** The upstream commit that last touched the project's AGENTS.md. */
export interface LastCommit {
    sha: string;
    /** ISO 8601, UTC. */
    date: string;
}

/** A document the AGENTS.md tells the agent to read. Not the repo map. */
export interface DocReference {
    path: string;
    label?: string;
    /**
     * Set when the reference names a shape rather than one file — "the nearest
     * nested AGENTS.md", "the changed provider's changelog". These have no single
     * copy to vendor and no single file to open.
     */
    kind?: 'pattern';
}

/** One locally stored copy of a file the project's AGENTS.md reads. */
export interface VendoredFile {
    symlink?: string;
    resolvedPath?: string;
    unavailable?: string;
    imports?: { target: string; path?: string; unavailable?: string }[];
    sameContentAs?: string;
    tokens?: number;
    path: string;
    /** Size upstream, before any truncation. */
    bytes: number;
    lines: number;
    /** Only the first part of the file is stored; the rest is a link away. */
    truncated?: boolean;
    /** The path does not resolve at this commit — the AGENTS.md points at nothing. */
    missing?: true;
}

/** The index written by scripts/sync-agents-md-files.ts for one project. */
export interface VendoredFiles {
    slug: string;
    /** The commit every stored file was taken from. Matches the entry's lastCommit. */
    sha: string;
    /** SPDX id, when the repository's license file was recognised. */
    license?: string;
    licensePath?: string;
    files: VendoredFile[];
}

export interface Technique {
    /** Source of this excerpt, when different from the entry's primary file. */
    sourcePath?: string;
    title: string;
    body: string;
    /** Verbatim excerpt. Must appear in the real file, character for character. */
    quote?: string;
    pattern?: PatternId;
}

export interface AgentsProject {
    /** The real source analyzed by this entry. Defaults to AGENTS.md for existing entries. */
    instructionFile?: string;
    slug: string;
    /** Display name of the project. */
    name: string;
    owner: string;
    repo: string;
    /** What the project is, for readers who have not heard of it. */
    tagline: string;
    language: string;
    stars: number;
    defaultBranch: string;
    /** Upstream commit that last changed AGENTS.md, for the permalink and the age. */
    lastCommit: LastCommit;
    /** ISO date (YYYY-MM-DD) this entry's analysis was last written against the file. */
    evaluatedAt: string;
    file: FileStats;
    /** Documents the file routes to. Empty when it is self-contained. */
    references: DocReference[];
    /** A compact preview of the instruction file's scope and contents. Shown on the directory card. */
    hook: string;
    /** Two or three sentences on what kind of document this is. */
    summary: string;
    /** Concrete techniques from the file, each with a short explanation of why it matters. */
    techniques: Technique[];
    /** Direct, reusable instructions a reader can adapt for their own repository. */
    steal: string[];
    /** The file's own top-level sections, in order. */
    outline: string[];
    patterns: PatternId[];
}

/** Only the fields the interactive directory displays, searches, or sorts. */
export type ProjectListingEntry = Pick<
    AgentsProject,
    'slug' | 'name' | 'owner' | 'repo' | 'tagline' | 'hook' | 'language' | 'stars' | 'patterns' | 'instructionFile'
> & {
    file: Pick<FileStats, 'lines' | 'bullets'>;
    lastCommit: Pick<LastCommit, 'date'>;
    skillCount?: number;
};

export function toProjectListingEntry(project: AgentsProject): ProjectListingEntry {
    return {
        slug: project.slug,
        name: project.name,
        owner: project.owner,
        repo: project.repo,
        tagline: project.tagline,
        hook: project.hook,
        language: project.language,
        stars: project.stars,
        patterns: project.patterns,
        instructionFile: project.instructionFile,
        file: { lines: project.file.lines, bullets: project.file.bullets },
        lastCommit: { date: project.lastCommit.date },
    };
}

/** GitHub URLs. Kept as helpers so a future host move does not scatter string building. */
export function repoUrl(project: AgentsProject): string {
    return `https://github.com/${project.owner}/${project.repo}`;
}

export function agentsFileUrl(project: AgentsProject): string {
    return `https://github.com/${project.owner}/${project.repo}/blob/${project.defaultBranch}/${project.instructionFile ?? 'AGENTS.md'}`;
}

/** Permalink to the exact revision this entry was written against. */
export function agentsFileCommitUrl(project: AgentsProject): string {
    return repoFileUrl(project, project.instructionFile ?? 'AGENTS.md');
}

/** Any file in the repository, pinned to the commit this entry was measured at. */
export function repoFileUrl(project: AgentsProject, filePath: string): string {
    return `https://github.com/${project.owner}/${project.repo}/blob/${project.lastCommit.sha}/${filePath.split('/').map(encodeURIComponent).join('/')}`;
}

/**
 * True when the file changed upstream after this entry was written, which means
 * the measurements and analysis describe an older revision.
 */
export function isEntryStale(project: AgentsProject): boolean {
    return project.lastCommit.date.slice(0, 10) > project.evaluatedAt;
}

export function rawAgentsFileUrl(project: AgentsProject): string {
    return `https://raw.githubusercontent.com/${project.owner}/${project.repo}/${project.defaultBranch}/${project.instructionFile ?? 'AGENTS.md'}`;
}

/** "38.2k" for list display. Whole numbers under 1,000 stay as-is. */
export function formatStars(stars: number): string {
    if (stars < 1000) return String(stars);
    return `${(stars / 1000).toFixed(1).replace(/\.0$/, '')}k`;
}

/**
 * GitHub linguist colours, so the language column can be a dot rather than a
 * word. Only the languages in the directory need an entry; anything unlisted
 * falls back to a neutral grey rather than breaking, which is what keeps adding
 * a project in a new language from requiring an edit here.
 *
 * A colour alone is not an accessible label, so every dot also carries the
 * language name as text for assistive tech, and the language filter chips show
 * the same dots beside their names to act as an on-page legend.
 */
const LANGUAGE_COLORS: Record<string, string> = {
    C: '#555555',
    'C++': '#f34b7d',
    'C#': '#178600',
    Clojure: '#db5855',
    CSS: '#563d7c',
    Dart: '#00b4ab',
    Elixir: '#6e4a7e',
    Erlang: '#b83998',
    Go: '#00add8',
    Haskell: '#5e5086',
    HTML: '#e34c26',
    Java: '#b07219',
    JavaScript: '#f1e05a',
    Julia: '#a270ba',
    Kotlin: '#a97bff',
    Lua: '#000080',
    Nix: '#7e7eff',
    'Objective-C': '#438eff',
    OCaml: '#ef7a08',
    Perl: '#0298c3',
    PHP: '#4f5d95',
    PowerShell: '#012456',
    Python: '#3572a5',
    R: '#198ce7',
    Ruby: '#701516',
    Rust: '#dea584',
    Scala: '#c22d40',
    Shell: '#89e051',
    Svelte: '#ff3e00',
    Swift: '#f05138',
    TypeScript: '#3178c6',
    Vue: '#41b883',
    Zig: '#ec915c',
};

const UNKNOWN_LANGUAGE_COLOR = '#6c6860';

export function languageColor(language: string): string {
    return LANGUAGE_COLORS[language] ?? UNKNOWN_LANGUAGE_COLOR;
}

/** Org avatar, committed under public/logos so the list needs no third-party request. */
export function logoSrc(project: Pick<AgentsProject, 'slug'>): string {
    // Refresh previously cached GitHub placeholders in browsers and Next's image optimizer.
    const version = ['deno', 'bun', 'langflow', 'better-auth'].includes(project.slug) ? '?v=2' : '';
    return `/logos/${project.slug}.png${version}`;
}

/**
 * Facets for the index UI. Both derive from the entries rather than a hand list,
 * so adding a project with a new language surfaces its filter with no edit here.
 */
export function languageFacets(projects: Pick<AgentsProject, 'language'>[]): { value: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const project of projects) {
        counts.set(project.language, (counts.get(project.language) ?? 0) + 1);
    }
    return [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function patternFacets(projects: Pick<AgentsProject, 'patterns'>[]): { id: PatternId; name: string; count: number }[] {
    const counts = new Map<PatternId, number>();
    for (const project of projects) {
        for (const pattern of project.patterns) {
            counts.set(pattern, (counts.get(pattern) ?? 0) + 1);
        }
    }
    return PATTERNS.filter((pattern) => counts.has(pattern.id)).map((pattern) => ({
        id: pattern.id,
        name: pattern.name,
        count: counts.get(pattern.id) ?? 0,
    }));
}

/** Sort IDs remain stable for saved URLs; labels describe the underlying measurements. */
export type SortId = 'stars' | 'lines' | 'skills' | 'updated' | 'name';

export const SORTS: { id: SortId; label: string }[] = [
    { id: 'stars', label: 'Stars' },
    { id: 'lines', label: 'Lines' },
    { id: 'skills', label: 'Skill count' },
    { id: 'updated', label: 'Last modified' },
    { id: 'name', label: 'Name' },
];

export function compareProjects(a: ProjectListingEntry, b: ProjectListingEntry, sort: SortId, descending: boolean): number {
    const sign = descending ? -1 : 1;
    if (sort === 'name') {
        return sign * a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
    }
    if (sort === 'updated') {
        const time = (p: ProjectListingEntry) => Date.parse(p.lastCommit.date);
        return sign * (time(a) - time(b)) || b.stars - a.stars;
    }
    if (sort === 'skills') {
        if (a.skillCount === undefined || b.skillCount === undefined) {
            if (a.skillCount !== undefined) return -1;
            if (b.skillCount !== undefined) return 1;
            return b.stars - a.stars;
        }
        return sign * (a.skillCount - b.skillCount) || b.stars - a.stars;
    }
    const value = (p: ProjectListingEntry) => (sort === 'stars' ? p.stars : p.file.lines);
    // Stars break ties so equal-length files keep a stable, meaningful order.
    return sign * (value(a) - value(b)) || b.stars - a.stars;
}

/** Free-text match over the fields a reader would type: name, org, repo, and the prose. */
export function matchesQuery(project: ProjectListingEntry, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [project.name, project.owner, project.repo, project.tagline, project.hook, project.language].join(' ').toLowerCase().includes(q);
}
