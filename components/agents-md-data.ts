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
 * file teaches you about one repo, but the same nine moves recur across all of
 * them, and that is what transfers to your own project.
 *
 * Order is roughly "easiest to adopt" first.
 */
export const PATTERNS: Pattern[] = [
    {
        id: 'hard-prohibition',
        name: 'Hard prohibitions',
        summary: 'A short list of actions the file states the agent must never take, without hedging.',
        detail: 'Stated as flat "never" rather than "prefer not to", and usually naming the exact action rather than a category. Several files pair the rule with what to do when a user asks anyway.',
    },
    {
        id: 'worked-examples',
        name: 'Good and bad pairs',
        summary: 'A style rule is shown with the wrong version beside the right one.',
        detail: 'Some files pair whole code blocks, others contrast inline within a sentence. The rule is stated once and then demonstrated twice, which removes the judgement call at the margins.',
    },
    {
        id: 'generated-file-guard',
        name: 'Generated file guards',
        summary: 'Generated files are named, along with the generator to run instead.',
        detail: 'The lists are explicit paths rather than a description of what generated files look like. Several entries also name the command and, in a few cases, the extra steps that have to happen in the same change, such as deleting a superseded fixture.',
    },
    {
        id: 'verification-matrix',
        name: 'Verification by change type',
        summary: 'The kind of change is mapped to the specific checks that cover it.',
        detail: 'A rendering change maps to one command, a protocol change to another. Several files also state what the default test command leaves out, which is otherwise discoverable only by finding the gap.',
    },
    {
        id: 'nested-instructions',
        name: 'Nested instruction files',
        summary: 'Per-package AGENTS.md files, with a stated order of precedence.',
        detail: 'The root file covers repository-wide navigation and defers subsystem detail to a file next to the code. Where the files could conflict, the precedence order is written down rather than left to the agent.',
    },
    {
        id: 'single-source',
        name: 'Pointing at the source of truth',
        summary: 'The file refuses to copy values that live somewhere authoritative.',
        detail: 'Version numbers, rule lists and counts are replaced with a pointer to the config, script or array that defines them. Some files state the reason directly: a copied value drifts from the thing it copied.',
    },
    {
        id: 'skill-routing',
        name: 'Router files',
        summary: 'The entry file dispatches to deeper task guides rather than containing them.',
        detail: 'A short index maps a kind of work to the guide to read before starting it. The deeper document is loaded when the task touches that subsystem, instead of on every request.',
    },
    {
        id: 'behavioral-conditioning',
        name: 'Behavioral framing',
        summary: 'Rules about how to approach the work rather than facts about the repository.',
        detail: 'Surface tradeoffs, do not over-build, touch only what was asked. Two files state outright that these sections were written from recurring mistakes in agent-authored changes to that repo.',
    },
    {
        id: 'house-vocabulary',
        name: 'House vocabulary',
        summary: 'Specific words the project does and does not use, defined once.',
        detail: 'Ranges from fixing the spelling of a domain term across all prose, to defining the difference between two near-synonyms, to listing individual words that may not appear. Naming drift is hard to catch in review, which is what these rules are aimed at.',
    },
    {
        id: 'architecture-narrative',
        name: 'Architecture as narrative',
        summary: 'How the system works, written out, rather than a list of rules about it.',
        detail: 'Request lifecycles, data flows and component boundaries. It lets the agent derive an answer for a case the file does not cover, at the cost of length.',
    },
    {
        id: 'ratchet',
        name: 'Ratchets',
        summary: 'Baselines that may only shrink and lists that may only grow.',
        detail: 'A known-violations file, a lint warning count, or a tombstone list, each with a direction of travel stated in the file and usually enforced in CI.',
    },
    {
        id: 'contribution-etiquette',
        name: 'Contribution etiquette',
        summary: "Rules for what the agent may open, push or post on the project's behalf.",
        detail: 'Covers pull requests, issues, @-mentions and commit trailers. Two of these files give the reason as agent traffic specifically: unsolicited pull requests, and issues that attract duplicate work from other agents.',
    },
    {
        id: 'scope-layering',
        name: 'Scope layering',
        summary: 'Different rules for different actors, with a test for which set applies.',
        detail: 'One file covers maintainers, external contributors and forks, and states how the agent determines which it is before the rules take effect.',
    },
    {
        id: 'context-budget',
        name: 'Context budgeting',
        summary: 'Rules governing what may enter the model context, with size caps.',
        detail: 'Appears in repos that build agents. The context window is treated as a resource with an owner, a cap per item, and a review threshold.',
    },
];

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
    title: string;
    body: string;
    /** Verbatim excerpt. Must appear in the real file, character for character. */
    quote?: string;
    pattern?: PatternId;
}

