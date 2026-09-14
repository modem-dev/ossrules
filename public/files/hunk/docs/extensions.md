# Writing Hunk extensions

A Hunk extension entry is one TypeScript (or JavaScript) file that
default-exports a function. Hunk imports it at startup and hands it an API
object. An entry may stand alone or be declared by a folder's optional
`package.json` manifest; no build step is required.

```ts
// ~/.config/hunk/extensions/hello.ts
import type { HunkExtensionAPI } from "hunkdiff/extension";

export default function (hunk: HunkExtensionAPI) {
  hunk.on("startup", (_event, ctx) => {
    ctx.notify("Hello from my extension");
  });
}
```

> **The extension API is experimental.** Everything below works today, but the
> `hunkdiff/extension` surface may change in breaking ways between minor
> releases while it stabilizes against real third-party extensions. Breaking
> changes will be called out in release notes, and `hunk.apiVersion` identifies
> the surface an extension was written against.

Writing one with a coding agent? `hunk skill path hunk-extensions` prints a
bundled skill that maps the touchpoints below for agents, the way
`hunk skill path` does for reviewing.

## Where Hunk looks for extensions

Discovery runs group by group, alphabetically by resolved path within each
group — a folder extension's entries sort together, at the folder's own path.
The first occurrence of a resolved path wins, so a path you pass explicitly
keeps its origin even if the same file is also discovered somewhere else.

| Group | Source                                               | Trust                 |
| ----- | ---------------------------------------------------- | --------------------- |
| 1     | `--extension <path>` (repeatable)                    | runs immediately      |
| 2     | `[extensions] paths` in your user config             | runs immediately      |
| 3     | `~/.config/hunk/extensions/`                         | runs immediately      |
| 4     | `.hunk/extensions/` in the repo under review         | **prompts for trust** |
| 4     | `[extensions] paths` in the repo `.hunk/config.toml` | **prompts for trust** |

The two repo-local sources share a group number because they are one group:
both are repo-controlled, so they share a trust decision and their paths are
sorted together rather than one source being loaded ahead of the other.

A directory source matches `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mjs` directly
inside it, plus one level of folder extensions, so a folder extension can keep
helper modules beside its entry file.

A folder is an extension if it declares its entry files in a `package.json`, or
failing that if it has an `index.{ts,tsx,js,jsx,mjs}` (in that preference
order, so a folder shipping both a source and a built entry resolves the same
everywhere). The manifest field is `hunk`:

```text
~/.config/hunk/extensions/my-ext/
  package.json          # {"hunk": {"extensions": ["./src/index.ts"]}}
  node_modules/         # bun install / npm install, right here
  src/
    index.ts            # the declared entry
    helper.ts
```

The manifest wins over the `index.*` fallback, and its paths resolve against the
folder. It may list more than one entry, in which case each entry loads as its
own extension in the order the manifest gives. Each one is identified by its
file stem; when stems collide, later entries receive a numeric suffix while
avoiding ids already claimed by other entries in the manifest.

Because the manifest is a real `package.json`, a folder extension may depend on
npm packages: declare them, install them into the folder's own `node_modules`,
and imports resolve from the entry file the way they do in any other package.

The `hunk` field may also state the minimum extension API version the folder
needs:

```json
{
  "name": "my-ext",
  "version": "1.0.0",
  "description": "What the extension does",
  "hunk": { "extensions": ["./src/index.ts"], "apiVersion": 3 }
}
```

A Hunk whose extension API is older than `apiVersion` refuses the folder with a
startup notice naming the version it would need, instead of failing somewhere
inside the factory with whatever error the missing surface happens to produce.
Omit it while you only use surface that has been around a while; declare it when
you depend on something recent (the current version is exported as
`HUNK_EXTENSION_API_VERSION` from `hunkdiff/extension` and handed to factories
as `hunk.apiVersion`). The standard `name`, `version`, and `description` fields
are how tooling and humans identify a shared extension, so fill them in on
anything you publish.

Pointing `--extension` or `[extensions] paths` straight at a directory works
either way: a directory that is itself a folder extension loads as that one
extension, so its helper modules stay helpers. A directory that is not is
treated as a directory _of_ extensions and scanned with the patterns above.

An extension's **id** is its file stem, or its folder name for
`<name>/index.ts`. A manifest that declares a single entry also keeps the
folder's name, whatever the entry file is called. The id is what
`[extension.<id>]` config tables key off, so moving a single-file extension into
a folder of the same name — or later giving that folder a manifest — keeps its
config working.

