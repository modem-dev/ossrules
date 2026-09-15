# ossrules.md

A reference library of agent instructions and skills from open source projects,
with editorial analysis of `AGENTS.md` and `CLAUDE.md`, original source, and bundled skill resources.

Live at **[ossrules.md](https://ossrules.md)**. Built by [Modem](https://modem.dev).

## What it is

The main surfaces, all generated from the corpus in `content/projects/`:

- **`/`** — the directory. Sortable by stars, lines, rule count, last change and
  name; filterable by language and technique.
- **`/agent-rules`** — the recurring moves across the corpus, and which projects
  use each one.
- **`/<owner>/<repo>`** — one page per project: its instruction files and referenced documents,
  the file's measurements pinned to a commit, the techniques in it with verbatim
  quotes, and takeaways.

Instruction files and referenced documents open in a tray without leaving the page,
and a technique's quote opens the file at the line it came from. Symlinks open
their resolved source; imports and identical files are labeled separately. The
reader includes per-file token counts and a side-by-side comparison.

Entries default to analyzing `AGENTS.md`; set `instructionFile: "CLAUDE.md"` to
analyze that source instead. Nested entry points such as
`instructionFile: ".agents/AGENTS.md"` retain their actual repository path in
source links, previews, and measurements. Check agent folders as well as the
repository root when adding candidates. All instruction discovery and link resolution use
the analysis commit. Skills retain their independent discovery snapshot.

## Adding a project

Entries are one JSON file per project. The procedure is in
[`.claude/skills/agents-md-entry/SKILL.md`](.claude/skills/agents-md-entry/SKILL.md)
— it covers which branch is canonical, how to record the upstream commit, what to
measure, how to quote, and the voice. Follow it and the checks below will pass.

**Every quote must be verbatim.** That is the rule the collection rests on; the
skill puts it above all the others.

```bash
pnpm install
pnpm dev                       # http://localhost:3000

pnpm sync:files -- --slug foo  # download the files a new entry reads
pnpm lint                      # biome + corpus validation
pnpm typecheck
pnpm build
```

## How the content stays honest

| Command | Does |
|---|---|
| `pnpm sync:files` | Downloads every file an entry reads, pinned to its `lastCommit.sha`, into `public/files/`. `--slug x` for one project, `--check` to verify without writing. |
| `pnpm refresh` | Re-measures each file against upstream and names entries whose source has changed since it was read. `--write` applies the mechanical updates and re-runs the sync. |
| `pnpm validate` | Schema, slug/filename agreement, avatar present, no duplicate repo, and that every vendored copy is present and from the commit its entry pins. Offline; runs as part of `pnpm lint`. |

Entries go stale two ways and only one is mechanical. Measurements and commits a
script can re-derive; when the file itself has changed, the analysis describes a
revision that no longer exists and that entry has to be re-read. `pnpm refresh`
reports those separately.

## Third-party content

`public/files/` holds copies of other projects' documentation, stored at the
commit each entry was measured against so the page and the file cannot disagree.
Each project's license is recorded in its `manifest.json` and shown wherever its
files are displayed. That directory is excluded from Biome — reformatting it
would break the verbatim quotes.

To remove a project's files, open an issue and we will take the entry down.
## Skills

Skills are discovered independently from the editorial AGENTS.md corpus. Run
`pnpm sync:skills` (or `pnpm sync:skills --slug storybook`) with an authenticated
GitHub CLI to scan tracked `SKILL.md` files at each repository's current default
branch. Existing instruction analysis and its pinned files remain unchanged.

Generated manifests in `content/skills/` record the repository snapshot, scan
scope, excluded fixtures, invalid metadata, bundled files, and omissions.
Original bytes are stored by Git blob hash in `content/skill-files/`. These are
third-party data, never instructions for maintaining this site; do not hand-edit
or execute them. Validate the stored corpus with `pnpm check:skills`.

Discovery excludes test, fixture, dependency, and vendored directories. Symlinks
and submodules are reported rather than followed. Files over 1 MiB and bundles
over 10 MiB or 250 files are marked incomplete. Failed or truncated repository
scans retain the previous manifest. A complete bundle download is offered only
when every bundle file is present; external references remain external. Metadata
comes from upstream YAML; descriptions are not editorial reviews. Skill names
can repeat, so URLs use a stable repository-path identity.

Contributor avatars come from GitHub-linked commit authors for each `SKILL.md`
path, up to the pinned skill snapshot. `pnpm sync:skills` refreshes this metadata
with discovery; `pnpm sync:skill-contributors` (optionally `--slug opencode`)
refreshes only attribution at existing snapshots. The stored account IDs and
usernames support avatar groups without live API requests while browsing.
Known bot accounts are filtered; co-author trailers and history before path
renames are not included. Unlinked commit authors are recorded as a coverage
notice rather than guessed GitHub identities.

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
