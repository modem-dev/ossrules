# Usability review

Reviewed September 15, 2026, against the local app on port 3001. This is a heuristic review with hands-on browser checks, not a user study. Recommendations are proposals; application code was not changed.

## Scope

- Desktop at the browser's default size and a 390 × 844 mobile viewport.
- Project directory, technique directory, opencode and Svelte instruction pages, global skill search, and OpenClaw's autoreview skill with supporting files.
- Project search, return navigation, skill search, file switching, source excerpt navigation, and Escape/focus return from the source viewer.
- Visual checks used the light theme. Dark palette definitions were inspected in code, but dark rendering was not visually verified. This was not a full accessibility audit.

## Overall assessment

The cream, teal, typography, two-column directory, and source-backed explanations form a coherent reference library. The biggest opportunity is to bring useful content forward: reduce introductory space, subordinate metadata, and keep readers oriented when moving between results and documents.

Preserve the desktop source tray. Opening an opencode quote placed the source beside the explanation and highlighted line 26. The mobile source viewer also provided a readable full-screen document; Escape returned focus to the opening button. These are useful existing interactions.

## Fix first

### 1. Put the selected skill document ahead of the mobile file inventory

**Observed:** OpenClaw's autoreview page lists all 15 bundle entries before the article on mobile. Long paths wrap over several lines. After selecting AGENTS.md, its article heading was still about 1,198 pixels below the viewport's top, so the change was not visible where the user tapped.

**Recommendation:** Replace the mobile inventory with a compact disclosure or file picker showing the selected filename and total count. Close it after selection and bring the article heading into view. Keep omitted files discoverable with their explanations. On desktop, group paths into folders and consider a separately scrollable file list for large bundles.

**Acceptance:** A reader can see document content on the first screen, switch to a supporting file, and immediately see which document opened.

Implementation: [skill page](../app/[owner]/[repo]/skills/[skill]/page.tsx), [responsive styles](../app/globals.css).

### 2. Preserve project search and filters when returning from a result

**Observed:** Search for `svelte`, open Svelte, then press browser Back. The search field becomes empty. Project filters live in component state; only an initial technique filter is read from the URL. Skills already preserve their query in the URL.

**Recommendation:** Store project query, language, technique, sort, and direction in the URL, following the skills approach. Restore result position on Back. Keep a visible clear action whenever filters are active.

**Acceptance:** Back, refresh, and sharing a filtered URL preserve the same collection and ordering.

Implementation: [project explorer](../components/project-explorer.tsx).

## Improve hierarchy

### 3. Make the home page a faster entrance to the directory

**Observed:** At 390 × 844, the first project name appears near the bottom of the first screen; its description is below it. The hero, three statistic tiles, filters, and snapshot row consume most of the screen. On desktop, only the beginning of the first result row is visible at the default browser height.

**Recommendation:** Keep the branded masthead but reduce its padding and height. Turn the project and skill counts into a compact line. Remove aggregate GitHub stars from the hero; individual stars can remain secondary metadata and an optional sort. Consider name order as the neutral default. Popularity currently controls both the largest statistic and the initial ordering.

**Acceptance:** Mobile shows at least one complete project entry without scrolling. Counts continue to come from the dataset; snapshot scope remains available beside the relevant statistic.

Implementation: [home page](../app/page.tsx), [project explorer](../components/project-explorer.tsx).

### 4. Lead project pages with the explanation

**Observed:** opencode puts a document tree before “What makes it useful.” The sidebar places eight measurements and four provenance rows before “On this page.” On narrow screens the sidebar comes after the article, reducing the usefulness of its navigation.

**Recommendation:** Order the main content as overview, techniques and source excerpts, then takeaways. Keep documents accessible through a compact “Browse files” disclosure near “Read AGENTS.md.” Put page navigation above detailed facts on desktop and near the article entrance on mobile. Show lines and tokens at a glance; collect file size, heading counts, bullet counts, encoding, and other measurements under “File details.” Keep the pinned source and analysis date explicit.

**Acceptance:** The first screen explains what the file offers and provides an obvious source action. Supporting material is one action away.

Implementation: [project page](../app/[owner]/[repo]/page.tsx).

### 5. Use one name for the technique collection

**Observed:** Navigation says “Agent Rules,” the page introduces “patterns,” and the filters and cards say “techniques.” “Agent Rules” can sound like another directory of the instruction files already available under Projects.

**Recommendation:** Use “Techniques” in navigation, page headings, filters, and cross-links. Introduce it once as “Recurring techniques in agent instructions.” Retain the existing URL if useful. Simplify specialized labels where possible, for example “Router files” to “Task routing” and “Ratchets” to “One-way constraints,” with their precise definitions still available.

**Acceptance:** Projects, Techniques, and Skills each describe a distinct way into the library.

