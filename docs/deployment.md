# Deployment and search discovery

The production site runs on Vercel. Its application build command is `pnpm build`.
For a local production preview, see [development](development.md#preview-a-production-build).

## Rendering and navigation

Next.js Cache Components prerender project analysis, source excerpts, and token
counts together. Breadcrumbs, tabs, and Previous/Next links stream separately
and retain the requested collection. Keep these query reads inside their
Suspense boundaries so they do not block the analysis or prevent its static
content from being prefetched.

Directories and skill readers resolve the requested content on the server.
They deliberately omit loading-only Suspense fallbacks so navigation keeps the
current page visible until the next page is ready. Their `instant = false`
configuration permits these routes to block under Cache Components. Source
selection, filters, pagination, and their canonical/indexing rules still resolve
on the server. Download routes also run on request; the entire site is not static.

The production build should report project pages as partial prerenders (`◐`).
Use `pnpm check:routes` against a production preview to verify the complete
streamed HTML, query-dependent links, metadata, downloads, and missing routes.
Measure navigation using a production build; development does not exercise the
same prerendering and prefetch behavior.

## Project URLs

Project pages mirror GitHub: `https://ossrules.md/freshframework/fresh`.
Skills live at `/<owner>/<repo>/skills`, with each skill reader and its downloads
under that path. Only indexed projects resolve. Legacy short project URLs
redirect permanently, preserving query parameters; real repository paths take
precedence over conflicting legacy skill aliases. Internal corpus slugs and
vendored file paths remain stable.

Project directory links preserve `q`, `language`, `technique`, `sort`, and
`direction`. Project breadcrumbs and Previous/Next retain that collection;
direct visits use the default directory order. Filtered homepages render their
requested results on the server and use `noindex, follow` with `/` as canonical.

Instruction source links use `source`, `rev`, `view`, and optional one-based
`line`/`end` parameters. The reader restores these on reload and browser history
navigation. A link to a different stored revision shows a notice instead of
applying old line numbers to new text. Reader parameters do not change the
project page's canonical URL.

Run `pnpm check:routes` against the dev server on port 3001, or pass another
origin (for example `pnpm check:routes http://localhost:3002`) to verify canonical
URLs, old links, file bytes, and bundle downloads after routing changes.

## Search discovery

The canonical origin is **https://ossrules.md**. In Vercel's project Domains
settings, connect `ossrules.md` to Production and redirect `www.ossrules.md` to
`ossrules.md` permanently. Remove any apex-to-www redirect before enabling the
reverse direction; application metadata cannot override a hosting redirect.

`/sitemap.xml` derives project pages, nonempty project skill indexes, and skill
readers from the stored corpus. `/robots.txt` allows crawling and advertises that
sitemap. Scan and upstream commit dates are not used as page modification dates.

Skill lists render the requested page on the server. Unfiltered numbered pages
have their own canonical URLs; filtered/search results and empty project skill
indexes use `noindex, follow`. Invalid page numbers normalize to page 1, and
out-of-range page numbers normalize to the last page, in both content and
canonical metadata. `pnpm check:routes` checks the initial HTML across every
listing page, canonical normalization, indexing policy, and sitemap coverage.
