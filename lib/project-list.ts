import {
    compareProjects,
    matchesQuery,
    PATTERNS_BY_ID,
    type PatternId,
    type AgentsProject,
    SORTS,
    type SortId,
} from '@/components/agents-md-data';

export type ProjectSearchParams = Record<string, string | string[] | undefined>;
export const PROJECT_QUERY_KEYS = ['q', 'language', 'technique', 'sort', 'direction'] as const;

export function projectSearchString(params: ProjectSearchParams) {
    const search = new URLSearchParams();
    for (const key of PROJECT_QUERY_KEYS) {
        const value = params[key];
        const first = Array.isArray(value) ? value[0] : value;
        if (first) search.set(key, first);
    }
    return search.toString();
}

export function projectListing<T extends AgentsProject>(projects: T[], search = '') {
    const params = new URLSearchParams(search);
    const query = params.get('q') ?? '';
    const requestedLanguage = params.get('language');
    const language = requestedLanguage && projects.some((project) => project.language === requestedLanguage) ? requestedLanguage : 'all';
    const requestedPattern = params.get('technique');
    const pattern: PatternId | 'all' =
        requestedPattern && Object.hasOwn(PATTERNS_BY_ID, requestedPattern) ? (requestedPattern as PatternId) : 'all';
    const sort = SORTS.some((item) => item.id === params.get('sort')) ? (params.get('sort') as SortId) : 'stars';
    const defaultDescending = sort !== 'name' && sort !== 'lines';
    const direction = params.get('direction');
    const descending = direction === 'asc' ? false : direction === 'desc' ? true : defaultDescending;
    const canonical = new URLSearchParams();
    if (query.trim()) canonical.set('q', query.trim());
    if (language !== 'all') canonical.set('language', language);
    if (pattern !== 'all') canonical.set('technique', pattern);
    if (sort !== 'stars') canonical.set('sort', sort);
    if (descending !== defaultDescending) canonical.set('direction', descending ? 'desc' : 'asc');
    const visible = projects
        .filter((project) => matchesQuery(project, query))
        .filter((project) => language === 'all' || project.language === language)
        .filter((project) => pattern === 'all' || project.patterns.includes(pattern))
        .sort((a, b) => compareProjects(a, b, sort, descending));
    return {
        query,
        language,
        pattern,
        sort,
        descending,
        visible,
        canonicalSearch: canonical.toString(),
        filtered: !!query.trim() || language !== 'all' || pattern !== 'all',
    };
}

export function withProjectSearch(href: string, search: string) {
    return search ? `${href}?${search}` : href;
}

export function projectNeighbors<T extends AgentsProject>(projects: T[], slug: string, search = '') {
    const listing = projectListing(projects, search);
    const inCollection = listing.visible.some((project) => project.slug === slug);
    const ordered = inCollection ? listing.visible : projectListing(projects).visible;
    const index = ordered.findIndex((project) => project.slug === slug);
    return {
        search: inCollection ? listing.canonicalSearch : '',
        previous: index >= 0 && ordered.length > 1 ? ordered[(index - 1 + ordered.length) % ordered.length] : undefined,
        next: index >= 0 && ordered.length > 1 ? ordered[(index + 1) % ordered.length] : undefined,
    };
}
