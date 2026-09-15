import type { SkillEntry } from '@/components/skill-explorer';

export type SkillSearchParams = Record<string, string | string[] | undefined>;
export const SKILL_PAGE_SIZE = 50;

/** Match URLSearchParams.get: repeated parameters use their first value. */
export function skillSearchString(params: SkillSearchParams): string {
    const search = new URLSearchParams();
    for (const key of ['q', 'project', 'resources', 'page']) {
        const value = params[key];
        const first = Array.isArray(value) ? value[0] : value;
        if (first) search.set(key, first);
    }
    return search.toString();
}

/** Shared by initial HTML, client navigation, and canonical metadata. */
export function skillListing(entries: SkillEntry[], search = '', projectOnly = false) {
    const params = new URLSearchParams(search);
    const query = params.get('q') ?? '';
    const project = projectOnly ? 'all' : (params.get('project') ?? 'all');
    const resources = params.get('resources') === '1';
    const visible = entries.filter(
        (entry) =>
            (project === 'all' || entry.project.slug === project) &&
            (!resources || entry.files > 1) &&
            `${entry.name} ${entry.description} ${entry.path} ${entry.project.name} ${entry.project.repository}`
                .toLowerCase()
                .includes(query.trim().toLowerCase()),
    );
    const pageCount = Math.max(1, Math.ceil(visible.length / SKILL_PAGE_SIZE));
    const requestedPage = Number(params.get('page') ?? 1);
    const page = Math.min(pageCount, Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
    const start = (page - 1) * SKILL_PAGE_SIZE;
    const canonicalParams = new URLSearchParams();
    if (query.trim()) canonicalParams.set('q', query.trim());
    if (project !== 'all') canonicalParams.set('project', project);
    if (resources) canonicalParams.set('resources', '1');
    const filtered = canonicalParams.size > 0;
    if (page > 1) canonicalParams.set('page', String(page));
    return {
        query,
        project,
        resources,
        visible,
        pageCount,
        page,
        start,
        pageEntries: visible.slice(start, start + SKILL_PAGE_SIZE),
        canonicalSearch: canonicalParams.toString(),
        noindex: filtered || entries.length === 0,
    };
}

export function skillListingMetadata(baseHref: string, entries: SkillEntry[], search: string, projectOnly = false) {
    const { canonicalSearch, noindex } = skillListing(entries, search, projectOnly);
    return {
        alternates: { canonical: `${baseHref}${canonicalSearch ? `?${canonicalSearch}` : ''}` },
        robots: { index: !noindex, follow: true },
    };
}
