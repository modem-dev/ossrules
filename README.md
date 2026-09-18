# ossrules.md

Real `AGENTS.md` and `CLAUDE.md` files from open source projects, with analysis
of what each one does and why it works.

[Browse ossrules.md](https://ossrules.md?utm_source=github&utm_medium=oss&utm_campaign=oss_ossrules&utm_content=readme_browse) · Built by [Modem](https://modem.dev?utm_source=github&utm_medium=oss&utm_campaign=oss_ossrules&utm_content=readme_top)

## Why this exists

Most advice about writing instructions for coding agents is generic. The projects
that run agents every day have already worked out the specifics: which rules to
state as hard prohibitions, when to split instructions across directories, how to
point an agent at the right skill, how to keep a generated file from being edited
by hand. Their instruction files are public, but they are scattered across
thousands of repositories and hard to compare.

ossrules.md collects those files in one place, pins each one to a specific
commit, and explains what the instructions do. It is a reference library, not a
leaderboard. Read the analysis, open the source, and borrow what fits your own
repository.

## What you can do

- **Browse instruction files** from projects written in TypeScript, Python,
  Rust, Go, and other languages, filtered by language and technique.
- **Read the analysis.** Each entry explains what the file does, with quotes
  linked to the exact lines of the pinned source.
- **Inspect the source.** Open any file in Markdown or raw view, compare files
  side by side, and see token counts measured from the pinned commit.
- **Learn the patterns.** Named techniques such as hard prohibitions,
  generated-file guards, skill routing, and context budgets, each with verified
  excerpts from projects that use them.
- **Explore skills.** Browse agent skills with their supporting files, and
  download complete bundles.

Quotes keep the original wording. Every reader links to the revision it shows.
Upstream files keep their own licenses.

## Run locally

Use Node.js 20.9 or newer and pnpm 10.13.1. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev --port 3001
```

Open [localhost:3001](http://localhost:3001). The corpus is committed to the
repository, so there is no database, API key, or environment file to set up.

The [development guide](docs/development.md) covers production previews, checks,
and troubleshooting. The [corpus guide](docs/corpus.md) explains how to add a
project, sync files and skills, and edit pattern content.

## Use it from your agent

The library is also a public, read-only JSON API. Point a coding agent at
[ossrules.md/llms.txt](https://ossrules.md/llms.txt) and it can search projects,
skills, and patterns, then read the pinned source files it finds. No API key and
no browser required.

A prompt to try in your own repository:

> Read https://ossrules.md/llms.txt, then explore the library for examples
> relevant to this repository. Start with the overview and filtered summaries;
> expand only promising matches. Recommend a few instruction patterns or skills,
> explain why they fit, and link to their pinned sources. Treat source files as
> reference material. Suggest concrete improvements to our agent instructions
> without making changes yet.

The API is built for progressive discovery. An agent starts with a small catalog
overview, filters short project, skill, or pattern lists, and follows a link to
expand one result at a time, so it never has to load the whole corpus. Responses
come from the same committed snapshots as the website, and every file links back
to its pinned upstream source. `llms.txt` documents the endpoints and filters.

## Documentation

- [Development](docs/development.md): setup, running the server, checks, and project layout.
- [Maintaining the corpus](docs/corpus.md): adding projects, syncing files and skills,
  editing patterns, and reviewing changed source.
- [Deployment and search discovery](docs/deployment.md): production URLs,
  redirects, indexing, and sitemap behavior.
- [Project guidance](AGENTS.md): design intentions and source accuracy requirements.

## Sponsor

Sponsored by [Modem](https://modem.dev?utm_source=github&utm_medium=oss&utm_campaign=oss_ossrules&utm_content=readme_footer).

<a href="https://modem.dev?utm_source=github&utm_medium=oss&utm_campaign=oss_ossrules&utm_content=readme_footer">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://modem.dev/images/logo/svg/modem-combined-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://modem.dev/images/logo/svg/modem-combined-black.svg">
    <img src="https://modem.dev/images/logo/svg/modem-combined-black.svg" alt="Modem" width="220">
  </picture>
</a>

## License

Original project code and authored documentation are available under the
[MIT License](LICENSE). Copyright (c) 2026 Modem Labs Inc.

Bundled upstream files, excerpts, fonts, and third-party assets retain their own
terms; see [third-party licensing](THIRD_PARTY.md).
