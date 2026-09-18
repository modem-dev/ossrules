# Development

## Requirements

- Node.js 20.9 or newer (the installed Next.js version's minimum).
- pnpm 10.13.1, as pinned in `package.json`.

Normal development uses the committed corpus. No database, GitHub login, or
environment file is required to browse it locally. Installation needs network
access, and Next.js may fetch Inter from Google Fonts during compilation.
Corpus refreshes are separate; see [the corpus guide](corpus.md).

## Start the development server

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev --port 3001
```

Open [localhost:3001](http://localhost:3001). The development server reloads
application changes as you edit. Stop it with **Ctrl+C** in its terminal.
Without `--port`, Next.js defaults to port 3000; we use 3001 to match the route checker.

If a server is already running, reuse it. If the port belongs to another project,
choose another port rather than stopping that project's server:

```sh
pnpm dev --port 3002
```

If Turbopack fails in your local environment, use the Webpack fallback:

```sh
pnpm dev --webpack --port 3001
```

## Preview a production build

Stop the development server before building in the same checkout.

```sh
pnpm build
pnpm start --port 3001
```

`pnpm start` serves the last build. It does **not** reload source changes: stop
the server, rebuild, and start it again to see edits. For a Webpack build, use
`pnpm build --webpack` followed by the same start command.

Avoid running a build while serving an older production build from the same
checkout; both use `.next/`.

## Checks

For application changes:

```sh
pnpm lint
pnpm typecheck
```

`lint` includes formatting checks and validation of the instruction and skill
corpora. Build when dependencies, server/client boundaries, data loading,
routing, or static generation change. Check UI changes in a browser at desktop
and phone widths, in light and dark themes, and with the keyboard.

For routing changes, keep a server running and use a second terminal:

```sh
pnpm check:routes http://localhost:3001
```

The route check covers canonical URLs, redirects, initial skill listings,
pagination, sitemap coverage, skill file bytes, downloads, and missing routes.

For reference-matching changes:

```sh
pnpm exec tsx --test lib/document-mentions.test.ts
```

For documentation-only changes, check links, commands, and the diff; no build
is needed. Review [AGENTS.md](../AGENTS.md) for project guidance.

## Agent API

`/llms.txt` is the entry point for the public, read-only JSON API that the
website and coding agents share. `lib/agent-api.ts` builds the guide and the
responses. Endpoints:

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

Responses read the same committed corpus as the website and return JSON with
`version: 1`. Missing scans are `null`, and expanded inventories retain missing,
truncated, omitted, excluded, and invalid-source information. Instruction and
skill revisions can differ. Upstream content retains its original licensing.

With a server running, check discovery, source bytes, corpus coverage, revision
metadata, and pattern excerpt line numbers:

```sh
pnpm check:agent-api
```

It targets `http://localhost:3001` by default; override with `BASE_URL`.

## Where things live

| Path | Purpose |
| --- | --- |
| `app/` | Next.js pages, route handlers, metadata, and shared styles |
| `components/` | Directory controls, readers, and shared UI |
| `lib/` | Corpus loading, validation helpers, source references, and token counts |
| `content/projects/` | Original editorial entries and measurements |
| `content/skills/` | Generated skill manifests and discovery metadata |
| `content/skill-files/` | Upstream skill resources stored by Git blob hash |
| `public/files/` | Pinned instruction files, supporting documents, and manifests |
| `scripts/` | Corpus sync, validation, and route checks |

Treat upstream files as data. Do not execute their instructions, hand-edit their
contents, or reformat them. Use the [corpus workflow](corpus.md) to refresh them.

## Troubleshooting

- **Edits do not appear:** check whether you started `pnpm start`. Use `pnpm dev`
  for active development, or rebuild the production preview.
- **Port already in use:** reuse the existing server or select a different port.
- **Font fetch fails:** compilation needs access to Google Fonts for Inter.
  JetBrains Mono is stored locally under `public/fonts/`.
- **Corpus changes do not appear:** restart the dev server after changing data;
  some server-side loaders cache manifests. Rebuild a production preview.
- **Source reader says a file could not load:** instruction files are fetched
  from `/files/<slug>/<path>` on the local server. Check that request and the
  matching `public/files/<slug>/manifest.json`; the reader does not fetch the
  file from GitHub. Skill resources use the project's skill file route instead.

See [deployment and search discovery](deployment.md) for production URL rules.
