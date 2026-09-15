# Search and AI discovery audit

Audited September 15, 2026. Repository: `main` at `a7d17c8` after a successful
`git pull --ff-only origin main`. Live HTTP responses and one hydrated browser
session were checked separately; the production deployment SHA was not verified.

## Recommendation

Make the existing library reliably discoverable, then turn its original analysis
into focused pages that answer questions about writing agent instructions.
The strongest asset is the connection between an explanation, a verbatim example,
and its pinned upstream source.

The current dataset contains **50 projects, 14 editorial patterns, and 749 skills**
across 43 projects with nonempty skill snapshots. These are stored corpus totals,
not counts of all open-source projects or a measure of quality.

SEO makes these pages discoverable in search. AEO makes the answers easy to
extract and attribute. GEO aims to have those answers cited by generative search.
Much of the work overlaps: Google explicitly says its AI search features use
existing SEO fundamentals and do not require special AI markup or text files.
[Google's AI search guidance](https://developers.google.com/search/docs/appearance/ai-features)

## 1. Fix discovery first

| Priority | Finding | Evidence | Recommended change |
| --- | --- | --- | --- |
| P1 | Redirects and canonical tags disagree about the hostname | `https://ossrules.md/` returns 308 to `https://www.ossrules.md/`; the destination declares `https://ossrules.md` canonical. The sampled project and skills pages do the same. | Keep `https://ossrules.md` as requested. Reverse the hosting redirect so www points to the apex. Use the apex for canonical tags, schema, social images, and sitemap URLs. |
| P1 | Skill pagination repeats page 1 in initial HTML | `/skills` and `/skills?page=2` each expose the same 50 internal skill links. OpenClaw's project skills listing behaves identically. | Resolve pagination on the server and render the requested slice with real next/previous links. Give each unfiltered page its own canonical URL. |
| P1 | No published sitemap | `/sitemap.xml` returns 404; no sitemap implementation exists in the repo. | Generate from the same project and skill loaders as the site. Include canonical editorial pages, useful project skill indexes, and skill readers. |
| P2 | No explicit crawler policy or sitemap advertisement | `/robots.txt` returns 404; no robots implementation exists in the repo. | Add a permissive robots response with the canonical sitemap URL. A missing robots file is not itself a crawl block. |
| P2 | Empty skill indexes are indexable | Seven snapshots contain no skills. `/freshframework/fresh/skills` returns 200 with no `noindex`. | Keep the useful empty-state explanation for readers, add `noindex`, and omit empty indexes from the sitemap. |
| P2 | Skill metadata is incomplete | Project skill indexes inherit the generic site description. Sampled global, project, and individual skill pages have no OG image. Skill routes do not emit JSON-LD. | Add accurate descriptions, social previews, and structured data where it describes visible content. |

### Pagination is the largest measurable gap

The hydrated browser correctly shows **51–100 of 749**, page 2 of 15, at
`/skills?page=2`. This is specifically an initial HTML and canonicalization issue,
not a claim that pagination is broken for ordinary JavaScript-enabled browsing.

[SkillExplorer](../components/skill-explorer.tsx) reads URL parameters on the client.
Its prerendered fallback receives no search parameters and defaults to page 1.
Both the [global skills route](../app/skills/page.tsx) and
[project skills route](../app/[owner]/[repo]/skills/page.tsx) publish a canonical
without the page parameter.

Using the exact current ordering rules, the union of the global first 50 skills
and each project's first 50 skills covers **530 of 749 skills**. The remaining
**219** have no link from those initial directory listings. This is not an
indexation count: links inside skill documents, external links, and JavaScript
rendering may expose additional pages.

The three project lists requiring pagination contain 209 skills (Hermes Agent),
122 (OpenClaw), and 52 (Paperclip).

Acceptance criteria:

- A plain HTTP fetch of `?page=2` contains the actual second set of 50 skill links.
- Following HTML pagination links reaches all 749 skills across the global list.
- Each unfiltered pagination URL has a matching canonical; normalize page 1 to
  the base URL and handle invalid/out-of-range values consistently.
- Search and arbitrary filter combinations get an explicit indexing policy;
  do not expose every query combination as a landing page.
- Client navigation, back/forward, filtering, focus behavior, and no-JavaScript
  navigation remain useful.

Google recommends distinct pagination URLs, crawlable anchors, and a separate
canonical for each page in a sequence.
[Pagination guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)

### Canonical and sitemap implementation

Centralize the origin currently duplicated in [layout metadata](../app/layout.tsx)
and [schema helpers](../lib/schema.ts). Reuse the existing
[project URL helpers](../lib/project-paths.ts). Preserve the permanent legacy
redirects in [Next configuration](../next.config.mjs).

Add `app/sitemap.ts` and `app/robots.ts`. Sitemap entries should resolve directly
to indexable 200 pages. Exclude empty indexes, downloads, arbitrary filters,
raw-file variants, redirects, and errors. Incomplete bundles may still have
useful skill reader pages: do not exclude them automatically when their content
and omission notices are informative.

Use `lastmod` only when a meaningful page change can be established. The upstream
file commit date, skill scan time, editorial review date, and deployment time
are different events. Omit the field when the existing data cannot accurately
describe a page modification. Do not set every URL to the build time.

Validate host normalization, mixed-case repository paths, and legacy URLs along
with new metadata. Existing case-insensitive repository lookup can resolve URL
variants; canonical tags should consistently identify the stored identity.
Consistent redirect and canonical signals help search engines select the intended
URL. [Canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

## 2. Build pages around questions the corpus can answer

The current navigation organizes material by project, skill, or one long
`/agent-rules` page. That works for browsing. It provides fewer dedicated landing
pages for someone researching a particular instruction-writing problem.

These query targets are editorial hypotheses, not measured search-volume estimates.
Validate them with Search Console data as the pages begin receiving impressions.

| Surface | Search intent | Evidence already available | Proposed treatment |
| --- | --- | --- | --- |
| Home | AGENTS.md examples; CLAUDE.md examples; agent instruction examples | 50 project analyses | Use these recognizable file names in the title and introductory copy. Keep the existing two-column directory. |
| `/agent-rules/<pattern>` | How to scope agent instructions; how to choose tests by change type; how to prevent edits to generated files | 14 classified patterns with project-level analysis | Give each sufficiently supported technique a dedicated explanation and several pinned examples. Preserve existing fragment links on the overview. |
| `/examples/typescript`, `/examples/rust`, `/examples/python` | AGENTS.md examples for a language or stack | 29 TypeScript, 8 Rust, 5 Python projects | Curate a small number of contrasting examples with original explanations. Language labels alone do not establish framework compatibility. |
| `/guides/agents-md-vs-skills` | What belongs in AGENTS.md versus SKILL.md? | Separate instruction and skill snapshots; reference detection | Explain the distinction using verified examples. Do not imply an instruction file references every discovered skill. |
| `/skills/topics/code-review` and similar | Agent skills for code review, testing, releases, or documentation | 749 skills and their bundles | Start with a few reviewed topic collections. Add useful comparison criteria and source links. |
| `/research/agent-instructions` | How do real projects structure agent instructions? | Pattern labels, source sizes, tokens, dates | Publish reproducible findings with denominators, methodology, exclusions, and links to supporting entries. |

These are proposed new routes, not existing URLs. Start with three technique
pages and one guide; avoid generating every language × framework × pattern
combination. A new page should answer a distinct question with more value than
a filtered list.

### First editorial batch

1. **Verification by change type.** Thirty of the 50 project entries carry this
   label. Explain how projects map a change to specific checks, with three
   contrasting quoted examples.
2. **Nested instruction files.** Six entries carry this label. Explain local
   scope using their actual source. Tool-specific precedence claims need separate
   current documentation; a repository's convention is not a universal rule.
3. **Generated file guards.** Eight entries carry this label. Show how instructions
   point to the generator and when that is useful.
4. **AGENTS.md versus skills.** Use the site's existing distinction between
   reviewed instructions and independently discovered skills. Cover source
   references, bundled resources, and the limits of adopting another project's
   workflow.

For each page, use a descriptive heading, a short direct answer, concrete
examples, conditions where the technique fits, and links to the full analyses.
Keep the strongest explanation visible in the initial HTML. Do not add filler
to reach an arbitrary word count.

The `/agent-rules` page already has useful summaries and anchors. Dedicated
pages add space for source-grounded comparison; the current overview should
remain a compact entry point.

### Improve existing project pages

Preserve the current analysis, quotations, takeaways, and provenance. The
[project page](../app/[owner]/[repo]/page.tsx) already renders that material on the
server. Full raw files being loaded on demand is not a reason to inline every
vendored document.

Add stable anchors to individual technique examples and an easy way to copy a
citation containing the analysis URL, upstream commit, path, and actual line
range. Current source buttons open a client-side tray; they do not provide a
durable public URL for that exact explanatory passage. Keep the tray while
making each explanation independently linkable.

Add a few related projects based on shared techniques or relevant implementation
context. The current previous/next links follow the star-sorted directory, which
does not necessarily connect examples useful for the same question.

Use headings and introductions that identify the subject explicitly, such as
“Fresh's AGENTS.md”, while retaining the project identity and visual hierarchy.
“What makes it useful” can remain a section label; the answer around it should
stand on its own when quoted.

## 3. Make attribution and originality clear

### Editorial provenance

Add an About/Methodology page covering who maintains the library, how entries are
selected and reviewed, how quotations are checked, what measurements mean, how
skills are discovered, and how corrections can be submitted. Link it from the
footer and relevant provenance sections.

Use real reviewer attribution when available. Do not invent author names or
reinterpret upstream skill contributors as authors of ossrules analysis. Keep
“analysis written”, “source changed”, and “skills scanned” distinct.

### Structured data

The existing `WebPage` and `CollectionPage` JSON-LD are a useful starting point.
Extend them to reflect the visible site:

- A consistent `WebSite` identity and publisher relationship to Modem.
- `BreadcrumbList` matching actual navigation.
- `CollectionPage` and `ItemList` for indexable skill and topic collections,
  accurately describing the displayed list.
- `Article` for original editorial analysis where appropriate, with genuine
  authorship and editorial dates, and links to the referenced upstream work.
- Suitable `CreativeWork` information for upstream skills without claiming
  ossrules authored them or owns their licenses.

Structured data is descriptive infrastructure; adding types does not guarantee
rankings, rich results, or AI citations. Match visible text and escape `<` in the
[JSON-LD serializer](../components/json-ld.tsx) before passing third-party metadata
through it.

### Original findings worth citing

A modest corpus study is a better use of the dataset than more generic advice.
For example: “30 of 50 reviewed projects are tagged with verification by change
type” is supported by the current labels. It is not evidence that 60% of all
open-source projects use that technique, or that it improves agent performance.

Show the sample, labeling method, analysis dates, and counterexamples. Derive
token distributions from pinned source with `o200k_base`. Publish an accessible
table and downloadable derived measurements alongside the explanation. Consider
`Dataset` markup only when an actual documented dataset is published.

Publish smaller case studies through Modem and offer useful resources to relevant
maintainers and documentation communities. Link back to the specific evidence.
This is a distribution proposal; no outreach or posting was performed.

## 4. AI crawler access

Check actual hosting and firewall logs for Googlebot, Bingbot, OAI-SearchBot,
and Claude-SearchBot. Successful ordinary HTTP requests do not establish that
verified bot traffic passes hosting controls.

OpenAI documents OAI-SearchBot as the crawler for ChatGPT search. Its setting is
independent from GPTBot's training permission. Support user-directed retrieval
too, but do not treat ChatGPT-User as the search indexing crawler.
[OpenAI crawler documentation](https://developers.openai.com/api/docs/bots)

Anthropic similarly distinguishes search, user-directed retrieval, and training
crawlers. [Anthropic crawler documentation](https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)

Keep search access deliberate without changing training preferences as an SEO
tactic. An optional generated `llms.txt` or Markdown export can help direct agent
consumption, but should follow the canonical HTML, pagination, and content work.
There is no established ranking uplift assumed for those exports.

## 5. Page delivery and measurement

The live `/skills` response was **857,643 bytes** of HTML, before HTTP compression.
It renders 50 entries while passing all 749 entries to the client. The project
directory response was 331,708 bytes. These are payload measurements, not Core
Web Vitals scores or measured mobile transfer sizes.

With server pagination, send only the requested page plus compact filter data.
Preserve responsive controls and interactive search. Measure mobile loading and
interaction before pursuing unrelated visual or infrastructure changes.

No analytics integration was found in application source. Hosting analytics,
Search Console, and Bing Webmaster Tools configuration were not available in
this audit, so existing account setup and traffic remain unknown.

Track three distinct outcomes:

| Outcome | Measurement |
| --- | --- |
| Search discovery | Submitted versus indexed canonical URLs, Google-selected canonicals, non-brand impressions and clicks by page/query group |
| AI citations | Bing AI Performance cited pages and grounding queries; a small repeatable set of manual answer checks with dates, sources, and product names |
| Reader value | Source opens, source copies, skill downloads, repeat visits, and Modem CTA clicks attributed to landing page and referrer |

Google includes its AI features in the Search Console Web reporting rather than
providing a clean standalone AI traffic total. Bing offers an AI Performance
report for supported Microsoft and partner experiences; it is not a universal
measurement of all AI systems.
[Google reporting guidance](https://developers.google.com/search/docs/appearance/ai-features),
[Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview)

Establish a baseline, then compare 28-day periods and page cohorts after recrawling.
Use any manual prompt panel as a directional sample, not a stable “GEO score”.
Search demand, index coverage, and conversion data should determine the second
editorial batch.

## Delivery order

1. **Discovery repair:** Align hostname signals; server-render pagination;
   publish sitemap and robots; set empty-index and query-variant policies.
2. **Metadata and attribution:** Complete skill metadata, breadcrumbs, citation
   anchors, and About/Methodology. Keep content and schema consistent.
3. **Editorial pilot:** Publish the three technique guides and the instructions
   versus skills guide. Add contextual links from existing pages.
4. **Expand from evidence:** Use query and citation data to choose language/task
   collections and a first corpus study. Add distribution and outcome tracking.

For implementation, run `pnpm lint`, `pnpm typecheck`, and `pnpm build`; extend
`pnpm check:routes` with metadata, pagination, robots, and sitemap checks.
Verify initial HTML as well as hydrated navigation, plus narrow layouts and
both themes when UI changes. Sitemap coverage should be derived from the corpus,
not asserted against a permanently hard-coded total.

## Audit limits and reproducibility

This pass inspected application routes, metadata, schema, directory components,
URL helpers, download behavior, and corpus manifests. Live checks covered the
home page, global skill pages 1 and 2, a project analysis, OpenClaw skill pages
1 and 2, a Next.js skill reader, an empty skill index, robots, sitemap, and an
invalid project URL. Invalid routes correctly returned 404 with `noindex`.

The initial HTML checks parsed actual `<a>`, `<meta>`, `<link>`, and JSON-LD
elements, excluding links serialized inside scripts. The browser confirmed that
the global second page changes correctly after hydration. The 219-skill finding
is derived from stored manifests and listing order, not a full crawl of every
skill's internal references.

No Search Console account, ranking history, backlink inventory, real bot logs,
or field performance data was inspected. Those omissions limit traffic forecasts
and claims about actual indexation; they do not change the reproduced routing
and HTML findings. This deliverable is an audit and implementation plan. No
application behavior, deployment settings, or upstream corpus files were changed
during the initial audit.

### Implementation follow-up

The requested discovery changes are implemented on `codex/search-discovery`:
server-rendered skill pagination, per-page canonical URLs on `ossrules.md`, a
generated sitemap, and a permissive robots policy. Search/filter variants and
empty project skill indexes are marked `noindex, follow`. The route checks cover
all 749 skills through initial HTML listings and 845 sitemap URLs in this snapshot.
The client retains interactive filtering and pagination.

The production build, lint, typecheck, and route checks pass. The build reports
a broad file-tracing warning for the existing skill-file loader. Vercel access
requires a login, so the live apex-to-www redirect still needs to be reversed
in the hosting settings. The README records the required domain configuration.