Implementation: [header](../components/site-header.tsx), [technique page](../app/agent-rules/page.tsx), [footer](../components/site-footer.tsx).

## Refine discovery and controls

### 6. Rank skill searches by relevance and clarify duplicate names

**Observed:** Searching `code review` returned four results in alphabetical order. The skill named `code-review` came after `astro-code-review` and `autoreview`. The default directory begins with two `1password` entries; their owning projects appear below the description and path. Search currently uses a contiguous substring across metadata.

**Recommendation:** Rank normalized exact names first, then name matches, then descriptions and paths. Normalize spaces and hyphens and match multiple query words without requiring one contiguous phrase. Move the project identity beside or immediately below the skill name, so duplicate names are distinguishable before reading their descriptions. Provide Clear filters for nonempty filtered results too; currently the skills reset button appears only with zero matches.

Keep upstream descriptions intact. If editorial summaries are added later, distinguish them from original metadata rather than silently rewriting the source.

Implementation: [skill listing](../lib/skill-list.ts), [skill explorer](../components/skill-explorer.tsx).

### 7. Put real examples within reach on technique cards

**Observed:** Cards define the technique, hide the rationale under “Why it works,” and show project logos. Clicking a project opens the top of its general explanation rather than the relevant example.

**Recommendation:** Include one short, verified excerpt or named example per technique and link directly to its location in a project page. Keep the full matching collection as a secondary link. Rename “Why it works” to “Why use it” or “How it helps”; the current label implies demonstrated effectiveness beyond an editorial observation.

Implementation: [technique page](../app/agent-rules/page.tsx).

### 8. Clarify link behavior and incomplete downloads

**Observed:** Project cards and “Read AGENTS.md” use an upward-right arrow, even though they navigate internally or open a tray. The same symbol is used for external GitHub links. The instruction reader switches “Markdown / Raw” through a select, while the skill reader uses “Source / Read” links. The partial autoreview bundle shows “download unavailable” with no adjacent explanation or direct recovery action.

**Recommendation:** Use a right arrow for internal navigation, a document icon or no arrow for a tray, and the external arrow for outbound links. Standardize both readers on “Read / Source.” For incomplete bundles, offer an adjacent “Why?” disclosure that names unavailable files and links to the pinned upstream directory. Preserve the disabled full-bundle download and the distinction between included and omitted material.

Implementation: [project explorer](../components/project-explorer.tsx), [source tray](../components/file-tray.tsx), [skill page](../app/[owner]/[repo]/skills/[skill]/page.tsx).

### 9. Reduce secondary visual competition

**Observed:** Paths, provenance, counts, contributors, and file statistics accumulate across the skill header and cards. Several metadata labels are only 10–11 pixels. On a skill detail page reached through global Skills, the main navigation highlights Projects.

**Recommendation:** Give the title, owner, task description, and read/download actions the strongest hierarchy. Keep contributor attribution, paths, and provenance available in a compact details area. Increase small functional labels to a comfortable reading size. Make Skills remain the active global section on skill readers, or use a deliberate parent-section model with a clear return-to-results link.

Preserve Modem attribution and the project-page upsell; their placement after the reference material is appropriate.

## Specific copy cuts

These edits apply to interface and editorial copy, not vendored source or quotations.

| Current | Suggested |
| --- | --- |
| Agent rules and skills from open source projects. | Agent instructions and skills from open source. |
| Different projects. Recurring ideas. Find a technique, then see how real projects put it to work. | See how projects use each technique. |
| Explore task-specific agent workflows, their instructions, and the files they bring along. | Browse skill instructions and supporting files. |
| The file, explained / What makes it useful | Keep one heading: Overview |
| Quoted passages are verbatim. Open one to see it in the source. | Remove; keep the explicit View in source action. |
| Put it to work / Borrow this for your repo | Keep one heading: Ideas to borrow |
| 03 / From this file | Remove “From this file”; the page already establishes this. |
| Show all 32 lines | Expand file tree |
| Why it works | Why use it |
| 15 bundle files | 15 files; show included/omitted counts where applicable |
| Partial bundle · download unavailable | Incomplete bundle, with a Why? disclosure |
| Copy stored at the pinned commit. | Source snapshot, followed by the commit and license links |
| Good instructions are worth sharing. | Optional removal; footer navigation and attribution are sufficient. |

Also remove the opencode overview's “The highest ratio of code to prose in the directory.” It introduces a superlative where the concrete observation already does the work.

## Suggested delivery order

1. Mobile file picker and project filter persistence.
2. Copy cleanup, consistent navigation labels, and link icons.
3. Compare compact masthead and project-page hierarchy mockups before implementing the larger visual changes.
4. Search relevance and direct links to technique examples.

For implementation, verify narrow and desktop layouts in both themes, keyboard navigation, source fidelity, and Back behavior. Run the repository's required lint/type checks, plus build and focused tests where the changes affect routing, data loading, or reference matching.