export interface AgentsProject {
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
    /** The one-line reason this file is in the collection. Shown on the card. */
    hook: string;
    /** Two or three sentences on what kind of document this is. */
    summary: string;
    /** The analysis: what this file does that others do not. */
    techniques: Technique[];
    /** Concrete things a reader can copy into their own repo today. */
    steal: string[];
    /** The file's own top-level sections, in order. */
    outline: string[];
    patterns: PatternId[];
}

/** GitHub URLs. Kept as helpers so a future host move does not scatter string building. */
export function repoUrl(project: AgentsProject): string {
    return `https://github.com/${project.owner}/${project.repo}`;
}

export function agentsFileUrl(project: AgentsProject): string {
    return `https://github.com/${project.owner}/${project.repo}/blob/${project.defaultBranch}/AGENTS.md`;
}

/** Permalink to the exact revision this entry was written against. */
export function agentsFileCommitUrl(project: AgentsProject): string {
    return repoFileUrl(project, 'AGENTS.md');
}

/** Any file in the repository, pinned to the commit this entry was measured at. */
export function repoFileUrl(project: AgentsProject, filePath: string): string {
    return `https://github.com/${project.owner}/${project.repo}/blob/${project.lastCommit.sha}/${filePath}`;
}

/**
 * True when the file changed upstream after this entry was written, which means
 * the measurements and analysis describe an older revision.
 */
export function isEntryStale(project: AgentsProject): boolean {
    return project.lastCommit.date.slice(0, 10) > project.evaluatedAt;
}

export function rawAgentsFileUrl(project: AgentsProject): string {
    return `https://raw.githubusercontent.com/${project.owner}/${project.repo}/${project.defaultBranch}/AGENTS.md`;
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

/** Org avatar, committed under public/agents-md so the list needs no third-party request. */
export function logoSrc(project: AgentsProject): string {
    return `/logos/${project.slug}.png`;
}

/**
 * Facets for the index UI. Both derive from the entries rather than a hand list,
 * so adding a project with a new language surfaces its filter with no edit here.
 */
export function languageFacets(projects: AgentsProject[]): { value: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const project of projects) {
        counts.set(project.language, (counts.get(project.language) ?? 0) + 1);
    }
    return [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function patternFacets(projects: AgentsProject[]): { id: PatternId; name: string; count: number }[] {
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

/**
 * Sort options offered by the index.
 *
 * Each one answers a different question a reader actually has: which projects
 * carry weight (stars), how much there is to read (lines), how prescriptive the
 * file is (rules), and where something is when you already know its name.
 * `direction` is the sensible default for that column, not a fixed convention.
 */
export type SortId = 'stars' | 'lines' | 'rules' | 'updated' | 'name';

export const SORTS: { id: SortId; label: string }[] = [
    { id: 'stars', label: 'Stars' },
    { id: 'lines', label: 'Lines' },
    { id: 'rules', label: 'Rules' },
    { id: 'updated', label: 'Updated' },
    { id: 'name', label: 'Name' },
];

export function compareProjects(a: AgentsProject, b: AgentsProject, sort: SortId, descending: boolean): number {
    const sign = descending ? -1 : 1;
    if (sort === 'name') {
        return sign * a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
    }
    if (sort === 'updated') {
        const time = (p: AgentsProject) => Date.parse(p.lastCommit.date);
        return sign * (time(a) - time(b)) || b.stars - a.stars;
    }
    const value = (p: AgentsProject) => (sort === 'stars' ? p.stars : sort === 'lines' ? p.file.lines : p.file.bullets);
    // Stars break ties so equal-length files keep a stable, meaningful order.
    return sign * (value(a) - value(b)) || b.stars - a.stars;
}

/** Free-text match over the fields a reader would type: name, org, repo, and the prose. */
export function matchesQuery(project: AgentsProject, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [project.name, project.owner, project.repo, project.tagline, project.hook, project.language].join(' ').toLowerCase().includes(q);
}