The id is also the namespace your extension owns: its commands are
`<id>.<commandId>` and its panes `<id>:<viewId>`. So the id has to be
spelled like a name — starting with a letter or digit, then letters, digits,
`-`, or `_`. A dot or a colon would make those composed ids ambiguous, and
`hunk`, `git`, `jj`, and `sl` are reserved for what Hunk ships. An extension
whose id breaks a rule is skipped with a startup notice naming the file; rename
it and it loads. If two discovery sources offer the same id, the first in
[source order](#where-hunk-looks-for-extensions) loads and the other is skipped the
same way, since one id cannot own two config tables.

`--no-extensions` disables user extensions for one run — nothing on disk is
read, let alone executed. Use it when triaging a bug.

`--extension` is explicit user intent: the file loads immediately, with no
trust prompt, even when the path points inside the repository under review.
Never pass a path you have not read — including one copy-pasted from a
repository's own README.

## Sharing and installing extensions

Extensions are shared as plain git repositories — there is no registry to
publish to. `hunk extension install` clones one into a managed directory
(`~/.config/hunk/extensions/installed/<repo-name>/`), verifies it actually
contains an extension, installs its npm dependencies when it declares any, and
records the source and resolved commit:

```bash
hunk extension install acme/hunk-word-diff          # GitHub shorthand
hunk extension install acme/hunk-word-diff@v1.2.0   # pin a tag, branch, or commit
hunk extension install git:codeberg.org/acme/ext    # any host; https:// is assumed
hunk extension install https://github.com/acme/hunk-word-diff.git
hunk extension install ~/dev/hunk-word-diff         # a local checkout, for testing
```

Managed installs load through the global source group — same origin, same
precedence, no trust prompt — because installing one is the explicit consent:
the install asks for confirmation (or `--yes`) after stating that extensions
run with your full user permissions. Only install repositories you trust.

`hunk extension list` shows every managed install with its version, commit, and
source. `hunk extension update [name]` re-clones one install (or all of them)
from its recorded source — an install pinned with `@ref` stays at that ref
until you re-install with a different one. `hunk extension remove <name>`
deletes the install and its record. Managed installs never collide with
extensions you copied into `~/.config/hunk/extensions/` by hand, and the
installer refuses to overwrite an unmanaged directory of the same name.

### Publishing an extension

A publishable extension repository is just the folder-extension layout at the
repository root:

```text
hunk-word-diff/
  package.json          # name, version, description, hunk field
  index.ts              # or entries declared in "hunk": {"extensions": [...]}
  README.md
```

To publish one:

1. Give `package.json` a real `name`, `version`, and `description`, declare
   entries under the `hunk` field, and state `"hunk": {"apiVersion": N}` if you
   rely on recent API surface (see [the manifest](#where-hunk-looks-for-extensions)).
2. Keep it dependency-light. Declared `dependencies` are installed with
   `bun install` at install time when the user has `bun` on PATH; without it
   they get a warning and instructions. `react`, `@opentui/*`, and
   `hunkdiff/extension` come from the host at runtime and belong in
   `devDependencies` (types only), never `dependencies`.
3. Tag releases (`v1.2.0`) so users can pin with `@v1.2.0` instead of tracking
   your default branch.
4. Push the repository to any git host and add the **`hunk-extension`** GitHub
   topic so people can find it: every public repository with that topic shows
   up at <https://github.com/topics/hunk-extension>. Opening a pull request
   against `website/src/data/extensions.ts` also lists it on
   <https://hunk.dev/extensions>.

Before publishing, exercise the exact layout users will install:
`hunk extension install /path/to/your/checkout` installs from a local
repository, and `hunk diff --extension /path/to/your/checkout` loads it for one
run without installing anything.

## Bundled extensions

Every VCS backend Hunk ships — **Git, Jujutsu, and Sapling** — is an extension,
and so are the **built-in file-navigation pane**, the commit and change-request info panes, and
the **`/` content search** (`hunk.search.find` / `next` / `previous`, with its match marks and
status-row report). Provider implementations live in the private
`packages/hunk-{git,jj,sapling}` workspaces and are statically imported by
`packages/hunk/src/extensions/default/vcs/index.ts`. Bundled UI registrations live under
`packages/hunk/src/extensions/default/ui/`. All register through the same
`hunk.registerVcsAdapter`, `hunk.registerPane`, `hunk.registerCommand`, and
`hunk.registerLineHighlighter` contract documented here, and their commands, highlighters, and
panes are composed ahead of yours; there is no private registration path.

Git exercises exact file sources, skipped-too-large placeholders, untracked files, watch plans,
and structured failures through the public adapter contract. Its package and boundary tests keep
those capabilities on the same registration path available to third-party adapters.

Bundled extensions differ from yours in three ways, all of them consequences of
being Hunk's own code:

- They are **statically imported**, so they load synchronously, before config
  resolution picks the session's VCS.
- They are **implicitly trusted**: no discovery, no trust prompt, and no
  `[extension.<id>]` config table.
- They stay loaded under `--no-extensions` and `[extensions] enabled = false`.
  Those switches exist to triage extensions _you_ installed; losing VCS support
  from a debugging flag would break every workflow there is.

A bundled VCS factory failure becomes a load issue rather than crashing the session. Bundled UI
panes are required host code, so failure to register the expected panes aborts startup. The ids
`git`, `jj`, and `sl` are reserved as a result — see `registerVcsAdapter` below — and so is `hunk`,
the id the bundled files pane, the bundled search, and every built-in command are named under.
Because bundled factories run once per process with no config, a bundled command derives its
session state from its context (`ctx.selection.files`) rather than closing over a review.

## Trust

Extensions run with your user permissions, exactly like a shell dotfile. That is
fine for extensions you installed yourself, and not fine for extensions that
came with a repository you are about to review — pointing a diff tool at
unfamiliar code is a normal thing to do, and it must never execute that code.

So repo-local sources are gated. The first time Hunk finds extensions in a
repository's `.hunk/extensions` (or repo-config `paths`), it skips them and asks:

```
Run this repository's extensions?

  This repository contains extensions in .hunk/extensions.
  Extensions run with your user permissions.

  enter/t trust · esc not now · n never
```

- **Trust** records the decision and reloads the session so the repo's
  extensions take effect immediately.
- **Not now** (also `Esc`) dismisses without recording anything; you will be
  asked again next time.
- **Never** records a denial so Hunk stops offering.

Decisions are stored per repository root in `~/.config/hunk/state.json`. The
prompt is a normal dialog over the review stream, not a gate in front of it:
you can dismiss it and keep reviewing.

Trust is keyed by the repo root's **path**, not by the repository's identity —
the same model VS Code workspace trust uses. If you delete a trusted checkout
and a different repository later occupies that path, it inherits the decision.
Clear the entry from `state.json` if that matters for a path you reuse.

## Failure isolation

A broken extension should not break review. An extension that fails to import,
has no default export, or throws from its factory is skipped, its partial
registrations are rolled back, and it becomes a startup notice in the footer.
A handler or transform that throws later is reported as a warning naming the
extension, and everything else keeps running. Event handlers receive frozen
copies of the changeset, so accidental mutation throws inside the handler
instead of corrupting the review.

This is crash containment, not a sandbox. Per-file `metadata` inside event
payloads is shared with the renderer for performance and is not frozen, and an
extension runs with your full user permissions — it can do anything your shell
can. The containment protects you from bugs, not from code you should not have
loaded in the first place. For reviewed files, prefer [`ctx.workspace`](#workspace-documents). It attributes
writes to the extension and asks for consent.

## The API

The factory receives one object. Registration calls are only valid while the
factory is running; Hunk seals the object afterwards so a deferred callback
cannot mutate the registry mid-session. Keep the factory registration-only:
start watchers, processes, connections, and other long-lived resources from
`startup`, and release them from `shutdown`. Extension-registry reloads create
new instances and run that shutdown/startup pair around the replacement.

One host-owned `ExtensionSession` holds active, provisional, and retiring registries for a
command lifetime. It revokes replaced authority at the review commit gate, drains bounded shutdown
handlers before terminal teardown, and prevents surfaces from independently replacing or retiring
the shared registry.

An interactive history workspace owns one extension instance for its complete
lifetime. Opening a commit review inside that workspace borrows the same
instance: the factory and `startup` do not run again, and returning to history
does not send `shutdown`. Review-specific `changeset_loaded` events still run
for each opened commit. The owning history workspace sends the one eventual
`shutdown` when it exits. This makes module-local clients and stores safe to
share deliberately between retained history and its commit reviews without a
review closing resources that history still uses.

Keep mutable review-generation data keyed by the identities in event payloads
or replace it on `changeset_loaded`; module scope is workspace state, not a
fresh namespace per opened commit. An embedded review cannot replace its
borrowed registry; extension replacement remains an operation of the owning
workspace. A true owner-driven extension-registry reload creates a new instance
and retires the replaced instance at that explicit ownership boundary.

### `hunk.apiVersion`

The API generation this Hunk speaks (currently `27`). Branch on it if you want
one file to support several Hunk versions. Version 27 adds `ctx.selection.files`, the visible
files in review order; version 26 adds the status line (`ctx.statusLine`
items and `ctx.prompts.line()` inline prompts); version 25 adds Promise-returning watch
signatures and watch cancellation; version 24 adds review metadata to VCS patch results and
short display revisions to commit descriptors; version 23 adds canonical unified-layout fields
while preserving the previous event vocabulary; version 22 adds frame-derived pane preferred sizing,
non-resizable dynamic panes, and commit-history paint tokens; version 21 adds optional inclusive history-range review
planning and bounded comparison commit summaries; version 20 adds optional commit timestamps to review
metadata, pane clipboard actions, and the `theme.copyAction` paint token; version 19 adds provider-owned history
enumeration and review planning; version 18 lets lifecycle and custom-event handlers request
a host-owned review reload; version 17 adds structured review metadata to delegated patch
commands and projects it into pane availability and component props; version 16 adds pane-wide
`onActivate`; version 15 added `{ side, line }` to opted-in pane `currentLine`
paint; version 14 added structured `rangeEndpoints`
to two-revision VCS diff requests; version 13 added saved-note parent identities and
committed note-edit events; version 12 adds responsive fractional pane sizing; version 11 added
the `"dim"` line-highlight tone; version 10 added generic top-level CLI commands; version 9
added exact-filename and glob selectors to `registerFileLanguage`; version 8
added authoritative review snapshots to command handlers; version 7 added the
current source line to command selection snapshots. Version 6 added session behavior,
terminal-command observation, and live navigation/dialogs in event handlers;
version 5 added line highlighters and line-granular navigation (`revealLine`);
version 4 added keyboard modes and docked panes, with API-v3 sidebar names
remaining as deprecated aliases.

### `hunk.registerCliCommand(command, handler)`

Register a generic top-level command tree. The name must use lowercase kebab
case, cannot replace a built-in command or alias, and is global across loaded
extensions. Discovery order decides collisions: explicit flag, user-config path,
global/managed, then trusted repo extensions; the first claim wins.

```ts
hunk.registerCliCommand(
  { name: "greptile", summary: "Work with Greptile", usage: "<sync|review>" },
  async (args, ctx) => {
    if (args[0] === "sync") {
      await ctx.stdout.write("Synced.\n");
      return { kind: "exit", code: 0 };
    }

    await ctx.stderr.write("Preparing review…\n");
    return {
      kind: "delegate",
      argv: ["patch", "review.diff"],
      review: {
        kind: "change-request",
        provider: "GitHub",
        title: "Add structured review metadata",
        url: "https://github.com/acme/project/pull/123",
        id: "#123",
        repository: "acme/project",
        author: "octocat",
        base: "main",
        head: "review-metadata",
        state: "open",
        draft: false,
      },
    };
  },
);
```

The handler receives the frozen raw tokens below its top-level name plus
`ctx.cwd`, cooperative `ctx.signal`, byte-streaming `ctx.stdin`, and leased,
backpressure-aware `ctx.stdout`/`ctx.stderr`. It may use ordinary JavaScript APIs
to access networks, processes, services, and files. Return `{ kind: "exit",
code? }` with a status from 0 through 255, or delegate exactly once to a
built-in Hunk command.

A delegated built-in `patch` command may include a provider-neutral `review` descriptor. Its
`kind` is `change-request`, `commit`, or `comparison`; each exact shape combines bounded display
strings with an optional credential-free HTTPS URL. Hunk rejects unknown fields, control
characters, invalid types, unsafe URLs, fields over their byte limits, and descriptors over 4 KiB,
then copies and freezes the accepted value. `provider` and change-request `id` allow 256 bytes;
`repository`, `author`, `base`, `head`, and `revision` allow 512; `authoredAt` allows 128;
`title` and `url` allow 2 KiB. Change requests may also carry `state` (`open`, `closed`, or
`merged`) and boolean `draft`; commits may carry a parseable `authoredAt` date-time. Exit results and delegation to any built-in other than
`patch` cannot carry review metadata. An ordinary `hunk patch` has no descriptor.

The descriptor describes the review source rather than its diff contents: it stays on the app
bootstrap and does not enter changeset transforms or `ReviewDocumentV1`. Refreshing the same
file-backed patch preserves it, including watch and manual refresh; an explicit reload to a
different patch path or input kind clears it. Opening a commit from interactive `hunk log` attaches
a commit descriptor from the selected provider history row and preserves it while refreshing that
exact provider review request. Live-session list, context, and review JSON snapshots project the
same optional descriptor from registration metadata; it remains outside the semantic
review document and grants no remote reload or provider capability.

Delegation cannot target another extension command or change extension bootstrap
flags. Do not write stdout or read stdin before delegating; use stderr for
progress. Reading stdin is an exit-only workflow because even a pending read can
steal terminal input from the delegated command. Writers and stdin iterators
reject after the handler settles. SIGINT and SIGTERM abort
`ctx.signal`; handlers should stop promptly. Extensions are not sandboxed, so
direct process stream access cannot be enforced by these capabilities and must
be avoided.

Bare `hunk --help` remains static and does not load extensions. The extension
owns `hunk <name> --help` and receives `--help` unchanged.

`summary` and `usage` are what Hunk shows when a top-level token reaches
extension discovery but no extension claims it. That failure has already paid
for the registry, so it lists every loaded command rather than only naming the
token that was wrong:

```text
hunk: Unknown command: nosuchthing

Extension commands available here:
hunk cli-tools <status|review> [args...] — Demonstrate extension-provided CLI workflows
hunk gh <number|owner/repo#number|pull-request-url> [--repo <owner/repo>] — Review a GitHub pull request
```

Both fields are collapsed to one sanitized line, so an extension cannot forge
host output with newlines or escape sequences.

The dependency-free [`github-pr` example](../examples/extensions/github-pr/)
is a complete network workflow built on this contract. It fetches bounded GitHub PR metadata and
the diff without the `gh` CLI, attaches a `change-request` descriptor so the bundled review-info
pane shows the provider facts above the diff, writes a temporary patch with restrictive POSIX modes
(and inherited temporary-directory ACLs on Windows), delegates to the built-in `patch` command, and
removes the patch on extension shutdown. Run it
from this checkout with:

```bash
bun run packages/hunk/src/main.tsx --extension ./examples/extensions/github-pr gh 123
```

### `hunk.configureSession(options)`

Request host-level behavior for the review session loading the extension. Use
`{ viewPreferences: "transient" }` for training, demos, and presentations that
deliberately exercise view controls but must never offer to save their final
practice state into the user's config. If any loaded extension requests it, the
shared session skips the save-view-preferences prompt on quit.

```ts
hunk.configureSession({ viewPreferences: "transient" });
```

The default is `{ viewPreferences: "default" }`. Like every registration-time
call, this must run synchronously while the factory is loading.

### `hunk.registerTheme(theme)`

Contribute one selectable theme. The object is the same shape as a
`[themes.<id>]` config table:

```ts
hunk.registerTheme({
  id: "midnight-review",
  label: "Midnight Review",
  base: "catppuccin-mocha",
  accent: "#7fd1ff",
  syntaxScopes: { "keyword.operator": "#7fd1ff" },
});
```

Theme ids must be lowercase words separated by `-` or `_` and cannot reuse a
built-in id. Config-defined themes always win over extension themes for the same
id; the loser is reported as a startup notice. Extension themes appear in the
selector after config themes, in load order.

### `hunk.registerFileLanguage(matcher, language)`

Map file extensions, exact filenames, or globs to an existing syntax-highlighting language. The
string shorthand registers a case-insensitive extension with or without its leading dot. Explicit
extension matchers use the same trimming, leading-dot removal, and lowercasing:

```ts
hunk.registerFileLanguage(".zig", "zig");
hunk.registerFileLanguage({ kind: "extension", value: "bzl" }, "python");
hunk.registerFileLanguage({ kind: "filename", value: "BUILD" }, "python");
hunk.registerFileLanguage(
  { kind: "glob", value: "generated/**/*.proto", target: "path" },
  "protobuf",
);
hunk.registerFileLanguage({ kind: "glob", value: "*.component", target: "basename" }, "typescript");
```

Filename and glob matching is case-sensitive on every platform. Exact filenames match a basename
at any directory depth. Globs use Bun's shell-style glob syntax and must explicitly target either
the basename or the review path exactly as Hunk decoded it. `/` is the review-path separator;
backslashes remain literal filename characters. Exact filename and glob values preserve leading and
trailing whitespace. Globs reject NUL and do not run against NUL-bearing decoded patch paths; exact
filename selectors can still address those paths. VCS review paths are normally repo-relative,
while generic patch input may carry an absolute path.

Hunk's reserved `.mts` and `.cts` mappings run first and cannot be overridden. Otherwise, exact
filenames take precedence over globs, which take precedence over extensions. The longest matching
extension wins, and later registrations win ties within each category. Direct attempts to register
those two reserved extensions are skipped with a notice.

This API selects a language already available to Pierre/Shiki. It does not load a new syntax
grammar; an unknown language remains plain text.

### `hunk.registerVcsAdapter(adapter)`

Contribute an additional VCS backend. This is the same call Hunk's own bundled
Git, Jujutsu, and Sapling backends make.

```ts
hunk.registerVcsAdapter({
  id: "hg",
  name: "Mercurial",
  detect: (cwd) => (existsSync(join(cwd, ".hg")) ? { id: "hg", repoRoot: cwd } : null),
  operations: {
    "working-tree-diff": {
      async load(input, ctx) {
        return {
          repoRoot: ctx.cwd,
          sourceLabel: ctx.cwd,
          title: "Mercurial working copy",
          patchText: await runHgDiff(ctx.cwd),
          untrackedPaths: await listHgUnknownFiles(ctx.cwd),
        };
      },
    },
  },
});
```

The ids Hunk ships with — `git`, `jj`, and `sl` — are reserved. An adapter that
reuses one is skipped with a notice.

`operations` is optional and may implement any of `working-tree-diff`,
`revision-show`, and `stash-show`; an operation you leave out — or leaving the
map off entirely — produces a clear "not supported" error for that command
instead of a crash.

API version 19 adds the optional, read-only `history` capability used by the built-in `hunk log` surface. API version 21 adds optional inclusive range planning:

```ts
hunk.registerVcsAdapter({
  id: "hg-history",
  name: "Mercurial history",
  detect: () => null,
  history: {
    async open() {
      return {
        async read({ signal }) {
          signal?.throwIfAborted();
          return { commits: [], done: true };
        },
        close() {},
      };
    },
    planReview(commit) {
      return commit.parentRevisionIds[0]
        ? {
            kind: "revision-range",
            fromRevisionId: commit.parentRevisionIds[0],
            toRevisionId: commit.revisionId,
          }
        : { kind: "revision-show", revisionId: commit.revisionId };
    },
    planRangeReview({ newestCommit, oldestCommit }, _context, options) {
      const parent = options?.parentRevisionId ?? oldestCommit.parentRevisionIds[0];
      if (!parent) throw new Error("Resolve this provider's empty root baseline here.");
      return {
        kind: "revision-range",
        fromRevisionId: parent,
        toRevisionId: newestCommit.revisionId,
      };
    },
  },
});
```

The snippet above demonstrates static history production only; it is not a complete interactive
adapter. Add a `revision-show` operation for `revision-show` actions and a `working-tree-diff`
operation that accepts `rangeEndpoints` for `revision-range` actions before advertising interactive
opening. Otherwise Enter reports that the corresponding review operation is unsupported.

History is deliberately separate from patch-producing `operations`. The built-in host owns command
routing, graph planning, themes, terminal lifecycle, and static/interactive presentation. The
adapter owns every repository semantic: traversal and filtering, immutable identities, refs, and
review-planning decisions about roots, merges, ancestry, and direct endpoints. `planRangeReview` is
optional so older adapters remain compatible; without it, Hunk reports multi-commit opening as
unsupported rather than silently opening one commit. A range planner compares the chosen parent—or
provider-specific empty/root baseline—of `oldestCommit` directly with `newestCommit` and must not use
merge-base/triple-dot semantics. Hunk treats revision ids as opaque strings and never invents provider
revision syntax.

Commits must carry an immutable full `revisionId`, display id, ordered parent ids, subject, optional
message body, author (and optional email), ISO authored time, and structured ref decorations. The
optional `logicalId` identifies the same logical change across provider rewrites (for example, a
Jujutsu change id); Hunk treats it as metadata and continues to key graph and review operations by
immutable `revisionId`. A `head` decoration carries an optional `attachedLocalBranch`; use that field
rather than embedding an arrow or branch identity in its display label.

Every source must emit commits in **child-before-parent topological order**. If both a child and one
of its parents are included, the child appears first. This invariant spans the source's complete
lifetime: page boundaries do not reset it, and a parent returned on one page cannot be followed by
its child on a later page. Reads may return at most the requested limit and must distinguish a page
boundary from repository end with `done`. Hunk copies and validates every page, strips terminal
controls from display metadata, rejects duplicate revisions and parent-before-child output across
pages, forwards cancellation, and closes the source at EOF or failure.

The bundled Git and Jujutsu extensions implement this public capability today; Sapling currently
reports it as unsupported. Jujutsu supplies commit/change identities, bookmarks, tags, traversal,
and native merge-review semantics without routing through a colocated Git repository. Third-party
adapters use exactly the same contract.

Every operation `load` and `watchSignature` receives optional `context.signal`.
Use asynchronous subprocess APIs, pass cancellation through, and terminate plus
reap provider processes when it aborts; a synchronous spawn blocks Hunk's renderer
and prevents the abort handler from running.

A `load` result is patch text plus how to label it. Everything else on it is
optional, and each optional field buys one thing. API version 24 adds `review`:

| Field            | What it adds                                                       |
| ---------------- | ------------------------------------------------------------------ |
| `review`         | commit or comparison context above a revision-backed review        |
| `untrackedPaths` | files your VCS calls unknown, synthesized into added-file diffs    |
| `readFileSource` | exact whole-file contents, for context expansion and highlighting  |
| `sourceCacheKey` | stable source-snapshot identity for highlight reuse across reloads |
| `extraFiles`     | files reviewed outside the patch, including skipped placeholders   |

Use the same `ExtensionReviewDescriptor` accepted by delegated CLI reviews. Return a `commit`
descriptor when the operation resolves one reviewed commit, or a `comparison` descriptor when both
sides resolve to commits. Comparison `commits` are newest-first and bounded to eight entries; retain
the exact total in `commitCount` when known. Commit descriptors and comparison commit rows carry the
full immutable ID in `revision` for copying and should carry the provider-formatted short ID in
`displayRevision` for display. `displayRevision` remains optional on a single commit for extensions
built against an older API; Hunk abbreviates `revision` when it is absent. Omit `review` when either
side is working-copy, staged, stash, or otherwise cannot be identified accurately. Hunk validates,
copies, and freezes the descriptor before mounting it, then recomputes provider-supplied metadata on
reload so moving refs do not retain stale information.

`untrackedPaths` is the shorthand: list the repo-root-relative paths your VCS
reports as unknown and Hunk synthesizes the added-file diffs for you, skipping
binaries and files too large to render. Honor `input.options.excludeUntracked`
when you do, so `--exclude-untracked` still means what it says. The other two
are covered below.

#### Detection order

Detection prefers the **nearest** checkout: a Git repository nested inside a jj
workspace is reviewed as Git, whatever the priorities say. The same rule covers
your adapter — a Mercurial checkout inside a Git repository is reviewed as
Mercurial. `detectionPriority` only decides which backend wins when several
recognize the _same_ directory — the colocated case, where one working copy
carries two sets of markers.

| Adapter                  | Priority                                     |
| ------------------------ | -------------------------------------------- |
| bundled `jj`             | 200                                          |
| bundled `sl`             | 100                                          |
| bundled `git`            | 0 (`HUNK_VCS_DETECTION_BASELINE_PRIORITY`)   |
| your adapter, by default | -100 (`HUNK_DEFAULT_VCS_DETECTION_PRIORITY`) |

Higher is consulted first; equal priorities fall back to registration order.
jj and Sapling sit above Git because a colocated jj repository — or a Sapling
repository created with `sl init --git` — also carries Git metadata, and the
Git view is the wrong one.

The default puts your adapter below Git, so installing an extension never
silently changes how an existing repository is reviewed. Set
`detectionPriority` explicitly to outrank a shipped backend; it is your machine.

```ts
import { HUNK_VCS_DETECTION_BASELINE_PRIORITY } from "hunkdiff/extension";

hunk.registerVcsAdapter({
  id: "hg",
  name: "Mercurial",
  detectionPriority: HUNK_VCS_DETECTION_BASELINE_PRIORITY + 10,
  detect,
});
```

Detection runs the same way for every adapter, whichever tier registered it:
the nearest checkout wins, `detectionPriority` breaks ties between adapters
that recognize the same root, and equal priorities fall back to registration
order. Hunk first resolves config and project root with the available catalog. If newly loaded
adapters change the detected project root, it reruns root and config resolution before loading the
session.

What detection never overrides is an explicit choice: a `vcs = "<id>"` in Hunk
config naming a backend this session loaded is honored as-is, however near a
checkout some other adapter finds. A repository-local adapter can bootstrap a
provider Hunk has never seen because `.hunk` itself establishes the project root;
global, config-path, and `--extension` adapters also participate in a staged
root/config pass before the review loads. When the final root only adds repo
candidates, Hunk extends the provisional registry instead of executing its
already loaded factories again. If repo config changes an existing extension's
factory config, Hunk sends that provisional instance `shutdown` before rebuilding it.

#### Watch support

Promise-returning `watchSignature` hooks and watch cancellation require API version 25.
Declare `"hunk": { "apiVersion": 25 }` in the extension manifest so older hosts refuse to
load it, or branch on `hunk.apiVersion` and keep a synchronous hook on older hosts.
Existing synchronous hooks remain supported.

`--watch` works through extension adapters. Each operation may add:

- `watchSignature(input, ctx)` — a fingerprint of the reviewed state, returning
  `string | Promise<string>`. Hunk awaits it and reloads when it changes. Prefer
  async I/O and honor `ctx.signal`, which aborts when observation closes.
- `watchPlan(input, ctx)` — the filesystem targets that cover that state, so
  Hunk reacts to events instead of polling on a timer.

```ts
watchPlan: (input, ctx) => ({
  coverage: "hybrid",
  targets: [
    {
      kind: "directory-tree",
      directory: ctx.cwd,
      ignoredRoots: [join(ctx.cwd, ".hg")],
      sources: ["worktree"],
    },
  ],
}),
```

`coverage: "hybrid"` promises the targets cover the reviewed state. Leaving
`watchPlan` out is equivalent to `poll-only` and still works — it just costs a
subprocess per tick.

#### Exact file sources

A patch carries the changed lines and a little context, and nothing else. If
your VCS can produce a file's _whole_ contents on each side, say so with
`readFileSource` and Hunk will expand context past the hunk, highlight against
the real file, and word-diff accurately.

```ts
async load(input, ctx) {
  // Pin the revisions while the operation loads, then close over them: by the
  // time Hunk asks for a file, nothing can have moved underneath it.
  const [oldRev, newRev] = await resolveHgRevisions(input, ctx.cwd);

  return {
    repoRoot: ctx.cwd,
    sourceLabel: ctx.cwd,
    title: "Mercurial working copy",
    patchText: await runHgDiff(ctx.cwd),
    sourceCacheKey: `${oldRev}:${newRev}`,
    readFileSource: async ({ path, previousPath, changeType, side }) => {
      if (side === "old") {
        return changeType === "new" ? null : hgCat(oldRev, previousPath ?? path);
      }
      return changeType === "deleted" ? null : hgCat(newRev, path);
    },
  };
}
```

Return `null` for a side that has no content — the old side of an added file, a
path the revision never contained — rather than throwing. Return
`{ kind: "too-large", maxBytes }` when fetching the source would exceed your
resource limit; Hunk shows expansion as unavailable without treating the result
as an extension failure. Hunk calls the reader
**at most once per file and side** and caches what it resolves, so you do not
need your own cache, and it never calls it for a file the diff reports as
binary. When equivalent reloads close over the same source base, return the same
opaque `sourceCacheKey` so Hunk can reuse its highlighted output. An equal per-file
patch plus that key must guarantee equal old/new source answers for the file; change
it when source state outside the patch changes. Omit it when the adapter cannot prove
stable identity and Hunk will invalidate conservatively. Leaving
`readFileSource` off is fine: Hunk falls back to the content the patch itself carries,
which renders the same diff with less context available.

#### Files outside the patch

`extraFiles` lists files to review that your `patchText` does not contain, in
the order they should appear. Each entry is one of two kinds, and Hunk builds
the diff model for both — you describe files, you never assemble them.

A **patch** entry is a file with its own one-file diff. Reach for it when your
VCS produces better text for a file than Hunk reading the working copy would —
its own binary detection, its own path quoting:

```ts
extraFiles: [
  {
    kind: "patch",
    path: "notes.md",
    patchText: await hgDiffOneFile("notes.md"),
    isUntracked: true,
  },
];
```

A **skipped** entry is a file Hunk should list but not render. Reviewing a
multi-hundred-megabyte generated file costs more than it is worth, so report the
file and why instead of producing a diff nothing will read:

```ts
extraFiles: [
  {
    kind: "skipped",
    path: "dist/bundle.js",
    reason: "too-large",
    changeType: "change",
    stats: { additions: 100_001, deletions: 0 },
    statsTruncated: true,
  },
];
```

`readFileSource` covers the patch entries too; a skipped entry has no content to
read, so it never gets a source reader.

`untrackedPaths` remains the shorthand for the common case: list the paths your
VCS calls unknown and Hunk synthesizes the added-file diffs from the working
copy, skipping binaries and files too large to render. Use `extraFiles` instead
only when your VCS renders those files better than a plain read would.

#### Moved lines

`input.options.colorMoved` is true when the user asked for move detection.
Hunk reads move classes back out of the patch itself, so emit ANSI-colored diff
text painting moved additions cyan and moved deletions magenta — what
`git diff --color-moved` produces — and those lines render as moved. This is
ordinary post-processing over whatever patch text an adapter returns, not a Git
special case. A backend with no notion of moved lines can ignore the option.

#### Failures the user can fix

Throw a `HunkExtensionUserError` when the problem is how Hunk was invoked rather
than a bug — no repository here, an unresolvable revision, a missing binary.
Hunk prints the message without a stack trace and lists the suggestions beneath
it. Anything else is reported as an unexpected error.

```ts
import { HunkExtensionUserError } from "hunkdiff/extension";

throw new HunkExtensionUserError("`hunk stash show` is not supported by Mercurial.", {
  suggestions: ["Use `hunk show <rev>` to review a commit instead."],
});
```

Hunk detects this structurally — an object whose `name` is
`"HunkExtensionUserError"` with an optional `suggestions` array of strings — so a
plain-JavaScript extension, or one bundling its own copy of the class, is
treated the same way. `HUNK_EXTENSION_USER_ERROR_NAME` is exported if you would
rather not hard-code the string. Hunk's own bundled Git, Jujutsu, and Sapling
backends raise their failures exactly this way.

### `hunk.registerPane(pane)`

Render a React component on the `left`, `right`, `top`, or `bottom` edge of the
review. Pair it with `registerCommand` so a key opens it:

```tsx
// ~/.config/hunk/extensions/flat-pane.tsx
import { useMemo } from "react";
import type { ExtensionPaneProps, HunkExtensionAPI } from "hunkdiff/extension";

function FlatPane({ files, selectedFileId, theme, actions }: ExtensionPaneProps) {
  const ordered = useMemo(() => [...files].sort((a, b) => a.path.localeCompare(b.path)), [files]);

  return (
    <scrollbox scrollY={true} width="100%" height="100%">
      {ordered.map((file) => (
        <text
          key={file.id}
          content={` ${file.path}  +${file.stats.additions} -${file.stats.deletions}`}
          style={{
            fg: file.id === selectedFileId ? theme.accent : theme.text,
            bg: theme.panel,
          }}
          onMouseDown={() => actions.selectFile(file.id)}
        />
      ))}
    </scrollbox>
  );
}

export default function (hunk: HunkExtensionAPI) {
  hunk.registerPane({
    id: "flat",
    title: "Flat files",
    placement: "right",
    component: FlatPane,
  });
  hunk.registerCommand({ id: "toggle-flat", title: "Toggle flat pane", key: "ctrl+f" }, (ctx) => {
    ctx.panes.toggle("flat");
  });
}
```

`placement` defaults to `"left"`. Left/right panes use `width`; top/bottom panes
use `height`. Both accept `{ preferred, min?, max?, fraction? }`; equal bounds
make a fixed pane. Defaults are `{ preferred: 34, min: 22 }` columns and
`{ preferred: 8, min: 3 }` rows.

`fraction` opts into live responsive sizing until the user drags the divider. It
must be greater than `0` and at most `1`; Hunk rounds that fraction of the full
host body width or height to a terminal cell, then applies `min`, `max`, and the
space required by the review. `preferred` remains the fixed-cell target when
`fraction` is omitted. A divider drag establishes a session-local cell override:
later terminal shrink may clamp it temporarily, and expanding restores it.
Panes without `fraction` retain their fixed preferred startup size. Folder
extensions that use `fraction` should declare `"hunk": { "apiVersion": 12 }` in
their manifest.

`preferredSize(context)` can derive that automatic cell target from current
review facts. Hunk invokes it synchronously with the same context as
`available`, clamps its positive whole-number result to `min`/`max`, and still
lets a session-local divider drag take precedence. Set `resizable: false` when a
dynamic pane should track that target without exposing a divider. These options
require API version 22.

Use `defaultOpen` to open a pane initially, `replaces: "hunk:files"` to replace
the initial files pane (and override `defaultOpen`), and `available(context)` to
hide it conditionally. One pane may replace each named target; the first
registration owns that slot and later claims are skipped with a warning.
`replaces` may also name another pane by its fully qualified
`"<extensionId>:<paneId>"` key, and Hunk follows those replacement chains.
Both `available(context)` and the mounted component receive `review`: immutable
metadata supplied by a delegated patch command or an interactive history selection, or `null` for
ordinary reviews. The bundled `hunk:review-info` top pane uses this to show change-request and
commit identity without taking any rows when no supported descriptor exists. Pane extensions that read
`review` should declare `"hunk": { "apiVersion": 17 }` in their manifest so older Hunk versions
refuse them cleanly instead of mounting with an incomplete prop contract.

`onActivate()` observes a primary mouse press anywhere in the pane's content,
including content nested in a `<scrollbox>`. Use it to focus an extension-owned
editor or update pane-local active state without adding mouse handlers to every
row. Hunk does not stop propagation or prevent the press, so extension-local
mouse behavior can continue. Other mouse buttons do not activate the pane. A
thrown or rejected callback is contained and reported as an attributed warning.

`hunk:files` is a named role, not a left-edge location. The
`hunk.view.toggleFilesPane` command (`s` by default) and **View → Files pane**
follow the resolved owner of that slot, whether the replacement is on the left,
right, top, or bottom. They toggle only that owner; independently registered
panes keep their own open state. User remaps and unbindings of
`hunk.view.toggleFilesPane` apply to the resolved slot in the usual way. The
former `hunk.view.toggleSidebar` id remains a compatibility alias.

`currentLine: true` opts into the selected-row painter. `currentLine.render(side, width)`
paints one side as a clipped row; `currentLine.side` and `currentLine.line` are
the same public source address command handlers see on `ctx.selection.currentLine`
(context rows use Hunk's canonical new-side). The installable
[Hunk Lens](https://github.com/modem-dev/hunk-lens) extension uses the painter; a
blame or diagnostic pane can use the address without waiting for a keypress.
Install the lens with `hunk extension install modem-dev/hunk-lens`.

Import `react` normally — Hunk serves its own React instance to extension files
at import time, so hooks, context, and JSX all run on the reconciler drawing the
rest of the app. **Never bundle or vendor a copy of React into an extension**: a
second React means a second hooks dispatcher, and the component will fail to
render. OpenTUI elements (`box`, `text`, `scrollbox`, ...) are plain intrinsic
elements and need no import.

The component receives fresh props as the app changes:

| Prop                | What it is                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `review`            | immutable review-source metadata (`change-request`, `commit`, or `comparison`), or `null` for ordinary reviews                                                            |
| `files`             | the visible reviewed files, review-stream order, filtered, frozen views (each carries `changeType`, `statsTruncated`, and `hunks` summaries beside the usual file fields) |
| `selectedFileId`    | the selected file, or `null`                                                                                                                                              |
| `selectedHunkIndex` | the selected hunk within that file, or `null`                                                                                                                             |
| `placement`         | the accepted terminal edge                                                                                                                                                |
| `width`             | exact terminal columns in the host-owned rectangle                                                                                                                        |
| `height`            | exact terminal rows in the host-owned rectangle                                                                                                                           |
| `currentLine`       | selected-row painter plus `{ side, line }` when the registration opts in, otherwise `null`                                                                                |
| `theme`             | hex color tokens from the active theme, updated on theme switch                                                                                                           |
| `keybindings`       | the current command bindings, resolved from defaults and the user's `[keybindings]` table                                                                                 |
| `actions`           | navigation, clipboard, and notifications the pane may trigger                                                                                                             |

API-v3 sidebar names remain as deprecated aliases: use `registerPane`,
`ExtensionPane*`, `ctx.panes`, and `replaces: "hunk:files"` in new code.

`actions.selectFile(fileId)`, `actions.selectHunk(fileId, hunkIndex)`, and
`actions.revealLine(fileId, side, line)` route through the same review
controller as the built-in files pane and the keyboard shortcuts, so the review
stream scrolls, selection updates, and the `selection_changed` event fires
exactly as if the user had clicked a built-in row. `actions.copyText(text)` uses the terminal's
OSC 52 clipboard integration and returns `false` when unavailable. Extensions that call it or read
`theme.copyAction` should declare `"hunk": { "apiVersion": 20 }` in their manifest. `actions.notify(message,
type?)` shows a toast attributed to your extension. An action given a file id
that is not currently visible is refused with a warning rather than corrupting
the selection. A pane's `actions` carry the same navigation methods a command
handler's [`ctx.navigation`](#navigating-the-review) does, with the same
guarantees.

The three hunk surfaces line up by design: each file's `hunks` lists public
`ExtensionDiffHunk` summaries (`index`, the `@@` header, inclusive old/new
line spans) in render order, `selectedHunkIndex` reports the same index, and
`actions.selectHunk(fileId, hunkIndex)` accepts it. That is everything a hunk
checklist, a per-hunk progress view, or an agent-annotation navigator needs —
match an annotation's `oldRange`/`newRange` against the summaries' spans to
find its hunk — without touching the opaque `metadata`.

A component that owns a key event should ask the injected `keybindings`
manager about a **command id**, rather than hard-coding the command's default
chord. Like Pi's injected `KeybindingsManager`, this keeps local component
behavior synchronized with the user's remaps and unbindings:

```ts
import type { ExtensionKeyEvent, ExtensionPaneProps } from "hunkdiff/extension";

export function handlePaneKey(props: ExtensionPaneProps, key: ExtensionKeyEvent) {
  const nextFile = props.files[1];
  if (nextFile && props.keybindings.matches(key, "hunk.review.nextFile")) {
    // The user may have remapped this from `.` to another chord.
    props.actions.selectFile(nextFile.id);
  }
}
```

`keybindings.getKeys(commandId)` returns the current chord list for a label or
hint; unknown and unbound commands return an empty list. `matches(key,
commandId)` returns `false` for those commands too. The manager includes both
Hunk commands and extension commands under their documented ids, and its key
event argument is structural — OpenTUI's `KeyEvent` works directly.

`matchesKey`, `parseKeyChord`, and `matchesKeyChord` remain exported for
extension-local keys that intentionally are not commands. Prefer a named
command whenever a shortcut should be user-remappable.

Hunk owns pane geometry, dividers, and responsive omission. Render failures are
contained to that pane; a failed `hunk:files` replacement restores file
navigation.

Props carry the pane's exact `width` and `height`. Use a `<scrollbox>` ref for
scroll position and selection following; Hunk serves the matching
`@opentui/core` instance to extensions.

#### Scrolling: the scrollbox ref contract

The one behavior a list pane always ends up needing is following the
selection. Give your rows stable `id` props, hold a ref to the scrollbox, and
scroll the selected row into view from an effect:

```tsx
import { useEffect, useRef } from "react";
import type { ScrollBoxRenderable } from "@opentui/core";
import type { ExtensionPaneProps } from "hunkdiff/extension";

function HunkList({
  files,
  selectedFileId,
  selectedHunkIndex,
  theme,
  actions,
}: ExtensionPaneProps) {
  const scrollRef = useRef<ScrollBoxRenderable | null>(null);

  // Follow policy is deliberately yours: the host never scrolls a pane it
  // cannot see into, so decide here when (and whether) to follow.
  useEffect(() => {
    if (selectedFileId !== null) {
      scrollRef.current?.scrollChildIntoView(`row-${selectedFileId}-${selectedHunkIndex ?? 0}`);
    }
  }, [selectedFileId, selectedHunkIndex]);

  return (
    <scrollbox ref={scrollRef} width="100%" height="100%" scrollY={true} focused={false}>
      {files.flatMap((file) =>
        (file.hunks ?? []).map((hunk) => {
          const selected = file.id === selectedFileId && hunk.index === selectedHunkIndex;
          return (
            <box
              key={`${file.id}:${hunk.index}`}
              id={`row-${file.id}-${hunk.index}`}
              style={{ width: "100%", height: 1 }}
              onMouseUp={() => actions.selectHunk(file.id, hunk.index)}
            >
              <text
                content={` ${file.path}  ${hunk.header}`}
                style={{ fg: selected ? theme.accent : theme.text }}
              />
            </box>
          );
        }),
      )}
    </scrollbox>
  );
}
```

The ref surface this recipe stands on is the exact one the built-in files pane
runs on:

- **`scrollChildIntoView(id)`** scrolls the descendant with that `id` prop
  into view.
- **`scrollTop`** and **`viewport.height`** read the current scroll offset and
  the scrollbox's live viewport rows. A read before the first layout pass
  reports `0`, so viewport-dependent code belongs behind the events below
  rather than a bare mount effect.
- **`verticalScrollBar.on("change", handler)`**,
  **`viewport.on("layout-changed", handler)`**, and
  **`viewport.on("resized", handler)`** report scrolling and pane resizes;
  unsubscribe with the matching `.off` in your effect's cleanup.

That is enough to window a long list yourself: the built-in files pane renders
only the rows near the viewport, plus spacer boxes sized from those same
reads (its render-window helper is host code, but nothing it computes needs
anything beyond this surface — `useTerminalDimensions` from `@opentui/react`
serves as its pre-first-layout viewport estimate).

One honest caveat: this contract rides on OpenTUI's renderable API, served at
whatever version Hunk pins — a wider surface than `hunkdiff/extension` itself.
The built-in files pane uses the same calls, so changes that break this contract
break Hunk first. Keep scroll handling small and behind your own helpers.

Its implementation lives in `packages/hunk/src/extensions/default/ui/sidebar/` and serves as
the reference for third-party panes.

#### Pane state from events

Lifecycle handlers run outside React, but a pane component only rerenders
when React sees a change. The recipe that connects them is a module-local store
read through `useSyncExternalStore`: the event handler updates the store, and
any mounted component subscribed to it rerenders — while the store keeps
accumulating even when the pane is closed.

```tsx
import { useSyncExternalStore } from "react";
import type { HunkExtensionAPI } from "hunkdiff/extension";

let viewedPaths: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();

function markViewed(path: string) {
  if (viewedPaths.has(path)) return;
  viewedPaths = new Set(viewedPaths).add(path); // new reference, so React sees the change
  for (const listener of listeners) listener();
}

function useViewedPaths() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => viewedPaths,
  );
}

function ViewedCount() {
  const viewed = useViewedPaths();
  return <text content={`${viewed.size} files viewed`} />;
}

export default function (hunk: HunkExtensionAPI) {
  hunk.on("file_viewed", ({ file }) => markViewed(file.path));
  hunk.registerPane({ id: "progress", component: ViewedCount });
}
```

Snapshots must be immutable — replace the set instead of mutating it, so
`useSyncExternalStore` can compare references. Storing state in a hook inside
the component instead would lose it every time the pane closes and unmounts.

### Status line

The bottom status row — where Hunk shows the file filter, notices, and the
keyboard-mode badge — is a host-owned surface extensions write to through two
small capabilities: persistent **items** and one inline **prompt**.

This example counts literal, non-overlapping matches in the selected file's
patch text (including patch headers), not its whole source document. The right
item counts `file_viewed` events, including revisits and reloads, rather than
unique files.

```ts
import type { ExtensionDiffFile, HunkExtensionAPI } from "hunkdiff/extension";

/** Count literal, non-overlapping occurrences in the selected patch. */
function countMatches(query: string, file: ExtensionDiffFile | null): number {
  if (!query || !file) return 0;
  return file.patch.split(query).length - 1;
}

export default function (hunk: HunkExtensionAPI) {
  let viewed = 0;

  hunk.registerCommand({ id: "find", title: "Search diff content", key: "ctrl+f" }, async (ctx) => {
    const query = await ctx.prompts.line({ prefix: "/", placeholder: "literal text" });
    if (query === null) return;

    const hits = countMatches(query, ctx.selection.file);
    ctx.statusLine.set({
      id: "status",
      spans: [
        { text: `[${hits}] `, tone: "accent" },
        { text: query, tone: "muted" },
      ],
    });
  });

  hunk.on("file_viewed", (_payload, ctx) => {
    viewed += 1;
    ctx.statusLine.set({
      id: "viewed",
      spans: [{ text: `${viewed} viewed` }],
      alignment: "right",
    });
  });
}
```

**Items** are declarative text, not components. `ctx.statusLine.set(item)`
sets or replaces one item and `clear(id)` removes it; ids are scoped to your
extension. `spans` use the same symbolic vocabulary as host-rendered file-view
rows — `text`, an optional `tone` (`muted`, `accent`, `accent-muted`, `syntax`,
`added`, `removed`), and optional `attributes` (`bold`, `italic`, `underline`,
`strikethrough`) — so Hunk measures them without a theme and paints them with
the active one. `alignment` defaults to `"left"`; right items sit beside the
host badge. When the row overflows, the lowest-`priority` items (default `0`)
are dropped whole, newest first among equals, and the last survivor is
truncated with an ellipsis; the badge is never dropped. A set item keeps the
row on screen, exactly like a non-empty filter does, so clear items that
should not cost a row while idle. Items persist across ordinary content reloads
and clear when the extension registry is replaced or the review unmounts.

**Prompts** are promise-shaped. `ctx.prompts.line({ prefix?, placeholder?,
initial?, onChange? })` draws a real input with a cursor on the status row and
resolves the submitted text, or `null` on cancel. `prefix` is painted before
the input and is not part of the value; `initial` is where the field starts
(use it to reopen with the last query); `onChange` is called on every edit for
consumers that react while the user types. Enter resolves; Escape clears a
non-empty buffer first and cancels second — the same two-step Escape the file
filter has. While a prompt is open it owns typing the way the filter does:
after dialogs and menus, before file-view and session keyboard modes and the
command table, so a bound key is text rather than a command. One prompt is
open at a time; a second request queues behind the first, across extensions
too. A session reload cancels open and queued prompts, and a request during
teardown resolves `null` immediately. Prompts from installed extensions carry
the `ext <your-id>` marker before the prefix, like toasts and dialogs.

Where the controls appear: command handlers get `ctx.statusLine` and
`ctx.prompts`; event, bus, and keyboard-mode handlers get `ctx.statusLine`
only. The factory object gets neither, so every write belongs to a handler
whose lifetime Hunk can scope. A malformed item (blank `id`, non-array `spans`,
a span without string `text`, an unknown tone) throws from `set`; malformed
prompt options reject the promise; a throwing `onChange` is reported once and
the prompt continues.

### `hunk.registerFileView(view)` (experimental)

A file view is an alternate **host-rendered** presentation of one file in the
same top-to-bottom review stream. It is not a whole-file React component: Hunk
owns row measurement, scrolling/windowing, hunk navigation, and fallback to
Pierre's raw diff. A constrained, experimental
[fixed-height JSX row POC](file-view-jsx-poc.md) lets individual validated rows
paint OpenTUI content without taking over that geometry. Raw is always the
default; users select a matching view from **View** for the selected file.
Rows may bind themselves to exact old/new source ranges so Hunk can insert its
own inline review-note cards without giving the extension note contents or
geometry.

The installable
[`examples/extensions/rendered-markdown/`](../examples/extensions/rendered-markdown/)
uses this contract for a parsed Markdown preview. It is intentionally not bundled
or loaded by default; copy the folder into `~/.config/hunk/extensions/`, install
its dependency there, and its View entry and `F8` command become available.

```ts
import type { HunkExtensionAPI } from "hunkdiff/extension";

export default function (hunk: HunkExtensionAPI) {
  hunk.registerFileView({
    id: "plain-markdown",
    title: "Plain Markdown",
    matches: (file) => file.path.endsWith(".md"),
    async layout(input) {
      const document = await input.readDocument("new");
      if (!document || document.length > 100_000) return null;

      const sourceLines = (document.endsWith("\n") ? document.slice(0, -1) : document).split("\n");
      const rows = sourceLines.map((text, index) => ({
        id: `line:${index + 1}`,
        spans: [{ text: text || " " }],
        sourceRanges: [{ side: "new" as const, range: [index + 1, index + 1] as const }],
      }));
      if (rows.length === 0) return null;

      return {
        rows,
        hunkRows: (input.file.hunks ?? []).map((hunk) => ({
          startRow: Math.max(0, (hunk.newRange?.[0] ?? 1) - 1),
          endRow: Math.min(rows.length - 1, (hunk.newRange?.[1] ?? 1) - 1),
        })),
      };
    },
  });
}
```

`layout` receives one readonly input containing `file`, `width`, `signal`,
`changes`, and `readDocument`. `input.file` is the same frozen public
`ExtensionDiffFile` panes receive. `input.changes` exposes typed added and
removed ranges without Pierre metadata;
complete old/new hunk ranges remain available through `input.file.hunks`.
`readDocument("old" | "new")` is lazy and cached by Hunk; it resolves exact
text or `null` when that side is absent, unavailable, too large, or fails to
load. Never treat `null` as an exception: return `null` from `layout` to keep
raw diff active.

