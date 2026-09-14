/** Renders a JSON-LD structured data block. */

import type { Thing, WithContext } from 'schema-dts';

export function JsonLd({ data }: { data: WithContext<Thing> }) {
    return (
        // biome-ignore lint/security/noDangerouslySetInnerHtml: required for JSON-LD structured data
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
    );
}
