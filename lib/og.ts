/** A label selects the skill layout, with project context above the title. */
export function ogImageUrl(title: string, projectSlug?: string, label?: string): string {
    const params = new URLSearchParams({ title });
    if (projectSlug) params.set('project', projectSlug);
    if (label) params.set('label', label);
    return `/og?${params.toString()}`;
}
