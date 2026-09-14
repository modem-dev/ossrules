---
name: agents-md-entry
description: Evaluate an open source project's AGENTS.md and produce a corpus entry for the /agents-md directory. Use when adding a project to the directory, refreshing an existing entry, or running a batch of candidate repositories.
---

# Adding a project to the AGENTS.md directory

One entry is one JSON file in `content/agents-md/<slug>.json` plus one avatar in
`public/agents-md/<slug>.png`. Nothing else changes: the directory page, the
project page, the technique filters and the sitemap all derive from the corpus.
Adding ten projects is ten JSON files and ten PNGs.

This is written to be run independently, one project per run, so the work can be
fanned out. Do not read the other entries before writing yours — the analysis
should come from the file in front of you, not from matching the house voice of
entries someone else wrote.

## The rule that matters most

**Every `quote` is verbatim.** Character for character, from the real file, on
the repository's default branch. Paraphrase belongs in `body`, never inside a
quote. One misquote makes the whole directory untrustworthy, so the last step
below verifies them mechanically rather than by eye.

## Voice

Describe what the file does. Do not rate it.

| Write this | Not this |
| --- | --- |
| "Lists thirteen metaphorical words that may not appear." | "Has a brilliant section on plain language." |
| "The rule names the exact files it applies to." | "This is the best example in the collection." |
| "39 lines: build commands, three directories, two absolute rules." | "Proof that a short AGENTS.md can be great." |

No superlatives, no ranking against other entries, no "unusually", "genuinely",
"clearest", "most". A reader decides whether a technique suits their repo; the
entry gives them what it is. `steal` is the one place that is prescriptive,
because a takeaway is advice by definition — keep it actionable and drop the
adjectives.

Site copy rules apply: **no em dashes**, and none of the filler list in
`.cursor/rules/project.mdc`.

## Procedure

### 1. Confirm the repository and get the canonical file

Resolve renames first. `sst/opencode` now lives at `anomalyco/opencode`, and
`denoland/fresh` at `freshframework/fresh`; raw URLs still redirect, so a fetch
succeeding does not mean the owner is current. Search the repo to get the
current `full_name`, `stargazers_count`, `language` and `default_branch`.

Fetch from the **default branch**, not `main` by habit. Storybook's default is
`next` and its `main` carried an older file; Omarchy's is `quattro`.

```bash
curl -sSL -o /tmp/<slug>.md \
  "https://raw.githubusercontent.com/<owner>/<repo>/<default-branch>/AGENTS.md"
```

If the file is under about 40 lines of build commands with nothing else, it is
thin material for an entry. Say so rather than padding it.

### 2. Record the upstream commit

The entry pins the revision it was written against, which is what the "last
updated" link points at and what makes staleness detectable later. The REST API
is blocked in some environments; a blobless clone is not, and takes seconds:

```bash
d=$(mktemp -d)
git clone -q --filter=blob:none --no-checkout --single-branch \
  --branch <default-branch> "https://github.com/<owner>/<repo>" "$d"
git -C "$d" log -1 --format='%H|%cI' -- AGENTS.md
rm -rf "$d"
```

That gives `lastCommit.sha` (full 40 characters) and `lastCommit.date` (convert
to UTC ISO 8601). Set `evaluatedAt` to today's date in `YYYY-MM-DD`.

### 3. Measure the file

Every number in `file` is measured. Never estimate, and never adjust a stale
number by eye — re-run this:

