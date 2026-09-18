# Maintaining the corpus

Use the committed snapshots for normal development. Refreshing the corpus needs
network access and the tools used by the sync scripts: Git and an authenticated
GitHub CLI (`gh auth status` to check).

Entries default to analyzing `AGENTS.md`; set `instructionFile: "CLAUDE.md"` to
analyze that source instead. Nested entry points such as
`instructionFile: ".agents/AGENTS.md"` retain their actual repository path in
source links, previews, and measurements. Check agent folders as well as the
repository root when adding candidates. All instruction discovery and link resolution use
the analysis commit. Skills retain their independent discovery snapshot.

If an instruction entry point is a symlink, set `instructionFile` to its resolved
regular file, such as `.rules`. The vendored manifest must record an `AGENTS.md`
or `CLAUDE.md` symlink resolving to that source. Measurements and quotes describe
the target's contents, not the symlink text.

## Adding a project

Entries are one JSON file per project. The procedure is in
[the entry guide](../.claude/skills/agents-md-entry/SKILL.md). It covers which
branch is canonical, how to record the upstream commit, what to measure, how to
quote, and the editorial voice. Run the checks below after updating an entry.

**Every quote must be verbatim.** That is the rule the collection rests on; the
skill puts it above all the others.

```bash
pnpm sync:files --slug foo     # replace foo with the entry's slug
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
| `pnpm measure:files` | Checks measurements against complete pinned source, including manifest line counts. Offline; runs as part of `pnpm lint`. `--write` corrects generated measurements without changing source bytes, commits, or analysis dates. |

`pnpm measure:files --file /path/to/AGENTS.md` prints measurements for one file.
Fenced code blocks are counted with a Markdown parser, including tilde fences,
nested blocks, and unclosed fences. Line counts include a final line without a
newline. Bullet lines are literal `-` or `*` list prefixes, not a count of rules;
words use JavaScript whitespace splitting. After correcting measurements,
review authored copy that repeats an affected count.

Entries go stale two ways and only one is mechanical. Measurements and commits a
script can re-derive; when the file itself has changed, the analysis describes a
revision that no longer exists and that entry has to be re-read. `pnpm refresh`
reports those separately.

## Patterns

All pattern pages use one template. Edit [the catalog](../content/patterns/catalog.json)
for names, summaries, and explanations, and [the guides](../content/patterns/guides.json)
for the three visual cues, application guidance, and selected example project slugs.
Both files are keyed by the same pattern IDs.

Examples reuse the matching techniques in `content/projects/*.json` and their
pinned source files. Quotes, line numbers, project counts, and links are resolved
automatically. The build checks selected examples against their pinned source;
there is no runtime content generation. Guide content stays on the server.

Run `pnpm lint`, `pnpm typecheck`, and `pnpm build` after content edits.

## Instruction contributors

Instruction-file contributor snapshots can be refreshed with
`pnpm sync:instruction-contributors` (requires authenticated `gh`). This reads
file history at each entry's pinned commit and preserves the previous snapshot
if any request fails. Refresh after changing instruction paths or pinned
commits; stale attribution is hidden until refreshed.

## Third-party content

`public/files/` holds copies of other projects' documentation, stored at the
commit each entry was measured against so the page and the file cannot disagree.
Known upstream license information is recorded in each project's `manifest.json`
and shown in the reader. A missing license field does not imply MIT coverage.
This directory is excluded from Biome because reformatting it would break the
verbatim quotes.

Preserve upstream copyright and license notices. See [third-party licensing](../THIRD_PARTY.md).

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

### Repair license coverage

Run `pnpm sync:licenses` to verify and repair project and skill license metadata
at their existing pinned commits. Use `--slug <slug>` to limit the run to one
project. This preserves analysis, skill inventories, and scan dates. Both license
reads must succeed before a project's snapshots are updated; fetch or hash
failures retain that project's previous data. Requires authenticated `gh` and
network access. Unrecognized license text remains linked without an inferred name.
