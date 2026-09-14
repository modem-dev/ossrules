/** URL for the dynamic OG image route, used in page metadata. */
export function ogImageUrl(title: string): string {
    return `/og?${new URLSearchParams({ title }).toString()}`;
}