```bash
f=/tmp/<slug>.md
echo "bytes=$(wc -c < $f) lines=$(wc -l < $f) words=$(wc -w < $f)"
echo "headings=$(grep -cE '^#{1,6} ' $f)"
echo "bullets=$(grep -cE '^\s*[-*] ' $f)"
echo "codeBlocks=$(grep -cE '^\s*```' $f)"
echo "docLinks=$(grep -oE '\]\([^)h][^)]*\)' $f | wc -l)"
```

`docLinks` counts relative links out to other files in the same repo. A high
count relative to length is what distinguishes a router from a self-contained
file.

### 4. Read the whole file

Read it end to end before writing anything. The entry's value is that a reader
can skip the original, which only holds if you did not skim it.

While reading, look for what this file does that a generic one would not:

- rules aimed at agent behavior rather than at the codebase
- a rule with its reason attached, especially where the reason is non-obvious
- prohibitions, and what happens when the user asks anyway
- anything about the file's own maintenance, or its precedence against other files
- limits on the change rather than on the code
- places the file admits a gap: a slow suite, a blind test, a known footgun

### 5. Get the avatar

```bash
curl -sL -o public/agents-md/<slug>.png \
  "https://avatars.githubusercontent.com/<owner>?s=160"
```

Use `avatars.githubusercontent.com/<owner>`, not `github.com/<owner>.png`, which
can be proxy-blocked. Confirm it is a real PNG with `file`.

### 6. Write the entry

Write `content/agents-md/<slug>.json`. The filename stem and `slug` must match.

```jsonc
{
    "slug": "ghostty",                    // kebab-case, matches filename and avatar
    "name": "Ghostty",                    // as the project writes it
    "owner": "ghostty-org",               // current GitHub owner
    "repo": "ghostty",
    "tagline": "...",                     // what the project is, one line, for readers who have not heard of it
    "language": "Zig",                    // GitHub's primary language, exact spelling
    "stars": 61058,                       // integer snapshot
    "defaultBranch": "main",
    "lastCommit": { "sha": "<40 chars>", "date": "2026-04-08T17:34:52Z" },
    "evaluatedAt": "2026-09-14",   // the day you wrote this analysis
    "file": { "bytes": 0, "lines": 0, "words": 0, "headings": 0, "bullets": 0, "codeBlocks": 0, "docLinks": 0 },
    "references": [               // documents the file routes to; [] when self-contained
        { "path": "docs/testing.md", "label": "Testing" },
        { "path": "AGENTS.md", "kind": "pattern", "label": "the nearest nested AGENTS.md" }
    ],
    "hook": "...",                        // one sentence, shown in the directory row
    "summary": "...",                     // two or three sentences: what kind of document this is
    "patterns": ["hard-prohibition"],     // ids from the taxonomy, see below
    "techniques": [
        {
            "title": "...",               // names the move, not a verdict on it
            "body": "...",                // two to four sentences: what it does and the reason the file gives
            "quote": "...",               // optional, VERBATIM
            "pattern": "hard-prohibition" // optional, when this technique is an instance of a taxonomy entry
        }
    ],
    "steal": ["..."],                     // three to five takeaways, each actionable in another repo
    "outline": ["..."]                    // the file's own top-level sections, in order
}
```

Aim for four to six `techniques`. Fewer than three usually means the file was
skimmed; more than seven usually means routine content was included.

**`hook` is the one line most readers see.** Make it specific to this file. Good
hooks name a number, a structure, or a rule: "42 lines that open with the
precedence order between instruction sources." A hook that would fit any project
is a wasted row.

### 7. Choose technique ids

Valid ids are the `PATTERNS` array in
`components/agents-md/agents-md-data.ts`. Read it before tagging; the validator
rejects unknown ids.

Tag a technique only when the file genuinely does that thing. An over-tagged
entry makes the filter useless, which is the one thing the taxonomy is for. If a
recurring move has no id and you have seen it in **two or more** projects,
propose adding it to `PATTERNS` rather than forcing it into a near-match — a new
id is a separate, deliberate change, not a side effect of adding a project.

### 8. Download the files the entry reads

```bash
pnpm sync:agents-md-files -- --slug <slug>
```

This writes `public/agents-md/files/<slug>/` — a copy of the AGENTS.md and of
every reference, taken at the entry's pinned commit, plus a `manifest.json` and
the repository's detected license. The site serves these so a reader can open
any of them without leaving the page, and so the file on screen is the same
revision the analysis describes.

Never hand-write anything under that directory. It is generated, and the
validator fails when it disagrees with the entry.

Read what the run prints. A path reported as not resolving is a finding, not a
mistake to correct: it means the AGENTS.md names a document the repository does
not contain. Leave the path exactly as the file writes it — the site renders it
as unresolved, which is the honest result. Only fix it if you transcribed it
wrong in step 6.

### 9. Verify

```bash
npx tsx scripts/validate-agents-md.ts   # schema, slug/filename match, avatar, vendored files, duplicate repos
pnpm typecheck
pnpm build                              # the corpus is read at build time
```

Then verify the quotes mechanically. Nothing else catches a near-miss:

```bash
python3 - <<'PY'
import json, re, sys
slug = "<slug>"
entry = json.load(open(f"content/agents-md/{slug}.json"))
source = open(f"/tmp/{slug}.md", encoding="utf-8").read()
norm = lambda t: re.sub(r"\s+", " ", t).strip()
bad = 0
for t in entry["techniques"]:
    q = t.get("quote")
    if q and norm(q) not in norm(source):
        bad += 1
        print("NOT VERBATIM:", q[:120])
