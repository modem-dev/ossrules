# ossrules.md

A reference library that helps developers write better coding-agent instructions
by learning from real open source projects.

[Browse ossrules.md](https://ossrules.md?utm_source=github&utm_medium=oss&utm_campaign=oss_ossrules&utm_content=readme_browse) · Built by [Modem](https://modem.dev?utm_source=github&utm_medium=oss&utm_campaign=oss_ossrules&utm_content=readme_top)

## Explore the library

- Find `AGENTS.md` and `CLAUDE.md` examples by language and technique.
- Read original analysis alongside quotes linked to their exact source lines.
- Inspect pinned instruction files in Markdown or Raw view, compare files,
  and see token counts.
- Browse agent skills with their supporting documents and downloadable bundles.

Source snapshots and editorial analysis are tracked separately. Quotes preserve
upstream wording, and each reader links to the revision it displays.

## Run locally

Use Node.js 20.9+ and pnpm 10.13.1. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev --port 3001
```

Open [localhost:3001](http://localhost:3001). The committed corpus is ready to
browse; no database or environment file is required.

See the [development guide](docs/development.md) for alternate ports, production
previews, checks, and troubleshooting.

## Edit pattern content

All pattern pages use one template. Edit [the catalog](content/patterns/catalog.json)
for names, summaries, and explanations, and [the guides](content/patterns/guides.json)
for the three visual cues, application guidance, and selected example project slugs.
Both files are keyed by the same pattern IDs.

Examples reuse the matching techniques in `content/projects/*.json` and their
pinned source files. Quotes, line numbers, project counts, and links are resolved
automatically. The build checks selected examples against their pinned source;
there is no runtime content generation. Guide content stays on the server.

Run `pnpm lint`, `pnpm typecheck`, and `pnpm build` after content edits.

## Agent access

Start at [`/llms.txt`](https://ossrules.md/llms.txt) for a guide to the public,
read-only API. No authentication or browser JavaScript is required.

- `/api/v1/catalog`: small overview with counts, language facets, filters, and links.
- `/api/v1/projects?q=router&language=TypeScript&limit=5`: project summaries;
  also accepts a `pattern` ID. Follow each `apiUrl` for a project overview.
- `/api/v1/projects/{owner}/{repo}`: summary and revision metadata, with links
  to separate `?view=analysis`, `?view=instructions`, and `?view=skill-discovery` responses.
- `/api/v1/skills?q=review&limit=5`: skill summaries; optionally filter by
  `repository=owner/repo`. Follow `apiUrl` for one skill's full metadata and files.
- `/api/v1/projects/{owner}/{repo}/skills/{id}`: one skill, original file URLs,
  pinned source links, completeness, and available bundle download.
- `/api/v1/patterns`: short pattern summaries; follow `apiUrl` for a single
  guide with verified source excerpts and line numbers.

Project and skill lists default to 10 results (maximum `limit=50`). Follow
`nextUrl` until null to see all matches; `total` is the count before pagination.
`q` searches case-insensitive substrings; other filters are exact matches,
case-insensitive, combined with AND. Ordering is by repository, then skill ID.
No matches returns an empty list. Unknown, duplicate, or invalid list parameters
return JSON 400; missing resources return JSON 404. Summary previews may be
shortened, while individual detail responses preserve the full content.

These endpoints read the same committed corpus as the website and return JSON
with `version: 1`. Missing scans are `null`, and expanded inventories retain
missing, truncated, omitted, excluded, and invalid-source information.
Instruction and skill revisions can differ. Upstream content retains its
original licensing.

Run `pnpm check:agent-api` against a running server (default
`http://localhost:3001`; override with `BASE_URL`) to check discovery, source
bytes, corpus coverage, revision metadata, and pattern excerpt line numbers.

## Documentation

- [Development](docs/development.md): setup, running the server, and project layout.
- [Maintaining the corpus](docs/corpus.md): adding projects, syncing files and skills,
  and reviewing changed source.
- [Deployment and search discovery](docs/deployment.md): production URLs,
  redirects, indexing, and sitemap behavior.
- [Project guidance](AGENTS.md): design intentions and source accuracy requirements.

## License

Original project code and authored documentation are available under the
[MIT License](LICENSE). Copyright (c) 2026 Modem Labs Inc.

Bundled upstream files, excerpts, fonts, and third-party assets retain their own
terms; see [third-party licensing](THIRD_PARTY.md).

Instruction-file contributor snapshots can be refreshed with `pnpm sync:instruction-contributors` (requires authenticated `gh`). This reads file history at each entry’s pinned commit and preserves the previous snapshot if any request fails. Refresh after changing instruction paths or pinned commits; stale attribution is hidden until refreshed.
