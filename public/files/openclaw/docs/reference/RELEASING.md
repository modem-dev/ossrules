---
doc-schema-version: 1
summary: "Release lanes, operator checklist, validation boxes, version naming, and cadence"
title: "Release policy"
read_when:
  - Looking for public release channel definitions
  - Running release validation or package acceptance
  - Looking for version naming and cadence
---

OpenClaw exposes four user-facing update channels:

- stable: the promoted regular release on npm `latest`
- extended-stable: the trailing completed month's `.33+` maintenance line on
  npm `extended-stable`
- beta: prerelease tags on npm `beta`
- dev: the moving head of `main`

Extended-stable ships the trailing month's Gateway, official npm plugins, and
Docker images without moving regular `latest` or `main` selectors.

Tideclaw alpha builds are a separate internal prerelease track (npm dist-tag `alpha`), covered under [NPM workflow inputs](#npm-workflow-inputs) and [Release test boxes](#release-test-boxes).

## Version naming

- Monthly Gateway extended-stable release version: `YYYY.M.PATCH`, with `PATCH >= 33`, git tag `vYYYY.M.PATCH`
- Daily/regular final release version: `YYYY.M.PATCH`, with `PATCH < 33`, git tag `vYYYY.M.PATCH`
- Regular fallback correction release version: `YYYY.M.PATCH-N`, git tag `vYYYY.M.PATCH-N`
- Beta prerelease version: `YYYY.M.PATCH-beta.N`, git tag `vYYYY.M.PATCH-beta.N`
- Alpha prerelease version: `YYYY.M.PATCH-alpha.N`, git tag `vYYYY.M.PATCH-alpha.N`
- Never zero-pad month or patch
- `PATCH` is a sequential monthly release-train number, not a calendar day. Regular final and beta releases advance the current train; alpha-only tags never consume or advance the beta/regular patch number, so ignore legacy alpha-only tags with higher patch numbers when selecting a beta or regular train.
- Alpha/nightly builds use the next unreleased patch train and increment only `alpha.N` for repeated builds. Once that patch has a beta, new alpha builds move to the following patch.
- npm versions are immutable: never delete, republish, or reuse a published tag. Cut the next prerelease number or the next monthly patch instead.
- `latest` continues to follow the current regular/daily npm line. For core and every published official plugin, `beta` must always resolve to a version greater than or equal to `latest` under semver ordering; a same-train prerelease is older than its final release.
- `extended-stable` means the supported trailing-month Gateway distribution, beginning at patch `33`; patch `34` and later are maintenance releases on that monthly line
- Regular final and regular correction releases publish to npm `beta` by default; release operators can target `latest` explicitly, or promote a vetted beta build later
- Gateway extended-stable publishes core, every npm-publishable official plugin,
  and its Docker images at one exact version; see the dedicated workflow below.
- Regular final releases publish the npm package first and finalize the GitHub release after npm and Docker verification. macOS, signed Windows Hub installers, and the signed standalone Android APK publish independently in parallel or afterward; app readiness never delays npm or GitHub publication. Verify each native release separately before announcing all platforms complete. Beta releases normally validate and publish the npm/package path first, with native app build/sign/notarize/promote reserved for regular final unless explicitly requested.

## Release cadence

- Releases move beta-first; stable follows only after the latest beta is validated. Publishing or promoting to `latest` requires immediate beta-floor repair through the release ledger; a newer beta remains unchanged.
- Maintainers normally cut releases from a `release/YYYY.M.PATCH` branch created from current `main`, so release validation and fixes do not block new development on `main`
- If a beta tag has been pushed or published and needs a fix, maintainers cut the next `-beta.N` tag instead of deleting or recreating the old one
- Detailed release procedure, approvals, credentials, and recovery notes are maintainer-only

## Linux companion publication

Regular stable publication requests Linux bundles automatically after GitHub
activation. A successful request is not completed Linux publication. Verify the
versioned AppImage, Debian package, signatures, and checksums independently;
pending Linux work does not block npm, Docker, GitHub finalization, or stable
main closeout.

The Linux publisher writes immutable `OpenClaw-<version>-linux.json` evidence
beside the bundles. It binds the source tag/SHA, original release ID, trusted
tooling SHA, updater key, and exact asset identities. Complete public bundles
are verified and reused rather than rebuilt. Asset completeness is separate
from unfinished channel publication.

One post-build publisher advances the fixed `linux-stable` control release's
`latest.json` only forward, then mirrors those exact bytes onto the latest
Gateway release. An authorized Linux publication creates the control release
as prerelease/non-latest when absent; ordinary PR validation never creates it.
Conflicting state, or missing canonical metadata on an existing channel, fails
closed; it never grants permission to overwrite arbitrary metadata.

Before activating a new Gateway release, the existing carry step preserves the
previous usable Linux manifest's original version, signature, and download URL.
After finalization and readback, a bounded detached mirror-only request catches
up that legacy endpoint without keeping the core release waiting for the
metadata queue. Dispatch acceptance is not mirror success. Cancellation, queue
overflow, timeout, and readback failures are visible degraded outcomes requiring
reconciliation, not reasons to roll back core publication.

Every asset or release-note mutation revalidates the live executing writer and
its original validated publication request after preparatory reads. A canceled
or superseded attempt stops before its next write, including between deletion
and replacement. Partial state remains available for investigation.

An interrupted deletion of canonical `latest.json` requires explicit
release-owner reconciliation; normal publication refuses to guess a version
floor. Retain the last verified canonical manifest and all intervening
publication evidence. Under exclusive metadata-writer ownership, reread the
channel release ID, tag/SHA, inventory, and canonical absence, then prove that
the selected immutable manifest is not older than any intervening valid
publication. Verify its source and asset identities, restore those exact bytes,
and read back both canonical and legacy endpoints. Stop on ambiguity; a supplied
version/hash or current Gateway `latest` alone is not Linux forward-order proof.

This tooling does not activate a new shipped endpoint or download link.
Existing clients retain `releases/latest/download/latest.json`. A later
`linux-stable` client cutover requires separate release approval, qualified
signed artifacts, and an installed-old-client migration proof. An old client
cannot acquire a corrected version comparator before its current comparator
offers the update; verify the chosen version is newer under that shipped
comparator. Local tests, unsigned packaging, and metadata readback do not prove
that migration.

## Release changelog artifacts

`CHANGELOG.md` is the generated release index. Each release has one complete
`CHANGELOG/YYYY.M.PATCH.md` file. Existing complete contribution records are
also retained in `CHANGELOG/records/YYYY.M.PATCH.md`, independently of later
editorial changes. Historical releases without records gain no invented data.
Initial release generation keeps its existing Highlights, Changes, Fixes and
contribution-record format; it does not automatically run the later docs rewrite.

Use the shared changelog owner rather than parsing the root index as release
notes:

```bash
node scripts/release-changelog.mjs read --version YYYY.M.PATCH
node scripts/release-changelog.mjs read --version YYYY.M.PATCH --ref <exact-sha-or-tag>
node scripts/release-changelog.mjs read --version YYYY.M.PATCH --record
node scripts/release-changelog.mjs write --version YYYY.M.PATCH --file /path/to/initial-section.md
pnpm changelog:check
```

The reader supports older tagged commits that still use a monolithic changelog.
Current writes require the split layout and update the selected entry, its
matching record and index together. Initial generation refuses to overwrite a
docs mirror. Historical duplicate version headings are preserved in their
original order, but automated single-release selection refuses an ambiguous
version. Generated files retain their source bytes; use their generator and
`changelog:check`, not a general-purpose formatter.

### Changelog-only evidence reuse

After product qualification, a later Release SHA may reuse Code SHA evidence
under `split-changelog-release-v1` only when the complete delta:

- Adds or modifies `CHANGELOG/YYYY.M.PATCH.md` for the selected release.
- Optionally adds or modifies that release's matching record and modifies the
  root `CHANGELOG.md` index.
- Contains no other paths, other releases, renames or deletions.

Beta package versions select the stable-base entry and matching record. For
example, `2026.9.5-beta.1` uses `CHANGELOG/2026.9.5.md` and
`CHANGELOG/records/2026.9.5.md`, as release-note generation does.

Docs-source changes do not qualify for this narrow reuse policy. Historical
root-only receipts retain `changelog-only-release-v1` and its original exact
`CHANGELOG.md` delta; they are not relabeled as split-layout evidence. Either
form reuses product validation only: the new Release SHA's package and image
bytes still require their own qualification.

## Monthly Gateway extended-stable publication

For completed month `YYYY.M`, create `extended-stable/YYYY.M.33` and publish
`.33+` from that branch. Tag, branch, checkout, package version, preflight, and
validation must identify one commit. Before `.33`, protected `main` must contain
a final version below patch `33` exactly one calendar month later, making the
release the trailing completed month. Maintenance patches remain eligible only
while that holds; the older line retires when `main` advances another month.

### Prepare and stabilize the candidate

Audit the unaudited mainline range, reconcile private security work, approve a
bounded backport set, and land one coordinated PR. Do not push the canonical
branch directly.

On the canonical branch, set `YYYY.M.P`, run `pnpm release:prep`, and require
that version in every publishable official plugin. From the approved ledger,
generate and commit a complete `## YYYY.M.P` section in `CHANGELOG/YYYY.M.P.md` with `### Highlights`,
`### Changes`, and `### Fixes`, citing original merged `main` PRs for equivalent
backports. Preflight rejects a missing or empty section.

Carry the full current-main Docker release-channel unit: workflow, promoter,
policy, shared classifier, tests, and workflow validation. GitHub loads tag
workflows from the tagged commit; an incomplete copy can fail after building or
move regular aliases. Run focused checks.

Freeze the full branch-tip SHA and record the exact trusted-main Tooling SHA.
Before tagging, run Full Release Validation through its immutable workflow
transport; it also prepares and qualifies the exact npm and Docker bytes.
`pnpm ci:full-release` runs `scripts/full-release-validation-at-sha.mjs`; this
page uses the `pnpm` form throughout.

```bash
VALIDATION_SHA="<exact-candidate-sha>"
TOOLING_SHA="<recorded-full-main-ancestor-sha>"
CONTEXT_REF="extended-stable/YYYY.M.33"
pnpm ci:full-release \
  --sha "$VALIDATION_SHA" \
  --target-ref "$CONTEXT_REF" \
  --workflow-sha "$TOOLING_SHA" \
  -f validation_purpose=publish \
  -f publication_selection_json='{"route":"extended-stable","npmDistTag":"extended-stable","publishOpenclawNpm":true,"pluginPublishScope":"all-publishable","plugins":[]}' \
  -f release_profile=stable \
  -f run_release_soak=true \
  -f fail_fast=false \
  -f rerun_group=all \
  -f reuse_evidence=false \
  -f dispatch_release_evidence=false
```

The helper dispatches from an immutable `release-ci/*` ref at the Tooling SHA,
passes the Validation SHA as `ref` and `expected_sha`, and records the canonical
branch as `target_context_ref`. GitHub workflow dispatch `--ref` must name a
branch or tag; it cannot be a raw SHA. Save the successful run ID and
`run_attempt`. When its manifest contains `publicationArtifacts.npmPreflight`,
use that same Full Release Validation run and attempt for both npm preflight and
full validation publication evidence.

Extended-stable also requires a separate npm preflight from trusted `main`:

```bash
gh workflow run openclaw-npm-release.yml \
  --repo openclaw/openclaw \
  --ref main \
  -f tag="$VALIDATION_SHA" \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable \
  -f release_candidate_branch="$CONTEXT_REF"
```

This standalone run is a supplemental validation-only preflight. Do not pass
its run ID as publication `preflight_run_id`: its `main` workflow head is not
the canonical candidate branch/SHA identity required for standalone
publication evidence. Publication continues to use the integrated Full Release
Validation npm artifact and exact run attempt.

Classify failures before editing:

- Product: land another approved backport PR.
- Frozen-target tooling: backport only the smallest compatibility repair that
  tests the old product unchanged.
- Provider, approval, runner, or service: keep the candidate unchanged and use
  the bounded retry path.

Any branch change invalidates both gates. Once they pass, require the tip still
equals `VALIDATION_SHA`, then push signed `vYYYY.M.P`. Later changes need the next
patch; never move or delete the tag. Tagging fixes the immutable release
identity; it does not publish Docker images.

### Publish the npm packages

Publish every npm-publishable official plugin from the same SHA and save the
successful run ID:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

The workflow covers all `all-publishable` packages, including unchanged ones,
and verifies every exact version and selector. Reruns reuse published versions.

Then publish the prepared core tarball with all three saved run identities:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

If the immutable candidate has already passed its saved preflight and Full
Release Validation but core publication needs a workflow-only recovery, dispatch
the trusted current-`main` workflow instead. Keep the same tag and evidence
identities; do not move the tag or republish plugins:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref main \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f release_candidate_branch=extended-stable/YYYY.M.33 \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

This recovery path checks out and publishes the immutable tag and requires the
canonical branch implied by that tag. It accepts Full Release Validation
evidence from the canonical candidate branch directly, from current `main`
directly when its workflow SHA is reachable from current `main`, or from the
trusted main-pinned harness. Every accepted form must attest the immutable
tag's SHA. Use it only when the candidate source and recorded evidence are
unchanged.

For non-production rehearsal only, add
`-f bypass_extended_stable_guard=true` to preflight and publish. It bypasses the
month guard only, never canonical-ref, SHA/tag/version equality, provenance,
approval, or readback checks. Never use it for production.

### Verify and recover

From a separate clean current-`main` checkout, not the frozen branch, run:

```bash
node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.P
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Require signatures and npm provenance for the canonical branch, plus publish,
preflight, and tarball-digest binding to the release SHA. Both commands must
return `YYYY.M.P`. Verify every prepared core package and `all-publishable`
official plugin at its exact version and selector.

If only the root selector fails, use the generated
`npm dist-tag add openclaw@YYYY.M.P extended-stable` repair command printed in
the workflow summary. Repair existing plugin or other prepared-core selectors
through approved credential-isolated tooling; the OIDC source cannot mutate
them. Never republish an immutable version.

Require `Docker Release` to verify exact default, slim, browser, and architecture
images in GHCR and Docker Hub, including attestations and platform versions. It
must advance only
`extended-stable`, `extended-stable-slim`, and `extended-stable-browser` by
digest; regular aliases remain unchanged and automatic rollback is rejected.

After that core registry readback succeeds, start Docker publication only through
`OpenClaw Release Publish`. Its Docker-only extended-stable path rechecks the
saved npm preflight artifact, exact `Full Release Validation` evidence, exact npm
version and `extended-stable` selector, and published tarball digest before it
calls the reusable `Docker Release` workflow. A tag push never publishes Docker
images by itself:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.P \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f npm_dist_tag=extended-stable \
  -f publish_openclaw_npm=false \
  -f publish_docker_only=true
```

For alias repair, run approval-gated `Docker Channel Promotion` from current
`main` with the tag. It repeats digest, attestation, and platform checks, allows
an explicit rollback, and never rebuilds images.

Slack, Discord, and Codex are the initial documented support surfaces, not a
release allowlist: every npm-publishable official plugin ships. The regular
checklist alone owns beta/`latest`, GitHub Releases, ClawHub, native apps, mobile,
website, and private dist-tags; do not run those steps for this Gateway path.

## Regular release operator checklist

This checklist is the public shape of the release flow. Private credentials and service-specific signing, notarization, dist-tag recovery, and emergency rollback procedures stay in the maintainer-only release runbook.

`pnpm release:candidate` rejects fresh extended-stable launches, whether selected
with `--npm-dist-tag extended-stable` or inferred from a final `.33+` version.
Monthly correction suffixes are invalid; use a new monthly maintenance patch.
Follow [Monthly Gateway extended-stable publication](/reference/RELEASING#monthly-gateway-extended-stable-publication):
Full Release Validation, then the separate plugin npm and core npm publication owners.
The guard runs after trusted tooling, candidate/tag, optional artifact, and saved-state
checks, but before state writes, generated checks, plugin plans, or validation dispatch.
An npm preflight run alone does not make a launch a resumed full-validation run.
Explicit or restored full-validation run IDs and `--skip-dispatch` retain their
existing recovery behavior; they do not certify monthly publication through this helper.

Fresh FRV preparation requires `validation_purpose=publish` and the actual
publication selection. Regular examples below use normal final publication;
select `npmDistTag=beta` for a beta and `route=prepared` for the prepared button.
The checklist equivalent is `--publication-route prepared`; a protected tooling
ref alone leaves the default route normal. Saved state binds that choice and
historical state without it retains normal recovery, not new source admission.
Keep one selection on Code-SHA and later notes-only Release-SHA parents:

```bash
PUBLICATION_SELECTION='{"route":"normal","npmDistTag":"latest","publishOpenclawNpm":true,"pluginPublishScope":"all-publishable","plugins":[]}'
```

Source admission validates committed metadata before selected producers start.
It is not registry eligibility, product-validation success, or publication
authority. Nonpublish work explicitly selects `diagnostic`,
`main-qualification`, or `postpublish-confidence` without a publication selection.
Fresh publish tooling additionally collects and retains selected public-registry
observations before fanout. The checklist and evidence verification authenticate
that original admission and compare their actual operands without repeating the
FRV observation sweep. Publishers retain their live registry planning, trust
checks, and final readbacks. Supported bootstrap routes still require downstream
owner authorization; admission does not grant it.

An explicit stable or full release request includes macOS publication unless the operator limits its scope. That authorization carries through macOS validation, signing, notarization, promotion, and verification without a separate macOS consent step. Follow the current owner-configured environment policy and retain all enforced rules and exact-source artifact checks.

For beta, stable, and full profiles, Linux (`ubuntu`) cross-OS lanes gate npm publication. Windows and macOS cross-OS lanes run in parallel as advisory coverage; their failures remain visible under **advisory** in `release-ci-summary` and in the evidence manifest without blocking Release Decision or `pnpm release:candidate`. Selected lanes still finish for terminal evidence. npm qualification, Docker, Package Acceptance, normal CI, and the profile's performance and soak gates remain required. macOS app signing/notarization/appcast and Windows Hub asset promotion run in parallel with or after npm publication and never delay it; verify platform readiness separately.

1. Start from current `main`: pull latest, confirm the target commit is pushed, and confirm `main` CI is green enough to branch from.
2. Create `release/YYYY.M.PATCH` from that commit. Backports are optional; apply only the operator-selected set. Bump every required version location, run `pnpm release:prep`, finish release fixes and required forward-ports, and review `src/plugins/compat/registry.ts` plus `src/commands/doctor/shared/deprecation-compat.ts`.
3. Prepare the complete history manifest and release notes, then freeze the product-complete commit and target context as the **Code SHA/ref**, and record the trusted **Tooling SHA/ref**. Run the deterministic source preflight, then use `pnpm ci:full-release --sha <code-sha> --target-ref release/YYYY.M.PATCH --workflow-sha <tooling-sha> -f validation_purpose=publish -f publication_selection_json="$PUBLICATION_SELECTION"`. Reuse those exact identities for later release validation; never refresh the tooling from moving `main`. Beta-publish uses `release_profile=beta` without soak; postpublish-confidence owns broad live, QA-live, mobile, and Parallels work.
4. Classify failures before editing as product, harness/tooling/provenance, infrastructure/credential, or wrapper. Only confirmed product failure creates a new Code SHA. Use one diagnosis, one fix when needed, and one narrow retry, then reassess.
5. Keep the selected `CHANGELOG/YYYY.M.PATCH.md` section complete, user-facing and deduplicated, covering merged PRs and direct commits since the last reachable shipped tag. Use the shared writer to keep its contribution record and root index aligned. The full manifest and editorial pass may overlap Code validation. When a divergent shipped tag or later forward-port re-associates already-released PRs, pass it explicitly as `--shipped-ref`. A contribution-record target may be an ancestor of the final target; include later fixes honestly rather than inventing a self-referential SHA.
6. If the qualified Code SHA already contains fully final notes, use that same commit as **Release SHA**. One successful fresh full qualification can supply both lifecycle roles and their exact publication bytes; do not create another commit or run solely to separate the labels. If notes change after qualification, commit the selected release entry and any matching record/index updates as a new Release SHA. Changes outside the [changelog-only delta](#changelog-only-evidence-reuse) return the release to step 2.
7. When Code SHA equals Release SHA, retain its successful full validation parent and exact prepared npm/OCI descriptors. Only for a later genuine changelog-only descendant, optionally run SHA-pinned Full Release Validation with evidence reuse: the complete delta must satisfy `split-changelog-release-v1`, point at green Code evidence, and dispatch no product child lanes. That path still prepares and qualifies new Release SHA package/image bytes. Either path must satisfy every required profile gate. Regular final artifacts include SDK reports for both npm `beta` and `latest`; review the report and 8-character acknowledgement for the channel you will publish.
8. Save that successful Full Release Validation run as both the validation run and `preflight_run_id`. Its read-only npm workflow builds and packs the root/core packages once, checks source in parallel, and qualifies the exact bytes with the final changelog. Docker images build in parallel and are preserved for later promotion. Review the **Plugin SDK API diff** summary. If it reports changes, inspect the readable diff (also uploaded as `plugin-sdk-api-release-diff-<run-id>-<run-attempt>`) and record the 8-character acknowledgement digest printed by the report; omit the acknowledgement when it reports no Plugin SDK API changes. Standalone `OpenClaw NPM Release` with `preflight_only=true` remains available for focused preflight and recovery.

   Prepared packing reuses the exact preflight build while retaining package smoke checks, inventory generation, docs and changelog preparation, and source restoration. It also runs `pnpm update:compat:check` against npm's current `latest` and `beta` tags before packing. Ordinary source packing still performs a clean package build without that registry freshness check.

   Packaging resolves the selected release through the shared owner and temporarily replaces the root index with that release's notes. If initial notes exceed 500 KiB, it keeps every editorial note and replaces only the complete contribution record with a link to the exact release tag's `CHANGELOG/records/YYYY.M.PATCH.md`; historical monolithic tags retain their `CHANGELOG.md` record link. Initial editorial notes must still satisfy the release-note minimum, and packaging fails if the compact result still exceeds the cap.

   Later docs mirrors remain complete in the package while they fit the same cap. An oversized mirror produces a small page linking the complete changelog and its Raw view, the separate contribution record, and the release documentation. Those changelog links follow the maintained files on `main`, so they also work for historical releases whose tags predate the split layout. Packaging never truncates mirrored prose. Postpack restores the exact source index, leaving the full release entry, docs sources, and credits unchanged. The archive is not included in the npm package.

9. Create the protected lightweight tooling tag at the recorded Tooling SHA using the [publish automation commands](#regular-release-publish-automation). Run the candidate helper against the untagged Release SHA with the successful Release-SHA validation parent and that tooling tag:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --target-sha <release-sha> \
     --full-release-run <release-sha-validation-run-id> \
     --publish-workflow-ref release-publish/<tooling-sha12>-<epoch> \
     --plugin-sdk-api-acknowledgement <reviewed-8-character-digest> \
     --skip-dispatch
   ```

   Include `--plugin-sdk-api-acknowledgement` only when the preflight reported Plugin SDK API changes. Stable candidates need no Windows tag. Optionally pass `--windows-node-tag vX.Y.Z` to record the approved installer digest map and include both Windows inputs in the printed publish command. Beta and alpha candidates defer Parallels install/update proof to the postpublish `pnpm release:beta-smoke` roster by default; pass `--run-parallels` only when the operator explicitly wants that proof before publish. Stable and full candidates run Parallels by default. The helper verifies release-note provenance, npm preflight bytes, and plugin publish plans, then prints the publish command. When admitted Full Release Validation evidence carries `coveragePolicy=npm-beta-v1`, it records Telegram package proof as `deferred-postpublish`; other evidence retains the existing Telegram check. After it completes green, create and push the final signed tag at that same Release SHA, then run the printed publish command.

   `pnpm release:candidate` validates the current frozen branch tip by default (or the explicit `--target-sha`), and rejects a tag that already exists. It records evidence before the final signed tag is pushed.

   The helper uses the qualified npm artifact bound by Full Release Validation. Supply `--npm-preflight-run` only to recover a separately prepared historical release. It never silently rebuilds a missing qualified artifact. Docker publication consumes the prepared OCI artifacts after checking the finalized tag and exact producer tuple; only registry writes and selector promotion hold the publication lock.

   `OpenClaw Release Publish` dispatches the selected or all-publishable plugin packages to npm and the same set to ClawHub in parallel, then promotes the prepared OpenClaw npm preflight artifact with the matching dist-tag once plugin npm publish succeeds. It keeps the GitHub release as a draft while it verifies registry readback, calls `Docker Release` with the immutable tag and Release SHA for beta and stable releases, and only then finalizes the GitHub release. npm-only alpha releases finalize after the required npm checks without scheduling Docker. The release checkout remains the product/data root, while planning and final verification execute from the exact trusted workflow-source checkout so an older release commit cannot silently use obsolete release tooling. Once publication binds the frozen Tooling SHA to an exact protected lightweight `release-publish/<12sha>-<provenance-run>` tag, that live tag-to-SHA mapping remains authoritative when `main` advances; the suffix records tag-creation provenance, not the current parent run id. Core and plugin npm publishers re-read that exact tag and revalidate the exact parent run tuple immediately before each npm publish or dist-tag mutation, failing closed on a missing, moved, annotated, or wrong-SHA tag, parent mismatch, or disallowed parent state. Other privileged writers require their dependent enforcement changes before the protected-tag publication route is globally complete. Before any publish child starts, it renders and caches the exact GitHub release body. When the complete selected `CHANGELOG/YYYY.M.PATCH.md` section fits GitHub's 125,000-character limit and the renderer's matching 125,000-byte safety ceiling, the page contains that exact `## YYYY.M.PATCH` section including its heading. When the source section does not fit, the page keeps the exact grouped editorial notes and replaces the oversized contribution record with a stable link to the full record in the tag-pinned `CHANGELOG/records/YYYY.M.PATCH.md` (historical monolithic tags retain their original record link); partial records and truncated bullets are never published. The workflow chooses that full or compact body before adding `### Release verification`; if the proof tail would exceed the limit, it keeps the canonical body and relies on the immutable attached evidence instead. Stable releases published to npm `latest` become the GitHub latest release, while stable maintenance releases kept on npm `beta` are created with GitHub `latest=false`. The workflow also uploads the preflight dependency evidence, the full-validation manifest, and postpublish registry verification evidence to the GitHub release for post-release incident response. It prints child run IDs immediately, auto-approves release environment gates the workflow token is allowed to approve, summarizes failed child jobs with log tails, creates the draft GitHub release page up front, runs native Android qualification independently for a matching tagged Android pin (otherwise recording an explicit skip and shared mobile cutter remedy) and dispatches its publisher after the npm publisher succeeds without making GitHub finalization wait, waits for ClawHub staging only when `wait_for_clawhub=true` (the default `false` leaves that child detached), then runs the trusted-main beta verifier and uploads postpublish evidence for the GitHub release, npm package, selected plugin npm packages, staged ClawHub child workflow run IDs, and optional NPM Telegram run ID. The ClawHub bootstrap verifier requires the exact trusted-main workflow path and SHA, producer and terminal run attempts, release SHA, requested package set, immutable package artifact tuple, and terminal registry readback artifact; a successful legacy release-ref run is not accepted.

   Core npm dispatch and environment approval start as soon as plugin npm succeeds. Once the exact `npm-release` approval succeeds, the parent proceeds without waiting for core runner allocation. ClawHub inventory authorization and optional bootstrap completion can overlap the running core publish. A failed ClawHub authorization still fails the parent and leaves the GitHub release as a draft; the parent collects any already-started core result and records its evidence.

   Normal ClawHub publication uses a v2 child identity and a parent-owned immutable authorization receipt. The child seals the exact packed package inventory; the parent validates the live child attempt, approved package set, candidate SHA, and tooling identity before uploading the receipt. The child submits staged packages without waiting for public visibility. After the parent succeeds, `Plugin ClawHub Postpublish` verifies the exact parent and child attempts, immutable receipt and tarballs, and canonical registry bytes. That detached verification must succeed before announcing plugin publication complete. An explicit no-publication dispatch record distinguishes Docker-only or empty plugin scope from missing evidence. Failed-parent recovery still requires a separately valid parent receipt bound to the recovery child; an old child-bound receipt cannot authorize a new run.

   New npm preflight manifests record the producer's original qualified workflow ref, SHA, run ID, and attempt. Consumers compare that immutable tuple with the admitted producer; legacy manifests retain `legacy-unrecorded` provenance instead of inventing a full ref. ClawHub artifact readback proves package bytes and current registry metadata only: `publicationAuthentication: not-verified` does not attest how the historical publish authenticated.

   Then run the post-publish package acceptance against the published `openclaw@YYYY.M.PATCH-beta.N` or `openclaw@beta` package. If a pushed or published prerelease needs a fix, cut the next matching prerelease number; never delete or rewrite the old one.

10. On a failed publish attempt, keep the Release SHA unchanged unless the failure proves a product or changelog defect. Resume successful immutable children and artifacts; never rebuild or republish a package version that already succeeded. An app failure is an independent recovery task: retain its summary and evidence, and recover that platform without rerunning npm or keeping the GitHub release drafted.
11. For stable, publish through `OpenClaw Release Publish` after Full Release Validation and candidate evidence pass, reusing the successful preflight artifact via `preflight_run_id`. Plugin npm publication gates core npm; ClawHub runs in parallel. The GitHub release finalizes after npm and Docker evidence passes. Run macOS through the validation, preflight, and publish workflows in `openclaw/releases`; its `.zip`, `.dmg`, `.dSYM.zip`, and signed `appcast.xml` retain their own verification requirements. Windows Hub and Android also attach their verified assets independently. Android dispatch starts after core npm succeeds and may finish after the GitHub release becomes public. Supply both optional Windows inputs to schedule promotion after GitHub publication, or use the [manual recovery command](#regular-release-publish-automation) later. App approval, build, signing, promotion, or failure never delays npm or the GitHub release.
12. After publish, run the npm post-publish verifier, optional standalone published-npm Telegram E2E when you need post-publish channel proof, dist-tag promotion when needed, and verify the generated GitHub release page. Announce the published surfaces accurately, then complete [Stable main closeout](#stable-main-closeout), recording pending apps explicitly. App workflows can finish afterward; verify their assets and the macOS appcast before announcing those platforms complete.

Regular stable GitHub activation automatically requests the Linux AppImage and
Debian package through `Linux App Release Request` on `main`, for both the
legacy publisher and `OpenClaw Release Button`. Request acceptance does not mean
the assets have published; verify the independent `Linux App Release` run and
its signed updater manifest. Before advancing GitHub latest, the publisher
preserves the previous Linux update while the new build is pending. Complete
same-tag Linux assets are reused on retries; partial assets require targeted
recovery without replacing published bytes. Alpha and beta prereleases, and
extended-stable publication, do not inherit this Linux request.

After Linux assets publish, rebuild `openclaw.ai` through its website deployment
owner: desktop download data is resolved at build time. Verify the deployed Apps
card's version and both Linux download URLs before calling the website handoff
complete.

## Stable main closeout

Stable publication is not complete until `main` carries the actual shipped release state.

1. Start from fresh latest `main`. Audit `release/YYYY.M.PATCH` against it and forward-port real fixes absent from `main`. Do not blindly merge release-only compatibility, test, or validation adapters into newer `main`.
2. For the normal path, set `main` to the shipped stable version. A late closeout may use `main` after it has advanced to a later stable OpenClaw CalVer; do not downgrade an already-started release train solely to close the prior release. The validator still requires the exact shipped changelog section and records the actual `main` version and SHA. It requires the matching appcast entry once the macOS release has published; until then it records `appcast: pending`. Run `pnpm release:prep` after any root version change.
3. Resolve the shipped release through the shared changelog owner. Its initial-format `CHANGELOG/YYYY.M.PATCH.md` section on `main` must exactly match the tagged release, with the matching contribution record retained separately. If `main` already has an approved docs mirror, preserve that prose and require its frozen contribution record to match the shipped accounting instead. Keep the generated root index current. Include the stable `appcast.xml` update when the mac release published one.
4. Do not add `YYYY.M.PATCH+1`, a beta version, or an empty future changelog section to `main` until the operator explicitly starts that release train.
5. Run `pnpm release:generated:check`, `pnpm deps:npm-lock:check`, and `OPENCLAW_TESTBOX=1 pnpm check:changed`. Push, then verify `origin/main` contains the shipped version and changelog before calling the stable release done.
6. Keep the repository variables `RELEASE_ROLLBACK_DRILL_ID` and `RELEASE_ROLLBACK_DRILL_DATE` current after each private rollback drill.

`OpenClaw Stable Main Closeout` starts from the `main` push that carries the shipped version and changelog after stable publication; apps may still be pending. Include the appcast once macOS publishes. It reads immutable postpublish evidence to bind the shipped tag to its Full Release Validation and Publish runs, then verifies the stable main state, release, mandatory stable soak, and blocking performance evidence. It attaches an immutable closeout manifest and checksum to the GitHub release. The manifest records `appPlatforms` with `macos`, `windows`, and `android` each `pending` or `attached`; aggregate `apps` is `attached` only when every required platform asset has a lowercase `sha256:<64hex>` digest. At the first closeout, `appcast` is `pending` unless the full macOS zip/DMG/dSYM asset set is attached with canonical digests; a complete macOS set requires appcast verification and records `verified`. Replay preserves the initial app snapshot and requires every recorded asset name and digest to match exactly. Later canonical app attachments are allowed, while changed or deleted recorded assets and unrelated additions remain errors. Recorded app, recovery, and asset fields remain byte-identical while authoritative release fields are recomputed. When macOS attaches after closeout, replay also checks its entry in the current main appcast; it preserves an appcast already verified at the original closeout. The automatic push trigger skips legacy releases that predate immutable postpublish evidence and never treats that skip as a completed closeout.

A complete closeout requires the closeout manifest asset and its matching checksum. A partial manifest replays its recorded `main` SHA and rollback drill to regenerate identical bytes, then attaches the missing checksum; an invalid pair, or a checksum without a manifest, stays blocking. A push-triggered run without rollback drill repository variables skips without completing closeout; a missing or more-than-90-day-old drill record still blocks manual evidence-backed closeout. Private recovery commands remain in the maintainer-only runbook. Use manual dispatch only to repair or replay an evidence-backed stable closeout.

If the Release Publish parent failed only after immutable npm/plugin evidence was attached, repair and verify the required npm, Docker, and GitHub publication surfaces. A maintainer may then manually dispatch closeout with `allow_failed_publish_recovery=true`; that mode accepts only a completed failed parent and preserves the publication evidence checks. Pending apps do not block recovery; the closeout records their state, and a published macOS release still requires a valid appcast. Automatic push closeout never enables this recovery mode. When core npm succeeded but the original parent failed during postpublish readback, an independently successful Docker-only publisher may supply the Docker proof. The checksummed postpublish evidence must select both runs through `operatorRecovery.npmPublishRunId` and `operatorRecovery.dockerPromotionRunId`. These are selectors, not proof: closeout verifies exact Actions attempts, successful publication jobs, immutable dispatch artifacts, protected tooling, qualified source and Full Release Validation bindings. For historical publishers without complete receipts, only the unique Actions-generated input group of each named successful step supplies missing bindings. Supported legacy whole-job logs additionally require the frozen publisher shell-body hash, exact step number, and successful API step time window; arbitrary command output is never evidence. Split recovery is bound to the exact requested tag; correction tags cannot borrow another tag’s recovery proof merely because they share a commit. It independently verifies npm registry signatures, tarball hashes, and Sigstore provenance, plus Docker image and attestation descriptors against the qualified OCI manifest. Missing, expired, ambiguous, or mismatched evidence blocks recovery. The closeout records the failed original parent and both successful publication attempts; replay must independently verify the same immutable recovery record.

A legacy fallback correction tag may reuse base-package evidence only when the correction tag resolves to the same source commit as the base stable tag. Its Android release reuses the base tag's verified APK and adds provenance for the correction tag. A correction with different source must publish and verify its own package evidence and use a higher Android `versionCode`.

For correction artifact preparation, validate the immutable SHA with `--target-ref release/YYYY.M.PATCH-N` before tagging, or the exact `vYYYY.M.PATCH-N` context after tagging. The existing `target_context_ref` workflow input carries the same context. This preserves the intended correction tag in both npm and Docker artifacts; a base-version package is accepted only when `vYYYY.M.PATCH` resolves to that same SHA. The package bytes keep their original version, and publishers still require artifacts sealed for the exact final tag. A base-context Full Release Validation run does not authorize reusing its base-tag publication artifacts for a correction.

## Post-release documentation publication

Approved detailed docs may replace the initial release prose after publication.
This is a separate documentation update, not another package release. The docs
are the editorial source; publish their complete flat Markdown mirror in the
same source PR so both presentations stay synchronized.

```bash
pnpm changelog:from-docs --version YYYY.M.PATCH \
  --source docs/releases/YYYY.M.PATCH.md \
  --output CHANGELOG/YYYY.M.PATCH.md
pnpm changelog:check
```

For a release spread across several docs pages, repeat `--source` in the
approved reading order. Keep one complete flat file even when it is too large
for GitHub's rendered preview; provide its Raw/download link. The renderer
removes presentation wrappers, promotes accordion titles to headings, expands
docs links and retains the prose, warnings, references, credits, code, tables
and images. Unsupported markup fails rather than silently dropping content.

The first-line mirror marker records the ordered source paths and exact source
digest. It is provenance, not publication approval. `changelog:check` checks
marked mirrors against their sources; historical unmarked release files are
not automatically rewritten. Any later edit to a mirrored docs source must
regenerate its flat file in the same PR. Preserve the frozen contribution
record and unrelated index entries when updating reader-facing prose.

After the exact approved source PR merges and the deployed docs are verified,
the release-notes publication workflow can update only the GitHub Release body:

- Show the version, verified PR/direct-commit/contributor counts, a Raw
  changelog link, and the reader-friendly docs link.
- Include one alphabetically deduplicated thanks list covering all verified
  contributors, including `@steipete`: PR and direct-commit authors, coauthors
  and credited issue contributors. Exclude bots; a mention or comment alone
  does not establish credit.
- Preserve the existing `### Release verification` section byte-for-byte.
  Check both the 125,000-character and 125,000-byte limits; never truncate
  credits or verification to fit.

Source merge, deployed docs and Release-body publication are separate results.
An unchanged earlier deployment or a coalesced later deployment is acceptable
only when the publication workflow proves its source lineage and exact approved
docs bytes. Re-read the live body and source before application, require the
exact publication approval and comparison, and verify the result afterward.
If interrupted, reconcile the existing PR or already-applied body and resume
only incomplete steps; do not repeat an uncertain remote write.

Initial publishing and proof-append helpers refuse a body marked
`openclaw-release-publication:docs-v1`. Do not rerun them to overwrite the
post-docs body. GitHub manages native contributor avatars and assets; exact
avatar counts are informational. This documentation workflow never retags a
release, rebuilds binaries, republishes assets or changes registry selectors.

## Release preflight

### Previous updater compatibility

Before freezing the release, refresh `scripts/lib/update-compat-inventory.json`
from every release in the supported upgrade window. The current window includes
2026.9.1, 2026.9.2, and 2026.9.3. Download each npm tarball and verify it against
its published `dist.integrity` before extracting it. Pass each verified artifact
to the recorder with a repeatable `--release` argument:

```bash
pnpm update:compat:gen \
  --release '<unpacked-2026.9.1-directory>=<verified-npm-dist.integrity>' \
  --release '<unpacked-2026.9.2-directory>=<verified-npm-dist.integrity>' \
  --release '<unpacked-2026.9.3-directory>=<verified-npm-dist.integrity>'
```

The recorder writes releases in version order and replaces the recorded set.
Drop releases older than the supported upgrade window when regenerating it;
the inventory must not accumulate indefinitely. A release with no post-swap
imports still has an entry with an empty chunk list, so coverage is explicit.
Conflicting origins for the same chunk export across releases fail generation.

The recorder corrects one verified historical bundler annotation: the 2026.9.1,
2026.9.2, and 2026.9.3 registry-lifecycle chunks grouped the retirement function
under the cache module's source region. The correction requires the exact release
version, build identity, commit, npm integrity, chunk and export. It changes only
recorded source provenance; missing or ambiguous current exports still fail the
build. Remove each correction when its release leaves the supported upgrade
window. Regenerate the inventory from verified tarballs rather than editing its
origins by hand.

`pnpm update:compat:check` reads `npm view openclaw dist-tags --json` and requires
the versions tagged `latest` and `beta` to be present, even when both tags refer
to stable versions or the same version. A missing version fails with the exact
`pnpm update:compat:gen` command to run after verifying and unpacking the listed
artifacts. `pnpm release:prep`, version preparation, and prepared-release packing
run this check. Ordinary PR checks and source packing do not query npm for it.
To verify deterministic regeneration offline, run `pnpm update:compat:check`
with the same `--release` arguments used for generation.

The recorder scans emitted lazy imports in the updater, service, and CLI cleanup source
regions and records required export origins. The wizard entry is excluded
because it starts before replacement. `runtime-postbuild` generates hashed
compatibility files by re-exporting the candidate's corresponding symbols;
multiple exports of one declaration resolve to its own chunk, with sorted paths
and export names breaking alias ties. Missing mappings or distinct declaration
bindings for the same source origin fail the build. The isolated `config-doctor`
graph cannot supply updater bridges. Stable entrypoints are checked
without replacement. The package carries the inventory in
`dist/update-compat-inventory.json`, so negative and future fixtures remove that
candidate's bridges. Existing older compatibility aliases remain separately
owned by their original upgrade contracts.

The default `update-first-hop-compat` lane runs each recorded release against the
candidate, with separate artifacts per version. Published updaters may correctly
skip a same-version tarball, so the lane stamps only test-artifact version metadata:
first hop `2026.9.99-first-hop.0` retains compatibility bridges; second hop
`2026.9.99-first-hop.1` removes them. The original candidate stays unchanged, and
transformation receipts bind package digests and every changed or removed member.
Both hops still require the exact installed build identity and a restarted service. The 2026.9.1 negative control demonstrates the
missing restart import; releases that already preload that helper record the
negative control as not applicable while retaining the positive first-hop and
bridge-free future-hop checks. An explicit source tarball still selects one
baseline. Run the published upgrade survivor lane from the oldest supported
release as well. Native Windows proof must invoke the old updater with
a registered Scheduled Task and verify its restart without a subsequent manual
`gateway start`. Import compatibility alone does not prove that old and new
modules share process-local state.

### Design proposal: immutable runtime generations

A durable replacement would install each version in an immutable generation
directory and switch an installation pointer. Launchers must resolve that
pointer before starting Node so lazy imports keep the process's original tree.
Retain generations until their processes have exited. This is a proposal, not
the current update layout.

The design must preserve npm's ownership and bookkeeping: `npm ls -g`, later
global installs and uninstall, lifecycle scripts, and generated launchers must
still work. Unix uses `<prefix>/lib/node_modules` and `<prefix>/bin`; Windows
uses `<prefix>/node_modules` and prefix-root launchers. A mutable junction alone
does not pin old imports, and Windows pointer replacement must respect open
handles and junction semantics. npm must not replace or orphan the retained
generation anchor during its next install.

pnpm owns a global project, manifests, lockfiles, virtual-store links, and
version-dependent package groups; its cleanup must not collect live generations.
Bun also owns a shared global project and separate binary directory, and its
Windows binary launchers currently cannot be relocated by this updater.
Generation activation must preserve sibling packages and the existing
concurrent-project checks for both managers. These constraints need separate
design approval and package-manager integration proof before implementation.

### Required checks

- Run `pnpm check:test-types` before release preflight so test TypeScript stays covered outside the faster local `pnpm check` gate.
- Run `pnpm check:architecture` before release preflight so the broader import cycle and architecture boundary checks are green outside the faster local gate.
- Run `pnpm build && pnpm ui:build` before `pnpm release:check` so the expected `dist/*` release artifacts and Control UI bundle exist for the pack validation step.
- Run `pnpm release:prep` after the root version bump and before tagging. It runs every deterministic release generator that commonly drifts after a version or config change: plugin versions, plugin inventory, base config schema, bundled channel config metadata, config docs baseline, plugin SDK exports, and Control UI locale bundles. It also blocks until native app translations and platform-generated locale resources match the source inventory; if they lag, wait for or dispatch `Native App Locale Refresh` before freezing the Code SHA. `pnpm release:check` re-runs those guards plus transient npm package-lock validation in check mode (including the strict locale gates plus the plugin SDK surface budget) and reports every failure in one pass before running package release checks. The npm preflight separately compares the exact release SHA with the prior published dist-tag and reports any Plugin SDK API changes.
- For reviewed native translation repairs, configure the translation provider and run `pnpm native:i18n:sync --locale <code> --refresh-id <native-id>`. Find IDs in `apps/.i18n/native-source.json`; repeat the selector for up to 64 distinct IDs. Selected entries join ordinary pending work, including missing strings and glossary invalidation. Requests include bounded nearby owner code and instructions to preserve printf argument roles; excerpts are request-only and do not enter the source inventory. Unknown IDs fail before provider work, and selected refresh cannot be combined with `--force`. Then run `pnpm native:i18n:sync` to regenerate platform resources and `pnpm native:i18n:check` to validate them.
- For reviewed Control UI translation repairs, run `pnpm ui:i18n:sync --locale <code> --refresh-key <key>`. Repeat the selector for up to 64 distinct catalog keys. It refreshes those keys alongside ordinary pending work while leaving still-valid unselected cached aliases reusable. A configured provider is required even when ordinary synchronization allows optional authentication; unknown keys and combining selected refresh with `--force` are rejected.
- Plugin version sync updates the publishable `@openclaw/ai` runtime package, official plugin package versions, and existing `openclaw.compat.pluginApi` floors to the OpenClaw release version by default. Treat that field as the plugin SDK/runtime API floor, not just a copy of the package version: for plugin-only releases that intentionally remain compatible with older OpenClaw hosts, keep the floor at the oldest supported host API and document that choice in the plugin release proof.
- Run the manual `Full Release Validation` workflow before release approval to select the pre-release test boxes from one entrypoint. It accepts a branch, tag, or full commit SHA and dispatches manual `CI`, plugin prerelease, and `OpenClaw Release Checks` for the selected profile. Canonical beta `all` without soak uses the bounded `npm-beta-v1` policy described in [Full release validation](/reference/full-release-validation); install, package, Linux cross-OS, QA parity, runtime-pair/restart, and tool-coverage gates remain; Windows/macOS cross-OS outcomes are advisory. Stable and full runs always include exhaustive live/E2E and Docker release-path soak; `run_release_soak=true` requests an explicit beta soak. Package Acceptance provides package Telegram E2E when selected, avoiding a second concurrent live poller for an unpublished candidate.

  Provide `release_package_spec` after publishing a beta to reuse the shipped npm package across release checks, Package Acceptance, and package Telegram E2E without rebuilding the release tarball. Provide `npm_telegram_package_spec` only when Telegram should use a different published package from the rest of release validation. Provide `package_acceptance_package_spec` when Package Acceptance should use a different published package from the release package spec. Provide `evidence_package_spec` when the release evidence report should prove that validation matches a published npm package without forcing Telegram E2E.

  ```bash
  TOOLING_SHA="<recorded-full-main-ancestor-sha>"
  pnpm ci:full-release \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH \
    --workflow-sha "$TOOLING_SHA" \
    -f validation_purpose=publish \
    -f publication_selection_json="$PUBLICATION_SELECTION"
  ```

- Run the manual `Package Acceptance` workflow when you want side-channel proof for a package candidate while release work continues. Use `source=npm` for `openclaw@beta`, `openclaw@latest`, or an exact release version; `source=ref` to pack a trusted `package_ref` branch/tag/SHA with the current `workflow_ref` harness; `source=url` for a public HTTPS tarball with a required SHA-256 and strict public URL policy; `source=trusted-url` for a named trusted-source policy using required `trusted_source_id` and SHA-256; or `source=artifact` for a tarball uploaded by another GitHub Actions run.

  The workflow resolves the candidate to `package-under-test`, reuses the Docker E2E release scheduler against that tarball, and can run Telegram QA against the same tarball with `telegram_mode=mock-openai` or `telegram_mode=live-frontier`. When the selected Docker lanes include `published-upgrade-survivor`, the package artifact is the candidate and `published_upgrade_survivor_baseline` selects the published baseline. `update-restart-auth` uses the candidate package as both the installed CLI and the package-under-test so it exercises the candidate update command's managed restart path.

  Example:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Common profiles:
  - `smoke`: install/channel/agent, gateway network, and config reload lanes
  - `package`: artifact-native package/update/restart/plugin lanes without OpenWebUI or live ClawHub
  - `product`: package profile plus MCP channels, cron/subagent cleanup, OpenAI web search, and OpenWebUI
  - `full`: Docker release-path chunks with OpenWebUI
  - `custom`: exact `docker_lanes` selection for a focused rerun

- Run the manual `CI` workflow directly when you only need deterministic normal CI coverage for the release candidate. Manual CI dispatches bypass changed scoping and force the Linux Node shards, bundled-plugin shards, plugin and channel contract shards, Node 24 minimum compatibility, `check-*`, `check-additional-*`, built-artifact smoke checks, docs checks, Python skills, Windows, macOS, and Control UI i18n lanes. Standalone manual CI defaults to full coverage and runs Android only with `include_android=true`. Full Release Validation includes Android except under `npm-beta-v1`, which selects `release_scope=npm-beta` and defers native app CI while retaining macOS and Windows Node checks.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Run `pnpm qa:otel:smoke` when validating release telemetry. It exercises QA-lab through a local OTLP/HTTP receiver and verifies trace, metric, and log export plus bounded trace attributes and content/identifier redaction without requiring Opik, Langfuse, or another external collector.
- Run `pnpm qa:otel:collector-smoke` when validating collector compatibility. It routes the same QA-lab OTLP export through a real OpenTelemetry Collector Docker container before the local receiver assertions.
- Run `pnpm qa:prometheus:smoke` when validating protected Prometheus scraping. It exercises QA-lab, rejects unauthenticated scrapes, and verifies release-critical metric families stay free of prompt content, raw identifiers, auth tokens, and local paths.
- Run `pnpm qa:observability:smoke` for the source-checkout OpenTelemetry and Prometheus smoke lanes back to back.
- Run `pnpm release:check` before every tagged release.
- `OpenClaw NPM Preflight` packs the publishable tarball once, then generates dependency release evidence while qualifying those exact bytes. The npm advisory vulnerability gate is release-blocking. The transitive manifest risk, dependency ownership/install surface, dependency change, and npm package-lock mirror reports are release evidence only. The npm mirrors include the root package and every publishable workspace package with runtime dependencies or optional dependencies, generated and verified against the source checkout’s `pnpm-lock.yaml`. They are never included in npm tarballs. The dependency change report compares the release candidate with the previous reachable release tag. The preflight uploads dependency evidence as `openclaw-release-dependency-evidence-<tag>` and also embeds it under `dependency-evidence/` inside the prepared npm preflight artifact. The real publish path reuses that preflight artifact, then attaches the same evidence to the GitHub release as `openclaw-<version>-dependency-evidence.zip`.
