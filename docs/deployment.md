# Deployment and search discovery

The production site runs on Vercel. Its application build command is `pnpm build`.
For a local production preview, see [development](development.md#preview-a-production-build).

## Project URLs

Project pages mirror GitHub: `https://ossrules.md/freshframework/fresh`.
Skills live at `/<owner>/<repo>/skills`, with each skill reader and its downloads
under that path. Only indexed projects resolve. Legacy short project URLs
redirect permanently, preserving query parameters; real repository paths take
precedence over conflicting legacy skill aliases. Internal corpus slugs and
vendored file paths remain stable.

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
