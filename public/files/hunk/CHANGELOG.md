# Changelog

## 0.22.0

### Minor Changes

- [#1044](https://github.com/modem-dev/hunk/pull/1044) [`2124066`](https://github.com/modem-dev/hunk/commit/21240662080433a987fe9dc98f5e2ff865b3b813) - Add visible keyboard selection for review notes. Line-by-line movement now stops on every comment and reply in rendered order; saving or clicking a note makes it active, with next/previous note navigation and persistent edit, reply, and delete shortcuts on the active note.

- [#1012](https://github.com/modem-dev/hunk/pull/1012) [`a83da6d`](https://github.com/modem-dev/hunk/commit/a83da6d7d11a873da80c824e26497b046201e9c7) - Add session CLI support for replying to existing inline review notes with inherited code anchors.

- [#931](https://github.com/modem-dev/hunk/pull/931) [`d0bf162`](https://github.com/modem-dev/hunk/commit/d0bf162dda6d5de828f64fd432ba9e6660489ef7) - Add persistent mouse and keyboard diff selections with explicit Comment, Copy, and Clear actions, including multiline review-note anchors.

- [#986](https://github.com/modem-dev/hunk/pull/986) [`7d27181`](https://github.com/modem-dev/hunk/commit/7d2718133b381aacde5362cd1807a3372ae1bc0d) - Let extension CLI commands attach validated provider-neutral review metadata when they delegate a patch into Hunk, expose it to extension panes and live-session snapshots, and show delegated change-request identity in a concise built-in top pane.

- [#1039](https://github.com/modem-dev/hunk/pull/1039) [`93250a8`](https://github.com/modem-dev/hunk/commit/93250a8128f183939bb00fc84ca27c48d1eb7a22) - Add configurable `hunk.history.*` command keybindings to the interactive history view.

- [#1009](https://github.com/modem-dev/hunk/pull/1009) [`e1001ae`](https://github.com/modem-dev/hunk/commit/e1001ae8493806aab2c120ac4f9edd1dfb79f7cf) - Allow folders in the wide sidebar tree to be collapsed and expanded with the mouse while file navigation reveals destinations hidden inside collapsed folders.

- [#1016](https://github.com/modem-dev/hunk/pull/1016) [`07c5892`](https://github.com/modem-dev/hunk/commit/07c58927fe13395cb5e7c10d498d78dcefbd3725) - Show history-style commit metadata in the review-info panel when opening a commit from interactive `hunk log`, with a copyable right-aligned revision and public pane clipboard/theme support.

- [#1064](https://github.com/modem-dev/hunk/pull/1064) [`661534f`](https://github.com/modem-dev/hunk/commit/661534f40a4c258f756679797c7e6738b72051da) - Show commit and comparison information, including short revision IDs, above direct CLI revision
  reviews for Git, Jujutsu, and Sapling.

- [#1031](https://github.com/modem-dev/hunk/pull/1031) [`e3e4a6a`](https://github.com/modem-dev/hunk/commit/e3e4a6ab82272b44c08c9cc651fbe61a1a5e11ad) - Add cancellable contiguous multi-commit selection to unfiltered interactive history with Shift+Arrow, J/K, and Shift-click controls, opening the inclusive cumulative change in one review.

- [#1011](https://github.com/modem-dev/hunk/pull/1011) [`bf3c2a7`](https://github.com/modem-dev/hunk/commit/bf3c2a7aad763079232cb2da8b4b7b3723537922) - Redesign interactive `hunk log` with themed GitHub-style day groups, account-like author handles, relative timestamps, and an optional commit graph view.

- [#1038](https://github.com/modem-dev/hunk/pull/1038) [`9919017`](https://github.com/modem-dev/hunk/commit/99190170947c8392944f1f6c65bb79bb1d1270f9) - Add `v` visual range selection plus shared full-page and half-page movement keys to interactive history.

- [#979](https://github.com/modem-dev/hunk/pull/979) [`9219562`](https://github.com/modem-dev/hunk/commit/921956215557de8792a953758358b07c23d1c33c) - Add themed, static-first Git and Jujutsu history with compact output and an interactive browser that opens selected commits in Hunk.

- [#988](https://github.com/modem-dev/hunk/pull/988) [`622c0a3`](https://github.com/modem-dev/hunk/commit/622c0a363724ec20eeec6c392cc3058e3aacec52) - Let extension lifecycle and custom-event handlers request a coalesced host review reload after external agents change reviewed files.

- [#987](https://github.com/modem-dev/hunk/pull/987) [`1598b0d`](https://github.com/modem-dev/hunk/commit/1598b0d4f1acb3784a6aa7c5da3937586f7f134a) - Open `hunk log` as an auto-responsive terminal browser with GitHub-inspired rows, right-aligned commit links and copy actions, while preserving static output for pipes and `--static`.

- [#983](https://github.com/modem-dev/hunk/pull/983) [`b4d4f6b`](https://github.com/modem-dev/hunk/commit/b4d4f6b588b6a04cc3d71db4bd74f058c895369f) - Add Hunk's desktop menu chrome, live theme picker, and provider-owned merge-parent selection to the interactive repository history browser.

- [#941](https://github.com/modem-dev/hunk/pull/941) [`f55894d`](https://github.com/modem-dev/hunk/commit/f55894dcd3774f21c77b73d4eb19a2a56102858d) - Animate docked panes as they open and close, moving the review pane alongside them.

- [#945](https://github.com/modem-dev/hunk/pull/945) [`a4e3d7a`](https://github.com/modem-dev/hunk/commit/a4e3d7a705f30602baf368fce961e120f3b3e67f) - Rename the single-column diff layout to unified, add canonical OpenTUI and extension API v23 fields, and retain deprecated stack compatibility across existing CLI, config, command, OpenTUI, and extension integrations.

### Patch Changes

- [#1075](https://github.com/modem-dev/hunk/pull/1075) [`0d68a61`](https://github.com/modem-dev/hunk/commit/0d68a6107f3b1b9512d1970feea8aaa04074297f) - Watch mode no longer freezes the review while checking Git for changes, and extension API generation 25 adds Promise-returning, cancellable `watchSignature` hooks.

- [#1045](https://github.com/modem-dev/hunk/pull/1045) [`e2beb21`](https://github.com/modem-dev/hunk/commit/e2beb21e72924ecea66acb0811b4e7a3f342fca3) - Keep diff view preferences active when moving between history and commit reviews in the same session.

- [#990](https://github.com/modem-dev/hunk/pull/990) [`f41a03d`](https://github.com/modem-dev/hunk/commit/f41a03d6378c6bcf10a6d2f742558dc6e63f399a) - Upgrade the bundled Bun runtime to 1.4.2 for lower memory use and runtime fixes.

- [#1032](https://github.com/modem-dev/hunk/pull/1032) [`5ecc4dd`](https://github.com/modem-dev/hunk/commit/5ecc4dda1c131d6a8ea503ea6bbc83f7418fd1a2) - Show multi-commit history metadata as compact responsive rows with reusable click-to-copy revision actions, and let extension panes derive a preferred size from current review facts.

- [#1050](https://github.com/modem-dev/hunk/pull/1050) [`4f95ca5`](https://github.com/modem-dev/hunk/commit/4f95ca52095e327d92ec435545a4f049a3e044f2) - Prevent delayed editor updates from crashing a review after a note is saved.

- [#1036](https://github.com/modem-dev/hunk/pull/1036) [`7947ca9`](https://github.com/modem-dev/hunk/commit/7947ca935f8a6ed2307248ce267e6914f109fb57) - Cap pane animation rendering at 30 FPS to avoid unnecessary CPU usage, and add an `animations = false` config setting for immediate pane transitions.

- [#1069](https://github.com/modem-dev/hunk/pull/1069) [`f5b8b24`](https://github.com/modem-dev/hunk/commit/f5b8b247f2d9a20ff96fc1e53be8377b2b2397f4) - Route curl-install release checks through globally refreshed metadata by default while retaining direct GitHub fallback and analytics opt-outs.

- [#992](https://github.com/modem-dev/hunk/pull/992) [`554cfc0`](https://github.com/modem-dev/hunk/commit/554cfc04c613f014d5e3044febc9079e534499d4) - Keep commit reviews responsive while bundled VCS commands run, and share one correctly owned extension lifecycle across retained history and embedded reviews.

- [#1043](https://github.com/modem-dev/hunk/pull/1043) [`f143e8e`](https://github.com/modem-dev/hunk/commit/f143e8ee1bb8544a590fcdc5e041d5743541098e) - Restore fast first-frame rendering for long wrapped split-view lines while preserving multiline copy selections and note range guides.

- [#989](https://github.com/modem-dev/hunk/pull/989) [`e884bca`](https://github.com/modem-dev/hunk/commit/e884bca4c8d9c9c38e54adfee5bc03a8162bed6b) - Keep the themed history loading screen visible until a selected commit review is ready to claim the terminal.

- [#1040](https://github.com/modem-dev/hunk/pull/1040) [`f9ef7ce`](https://github.com/modem-dev/hunk/commit/f9ef7ceff546575b35cf1ac9b95abefe7fc039cd) - Keep theme changes active when moving between history and review surfaces in the same session.

- [#969](https://github.com/modem-dev/hunk/pull/969) [`0aa24d3`](https://github.com/modem-dev/hunk/commit/0aa24d38f63f7460bc4adf0e6148f8a525f2607d) - Add an opt-in, privacy-preserving cached endpoint for curl-install release checks, rate-limit automatic checks, and retain direct GitHub fallback and analytics opt-outs.

- [#1054](https://github.com/modem-dev/hunk/pull/1054) [`c5bb30d`](https://github.com/modem-dev/hunk/commit/c5bb30d470ab55003f24f281ce419eab4854d699) - Restore automatic and manual reloads for direct-file comparisons launched outside repositories.

- [#991](https://github.com/modem-dev/hunk/pull/991) [`6d4440a`](https://github.com/modem-dev/hunk/commit/6d4440a5021ad72493c914e35e5561a319d7161a) - Make `alt` and `option` keybindings work with both legacy terminal and Kitty keyboard encodings while preserving distinct Meta bindings when the terminal reports them.

- [#992](https://github.com/modem-dev/hunk/pull/992) [`554cfc0`](https://github.com/modem-dev/hunk/commit/554cfc04c613f014d5e3044febc9079e534499d4) - Keep `hunk log` and opened commit reviews in one terminal renderer so returning never exposes previous terminal output.

- [#927](https://github.com/modem-dev/hunk/pull/927) [`dee21c4`](https://github.com/modem-dev/hunk/commit/dee21c497c139b4ab441fa1f4d0d180c489af3b3) - Report the underlying health-probe failure when a reachable session daemon port cannot be verified.

- [#1015](https://github.com/modem-dev/hunk/pull/1015) [`cbf77de`](https://github.com/modem-dev/hunk/commit/cbf77de94abe164a5b02c86dc4bb6401ea8d4bb0) - Prompt to save theme changes when quitting an interactive `hunk log` session, matching other review commands.

- [#1046](https://github.com/modem-dev/hunk/pull/1046) [`923ce03`](https://github.com/modem-dev/hunk/commit/923ce0352707468f60676dc4820d3d54fc933b69) - Stop drawing duplicate right-side range connectors on threaded reply cards.

- [#1076](https://github.com/modem-dev/hunk/pull/1076) [`0a2d52f`](https://github.com/modem-dev/hunk/commit/0a2d52f255a8f4d18ab734f56c908bee4267d90c) - Keep automatic refresh working on Linux after deleting and recreating nested directories.

- [#1076](https://github.com/modem-dev/hunk/pull/1076) [`0a2d52f`](https://github.com/modem-dev/hunk/commit/0a2d52f255a8f4d18ab734f56c908bee4267d90c) - Watch mode registers directory watchers in small batches so large repositories stay responsive during the first interaction on Linux.

- [#1035](https://github.com/modem-dev/hunk/pull/1035) [`09f06a2`](https://github.com/modem-dev/hunk/commit/09f06a247283d754464b9c36977dcc94f7018533) - Shorten full Git commit IDs to seven characters in comparison titles so the title bar stays compact.

- [#1068](https://github.com/modem-dev/hunk/pull/1068) [`795d835`](https://github.com/modem-dev/hunk/commit/795d83501e3d42535d63c237f3e04ab9401c4715) - Use `1` for unified diffs and `2` for split diffs by default.

- [#1029](https://github.com/modem-dev/hunk/pull/1029) [`367dbbe`](https://github.com/modem-dev/hunk/commit/367dbbe5c1d9eb5337999ef79fd878ccadf947e9) - Print reviews as static plain text instead of launching the interactive TUI when stdout is not a terminal.

- [#996](https://github.com/modem-dev/hunk/pull/996) [`c6d15c0`](https://github.com/modem-dev/hunk/commit/c6d15c06b13e5ec920290c7a4a19c155b7c4c4de) - Keep suspended Hunk jobs alive so `fg` restores the TUI and its in-progress state.

- [#1051](https://github.com/modem-dev/hunk/pull/1051) [`64c0abd`](https://github.com/modem-dev/hunk/commit/64c0abd7a6a89570d0b7a53c85951182c8668505) - Keep wrapped diff rows responsive by sharing one hover target across their visual lines.

## 0.22.0-beta.1

### Minor Changes

- [#1064](https://github.com/modem-dev/hunk/pull/1064) [`661534f`](https://github.com/modem-dev/hunk/commit/661534f40a4c258f756679797c7e6738b72051da) - Show commit and comparison information, including short revision IDs, above direct CLI revision
  reviews for Git, Jujutsu, and Sapling.

### Patch Changes

- [#1069](https://github.com/modem-dev/hunk/pull/1069) [`f5b8b24`](https://github.com/modem-dev/hunk/commit/f5b8b247f2d9a20ff96fc1e53be8377b2b2397f4) - Route curl-install release checks through globally refreshed metadata by default while retaining direct GitHub fallback and analytics opt-outs.

- [#1068](https://github.com/modem-dev/hunk/pull/1068) [`795d835`](https://github.com/modem-dev/hunk/commit/795d83501e3d42535d63c237f3e04ab9401c4715) - Use `1` for unified diffs and `2` for split diffs by default.

## 0.22.0-beta.0

### Minor Changes

- [#1044](https://github.com/modem-dev/hunk/pull/1044) [`2124066`](https://github.com/modem-dev/hunk/commit/21240662080433a987fe9dc98f5e2ff865b3b813) - Add visible keyboard selection for review notes. Line-by-line movement now stops on every comment and reply in rendered order; saving or clicking a note makes it active, with next/previous note navigation and persistent edit, reply, and delete shortcuts on the active note.

- [#1012](https://github.com/modem-dev/hunk/pull/1012) [`a83da6d`](https://github.com/modem-dev/hunk/commit/a83da6d7d11a873da80c824e26497b046201e9c7) - Add session CLI support for replying to existing inline review notes with inherited code anchors.

- [#931](https://github.com/modem-dev/hunk/pull/931) [`d0bf162`](https://github.com/modem-dev/hunk/commit/d0bf162dda6d5de828f64fd432ba9e6660489ef7) - Add persistent mouse and keyboard diff selections with explicit Comment, Copy, and Clear actions, including multiline review-note anchors.

- [#986](https://github.com/modem-dev/hunk/pull/986) [`7d27181`](https://github.com/modem-dev/hunk/commit/7d2718133b381aacde5362cd1807a3372ae1bc0d) - Let extension CLI commands attach validated provider-neutral review metadata when they delegate a patch into Hunk, expose it to extension panes and live-session snapshots, and show delegated change-request identity in a concise built-in top pane.

- [#1039](https://github.com/modem-dev/hunk/pull/1039) [`93250a8`](https://github.com/modem-dev/hunk/commit/93250a8128f183939bb00fc84ca27c48d1eb7a22) - Add configurable `hunk.history.*` command keybindings to the interactive history view.

- [#1009](https://github.com/modem-dev/hunk/pull/1009) [`e1001ae`](https://github.com/modem-dev/hunk/commit/e1001ae8493806aab2c120ac4f9edd1dfb79f7cf) - Allow folders in the wide sidebar tree to be collapsed and expanded with the mouse while file navigation reveals destinations hidden inside collapsed folders.

- [#1016](https://github.com/modem-dev/hunk/pull/1016) [`07c5892`](https://github.com/modem-dev/hunk/commit/07c58927fe13395cb5e7c10d498d78dcefbd3725) - Show history-style commit metadata in the review-info panel when opening a commit from interactive `hunk log`, with a copyable right-aligned revision and public pane clipboard/theme support.

- [#1031](https://github.com/modem-dev/hunk/pull/1031) [`e3e4a6a`](https://github.com/modem-dev/hunk/commit/e3e4a6ab82272b44c08c9cc651fbe61a1a5e11ad) - Add cancellable contiguous multi-commit selection to unfiltered interactive history with Shift+Arrow, J/K, and Shift-click controls, opening the inclusive cumulative change in one review.

- [#1011](https://github.com/modem-dev/hunk/pull/1011) [`bf3c2a7`](https://github.com/modem-dev/hunk/commit/bf3c2a7aad763079232cb2da8b4b7b3723537922) - Redesign interactive `hunk log` with themed GitHub-style day groups, account-like author handles, relative timestamps, and an optional commit graph view.

- [#1038](https://github.com/modem-dev/hunk/pull/1038) [`9919017`](https://github.com/modem-dev/hunk/commit/99190170947c8392944f1f6c65bb79bb1d1270f9) - Add `v` visual range selection plus shared full-page and half-page movement keys to interactive history.

- [#979](https://github.com/modem-dev/hunk/pull/979) [`9219562`](https://github.com/modem-dev/hunk/commit/921956215557de8792a953758358b07c23d1c33c) - Add themed, static-first Git and Jujutsu history with compact output and an interactive browser that opens selected commits in Hunk.

- [#988](https://github.com/modem-dev/hunk/pull/988) [`622c0a3`](https://github.com/modem-dev/hunk/commit/622c0a363724ec20eeec6c392cc3058e3aacec52) - Let extension lifecycle and custom-event handlers request a coalesced host review reload after external agents change reviewed files.

- [#987](https://github.com/modem-dev/hunk/pull/987) [`1598b0d`](https://github.com/modem-dev/hunk/commit/1598b0d4f1acb3784a6aa7c5da3937586f7f134a) - Open `hunk log` as an auto-responsive terminal browser with GitHub-inspired rows, right-aligned commit links and copy actions, while preserving static output for pipes and `--static`.

- [#983](https://github.com/modem-dev/hunk/pull/983) [`b4d4f6b`](https://github.com/modem-dev/hunk/commit/b4d4f6b588b6a04cc3d71db4bd74f058c895369f) - Add Hunk's desktop menu chrome, live theme picker, and provider-owned merge-parent selection to the interactive repository history browser.

- [#941](https://github.com/modem-dev/hunk/pull/941) [`f55894d`](https://github.com/modem-dev/hunk/commit/f55894dcd3774f21c77b73d4eb19a2a56102858d) - Animate docked panes as they open and close, moving the review pane alongside them.

- [#945](https://github.com/modem-dev/hunk/pull/945) [`a4e3d7a`](https://github.com/modem-dev/hunk/commit/a4e3d7a705f30602baf368fce961e120f3b3e67f) - Rename the single-column diff layout to unified, add canonical OpenTUI and extension API v23 fields, and retain deprecated stack compatibility across existing CLI, config, command, OpenTUI, and extension integrations.

### Patch Changes

- [#1045](https://github.com/modem-dev/hunk/pull/1045) [`e2beb21`](https://github.com/modem-dev/hunk/commit/e2beb21e72924ecea66acb0811b4e7a3f342fca3) - Keep diff view preferences active when moving between history and commit reviews in the same session.

- [#990](https://github.com/modem-dev/hunk/pull/990) [`f41a03d`](https://github.com/modem-dev/hunk/commit/f41a03d6378c6bcf10a6d2f742558dc6e63f399a) - Upgrade the bundled Bun runtime to 1.4.2 for lower memory use and runtime fixes.

- [#1032](https://github.com/modem-dev/hunk/pull/1032) [`5ecc4dd`](https://github.com/modem-dev/hunk/commit/5ecc4dda1c131d6a8ea503ea6bbc83f7418fd1a2) - Show multi-commit history metadata as compact responsive rows with reusable click-to-copy revision actions, and let extension panes derive a preferred size from current review facts.

- [#1050](https://github.com/modem-dev/hunk/pull/1050) [`4f95ca5`](https://github.com/modem-dev/hunk/commit/4f95ca52095e327d92ec435545a4f049a3e044f2) - Prevent delayed editor updates from crashing a review after a note is saved.

- [#1036](https://github.com/modem-dev/hunk/pull/1036) [`7947ca9`](https://github.com/modem-dev/hunk/commit/7947ca935f8a6ed2307248ce267e6914f109fb57) - Cap pane animation rendering at 30 FPS to avoid unnecessary CPU usage, and add an `animations = false` config setting for immediate pane transitions.

- [#992](https://github.com/modem-dev/hunk/pull/992) [`554cfc0`](https://github.com/modem-dev/hunk/commit/554cfc04c613f014d5e3044febc9079e534499d4) - Keep commit reviews responsive while bundled VCS commands run, and share one correctly owned extension lifecycle across retained history and embedded reviews.

- [#1043](https://github.com/modem-dev/hunk/pull/1043) [`f143e8e`](https://github.com/modem-dev/hunk/commit/f143e8ee1bb8544a590fcdc5e041d5743541098e) - Restore fast first-frame rendering for long wrapped split-view lines while preserving multiline copy selections and note range guides.

- [#989](https://github.com/modem-dev/hunk/pull/989) [`e884bca`](https://github.com/modem-dev/hunk/commit/e884bca4c8d9c9c38e54adfee5bc03a8162bed6b) - Keep the themed history loading screen visible until a selected commit review is ready to claim the terminal.

- [#1040](https://github.com/modem-dev/hunk/pull/1040) [`f9ef7ce`](https://github.com/modem-dev/hunk/commit/f9ef7ceff546575b35cf1ac9b95abefe7fc039cd) - Keep theme changes active when moving between history and review surfaces in the same session.

- [#969](https://github.com/modem-dev/hunk/pull/969) [`0aa24d3`](https://github.com/modem-dev/hunk/commit/0aa24d38f63f7460bc4adf0e6148f8a525f2607d) - Add an opt-in, privacy-preserving cached endpoint for curl-install release checks, rate-limit automatic checks, and retain direct GitHub fallback and analytics opt-outs.

- [#1054](https://github.com/modem-dev/hunk/pull/1054) [`c5bb30d`](https://github.com/modem-dev/hunk/commit/c5bb30d470ab55003f24f281ce419eab4854d699) - Restore automatic and manual reloads for direct-file comparisons launched outside repositories.

- [#991](https://github.com/modem-dev/hunk/pull/991) [`6d4440a`](https://github.com/modem-dev/hunk/commit/6d4440a5021ad72493c914e35e5561a319d7161a) - Make `alt` and `option` keybindings work with both legacy terminal and Kitty keyboard encodings while preserving distinct Meta bindings when the terminal reports them.

- [#992](https://github.com/modem-dev/hunk/pull/992) [`554cfc0`](https://github.com/modem-dev/hunk/commit/554cfc04c613f014d5e3044febc9079e534499d4) - Keep `hunk log` and opened commit reviews in one terminal renderer so returning never exposes previous terminal output.

- [#927](https://github.com/modem-dev/hunk/pull/927) [`dee21c4`](https://github.com/modem-dev/hunk/commit/dee21c497c139b4ab441fa1f4d0d180c489af3b3) - Report the underlying health-probe failure when a reachable session daemon port cannot be verified.

- [#1015](https://github.com/modem-dev/hunk/pull/1015) [`cbf77de`](https://github.com/modem-dev/hunk/commit/cbf77de94abe164a5b02c86dc4bb6401ea8d4bb0) - Prompt to save theme changes when quitting an interactive `hunk log` session, matching other review commands.

- [#1046](https://github.com/modem-dev/hunk/pull/1046) [`923ce03`](https://github.com/modem-dev/hunk/commit/923ce0352707468f60676dc4820d3d54fc933b69) - Stop drawing duplicate right-side range connectors on threaded reply cards.

- [#1035](https://github.com/modem-dev/hunk/pull/1035) [`09f06a2`](https://github.com/modem-dev/hunk/commit/09f06a247283d754464b9c36977dcc94f7018533) - Shorten full Git commit IDs to seven characters in comparison titles so the title bar stays compact.

- [#1029](https://github.com/modem-dev/hunk/pull/1029) [`367dbbe`](https://github.com/modem-dev/hunk/commit/367dbbe5c1d9eb5337999ef79fd878ccadf947e9) - Print reviews as static plain text instead of launching the interactive TUI when stdout is not a terminal.

- [#996](https://github.com/modem-dev/hunk/pull/996) [`c6d15c0`](https://github.com/modem-dev/hunk/commit/c6d15c06b13e5ec920290c7a4a19c155b7c4c4de) - Keep suspended Hunk jobs alive so `fg` restores the TUI and its in-progress state.

- [#1051](https://github.com/modem-dev/hunk/pull/1051) [`64c0abd`](https://github.com/modem-dev/hunk/commit/64c0abd7a6a89570d0b7a53c85951182c8668505) - Keep wrapped diff rows responsive by sharing one hover target across their visual lines.

## 0.21.1

### Patch Changes

- [#978](https://github.com/modem-dev/hunk/pull/978) [`bfbfac8`](https://github.com/modem-dev/hunk/commit/bfbfac8d2b3a54e1f72256d6dc24e873882d722f) - Fix `hunk pager` pegging a CPU core and growing to gigabytes of memory on large color-heavy
  input. Restoring preserved ANSI styling rescanned and reallocated the whole document once per
  sequence, so a `git log --graph --color=always` stream from a host like LazyGit took minutes of
  solid CPU per process and never produced output. Styling is now restored in a single pass: a 3 MB
  branch log pages through in well under a second.

- [#978](https://github.com/modem-dev/hunk/pull/978) [`bfbfac8`](https://github.com/modem-dev/hunk/commit/bfbfac8d2b3a54e1f72256d6dc24e873882d722f) - Fix `hunk pager` truncating its output at 64 KB when a host reads it through a pipe, which cut off
  large documents for Git's pager contract, LazyGit, and `| less`. Headless commands now hand the
  whole document to the stdout descriptor before exiting, so a piped consumer receives every byte.

## 0.21.0

### Minor Changes

- [#845](https://github.com/modem-dev/hunk/pull/845) [`a572286`](https://github.com/modem-dev/hunk/commit/a572286e687fabaca3e95213c78e949ca1c5c03f) - Navigate a live review directly to a comment returned by `hunk session comment list`.

- [#865](https://github.com/modem-dev/hunk/pull/865) [`4bb3f84`](https://github.com/modem-dev/hunk/commit/4bb3f84fa59ce228a7e34a1ba116ef93a3aa423a) - Make the vertical space between files and hunks configurable.

- [#909](https://github.com/modem-dev/hunk/pull/909) [`a78dac9`](https://github.com/modem-dev/hunk/commit/a78dac9e11487458f419d2e7c4f2bdfb12f4ba32) - Add a `dim` tone to `hunk.registerLineHighlighter` and `hunk session highlight add` for fading diff text toward line backgrounds while preserving syntax highlighting token hues.

- [#851](https://github.com/modem-dev/hunk/pull/851) [`4d8b000`](https://github.com/modem-dev/hunk/commit/4d8b000aa131b1392d80947df48777e90e48202f) - Let extensions select syntax highlighting by exact filename or basename/path glob, in addition to file extensions.

- [#888](https://github.com/modem-dev/hunk/pull/888) [`79fd010`](https://github.com/modem-dev/hunk/commit/79fd010a8d6cb239085790f0422eed8c136ae44f) - Let extensions register generic top-level CLI command trees with raw arguments, cancellable streaming I/O, validated exit statuses, and one-time delegation into built-in Hunk commands, including a dependency-free `hunk gh 123` example that fetches GitHub pull-request diffs directly.

- [#939](https://github.com/modem-dev/hunk/pull/939) [`e1c292b`](https://github.com/modem-dev/hunk/commit/e1c292b5caa9e9b2adcd4b346f07a416083361aa) - Publish `hunk_viewed` and store-backed `note_changed` extension lifecycle events so progress and note UIs can follow hunk navigation and agent comments.

- [#940](https://github.com/modem-dev/hunk/pull/940) [`2454101`](https://github.com/modem-dev/hunk/commit/2454101d326fc0513e40e38c47a6a945b4b733b1) - Give opted-in extension panes the current line's `{ side, line }` source address on `currentLine`, matching command selection, so a pane can follow the cursor without waiting for a keypress.

- [#917](https://github.com/modem-dev/hunk/pull/917) [`cf226e0`](https://github.com/modem-dev/hunk/commit/cf226e0f5a44a60cacf4e613930abf6b76fe1127) - Require Node.js 22 or newer for npm installs. Standalone Hunk binaries continue to run without Node.js.

- [#924](https://github.com/modem-dev/hunk/pull/924) [`15cdd7c`](https://github.com/modem-dev/hunk/commit/15cdd7c5ef491726cf091f7b95189843fe059027) - Resize the built-in files sidebar with the terminal, showing its compact projection at medium widths and keeping split review after the sidebar hides. Extension API v12 adds `ExtensionPaneSize.fraction` for bounded body-axis fractional sizing while preserving manual overrides.

- [#933](https://github.com/modem-dev/hunk/pull/933) [`8d17357`](https://github.com/modem-dev/hunk/commit/8d17357595adb66d115f8a1bdd945f2e4fc3c447) - Authenticate local session producers and CLI controls with automatically discovered owner-private credentials, signed responses, scoped reconnect replacement, and bounded handshakes. Expose only minimal public daemon health, refuse unsafe PID-based replacement, and let interactive Hunk windows reconnect automatically after an incompatible incumbent becomes idle.

- [#925](https://github.com/modem-dev/hunk/pull/925) [`f401472`](https://github.com/modem-dev/hunk/commit/f401472820034948e7e670c783df044a778a036d) - Add editable inline review notes and arbitrarily nested threaded replies with mouse and keyboard actions, including reviewer dismissal of reply-free live agent notes.

- [#965](https://github.com/modem-dev/hunk/pull/965) [`034796a`](https://github.com/modem-dev/hunk/commit/034796a959193c1637a1ef676d7dbccb41d377be) - Add a pane-wide `onActivate` callback to the extension API for primary mouse presses.

- [#938](https://github.com/modem-dev/hunk/pull/938) [`598e084`](https://github.com/modem-dev/hunk/commit/598e084074e0a188f71e3a0c24abae63d87be6ac) - Support backend-native `hunk diff <from> <to>` reviews across Git, Jujutsu, and Sapling, with pinned source expansion, working-copy isolation, explicit `hunk diff --files <left> <right>` file comparison, and structured `rangeEndpoints` in extension API generation 14.

- [#921](https://github.com/modem-dev/hunk/pull/921) [`7f7d84c`](https://github.com/modem-dev/hunk/commit/7f7d84cd1ec8d8a6858ffe89e1ef8cadb48f447a) - Show a fully expanded file tree when the file sidebar reaches its preferred 34-column width, and keep resize drags active while its layout changes.

### Patch Changes

- [#890](https://github.com/modem-dev/hunk/pull/890) [`5012b2f`](https://github.com/modem-dev/hunk/commit/5012b2f2a4c415a4f9cd6044446d1885bf19023f) - Enable unchanged-context expansion in Jujutsu-backed reviews.

- [#968](https://github.com/modem-dev/hunk/pull/968) [`566220b`](https://github.com/modem-dev/hunk/commit/566220bf910204c64c04605c49a41f6e00d98882) - Add a `/compare/` section to hunk.dev with head-to-head pages for delta, difftastic, diff-so-fancy, `git diff`, and Plannotator, each also served as Markdown for coding agents.

- [#774](https://github.com/modem-dev/hunk/pull/774) [`bf629ce`](https://github.com/modem-dev/hunk/commit/bf629ce17034acc5b2525518b427b9250f911a04) - Provide complete key event data to command matchers and programmatically invoked handlers.

- [#855](https://github.com/modem-dev/hunk/pull/855) [`c6ebba9`](https://github.com/modem-dev/hunk/commit/c6ebba98e0797680151dfaa3edb45b0ee1ca9087) - Add Ctrl-D and Ctrl-U aliases for half-page review scrolling.

- [#955](https://github.com/modem-dev/hunk/pull/955) [`9b5d419`](https://github.com/modem-dev/hunk/commit/9b5d4190cdfe68628794174adcda4db5e14e275b) - Fence late session lifecycle commits so stopped or replaced generations cannot authenticate, reconnect, publish daemon launch metadata, or mutate broker client state.

- [#928](https://github.com/modem-dev/hunk/pull/928) [`a7c8508`](https://github.com/modem-dev/hunk/commit/a7c8508bb648ece92003063b1172077a1167fea8) - Keep explicit top and bottom jumps from being overridden by a pending selection reveal.

- [#908](https://github.com/modem-dev/hunk/pull/908) [`708fd3a`](https://github.com/modem-dev/hunk/commit/708fd3a0ada303144f288b09faccbb179f51b709) - Stop installing Bun beside prebuilt Hunk packages so pnpm global updates cannot corrupt Bun's shared platform-package projection. Standalone platform binaries continue to work without a separate Bun installation.

- [#922](https://github.com/modem-dev/hunk/pull/922) [`dfa9aa4`](https://github.com/modem-dev/hunk/commit/dfa9aa4cd16242ebb4a8a18fda9dd21403624d78) - Fill the review stream on first paint instead of leaving it blank until the user scrolls.

- [#956](https://github.com/modem-dev/hunk/pull/956) [`be35bb5`](https://github.com/modem-dev/hunk/commit/be35bb591eca9d2547c77dccaa111640485046f7) - Contain unexpected session broker lifecycle failures behind one fixed, redacted user-visible message.

- [#954](https://github.com/modem-dev/hunk/pull/954) [`39217ae`](https://github.com/modem-dev/hunk/commit/39217ae09b5935fb1a6dd9be42c3042e1ede972a) - Let focused editors inside extension panes receive keys before Hunk's global shortcuts.

- [#919](https://github.com/modem-dev/hunk/pull/919) [`6df80a9`](https://github.com/modem-dev/hunk/commit/6df80a983efbc35c2a9f0c5e1af9f8f6ab531872) - Make the checksum-aware curl installer the default across the website and docs, add an accessible tabbed install selector, and establish `hunk update` as the canonical updater from Hunk 0.20 onward.

- [#950](https://github.com/modem-dev/hunk/pull/950) [`d4b1286`](https://github.com/modem-dev/hunk/commit/d4b1286aec23854c186f398499138fc3e2dd1bfd) - Retry session broker connections after synchronous WebSocket startup failures.

- [#936](https://github.com/modem-dev/hunk/pull/936) [`ad0baaa`](https://github.com/modem-dev/hunk/commit/ad0baaacac22f5ab36a95c2465b11c5fc07bec21) - Keep iTerm2 sessions connected to the local session daemon when their terminal identifiers contain native punctuation.

- [#858](https://github.com/modem-dev/hunk/pull/858) [`97a44be`](https://github.com/modem-dev/hunk/commit/97a44be5d589d9ecdfe2f4a76403e6af4eecc88b) - Keep wrapped diff geometry aligned with rendered note-guide and add-note columns.

- [#937](https://github.com/modem-dev/hunk/pull/937) [`6e39a34`](https://github.com/modem-dev/hunk/commit/6e39a343b5c4c539a830e883644927678c157227) - Accept the documented `dim` tone when routing line-highlight commands through the session daemon.

- [#850](https://github.com/modem-dev/hunk/pull/850) [`65d1c20`](https://github.com/modem-dev/hunk/commit/65d1c20cbe9d462ab2fc84f640642df21ddd0449) - Recognize pacman/AUR-managed installations via `HUNK_INSTALL_SOURCE=pacman` and suppress automatic update notices for them.

- [#914](https://github.com/modem-dev/hunk/pull/914) [`8992abd`](https://github.com/modem-dev/hunk/commit/8992abd1cecb0e4394c2918966485714ae59baba) - Upgrade the OpenTUI runtime and reusable component peer requirement to 0.5.6.

- [#961](https://github.com/modem-dev/hunk/pull/961) [`1e97cf4`](https://github.com/modem-dev/hunk/commit/1e97cf42ebc77224bd1338769f83bb2e80296582) - Publish dated prerelease notes on hunk.dev without promoting them as the latest stable release or default install target.

- [#960](https://github.com/modem-dev/hunk/pull/960) [`e9726c4`](https://github.com/modem-dev/hunk/commit/e9726c47eecb499da68f936da04a459367f5d18c) - Refuse curl installs alongside competing Hunk binaries unless explicitly forced, and print each conflicting path, version, PATH precedence, and package-manager removal guidance.

- [#724](https://github.com/modem-dev/hunk/pull/724) [`76565a6`](https://github.com/modem-dev/hunk/commit/76565a63c48769a4ebc4ab93452db7037d663330) - Exit cleanly when the terminal hosting a review disconnects instead of leaving an unreachable Hunk process behind.

- [#942](https://github.com/modem-dev/hunk/pull/942) [`42d2b9d`](https://github.com/modem-dev/hunk/commit/42d2b9dd2f3144e33080f159f4cc9c2824ad1708) - Restore first-frame and scroll responsiveness for large review streams.

- [#828](https://github.com/modem-dev/hunk/pull/828) [`f0fc408`](https://github.com/modem-dev/hunk/commit/f0fc40812b634f1cd20182a93c8e2303b257df90) - Fix washed-out or wrong-hue diff colors in ~25 bundled themes (gruvbox, rosé pine, tokyo-night, material, everforest, laserwave, night-owl, slack, and others) by re-harvesting every theme's diff accents from its real VS Code accent tokens.

- [#825](https://github.com/modem-dev/hunk/pull/825) [`b2fc6fc`](https://github.com/modem-dev/hunk/commit/b2fc6fccc24cf2fc3da8e4b55e58e3a9836e2fb1) - Stop the theme contrast guards from washing out diff accents: low-contrast sign colors now get the smallest readable adjustment instead of a fixed 45% blend, and word-level diff emphasis is derived to the renderer's own separation floor so the highlight you see is the one the theme defines.

- [#902](https://github.com/modem-dev/hunk/pull/902) [`034ec9e`](https://github.com/modem-dev/hunk/commit/034ec9e45aec156cb9fafda6c0de995716f33907) - Refuse to start watch mode under Bun versions older than 1.3.14, which can deadlock filesystem watcher cleanup and leave Hunk unresponsive.

## 0.21.0-beta.1

### Minor Changes

- [#965](https://github.com/modem-dev/hunk/pull/965) [`034796a`](https://github.com/modem-dev/hunk/commit/034796a959193c1637a1ef676d7dbccb41d377be) - Add a pane-wide `onActivate` callback to the extension API for primary mouse presses.

### Patch Changes

- [#955](https://github.com/modem-dev/hunk/pull/955) [`9b5d419`](https://github.com/modem-dev/hunk/commit/9b5d4190cdfe68628794174adcda4db5e14e275b) - Fence late session lifecycle commits so stopped or replaced generations cannot authenticate, reconnect, publish daemon launch metadata, or mutate broker client state.

- [#956](https://github.com/modem-dev/hunk/pull/956) [`be35bb5`](https://github.com/modem-dev/hunk/commit/be35bb591eca9d2547c77dccaa111640485046f7) - Contain unexpected session broker lifecycle failures behind one fixed, redacted user-visible message.

- [#954](https://github.com/modem-dev/hunk/pull/954) [`39217ae`](https://github.com/modem-dev/hunk/commit/39217ae09b5935fb1a6dd9be42c3042e1ede972a) - Let focused editors inside extension panes receive keys before Hunk's global shortcuts.

- [#950](https://github.com/modem-dev/hunk/pull/950) [`d4b1286`](https://github.com/modem-dev/hunk/commit/d4b1286aec23854c186f398499138fc3e2dd1bfd) - Retry session broker connections after synchronous WebSocket startup failures.

- [#961](https://github.com/modem-dev/hunk/pull/961) [`1e97cf4`](https://github.com/modem-dev/hunk/commit/1e97cf42ebc77224bd1338769f83bb2e80296582) - Publish dated prerelease notes on hunk.dev without promoting them as the latest stable release or default install target.

- [#960](https://github.com/modem-dev/hunk/pull/960) [`e9726c4`](https://github.com/modem-dev/hunk/commit/e9726c47eecb499da68f936da04a459367f5d18c) - Refuse curl installs alongside competing Hunk binaries unless explicitly forced, and print each conflicting path, version, PATH precedence, and package-manager removal guidance.

## 0.21.0-beta.0

### Minor Changes

- [#845](https://github.com/modem-dev/hunk/pull/845) [`a572286`](https://github.com/modem-dev/hunk/commit/a572286e687fabaca3e95213c78e949ca1c5c03f) - Navigate a live review directly to a comment returned by `hunk session comment list`.

- [#865](https://github.com/modem-dev/hunk/pull/865) [`4bb3f84`](https://github.com/modem-dev/hunk/commit/4bb3f84fa59ce228a7e34a1ba116ef93a3aa423a) - Make the vertical space between files and hunks configurable.

- [#909](https://github.com/modem-dev/hunk/pull/909) [`a78dac9`](https://github.com/modem-dev/hunk/commit/a78dac9e11487458f419d2e7c4f2bdfb12f4ba32) - Add a `dim` tone to `hunk.registerLineHighlighter` and `hunk session highlight add` for fading diff text toward line backgrounds while preserving syntax highlighting token hues.

- [#851](https://github.com/modem-dev/hunk/pull/851) [`4d8b000`](https://github.com/modem-dev/hunk/commit/4d8b000aa131b1392d80947df48777e90e48202f) - Let extensions select syntax highlighting by exact filename or basename/path glob, in addition to file extensions.

- [#888](https://github.com/modem-dev/hunk/pull/888) [`79fd010`](https://github.com/modem-dev/hunk/commit/79fd010a8d6cb239085790f0422eed8c136ae44f) - Let extensions register generic top-level CLI command trees with raw arguments, cancellable streaming I/O, validated exit statuses, and one-time delegation into built-in Hunk commands, including a dependency-free `hunk gh 123` example that fetches GitHub pull-request diffs directly.

- [#939](https://github.com/modem-dev/hunk/pull/939) [`e1c292b`](https://github.com/modem-dev/hunk/commit/e1c292b5caa9e9b2adcd4b346f07a416083361aa) - Publish `hunk_viewed` and store-backed `note_changed` extension lifecycle events so progress and note UIs can follow hunk navigation and agent comments.

- [#940](https://github.com/modem-dev/hunk/pull/940) [`2454101`](https://github.com/modem-dev/hunk/commit/2454101d326fc0513e40e38c47a6a945b4b733b1) - Give opted-in extension panes the current line's `{ side, line }` source address on `currentLine`, matching command selection, so a pane can follow the cursor without waiting for a keypress.

- [#917](https://github.com/modem-dev/hunk/pull/917) [`cf226e0`](https://github.com/modem-dev/hunk/commit/cf226e0f5a44a60cacf4e613930abf6b76fe1127) - Require Node.js 22 or newer for npm installs. Standalone Hunk binaries continue to run without Node.js.

- [#924](https://github.com/modem-dev/hunk/pull/924) [`15cdd7c`](https://github.com/modem-dev/hunk/commit/15cdd7c5ef491726cf091f7b95189843fe059027) - Resize the built-in files sidebar with the terminal, showing its compact projection at medium widths and keeping split review after the sidebar hides. Extension API v12 adds `ExtensionPaneSize.fraction` for bounded body-axis fractional sizing while preserving manual overrides.

- [#933](https://github.com/modem-dev/hunk/pull/933) [`8d17357`](https://github.com/modem-dev/hunk/commit/8d17357595adb66d115f8a1bdd945f2e4fc3c447) - Authenticate local session producers and CLI controls with automatically discovered owner-private credentials, signed responses, scoped reconnect replacement, and bounded handshakes. Expose only minimal public daemon health, refuse unsafe PID-based replacement, and let interactive Hunk windows reconnect automatically after an incompatible incumbent becomes idle.

- [#925](https://github.com/modem-dev/hunk/pull/925) [`f401472`](https://github.com/modem-dev/hunk/commit/f401472820034948e7e670c783df044a778a036d) - Add editable inline review notes and arbitrarily nested threaded replies with mouse and keyboard actions, including reviewer dismissal of reply-free live agent notes.

- [#938](https://github.com/modem-dev/hunk/pull/938) [`598e084`](https://github.com/modem-dev/hunk/commit/598e084074e0a188f71e3a0c24abae63d87be6ac) - Support backend-native `hunk diff <from> <to>` reviews across Git, Jujutsu, and Sapling, with pinned source expansion, working-copy isolation, explicit `hunk diff --files <left> <right>` file comparison, and structured `rangeEndpoints` in extension API generation 14.

- [#921](https://github.com/modem-dev/hunk/pull/921) [`7f7d84c`](https://github.com/modem-dev/hunk/commit/7f7d84cd1ec8d8a6858ffe89e1ef8cadb48f447a) - Show a fully expanded file tree when the file sidebar reaches its preferred 34-column width, and keep resize drags active while its layout changes.

### Patch Changes

- [#890](https://github.com/modem-dev/hunk/pull/890) [`5012b2f`](https://github.com/modem-dev/hunk/commit/5012b2f2a4c415a4f9cd6044446d1885bf19023f) - Enable unchanged-context expansion in Jujutsu-backed reviews.

- [#774](https://github.com/modem-dev/hunk/pull/774) [`bf629ce`](https://github.com/modem-dev/hunk/commit/bf629ce17034acc5b2525518b427b9250f911a04) - Provide complete key event data to command matchers and programmatically invoked handlers.

- [#855](https://github.com/modem-dev/hunk/pull/855) [`c6ebba9`](https://github.com/modem-dev/hunk/commit/c6ebba98e0797680151dfaa3edb45b0ee1ca9087) - Add Ctrl-D and Ctrl-U aliases for half-page review scrolling.

- [#928](https://github.com/modem-dev/hunk/pull/928) [`a7c8508`](https://github.com/modem-dev/hunk/commit/a7c8508bb648ece92003063b1172077a1167fea8) - Keep explicit top and bottom jumps from being overridden by a pending selection reveal.

- [#908](https://github.com/modem-dev/hunk/pull/908) [`708fd3a`](https://github.com/modem-dev/hunk/commit/708fd3a0ada303144f288b09faccbb179f51b709) - Stop installing Bun beside prebuilt Hunk packages so pnpm global updates cannot corrupt Bun's shared platform-package projection. Standalone platform binaries continue to work without a separate Bun installation.

- [#922](https://github.com/modem-dev/hunk/pull/922) [`dfa9aa4`](https://github.com/modem-dev/hunk/commit/dfa9aa4cd16242ebb4a8a18fda9dd21403624d78) - Fill the review stream on first paint instead of leaving it blank until the user scrolls.

- [#919](https://github.com/modem-dev/hunk/pull/919) [`6df80a9`](https://github.com/modem-dev/hunk/commit/6df80a983efbc35c2a9f0c5e1af9f8f6ab531872) - Make the checksum-aware curl installer the default across the website and docs, add an accessible tabbed install selector, and establish `hunk update` as the canonical updater from Hunk 0.20 onward.

- [#936](https://github.com/modem-dev/hunk/pull/936) [`ad0baaa`](https://github.com/modem-dev/hunk/commit/ad0baaacac22f5ab36a95c2465b11c5fc07bec21) - Keep iTerm2 sessions connected to the local session daemon when their terminal identifiers contain native punctuation.

- [#858](https://github.com/modem-dev/hunk/pull/858) [`97a44be`](https://github.com/modem-dev/hunk/commit/97a44be5d589d9ecdfe2f4a76403e6af4eecc88b) - Keep wrapped diff geometry aligned with rendered note-guide and add-note columns.

- [#937](https://github.com/modem-dev/hunk/pull/937) [`6e39a34`](https://github.com/modem-dev/hunk/commit/6e39a343b5c4c539a830e883644927678c157227) - Accept the documented `dim` tone when routing line-highlight commands through the session daemon.

- [#850](https://github.com/modem-dev/hunk/pull/850) [`65d1c20`](https://github.com/modem-dev/hunk/commit/65d1c20cbe9d462ab2fc84f640642df21ddd0449) - Recognize pacman/AUR-managed installations via `HUNK_INSTALL_SOURCE=pacman` and suppress automatic update notices for them.

- [#914](https://github.com/modem-dev/hunk/pull/914) [`8992abd`](https://github.com/modem-dev/hunk/commit/8992abd1cecb0e4394c2918966485714ae59baba) - Upgrade the OpenTUI runtime and reusable component peer requirement to 0.5.6.

- [#724](https://github.com/modem-dev/hunk/pull/724) [`76565a6`](https://github.com/modem-dev/hunk/commit/76565a63c48769a4ebc4ab93452db7037d663330) - Exit cleanly when the terminal hosting a review disconnects instead of leaving an unreachable Hunk process behind.

- [#942](https://github.com/modem-dev/hunk/pull/942) [`42d2b9d`](https://github.com/modem-dev/hunk/commit/42d2b9dd2f3144e33080f159f4cc9c2824ad1708) - Restore first-frame and scroll responsiveness for large review streams.

- [#828](https://github.com/modem-dev/hunk/pull/828) [`f0fc408`](https://github.com/modem-dev/hunk/commit/f0fc40812b634f1cd20182a93c8e2303b257df90) - Fix washed-out or wrong-hue diff colors in ~25 bundled themes (gruvbox, rosé pine, tokyo-night, material, everforest, laserwave, night-owl, slack, and others) by re-harvesting every theme's diff accents from its real VS Code accent tokens.

- [#825](https://github.com/modem-dev/hunk/pull/825) [`b2fc6fc`](https://github.com/modem-dev/hunk/commit/b2fc6fccc24cf2fc3da8e4b55e58e3a9836e2fb1) - Stop the theme contrast guards from washing out diff accents: low-contrast sign colors now get the smallest readable adjustment instead of a fixed 45% blend, and word-level diff emphasis is derived to the renderer's own separation floor so the highlight you see is the one the theme defines.

- [#902](https://github.com/modem-dev/hunk/pull/902) [`034ec9e`](https://github.com/modem-dev/hunk/commit/034ec9e45aec156cb9fafda6c0de995716f33907) - Refuse to start watch mode under Bun versions older than 1.3.14, which can deadlock filesystem watcher cleanup and leave Hunk unresponsive.

## 0.20.1

### Patch Changes

- [`29f18c8`](https://github.com/modem-dev/hunk/commit/29f18c8e3bcb7fa148245f722a4c1feabc713f22) - Prevent syntax-highlight cache collisions from displaying stale code after review reloads.

- [`e76dbcc`](https://github.com/modem-dev/hunk/commit/e76dbcc8acc2d17ba0bd0340b1e1b4102c736985) - Keep the theme selector responsive and its highlighted row visible during rapid keyboard navigation.

- [`3fb3e15`](https://github.com/modem-dev/hunk/commit/3fb3e155f653d5d5b1ae7e6c1c959769a926eead) - Reject session reload inputs whose VCS `range` or `ref` values look like command options. A caller reaching the session broker could otherwise inject `git` flags such as `--output=<path>` through a `/session-api` reload request and make Hunk write diff output to an arbitrary path.

## 0.20.0

### Minor Changes

- [#799](https://github.com/modem-dev/hunk/pull/799) [`61ca92d`](https://github.com/modem-dev/hunk/commit/61ca92de477efa357aeb0d16e354cc6b97a121a1) - Add a curl installer (`curl -fsSL https://hunk.dev/install.sh | sh`) with checksum verification, and teach `hunk update` to update curl installs.

- [#779](https://github.com/modem-dev/hunk/pull/779) [`bf28a59`](https://github.com/modem-dev/hunk/commit/bf28a591616f36e92e0437ef272fd9eb8579745c) - Let extension commands inspect `ctx.selection.currentLine`; TypeScript authors constructing `ExtensionReviewSelection` must add its required field.

- [#833](https://github.com/modem-dev/hunk/pull/833) [`1210c08`](https://github.com/modem-dev/hunk/commit/1210c084d38f0d8898d009b82a9142638c21ad80) - Let extension commands capture immutable snapshots of stable review files and every saved review note.

- [#788](https://github.com/modem-dev/hunk/pull/788) [`7d25fbf`](https://github.com/modem-dev/hunk/commit/7d25fbfcb4c7fdd1fba4bdbb90d5ab9edfcb2375) - Add `hunk update` to self-update Hunk with the package manager that installed it (npm or Homebrew), with guidance for Nix, mise, and source installs.

### Patch Changes

- [#809](https://github.com/modem-dev/hunk/pull/809) [`8a2e0d8`](https://github.com/modem-dev/hunk/commit/8a2e0d86c3696e796eb058d8193e8e553545fb68) - Keep the active code line fixed in place while an inline comment form pushes following content down.

- [#784](https://github.com/modem-dev/hunk/pull/784) [`4aea1e1`](https://github.com/modem-dev/hunk/commit/4aea1e16f6df1672c4c1de04ecce113931141617) - Keep `hunk --version`, `--help`, `daemon serve`, and `hunk session *` off the diff-engine startup
  path again, and release the syntax worker when the review app exits instead of at startup.

- [#810](https://github.com/modem-dev/hunk/pull/810) [`0436ba1`](https://github.com/modem-dev/hunk/commit/0436ba1279f0d7c7fe1b7757d7147510961c0d33) - Make `--fast` offload eligible syntax highlighting for files with 40 or more lines.

- [#840](https://github.com/modem-dev/hunk/pull/840) [`bff4fbe`](https://github.com/modem-dev/hunk/commit/bff4fbe4cd2cf3c2d749d1f83d3fa36798d76d06) - Let mouse clicks reliably select exact code lines, including blank lines, for keyboard review actions.

- [#786](https://github.com/modem-dev/hunk/pull/786) [`52543ea`](https://github.com/modem-dev/hunk/commit/52543ea2e4b5854fcd99e6b991b550675230e192) - Fail clearly when an OpenTUI upgrade removes the shifted-wheel scroll reset Hunk requires.

- [#803](https://github.com/modem-dev/hunk/pull/803) [`dc66723`](https://github.com/modem-dev/hunk/commit/dc66723b64a58337b9f7fb542233e1311a98b90a) - Reduce hunk navigation latency by avoiding unnecessary diff, sidebar, and syntax-highlighting work.

- [#791](https://github.com/modem-dev/hunk/pull/791) [`6c8cacf`](https://github.com/modem-dev/hunk/commit/6c8cacf3c50a062d6d3d0eae9c03fc79bd475c14) - Reuse worker-highlighted diffs after the terminal cache evicts them.

## 0.19.1

### Patch Changes

- [`5cb62af`](https://github.com/modem-dev/hunk/commit/5cb62af8c7c51c8ac63b17db005cc5dab91fb2f1) - Stop installing Pierre dependencies for CLI-only npm users.

- [`3e58eff`](https://github.com/modem-dev/hunk/commit/3e58effad32c6a550921bb312a7022c4997cd0a7) - Restore executable permissions for platform binaries installed through npm.

- [`da696b1`](https://github.com/modem-dev/hunk/commit/da696b1f6bdbdc17b48e432976774815ec994c58) - Accelerate complex Unicode text width measurement in reviews.

- [`87b654c`](https://github.com/modem-dev/hunk/commit/87b654cea79337fe960f14db5c05158173b94cae) - Git's `color.moved` highlights are no longer lost when `wrap_lines` is on.

- [`62441cf`](https://github.com/modem-dev/hunk/commit/62441cfb10dc3e1d6f9375026395fa2c01ca9bbb) - Build the x64 binaries for CPUs without AVX2, so Hunk no longer dies with an illegal instruction on pre-Haswell machines and conservative VM CPU models.

## 0.19.0

### Highlights

Hunk 0.19.0 expands the extension platform, makes live agent guidance more precise, and keeps large reviews responsive.

- **Install and build richer extensions.** Install shared extensions from Git, dock panes on every edge, add session-scoped keyboard modes and guided workflows, and use the bundled authoring skill to discover the public API.
- **Point agents and reviewers at exact code.** Live sessions and extensions can highlight character ranges and navigate directly to a source line, while `$EDITOR` opens at the line currently under review.
- **Stay responsive in large repositories.** Untracked-file diffs avoid per-file subprocesses, syntax caches follow the active review, generated files skip expensive highlighting, and experimental `--fast` highlighting can offload eligible large diffs to a worker.
- **Control the workspace more precisely.** Configure sidebar visibility, keep files and extension panes independent, and use review keybindings consistently in selectors and extension modes.
- **Verify and install releases confidently.** Release archives carry build provenance attestations, and mise installation is documented across macOS, Linux, and Windows.

### Minor Changes

- [#728](https://github.com/modem-dev/hunk/pull/728) [`bb6405e`](https://github.com/modem-dev/hunk/commit/bb6405e43c22bee359cd75b24b3c0fc08b0f24fa) - Agents can now light up exact character ranges in a live review with `hunk session highlight add` / `clear` (five contrast-guaranteed tones, painted through the same pipeline as extension line highlights), and `hunk session navigate` line targets now land the viewport on the exact line instead of just its hunk.

- [#697](https://github.com/modem-dev/hunk/pull/697) [`cb91c4b`](https://github.com/modem-dev/hunk/commit/cb91c4bb5f94be1a009d010ee82fd5875cefc407) - Ship an extension-authoring skill for coding agents and let `hunk skill path [name]` print any bundled skill.

- [#713](https://github.com/modem-dev/hunk/pull/713) [`ee97fef`](https://github.com/modem-dev/hunk/commit/ee97fefbc492a52543bfb4fe8be2a56e8f420622) - Open `$EDITOR` at the current line instead of the start of the selected hunk.

- [#710](https://github.com/modem-dev/hunk/pull/710) [`cd0df72`](https://github.com/modem-dev/hunk/commit/cd0df72e402ea968c74f38239d98790ac86432bd) - Generalize extension sidebars into dockable panes on all four review edges.

- [#717](https://github.com/modem-dev/hunk/pull/717) [`fe9373b`](https://github.com/modem-dev/hunk/commit/fe9373bcc7cd19d8c86333dcbf1079aa9c6fce6b) - Add extension APIs for transient sessions and observing or navigating guided review workflows.

- [#712](https://github.com/modem-dev/hunk/pull/712) [`994f66d`](https://github.com/modem-dev/hunk/commit/994f66d7bcdfe48a5f17b78436cb078dde0f12b3) - Install shared extensions straight from git with `hunk extension install <owner>/<repo>[@ref]` (plus `list`, `update`, and `remove`), let extension manifests declare a minimum API version via `"hunk": {"apiVersion": N}`, and find community extensions under the `hunk-extension` GitHub topic.

- [#726](https://github.com/modem-dev/hunk/pull/726) [`9bdb0bb`](https://github.com/modem-dev/hunk/commit/9bdb0bb94c28ce6b5ca5b052d3717ab6763ca2fb) - Extensions can mark character ranges inside diff lines with `hunk.registerLineHighlighter` (API v5): source-addressed, tone-based marks painted inside Hunk's own rendering with guaranteed contrast on every line kind, invalidated through `ctx.highlights.refresh`.

- [#749](https://github.com/modem-dev/hunk/pull/749) [`76e5eb2`](https://github.com/modem-dev/hunk/commit/76e5eb22efd759025615c96c7cafa98dfaa35ca1) - Hunk now runs on OpenTUI 0.5, picking up its faster FFI layout reads and a fix for duplicate live frame timers. Embedders of `hunkdiff/opentui` need to move their `@opentui/core` and `@opentui/react` peer installs to `^0.5.1`.

- [#706](https://github.com/modem-dev/hunk/pull/706) [`51df868`](https://github.com/modem-dev/hunk/commit/51df86850184b2b1a68be24c51b73465d32d50fb) - Let extensions invoke public Hunk review commands with atomic movement counts.

- [`f1bc9bf`](https://github.com/modem-dev/hunk/commit/f1bc9bfb562dad43023d88e49a57b7a1f26ace9c) - Let every configured vertical review key move open selection dialogs, including the theme selector.

- [#727](https://github.com/modem-dev/hunk/pull/727) [`b941e0f`](https://github.com/modem-dev/hunk/commit/b941e0f7e05b7e18516ddc4b8bd5748494dae0c1) - Extensions can jump the review to one exact source line with `ctx.navigation.revealLine(fileId, side, line)` (API v5), so a target deep inside a tall hunk lands near the top of the viewport instead of pages below its anchor.

- [#708](https://github.com/modem-dev/hunk/pull/708) [`61cc6b1`](https://github.com/modem-dev/hunk/commit/61cc6b167b09f3238f83c6c4e45a128972a44771) - Let extensions activate visible session-scoped keyboard modes that route keys through Hunk's public semantic commands.

- [#648](https://github.com/modem-dev/hunk/pull/648) [`c16206f`](https://github.com/modem-dev/hunk/commit/c16206f54da138b9fc21be60d8d414838af89a68) - Add configuration and CLI flags to control the sidebar in non-pager mode.

- [#711](https://github.com/modem-dev/hunk/pull/711) [`e31f7ad`](https://github.com/modem-dev/hunk/commit/e31f7ad8dac6b5e84523d6aac7aee67fe7b152cd) - Decouple bundled VCS providers from core, add provider-neutral repository bootstrapping, and let extension source readers report files that exceed their safe read limit.

### Patch Changes

- [#714](https://github.com/modem-dev/hunk/pull/714) [`bf981ee`](https://github.com/modem-dev/hunk/commit/bf981eed6eabd4390fadb29d57bcd459383e93e0) - Publish GitHub build provenance attestations for the release archives so installs can be cryptographically verified.

- [#743](https://github.com/modem-dev/hunk/pull/743) [`f5314d6`](https://github.com/modem-dev/hunk/commit/f5314d65757062091892105c19921a397fafd7a8) - Make the theme picker scroll independently, preview themes after a brief hover, and apply them on click.

- [#695](https://github.com/modem-dev/hunk/pull/695) [`63babe0`](https://github.com/modem-dev/hunk/commit/63babe0021396357ed9aa8cd4ea9617b01ce95c4) - Fix malformed `@@` hunk headers so each side's line range and count are emitted correctly.

- [#750](https://github.com/modem-dev/hunk/pull/750) [`781074d`](https://github.com/modem-dev/hunk/commit/781074d81c946e65744d93dece07e541ede96c44) - Start up faster for commands that never build a changeset. `hunk --version`, `--help`,
  `daemon serve`, the markup commands, and `hunk session *` no longer load the VCS, extension, and
  diff-engine graph before answering.

- [#714](https://github.com/modem-dev/hunk/pull/714) [`bf981ee`](https://github.com/modem-dev/hunk/commit/bf981eed6eabd4390fadb29d57bcd459383e93e0) - Document installing Hunk with mise, and note that Hunk ships as a default Omarchy tool.

- [#682](https://github.com/modem-dev/hunk/pull/682) [`cbd77c4`](https://github.com/modem-dev/hunk/commit/cbd77c4890ee4a07bed679162f6dbc1bf6e34885) - Wrap draft review notes by terminal cells instead of scrolling horizontally, so long CJK notes stay fully visible while typing; previously the composer stayed one row high and hid everything before the cursor.

- [#740](https://github.com/modem-dev/hunk/pull/740) [`772212d`](https://github.com/modem-dev/hunk/commit/772212dd9a1d8a5ced8b5290c6efafbf762ac5f6) - Agent notes anchored to collapsed or expanded-away lines now render beside their owning hunk instead of the top of the file.

- [#754](https://github.com/modem-dev/hunk/pull/754) [`859bdac`](https://github.com/modem-dev/hunk/commit/859bdac0027dfb7260a9c556164d6fbfd442a2bf) - Budget the syntax highlighting cache by lines instead of file count, so reviews of many small files stop re-highlighting as you scroll and reviews of very large files stay within a bounded memory footprint.

- [#757](https://github.com/modem-dev/hunk/pull/757) [`6d8752a`](https://github.com/modem-dev/hunk/commit/6d8752a132c96a8a618404f34e2e9c3fa073eda7) - Toggle the files pane without hiding independently controlled extension panes.

- [#733](https://github.com/modem-dev/hunk/pull/733) [`ef5798e`](https://github.com/modem-dev/hunk/commit/ef5798ee3998f6ec026b204adfcc0fb6aa827054) - Fix extension line highlights: marks now paint per file as they resolve instead of waiting for every file, never paint a previous review's offsets onto a reloaded file, stay visible on transparent line backgrounds, keep every active file's result retained however large the review is, and paint a row carrying thousands of ranges in milliseconds instead of seconds. Marks still resolve their tint against an assumed background on transparent cells, and a range covering only zero-width characters paints nothing.

- [#754](https://github.com/modem-dev/hunk/pull/754) [`859bdac`](https://github.com/modem-dev/hunk/commit/859bdac0027dfb7260a9c556164d6fbfd442a2bf) - Keep syntax highlighting cached for the files you are actually reviewing, so scrolling back to a recent file no longer re-highlights it.

- [#693](https://github.com/modem-dev/hunk/pull/693) [`505d9d3`](https://github.com/modem-dev/hunk/commit/505d9d373aec50b7c855e536dbab477560e5168d) - Keep the top menu bar inside the same one-column margin as the rest of the app instead of painting its background into the outer gutter.

- [#759](https://github.com/modem-dev/hunk/pull/759) [`5ebe975`](https://github.com/modem-dev/hunk/commit/5ebe97549edeeef855da92f1086f7bdc41354377) - Add an experimental `hunk --fast` mode that keeps eligible large syntax-highlighted diffs responsive with a Bun worker.

- [#714](https://github.com/modem-dev/hunk/pull/714) [`bf981ee`](https://github.com/modem-dev/hunk/commit/bf981eed6eabd4390fadb29d57bcd459383e93e0) - Recognize mise-managed installs and skip the startup update notice for them, since mise already keeps Hunk up to date.

- [#777](https://github.com/modem-dev/hunk/pull/777) [`bdec620`](https://github.com/modem-dev/hunk/commit/bdec620a7e977d0aaa8d6670b4f2d349590838f6) - Document that `mise use -g hunk` now installs Hunk on Windows with mise 2026.8.6 or newer.

- [#753](https://github.com/modem-dev/hunk/pull/753) [`cfe8eee`](https://github.com/modem-dev/hunk/commit/cfe8eee842a60d1f7946d1dbbb24b184b7ef62f8) - Improved diff alignment when a change block adds and removes different numbers of lines: the changed line now pairs with the line it actually resembles instead of whichever line happened to sit in the same position, so split view lines up correctly and the word-level highlight marks just the edited part instead of most of an unrelated line.

- [#703](https://github.com/modem-dev/hunk/pull/703) [`5afddf1`](https://github.com/modem-dev/hunk/commit/5afddf130c16a20870b20f36b6c2e869da28e182) - Keep Git's colors in non-diff `hunk pager` output for captured pager hosts, so LazyGit's branch log renders in its normal per-branch palette instead of a single color.

- [#754](https://github.com/modem-dev/hunk/pull/754) [`859bdac`](https://github.com/modem-dev/hunk/commit/859bdac0027dfb7260a9c556164d6fbfd442a2bf) - Render diffs larger than 10,000 lines as plain rows instead of syntax highlighting them, so a regenerated lockfile appears immediately and stops delaying color on the files around it.

- [#738](https://github.com/modem-dev/hunk/pull/738) [`58c7d48`](https://github.com/modem-dev/hunk/commit/58c7d48fffa693eeee5e6a9ef94e9e892439b8fe) - Fix `hunk diff` taking tens of seconds in repos with many untracked files by synthesizing untracked diffs in-process instead of spawning one `git diff --no-index` subprocess per file.

- [#760](https://github.com/modem-dev/hunk/pull/760) [`e5116b3`](https://github.com/modem-dev/hunk/commit/e5116b3a35a8733eb9e4985dade9a66e0327f3ca) - Name the public files-pane command `hunk.view.toggleFilesPane`, preserve `hunk.view.toggleSidebar` as a compatibility alias, and require `hunk:files` when directly controlling the built-in pane.

## 0.18.2

### Patch Changes

- [#742](https://github.com/modem-dev/hunk/pull/742) [`568e7a5`](https://github.com/modem-dev/hunk/commit/568e7a50ff34ba64fb1784cc74ffd1c7d0baaafc) - Fix `hunk diff` taking tens of seconds in repos with many untracked files by synthesizing untracked diffs in-process instead of spawning one `git diff --no-index` subprocess per file.

## 0.18.1

### Patch Changes

- [`f0c2d88`](https://github.com/modem-dev/hunk/commit/f0c2d88bbc5cd6c98cb1174988466eda640fe12c) - Fix malformed `@@` hunk headers so each side's line range and count are emitted correctly.

- [`85f441b`](https://github.com/modem-dev/hunk/commit/85f441b1474b02a00cc029c1e6db06287c0b571e) - Keep the top menu bar inside the same one-column margin as the rest of the app instead of painting its background into the outer gutter.

- [`a890077`](https://github.com/modem-dev/hunk/commit/a89007730f46b7a809a457039c856f736e0d22be) - Keep Git's colors in non-diff `hunk pager` output for captured pager hosts, so LazyGit's branch log renders in its normal per-branch palette instead of a single color.

## 0.18.0

### Highlights

Hunk 0.18.0 makes reviews more precise, customizable, and extensible—while improving performance and reliability across large repositories and diverse terminals.

- **A full extension platform.** Install TypeScript extensions that add VCS backends, commands, sidebars, dialogs, interactive file views, themes, and workspace actions.
- **Line-level review and commenting.** A visible cursor moves with `j`/`k`, and `c` adds a comment exactly where you are looking—even across large reviews and wrapped lines.
- **Richer agent context.** Experimental STML notes can present structured, terminal-native explanations with preview tools and layout-aware feedback.
- **Full reviews from pipelines.** Piped diffs now retain Hunk’s navigation, filtering, layouts, sidebars, and other review controls.
