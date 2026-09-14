import type { CollectionPage, WebPage, WithContext } from 'schema-dts';

export const SITE_URL = 'https://ossrules.md';
export const SITE_NAME = 'OSS Rules';

export function webPageSchema(page: { title: string; description: string; path: string }): WithContext<WebPage> {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: page.title,
        description: page.description,
        url: `${SITE_URL}${page.path}`,
        publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    };
}

/**
 * CollectionPage schema for index pages that list other pages. The nested
 * ItemList is what tells a crawler the page is a directory over the listed URLs
 * rather than an article that happens to contain links.
 */
export function collectionPageSchema(page: {
    title: string;
    description: string;
    path: string;
    items: { name: string; path: string }[];
}): WithContext<CollectionPage> {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: page.title,
        description: page.description,
        url: `${SITE_URL}${page.path}`,
        publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: page.items.length,
            itemListElement: page.items.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                url: `${SITE_URL}${item.path}`,
            })),
        },
    };
}