print("mismatched:", bad)
sys.exit(1 if bad else 0)
PY
```

### The references list

`references` is the documents the file **tells the agent to read**: markdown
links to other docs, and nested instruction files named in prose
(`crates/AGENTS.md`, `.agents/skills/*/SKILL.md`). It is not the repo map — a
path to source code is navigation, not routing, and does not belong here.

Include `.md`, `.rst` and `.mdx` targets plus any `AGENTS.md` / `CLAUDE.md` /
`SKILL.md`. Keep the markdown link text as `label` only when it says something
the path does not. An empty array is a real answer: five of the first sixteen
entries route nowhere, and that is what identifies a self-contained file.

Mark a reference `"kind": "pattern"` when it names a **shape rather than one
file** — "the nearest nested `AGENTS.md`", "the changed provider's changelog".
These have no single copy to download and nothing to open, so give them a
`label` that says what they stand for. A path that merely happens to be broken
is *not* a pattern; leave it as an ordinary reference and let step 8 record it
as missing.

## Refreshing the corpus

Entries go stale two ways, and only one is mechanical.

**Mechanical.** Measurements and the upstream commit can be re-derived:

```bash
pnpm refresh:agents-md            # report what changed upstream
pnpm refresh:agents-md -- --write # apply measurements and commits, then re-download the files
```

`--write` re-runs the file sync for you, because moving an entry's pinned commit
without re-downloading its files would show one revision of a document beside
measurements from another. To check for that drift without changing anything:

```bash
pnpm check:agents-md-files        # every vendored copy still matches its pinned commit
```

**Not mechanical.** When the file itself has changed, the techniques and quotes
describe a revision that no longer exists. The refresh script lists those
entries; each one goes back through steps 4 to 9 above, and `evaluatedAt` moves
to the day the analysis is rewritten. A stale analysis with fresh numbers is
worse than either alone, because the numbers make it look current.

The site flags this on its own: `isEntryStale` compares `lastCommit.date`
against `evaluatedAt`.

**Cadence.** Run the refresh monthly. Star counts are deliberately not touched
by the script, since the GitHub API is unreachable from some environments and a
wrong number is worse than a dated one; update `stars` and `STATS_AS_OF` by hand
when the whole corpus is refreshed.

## Running a batch

One project per run, one JSON file per run. Keep runs independent so a bad entry
is one file to fix. Before starting a batch, check
`content/agents-md/` for slugs that already exist; the validator also fails on
two entries claiming the same repository.

Candidate repositories need a real `AGENTS.md` at the default branch. Check
before assigning the work — a symlink to `CLAUDE.md` shows as a file of about
nine bytes and is not an entry.
