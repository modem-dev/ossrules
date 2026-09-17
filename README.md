# ossrules.md

A reference library that helps developers write better coding-agent instructions
by learning from real open source projects.

[Browse ossrules.md](https://ossrules.md) · Built by [Modem](https://modem.dev)

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
