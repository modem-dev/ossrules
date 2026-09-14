<!--
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
-->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of contents**

- [Intro](#intro)
  - [What the provider distributions are](#what-the-provider-distributions-are)
  - [Decide when to release](#decide-when-to-release)
  - [Delegating release duties to a non-PMC committer](#delegating-release-duties-to-a-non-pmc-committer)
- [Prerequisites (first-time release managers)](#prerequisites-first-time-release-managers)
- [Collect ambiguities during the release (for a follow-up doc PR)](#collect-ambiguities-during-the-release-for-a-follow-up-doc-pr)
- [Special procedures (done very infrequently)](#special-procedures-done-very-infrequently)
  - [Bump min Airflow version for providers](#bump-min-airflow-version-for-providers)
  - [Move provider into remove state](#move-provider-into-remove-state)
- [Prepare Regular Provider distributions (RC)](#prepare-regular-provider-distributions-rc)
  - [Perform review of security issues that are marked for the release](#perform-review-of-security-issues-that-are-marked-for-the-release)
  - [Convert commits to changelog entries and bump provider versions](#convert-commits-to-changelog-entries-and-bump-provider-versions)
  - [Update versions of dependent providers to the next version](#update-versions-of-dependent-providers-to-the-next-version)
  - [Create a PR with the changes](#create-a-pr-with-the-changes)
  - [Apply incremental changes and merge the PR](#apply-incremental-changes-and-merge-the-pr)
  - [(Optional) Apply template updates](#optional-apply-template-updates)
  - [Build Provider distributions for SVN apache upload](#build-provider-distributions-for-svn-apache-upload)
  - [Build and sign the source and convenience packages](#build-and-sign-the-source-and-convenience-packages)
  - [Commit the source packages to Apache SVN repo](#commit-the-source-packages-to-apache-svn-repo)
  - [Publish the Regular distributions to PyPI (release candidates)](#publish-the-regular-distributions-to-pypi-release-candidates)
  - [Push the RC tags](#push-the-rc-tags)
  - [Prepare documentation in Staging](#prepare-documentation-in-staging)
  - [Prepare issue in GitHub to keep status of testing](#prepare-issue-in-github-to-keep-status-of-testing)
  - [Prepare voting email for Providers release candidate](#prepare-voting-email-for-providers-release-candidate)
- [Release verification](#release-verification)
  - [Verify the release candidate by PMC members](#verify-the-release-candidate-by-pmc-members)
  - [Verify the release candidate by Contributors](#verify-the-release-candidate-by-contributors)
- [Publish release](#publish-release)
  - [Summarize the voting for the Apache Airflow release](#summarize-the-voting-for-the-apache-airflow-release)
  - [Publish release to SVN](#publish-release-to-svn)
  - [Publish the packages to PyPI](#publish-the-packages-to-pypi)
  - [Add the final release tag in git](#add-the-final-release-tag-in-git)
  - [Publish documentation](#publish-documentation)
  - [Update providers metadata](#update-providers-metadata)
  - [Notify developers of release](#notify-developers-of-release)
  - [Send announcements about security issues fixed in the release](#send-announcements-about-security-issues-fixed-in-the-release)
  - [Announce about the release in social media](#announce-about-the-release-in-social-media)
  - [Add release data to Apache Committee Report Helper](#add-release-data-to-apache-committee-report-helper)
  - [Close the testing status issue](#close-the-testing-status-issue)
  - [Remove Provider distributions scheduled for removal](#remove-provider-distributions-scheduled-for-removal)
- [Misc / Post release Helpers](#misc--post-release-helpers)
  - [Fixing released documentation](#fixing-released-documentation)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

------------------------------------------------------------------------------------------------------------

# Intro

## What the provider distributions are

The Provider distributions are separate packages (one package per provider) that implement
integrations with external services for Airflow in the form of installable Python packages.

The Release Manager prepares packages separately from the main Airflow Release, using
`breeze` commands and accompanying scripts. This document provides an overview of the command line tools
needed to prepare the packages.

NOTE!! When you have problems with any of those commands that run inside `breeze` docker image, you
can run the command with `--debug` flag that will drop you in the shell inside the image and will
print the command that you should run.

## Decide when to release

You can release Provider distributions separately from the main Airflow on an ad-hoc basis, whenever we find that
a given provider needs to be released due to new features or due to bug fixes.  You can release each provider
package separately, but due to voting and release overhead we try to group releases of Provider
distributions together.

## Delegating release duties to a non-PMC committer

Per the [ASF release policy](http://www.apache.org/legal/release-policy.html), the Release Manager
does not need to be a PMC member, and there is no requirement that only a PMC member may call a
release vote. The policy's own wording: *"If the Release Manager is not a member of the PMC, they
will need to ask a PMC member to do the actual release publication"* — i.e. the one hard boundary
is write access to the `dist/release` SVN area and the binding vote itself; everything else can be
run by any committer.

This means a non-PMC committer (the **Delegate** below) can run most of the provider release
process end to end, with a PMC member only stepping in for the parts ASF policy reserves to the
PMC. Split of duties:

| Step | Owner | Notes |
|---|---|---|
| [Convert commits to changelog entries and bump provider versions](#convert-commits-to-changelog-entries-and-bump-provider-versions) | Delegate | Normal PR review/merge process, no PMC involvement needed. |
| [Build](#build-provider-distributions-for-svn-apache-upload) + [sign](#build-and-sign-the-source-and-convenience-packages) + [commit to `dist/dev`](#commit-the-source-packages-to-apache-svn-repo) + [publish RC to PyPI](#publish-the-regular-distributions-to-pypi-release-candidates) | PMC | Kept as **one contiguous PMC block**: per [ASF release policy](https://www.apache.org/legal/release-policy.html#owned-controlled-hardware), a PMC member signing a release should build it themselves from source rather than sign artifacts someone else built, so they know what they're actually signing. The PMC member builds, signs with their own key (already in the project's `KEYS` file), commits packages + signatures to `dist/dev`, and uploads the RC to the `apache-airflow-providers-*` PyPI namespace under the PMC's trusted publishing identity. The PMC then hands `files/packages.txt` (the PyPI URLs) back to the Delegate for the vote email. |
| [Push the RC tags](#push-the-rc-tags) | Delegate | Plain git tag push, no elevated access needed. |
| [Prepare documentation in Staging](#prepare-documentation-in-staging) | Delegate | |
| [Prepare issue in GitHub to keep status of testing](#prepare-issue-in-github-to-keep-status-of-testing) | Delegate | Delegate also tracks the issue, the vote thread, and related PRs throughout the release. |
| [Prepare voting email for Providers release candidate](#prepare-voting-email-for-providers-release-candidate) | Delegate | Delegate may send the `[VOTE]` email, but must **not** claim a personal binding `+1` (see note in that section) — only PMC votes are binding. |
| Casting the deciding vote(s) | PMC | At least 3 binding `+1` votes from PMC members are required for the release to pass; this cannot be delegated. |
| [Summarize the voting for the Apache Airflow release](#summarize-the-voting-for-the-apache-airflow-release) (`[RESULT][VOTE]`) | Delegate | Only after at least 3 binding PMC `+1` votes are already visible in the thread — the Delegate is reporting a result the PMC already reached, not deciding it. |
| [Publish release to SVN](#publish-release-to-svn) (`dist/release`) | PMC | Per [ASF Infra policy](https://infra.apache.org/release-publishing), `dist/release` write access is PMC-only by default (a project can request Infra to open it to all committers, but Airflow has not done so). |
| [Publish the packages to PyPI](#publish-the-packages-to-pypi) (final) | PMC | |
| [Add the final release tag in git](#add-the-final-release-tag-in-git) | Either | Not privileged; whoever is running that phase of the process does it. |
| [Publish documentation](#publish-documentation) (live) | Delegate | |
| [Update providers metadata](#update-providers-metadata) | Delegate | |
| [Notify developers of release](#notify-developers-of-release), security announcements, social media, committee report | PMC | Official project communications made under the PMC's authority. |
| [Close the testing status issue](#close-the-testing-status-issue) | Delegate | |

The PMC continues to oversee the overall process regardless of how many steps are delegated, and
remains the party accountable for the release under ASF policy.

> [!NOTE]
> Delegation is also a runway toward PMC membership. The first time a committer takes on the
> Delegate role, the overseeing PMC member is encouraged to walk them through the reserved block
> live — sharing their screen (or pairing) through the build → sign → `dist/dev` → PyPI-RC steps so the
> Delegate sees exactly how it is done. The aim is simply that these steps are familiar rather than
> a surprise if and when the Delegate later becomes a PMC member and runs them for real.

# Prerequisites (first-time release managers)

Two steps of the release depend on access that you must request. Request both **before** you start your first
release. They only need to be done once for new release managers, but may take some time.

* **PyPI: membership of the `apache-airflow` organization.** The
  [RC upload](#publish-the-regular-distributions-to-pypi-release-candidates) and the
  [final upload](#publish-the-packages-to-pypi) steps push to the `apache-airflow-providers-*` PyPi projects.
  Ask a PMC member who is an owner of the Apache Airflow PyPI organization to invite your account. Then
  accept the invitation. Confirm it worked by opening [your PyPI projects](https://pypi.org/manage/projects/)
  and you should see many Airflow related projects (170+ at the time of writing).

* **GitHub: the docs-publishing allowlist.** The
  [`publish-docs-to-s3.yml`](../.github/workflows/publish-docs-to-s3.yml) workflow gates its
  `build-info` job on `github.event.sender.login`, and every other job depends on `build-info`. If
  your GitHub handle is not in that list, dispatching the workflow (as
  [Prepare documentation in Staging](#prepare-documentation-in-staging) does) reports **no error at
  all**. The run is created and every job is silently skipped, which is easy to mistake for a
  successful publish. Add your handle with a one-line PR to that file and merge it to main. Example:
  [#71848](https://github.com/apache/airflow/pull/71848).

# Collect ambiguities during the release (for a follow-up doc PR)

These instructions are imperfect. Every release uncovers at least one command
that has drifted, one step that is under-documented, or one automation that
silently did the wrong thing. As you run through this document, jot down any
such observations in a scratch file kept **outside** the repo (anywhere that
is not tracked by git — a note in your home directory, a scratchpad, a
gist). Once the release has landed, turn those notes into a follow-up PR
against this document.

Keeping the scratch file out of the repo avoids accidentally committing
release-manager notes along with the release-prep PR, and makes it obvious
that the notes are input to the next doc PR rather than something to keep
around long-term.

# Special procedures (done very infrequently)

> [!NOTE]
> Those processes are done very infrequently, when there is time to bump minimum versions of providers
> or when you remove a provider. Usually you should just skip this section and go straight to
> Prepare Regular providers RC.

## Bump min Airflow version for providers

> [!NOTE]
> This should only happen when it is time to bump the minimum version of providers as agreed in
> [related provider policy](../PROVIDERS.rst#upgrading-minimum-supported-version-of-airflow)

1. Update `PROVIDERS_COMPATIBILITY_TESTS_MATRIX` in `src/airflow_breeze/global_constants.py` to remove
the versions of Airflow that are not applicable anymore.

2. Check if Breeze unit tests in `dev/breeze/tests/test_packages.py` need adjustments. This is done by simply
searching and replacing old version occurrences with newer one. For example 2.10.0 to 2.11.0

3. Update minimum airflow version for all packages, you should modify `MIN_AIRFLOW_VERSION`
in `src/airflow_breeze/utils/packages.py` and run the `breeze release-management prepare-provider-documentation --only-min-version-update`
This will only update the min version in  the `__init__.py` files and package documentation without bumping the provider versions.

4. Remove `AIRFLOW_V_X_Y_PLUS` in all tests (review and update skipif and other conditional
   behavior and test_compat.py, where X is the TARGET version we change to. For example
   when we update min Airflow version to 3.0.0, we should remove all references to AIRFLOW_V_3_0_PLUS
   simply because "everything" in our tests is already 3.0.0+ and there is no need to exclude or
   modify tests for earlier versions of Airflow.

Note: Sometimes we are releasing a subset of providers and would not want to add the
list of these providers to every breeze command we run, specifically:
`prepare-provider-distributions`, `build-docs` , `publish-docs`, and, `add-back-references`. In this
case, we can instead export an environment variable: `DISTRIBUTIONS_LIST`, and it will work for every breeze
command involved in the release process. The value can also be passed as the `--distributions-list` argument.
Follow the steps below to set the environment variable:

```shell script
 export DISTRIBUTIONS_LIST="PACKAGE1 PACKAGE2"
```

```shell script
branch="update-min-airflow-version"
git checkout -b "${branch}"
breeze release-management prepare-provider-documentation --only-min-version-update
git add .
git commit -m "Bump minimum Airflow version in providers to Airflow 3.0.0"
git push --set-upstream origin "${branch}"
```

Note: that this command will only bump the min airflow versions for those providers that do not have it set to
a higher version. You do not have to skip specific providers - run it for all providers it will
handle everything automatically.

Note: this step is **not** part of the release cycle. It should be done independently
when the time to update min airflow version has come.

## Move provider into remove state

> [!NOTE]
> This is only needed in case some providers have been removed since last release wave.

The removed state needs to be in a release wave before you actually plan to remove the source code for the provider.
Set provider with ``removed state`` -> ``release provider`` -> ``remove source code of the provider``.
When setting the provider in removed state you need also to clarify in the change log that there will be
no more releases for this provider.

To set provider as removed do the following:

1. In provider yaml change state from to `ready` to `removed`
2. Place entry in changelog.txt that notify users about provider being removed.
3. Update test_get_removed_providers in `/dev/breeze/tests/test_packages.py` by adding the provider to the list

# Prepare Regular Provider distributions (RC)

This is the process that happens regularly (every 2 weeks).

## Perform review of security issues that are marked for the release

We are keeping track of security issues in the [Security Issues](https://github.com/airflow-s/airflow-s/issues)
repository currently. As a release manager, you should have access to the repository.
Please review and ensure that all security issues marked for the release have been
addressed and resolved. Ping security team (comment in the issues) if anything missing or
the issue does not seem to be addressed.

Additionally, the [dependabot alerts](https://github.com/apache/airflow/security/dependabot) and
code [scanning alerts](https://github.com/apache/airflow/security/code-scanning) should be reviewed
and security team should be pinged to review and resolve them.

## Convert commits to changelog entries and bump provider versions

First thing that release manager has to do is to convert commits for each provider into changelog entries
and update version of the provider to a target version - depending on type of changes implemented in the
providers.

One option for doing this is the **`prepare-providers-documentation` skill** loaded by an
agentic coding framework (e.g. Claude Code or OpenAI Codex CLI), which replaces the manual
commit-by-commit classification step of `breeze release-management
prepare-provider-documentation` with AI-driven classification. The skill inspects every PR (using
sub-agents per PR for thorough analysis), pays special attention to potentially breaking changes by
reading the actual diff (not just the commit message or PR labels), scopes multi-provider PRs to the
slice that touched the current provider, and asks the release manager only when genuinely uncertain.

> [!WARNING]
> The skill is an **optional** aid, not a required or default part of the release process. The
> interactive `breeze release-management prepare-provider-documentation` command (see
> [Falling back to interactive breeze](#falling-back-to-interactive-breeze)) remains the baseline,
> and release managers who do not use AI tooling should use that command directly — this skill is
> not for them. If you do use the skill, keep the following in mind:
>
> * **You must verify its output.** The version bumps and changelog entries it produces are
>   generated by an LLM and are **not authoritative** — the release manager is responsible for
>   reviewing every generated entry (especially breaking-change classification and version bumps)
>   before merging the release PR. Treat the skill's output as a first draft to be checked, not a
>   final answer.
> * **It runs for a long time and consumes a lot of tokens.** Classifying a full release wave with
>   per-PR sub-agents can take a while and burn through a large amount of model tokens. Because of
>   that, it is hard to recommend without a high-capacity plan (e.g. Claude Max, or an equivalent
>   GitHub Copilot / OpenAI tier). On a metered or low-quota plan the cost may be significant and
>   the run may not complete.

**Prerequisites:** running this skill requires an agentic coding environment with the
[GitHub MCP server](https://github.com/github/github-mcp-server) configured — the skill reads PR
diffs, lists commits, and (with maintainer confirmation) edits files via these tools. Two well-known
options:

* [Claude Code](https://docs.claude.com/en/docs/claude-code) — install via npm
  (`npm install -g @anthropic-ai/claude-code`) or follow the
  [setup guide](https://docs.claude.com/en/docs/claude-code/setup) for authentication and IDE
  integration. Configure GitHub MCP per the [MCP docs](https://docs.claude.com/en/docs/claude-code/mcp).
* [OpenAI Codex CLI](https://github.com/openai/codex) — install via npm
  (`npm install -g @openai/codex`), authenticate with your OpenAI key, and add the GitHub MCP server
  to its config (see the OpenAI Codex CLI README for MCP wiring).

Other MCP-compatible agentic clients should work as long as the GitHub MCP server is wired up and
the framework loads `SKILL.md` files from the `.claude/skills/` discovery path.

The skill source of truth lives in [`.agents/skills/prepare-providers-documentation/SKILL.md`](../.agents/skills/prepare-providers-documentation/SKILL.md).
Both Claude Code and OpenAI Codex CLI discover project-local skills via a symlink at
`.claude/skills/prepare-providers-documentation`. If your local checkout doesn't have that symlink
(the `.claude/` directory is gitignored), set it up once:

```shell script
mkdir -p .claude/skills
ln -s ../../.agents/skills/prepare-providers-documentation .claude/skills/prepare-providers-documentation
```

Before invoking the skill, set the environment variable ``RELEASE_DATE`` to the date of the release,
usually current or next day - depending on when you plan to start the release. This can be updated
later, when you rebase the PR with the latest main before merging it.

```shell script
export RELEASE_DATE=$(date "+%Y-%m-%d")
```

The RELEASE_DATE can also optionally have `_01`, `_02` suffixes appended to it to indicate that the release
is the first, second or third release candidate for the provider that day. It's unlikely to happen that
we have several release candidates for the same provider in a single day, but this makes it possible to
release multiple providers in a single day.

Note that versions of the provider will be updated in two places (the skill does it automatically):

* **provider.yaml** - where there is a list of all versions of providers (the first one is the latest)
* **changelog.rst** - where changelogs are sorted according to provider version and group changes in
  the right sections

In your agent session (Claude Code, OpenAI Codex CLI, etc.), invoke the skill:

```text
/prepare-providers-documentation
```

The skill will ask for `RELEASE_DATE`, base branch, optional provider subset, and include-flags
(`--include-not-ready-providers`, `--include-removed-providers`), then walk through five phases:
discovery, per-provider commit listing, classification with sub-agents, confirmation of any
uncertain or major-bump cases with you, and application via direct edits to `provider.yaml` plus
`changelog.rst`. Auto-generated build files (`__init__.py`, `README.rst`, `pyproject.toml`,
`conf.py`, `get_provider_info.py`, `index.rst`) are still regenerated by breeze under the hood
(`breeze release-management prepare-provider-documentation --reapply-templates-only`) so the skill
stays consistent with the existing tooling.

The skill also runs the [Update versions of dependent providers to the next
version](#update-versions-of-dependent-providers-to-the-next-version) step for you, so you do not
need to run that command separately when using the skill.

If you set ``DISTRIBUTIONS_LIST``, the skill scopes itself to that subset automatically.

The skill (and the underlying breeze tooling) determines the new version of provider as follows:

* increased patch-level for bugfix-only and doc-only changes
* increased minor version if new features are added or the minimum Airflow version is bumped
* increased major version if breaking changes are added

### Falling back to interactive breeze

If the skill is unavailable (e.g. you're not running an agentic coding framework), or if the per-provider commit
count is very large and the AI confidence is low across the board, you can still run the original
interactive breeze command and classify each change by hand:

```shell script
breeze release-management prepare-provider-documentation
```

Or for a subset:

```shell script
breeze release-management prepare-provider-documentation [packages]
```

In case you want to also release a pre-installed provider that is in ``not-ready`` state (i.e. when
you want to release it before you switch their state to ``ready``), pass
``--include-not-ready-providers``.

### Dropping a prepared provider back to doc-only (no PyPI artifact)

Two different outcomes are both called "doc-only", and the difference decides whether the provider
gets a PyPI release at all:

| | What it means | PyPI artifact |
|---|---|---|
| A `doc-only` entry in the changelog | The provider *is* released; one of the entries in the release happens to be documentation | **Yes** |
| The `.latest-doc-only-change.txt` marker | The provider is *not* released at all; only its documentation is republished | **No** |

The second case comes up when a provider was already prepared with, say, a `Misc` entry, and review
then concludes the change is internal or documentation only, so there is nothing for users to install.
Changing the changelog entry is not enough — the version bump and the changelog stay prepared, and the
provider would still be built and uploaded. Drop the provider back to doc-only with:

```shell script
breeze release-management prepare-provider-documentation --mark-doc-only PROVIDER [MORE PROVIDERS]
```

This restores the provider's `provider.yaml` and `changelog.rst` to their released state, then writes
`providers/PROVIDER/docs/.latest-doc-only-change.txt`. No version bump, no changelog section, no
distribution. It needs an explicit list of providers — it takes them out of the release, so it will
not default to every provider.

Commit the marker file afterwards. It is the only artifact of the whole sequence, and it must be
committed or the next release will prepare the provider again:

```shell script
git add providers/PROVIDER/docs/.latest-doc-only-change.txt
```

Doing it by hand is the same three steps: restore those two files, re-run
`prepare-provider-documentation PROVIDER`, and answer **`N`** to
`Does the provider: PROVIDER have any changes apart from 'doc-only'?`. Note that the interactive
prompt is not reachable during `--incremental-update`, which answers every question with "yes" —
that is what `--mark-doc-only` is for.

The marker holds the full commit hash of the latest change that was declared doc-only. On the next
release, the tooling counts commits since that hash rather than since the last release tag, so:

* if nothing landed since the marker, the provider is skipped with
  `The provider has doc-only changes since the last release. Skipping`;
* if something did land, only the commits after the marker are classified, so the changes already
  declared doc-only are not offered for classification a second time.

> [!NOTE]
> The same applies when using the `prepare-providers-documentation` skill — it classifies commits,
> but the decision that a prepared provider should not be released at all is still made by the
> release manager, and is still recorded by this marker file.

## Update versions of dependent providers to the next version

Sometimes when contributors want to use next version of a dependent provider, instead of
doing it immediately in the code they can add a comment ``# use next version``
to the line of ``pyproject.toml`` file of the provider that refers to the provider, which next version
should be used. This comment will be picked up by the``update-providers-next-version`` command and the
version of the dependent provider will be updated to the next version and comment will be
removed.

```shell script
breeze release-management update-providers-next-version
```

> [!NOTE]
> The `prepare-providers-documentation` skill runs this command automatically as part of its
> flow, so you only need to run it by hand when you prepared the documentation with the
> interactive breeze command instead of the skill. Run it regardless of whether you think any
> provider uses the `# use next version` comment — the command is a no-op when none do.

## Create a PR with the changes

Make sure to set labels: `allow provider dependency bump` and `skip common compat check` to the PR,
so that the PR is not blocked by selective checks.

You can do it for example this way:

```shell script
gh pr create \
  --title "Prepare providers release ${RELEASE_DATE}" \
  --label "allow provider dependency bump" \
  --label "skip common compat check" \
  --body "Prepare providers release ${RELEASE_DATE}" \
  --web
```

## Apply incremental changes and merge the PR

When those changes are generated, you should commit the changes, create a PR and get it reviewed.
This usually takes some time, so before merging you need to rebase it to latest main and see if there
are no new, incremental updates (one or two merged commits in the meantime). If there are - you still
have a chance to incorporate them via the **incremental update** flow.

> [!IMPORTANT]
> Whenever an incremental update bumps a provider's version, the [Update versions of dependent
> providers to the next version](#update-versions-of-dependent-providers-to-the-next-version) step
> must be applied **again** on the rebased branch — regardless of whether you prepared the docs with
> the skill or the interactive breeze command. The skill re-runs it automatically; with the
> interactive `--incremental-update` flow you must run the command yourself.

The recommended way is to invoke the same `prepare-providers-documentation` skill — it has a dedicated
**Incremental Update** section that detects which commits on the rebased branch are not yet referenced
in the existing `changelog.rst`, classifies only those new commits with the same per-PR sub-agent
analysis used in the initial run, and escalates the version bump in `provider.yaml` if (and only if) a
new commit changes the most-impactful classification:

```text
/prepare-providers-documentation
```

When invoked on a release-PR branch that already has classified entries in the changelogs, the skill
recognizes the incremental scenario and walks through:

1. Refreshing the apache remote and regenerating templates.
2. Detecting new commits per provider by comparing PR numbers to the existing changelog.
3. Classifying only the new commits (with breaking-change scrutiny on the diff).
4. Confirming any version-bump escalation with you explicitly before applying.
5. Inserting the new entries under the correct sections of the existing latest-version block.
6. Validating that no leftover `Please review` markers remain.
7. Re-running [Update versions of dependent providers to the next
   version](#update-versions-of-dependent-providers-to-the-next-version) when an incremental
   bump raised a provider's version.

If you set ``DISTRIBUTIONS_LIST`` the incremental flow honors that scope automatically.

Once the new entries are applied, commit the changes and update the PR. You need to apply the
following labels to the PR (if they aren't already set from the original PR):

* `skip common compat check`
* `allow provider dependency bump`

The rebase before merging is also the point to check the wave in the other direction. The incremental
flow looks for commits that are *missing* from the release; it does not look for providers that are in
the release but should no longer be there. If review concluded that a prepared provider's only changes
are internal or documentation, that provider still carries its version bump and changelog section, and
it would still be built and uploaded. Drop it back with [Dropping a prepared provider back to
doc-only](#dropping-a-prepared-provider-back-to-doc-only-no-pypi-artifact) before merging, so the
decision made in review is actually reflected in what gets released.

Once approved, merge it - be careful to do it quickly so that no new PRs are merged for
providers in the meantime; if they are, you'd miss them in the changelog.

### Falling back to interactive breeze (incremental)

If the skill is unavailable, the original incremental breeze command is still supported:

```shell script
breeze release-management prepare-provider-documentation --incremental-update
```

In case you prepare provider documentation for just a few selected providers, you can run:

```shell script
breeze release-management prepare-provider-documentation --incremental-update [packages]
```

Once you do it, the diff will be generated so you will see if there are any new changes added to
changelogs. If there are, you need to add them to PR and classify the changes manually:

* move the changes to the right sections in changelog
* remove the "Please review" comments generated by the incremental update process
* if needed adjust version of provider - in changelog and provider.yaml, in case the new
  change changes classification of the upgrade (patchlevel/minor/major)
* if a version was bumped, re-run [Update versions of dependent providers to the next
  version](#update-versions-of-dependent-providers-to-the-next-version) (the interactive
  `--incremental-update` command does not do it for you)

In case you want to also release a pre-installed provider that is in ``not-ready`` state (i.e. when
you want to release it before you switch their state to ``ready``), you need to pass
``--include-not-ready-providers`` flag to the command above.

> [!NOTE]
> In case you prepare provider's documentation in a branch different than main, you need to manually
> specify the base branch via `--base-branch` parameter.
> For example if you try to build a `cncf.kubernetes` provider that is build from `provider-cncf-kubernetes/v4-4`
> branch should be prepared like this:


```shell script
breeze release-management prepare-provider-documentation --include-removed-providers \
 --base-branch provider-cncf-kubernetes/v4-4 cncf.kubernetes
```

## (Optional) Apply template updates

This step should only be executed if we want to change template files for the providers, i.e. change
security information, commit/index/README content that is automatically generated.

Regenerate the documentation templates by running the command with
`--reapply-templates` flag to the command above. This refreshes the content of:

* `__init__.py` in provider's package
* Provider Commits
* Provider index for the documentation
* Provider README file used when publishing package in PyPI

```shell script
breeze release-management prepare-provider-documentation --include-removed-providers --reapply-templates-only
```

## Build Provider distributions for SVN apache upload

> [!NOTE]
> Under the [delegated process](#delegating-release-duties-to-a-non-pmc-committer) this build step
> begins the **PMC block**, together with signing, the `dist/dev` commit, and the PyPI RC upload.
> Per [ASF release policy](https://www.apache.org/legal/release-policy.html#owned-controlled-hardware),
> a PMC member should build the release themselves before signing it, rather than sign artifacts
> built by someone else — otherwise they don't actually know what they're signing. So the PMC member
> who signs also runs the build below, instead of the Delegate handing over pre-built artifacts.

Those packages might get promoted  to "final" packages by just renaming the files, so internally they
should keep the final version number without the rc suffix, even if they are rc1/rc2/... candidates.

They also need to be signed and have checksum files. You can generate the checksum/signature files by running
the "dev/sign.sh" script (assuming you have the right PGP key set-up for signing). The script
generates corresponding .asc and .sha512 files for each file to sign.
note: sign script uses `libassuan` and `gnupg` if you don't have them installed run:

MacOS:

```shell script
brew install libassuan
brew install gnupg
```

Linux (Debian/Ubuntu):

```shell script
sudo apt-get install libassuan-dev gnupg
```

### Verify your GPG signing key is ready

Before you spend 10+ minutes building artifacts only to discover that signing
fails, run these checks once:

```shell script
# 1. The apache.org key has a secret signing subkey available locally.
gpg --list-secret-keys apache.org

# 2. Signing actually works (exits 0, writes a .asc, verifies cleanly).
echo test > /tmp/sign-check && \
    gpg --yes --armor --local-user apache.org \
        --output /tmp/sign-check.asc --detach-sig /tmp/sign-check && \
    gpg --verify /tmp/sign-check.asc /tmp/sign-check && \
    rm -f /tmp/sign-check /tmp/sign-check.asc && \
    echo "GPG signing OK"

# 3. The fingerprint of your signing (sub)key appears in the Airflow KEYS file.
#    Without this, PMC verifiers cannot validate the release.
FINGERPRINT=$(gpg --list-keys --with-colons apache.org | awk -F: '/^fpr:/ {print $10; exit}')
curl -fsS https://dist.apache.org/repos/dist/release/airflow/KEYS | \
    grep -q "${FINGERPRINT}" && echo "Key ${FINGERPRINT} is in KEYS" || \
    echo "MISSING: add your key to KEYS before releasing"
```

If any of these fail, fix them before the build step. For first-time release
managers, adding your key to the `KEYS` file is a separate PR against
`https://dist.apache.org/repos/dist/release/airflow/` (SVN).

`sign.sh` defaults to `SIGN_WITH=apache.org`. If your `apache.org` uid resolves
to multiple keys (rare), set `SIGN_WITH` explicitly to the fingerprint of the
key you want to use.

## Build and sign the source and convenience packages

> [!NOTE]
> Under the [delegated process](#delegating-release-duties-to-a-non-pmc-committer) this step
> continues the **PMC block** started at [Build Provider distributions](#build-provider-distributions-for-svn-apache-upload)
> — the same PMC member builds and signs with their own key (already in the project's `KEYS`
> file), then stays on through the `dist/dev` commit and the PyPI RC upload without handing control
> back.

* Cleanup dist folder:

```shell script
export RELEASE_DATE=$(date "+%Y-%m-%d%n")
export AIRFLOW_REPO_ROOT=$(pwd -P)
rm -rf ${AIRFLOW_REPO_ROOT}/dist/*
```

* Release candidate packages:

These instructions assume the standard remote naming convention
(`upstream` → `apache/airflow`, `origin` → your fork — see
[`contributing-docs/10_working_with_git.rst`](../contributing-docs/10_working_with_git.rst#git-remote-naming-conventions)).
Set tags for the providers in the repo.


```shell script
echo "Tagging with providers/${RELEASE_DATE}"
git tag -s providers/${RELEASE_DATE} -m "Tag providers for ${RELEASE_DATE}" --force
git push upstream providers/${RELEASE_DATE}
breeze release-management prepare-provider-distributions  --include-removed-providers --distribution-format both --version-suffix ""
breeze release-management prepare-tarball --tarball-type apache_airflow_providers --version "${RELEASE_DATE}"
```

The `prepare-*-distributions` commands should produce the reproducible `.whl`, `.tar.gz` packages in the dist folder.
The `prepare-tarball` command should produce reproducible `-source.tar.gz` tarball of sources.

> [!IMPORTANT]
> `--version-suffix ""` is passed deliberately, and the empty value is the point: the packages
> committed to SVN carry the **final** version in their filename (`...-6.0.1-py3-none-any.whl`), with
> no `rcN`. That is what lets a passing vote promote them with a plain `svn mv` instead of a rebuild.
> The [PyPI upload below](#publish-the-regular-distributions-to-pypi-release-candidates) is the
> opposite case - it builds a *separate* set of packages from the same sources with
> `--version-suffix rcN`, so those filenames do carry the candidate number. Mixing the two up
> produces an SVN wave that cannot be promoted.

if you only build few packages, run:

```shell script
echo "Tagging with providers/${RELEASE_DATE}"
git tag -s providers/${RELEASE_DATE} -m "Tag providers for ${RELEASE_DATE}" --force
git push upstream providers/${RELEASE_DATE}
breeze release-management prepare-provider-distributions --include-removed-providers --distribution-format both --version-suffix "" PACKAGE PACKAGE ....
breeze release-management prepare-tarball --tarball-type apache_airflow_providers --version "${RELEASE_DATE}"

```

In case you want to also release a pre-installed provider that is in ``not-ready`` state (i.e. when
you want to release it before you switch their state to ``ready``), you need to pass
``--include-not-ready-providers`` flag to the command above.

* Sign all your packages

```shell script
pushd dist
../dev/sign.sh *
popd
```

If you see ``Library not loaded error`` it means that you are missing `libassuan` and `gnupg`.
check above steps to install them.

## Commit the source packages to Apache SVN repo

> [!NOTE]
> Under the [delegated process](#delegating-release-duties-to-a-non-pmc-committer) this is the middle
> of the **PMC block** — the same PMC member who signed commits the packages and signatures here and
> continues to the PyPI RC upload. (`dist/dev` is committer-writable per [ASF Infra
> policy](https://infra.apache.org/release-publishing), so a Delegate *could* do this step, but it is
> kept with the PMC to avoid bouncing control mid-way.)

* Push the artifacts to ASF dev dist repo

```shell script
# First clone the repo if you do not have it
cd ..
[ -d asf-dist ] || svn checkout --depth=immediates https://dist.apache.org/repos/dist asf-dist
svn update --set-depth=infinity asf-dist/dev/airflow

# Go to provider's folder in asf-dist
cd asf-dist/dev/airflow/providers

# Create a new folder for the release.
mkdir -p ${RELEASE_DATE}

# Move the artifacts to svn folder
mv ${AIRFLOW_REPO_ROOT}/dist/* "${RELEASE_DATE}"

# Add and commit
svn add ${RELEASE_DATE}
svn commit -m "Add artifacts for Airflow Providers ${RELEASE_DATE}"

cd "$AIRFLOW_REPO_ROOT"
```

Verify that the files are available in the ${RELEASE_DATE} folder under
[providers](https://dist.apache.org/repos/dist/dev/airflow/providers/)

You should see only providers that you are about to release.  If you are seeing others there is an issue.
You can remove the redundant provider files manually with:

```shell script
cd asf-dist/dev/airflow/providers
cd ${RELEASE_DATE}
svn rm file_name  // repeat that for every file
svn commit -m "delete old providers"
cd "$AIRFLOW_REPO_ROOT"
```

## Publish the Regular distributions to PyPI (release candidates)

> [!NOTE]
> Under the [delegated process](#delegating-release-duties-to-a-non-pmc-committer) this is the end of
> the **PMC block** (build → sign → `dist/dev` → PyPI RC) — all uploads to the `apache-airflow-providers-*`
> PyPI namespace, RC and final alike, go through the PMC's trusted publishing identity. When done,
> the PMC member hands the generated `files/packages.txt` (the PyPI URLs) back to the Delegate, who
> needs it for the vote email's completeness gate and body, and the Delegate resumes at [Push the RC
> tags](#push-the-rc-tags).

In order to publish release candidate to PyPI you just need to build and release packages.
The packages should however contain the rcN suffix in the version file name but not internally in the package,
so you need to use `--version-suffix` switch to prepare those packages.
Note that these are different packages than the ones used for SVN upload
though they should be generated from the same sources.

* Generate the packages with the rc1 version (specify the version suffix with PyPI switch). Note that
you should clean up dist folder before generating the packages, so you will only have the right packages there.

```shell script
cd "$AIRFLOW_REPO_ROOT"
rm -rf ${AIRFLOW_REPO_ROOT}/dist/*

breeze release-management prepare-provider-distributions  --include-removed-providers \
 --version-suffix rc1 --distribution-format both
```

If you only build few packages, run:

```shell script
breeze release-management prepare-provider-distributions \
--version-suffix rc1 --distribution-format both PACKAGE PACKAGE ....
```

Alternatively, if you have set the environment variable: `DISTRIBUTIONS_LIST` above, just run the command:

```shell script
breeze release-management prepare-provider-distributions --version-suffix rc1
```

Or using `--distributions-list` argument:

```shell script
breeze release-management prepare-provider-distributions --distributions-list "PACKAGE1 PACKAGE2" --version-suffix rc1
```

In case some packages already had rc1 suffix prepared and released, and they still need to be released, they
will have automatically appropriate rcN suffix added to them. The suffix will be increased for each release
candidate and checked if tag has been already created for that release candidate. If yes, the suffix will be
increased until the tag is not found.

* Verify the artifacts that would be uploaded:

```shell script
twine check ${AIRFLOW_REPO_ROOT}/dist/*
```

* Configure a short-lived PyPI token for this upload only. **Until Trusted
  Publishing is deployed for the Airflow provider distributions on PyPI**,
  the recommended practice is:

  1. Create the token immediately before uploading, at
     [Account settings → API tokens → "Add API token"](https://pypi.org/manage/account/token/). Name
     it after the wave (e.g. `airflow-providers-2026-08-25-rc`) so you can find it again to delete it.
  2. **Scope caveat:** a token can only be scoped to a single project and a wave publishes several,
     so pick "Entire account (all projects)". That is acceptable **only if** you treat it as
     single-use and delete it immediately after the upload. Never keep an all-projects token on disk
     longer than the upload itself.
  3. Copy the `pypi-...` value, PyPI shows it only once. Pass it to twine in the environment rather
     than in `~/.pypirc`, so that nothing is written to disk and any `.pypirc` you already have for
     your own projects is left alone:

     ```shell script
     export TWINE_USERNAME=__token__
     read -rs TWINE_PASSWORD && export TWINE_PASSWORD  # paste the token, press Enter
     ```

  4. Run the upload (below).
  5. **Delete the token** at
     [Account settings → API tokens](https://pypi.org/manage/account/#api-tokens) and run
     `unset TWINE_USERNAME TWINE_PASSWORD`.

  This is a defence-in-depth practice: the RM machine becomes a one-time
  release vehicle, not a persistent point of compromise.

* Upload the packages to PyPI. Only the provider wheels and sdists are uploaded — the ASF
  `-source.tar.gz` tarball and the `.asc`/`.sha512` files are SVN-only and must not go to PyPI.
  The output is teed to a log and the PyPI URLs twine prints are extracted (sorted, de-duplicated)
  into `files/packages.txt`. That file is what you paste into the vote email, and what the
  completeness gate ("Prepare voting email" section below) and the PMC verifiers consume. Both files
  land in `files/` (git-ignored), so they are never accidentally committed:

```shell script
mkdir -p "${AIRFLOW_REPO_ROOT}/files"
# COLUMNS=200 stops rich (twine's printer) from wrapping long URLs when stdout is a pipe.
COLUMNS=200 twine upload -r pypi ${AIRFLOW_REPO_ROOT}/dist/*.whl \
  $(ls ${AIRFLOW_REPO_ROOT}/dist/*.tar.gz | grep -v -- '-source.tar.gz') 2>&1 \
  | tee "${AIRFLOW_REPO_ROOT}/files/twine-upload.log"
# Only trust packages.txt if the upload above succeeded (PIPESTATUS[0] == 0):
grep -oE 'https://pypi\.org/project/[^[:space:]]+' "${AIRFLOW_REPO_ROOT}/files/twine-upload.log" \
  | sort -u > "${AIRFLOW_REPO_ROOT}/files/packages.txt"
```

* Confirm that the packages are available under the links printed and look good. The same links are
  now saved, sorted, in `files/packages.txt` — you'll paste them into the vote email you send to
  dev@airflow.apache.org.


## Push the RC tags

Earlier, we pushed the date tag, now that the RC(s) are ready we can push the tags for them.

> [!IMPORTANT]
> `tag-providers` tags whatever `HEAD` currently points at — it does not derive the commit from
> `--release-date`. **Always check out the wave tag `providers/${RELEASE_DATE}` first**, so the
> per-provider tags land on the exact commit the artifacts were built from. Anything that moved
> `HEAD` between the build and this step — a `git pull`, a branch switch, a rebase, or concurrent
> work by another terminal or agent sharing the same checkout — is otherwise tagged silently and
> without any error. This has gone wrong in a real wave: all 44 tags were pushed at an unrelated
> commit and had to be force-recreated afterwards. For the same reason, prefer running release
> steps from a dedicated worktree rather than a checkout you are also working in.

```shell script
git checkout providers/${RELEASE_DATE}
# Both SHAs printed here must be identical before you tag
git rev-parse HEAD "providers/${RELEASE_DATE}^{commit}"
breeze release-management tag-providers --release-date ${RELEASE_DATE}
```

You will see `You are in 'detached HEAD' state.` — that is expected, the wave tag is behind `main`.

Verify the pushed tags point where you think they do. Plain `git ls-remote` prints the *tag object*
SHA for annotated tags, which never matches the commit and looks alarming; dereference it with `^{}`:

```shell script
git ls-remote upstream "refs/tags/providers-<PROVIDER>/<VERSION>^{}"
```

## Prepare documentation in Staging

Documentation is an essential part of the product and should be made available to users.
In our cases, documentation for the released versions is published in the staging S3 bucket, and the site is
kept in a separate repository - [`apache/airflow-site`](https://github.com/apache/airflow-site),
but the documentation source code and build tools are available in the `apache/airflow` repository, so
you need to run several workflows to publish the documentation. More details about it can be found in
[Docs README](../docs/README.md) showing the architecture and workflows including manual workflows for
emergency cases.

You usually use the `breeze` command to publish the documentation. The command does the following:

1. Triggers [Publish Docs to S3](https://github.com/apache/airflow/actions/workflows/publish-docs-to-s3.yml).
2. Triggers workflow in apache/airflow-site to refresh
3. Triggers S3 to GitHub Sync

```shell script
  breeze workflow-run publish-docs --ref providers/${RELEASE_DATE} --site-env staging all-providers
```

Or if you just want to publish a few selected providers, you can run:

```shell script
  breeze workflow-run publish-docs --ref providers/${RELEASE_DATE} --site-env staging PACKAGE1 PACKAGE2 ..
```

> [!WARNING]
> Make sure to NOT close the terminal while the command is running and to keep your computer from
> sleep. This command will run several (3!) workflows from your terminal and this is important to keep
> it running until completion.

<!-- -->

> [!NOTE]
> If the workflow fails because a file it references or executes is missing or has incompatible
> logic in the release tag (e.g. it was added or changed in `main` after the tag was cut), see
> [Fixing released documentation](#fixing-released-documentation) in the Misc section below for
> the `-docs` branch workaround.

There is also a manual way of running the workflows (see at the end of the document, this should normally
not be needed unless there is some problem with workflow automation above)

## Prepare issue in GitHub to keep status of testing

To avoid GitHub's URL length limitations when creating massive issues, and to allow local modifications (such as carrying over completed checkmarks from previous waves), the recommended workflow is to **first generate the issue body locally into a file**, edit/update it as needed, and then publish it using the GitHub CLI.

### 1. Generate the issue content locally to `files/provider_issue.md`

Run the following command to fetch all relevant PRs and write the issue body to a local file:

```shell script
cd "${AIRFLOW_REPO_ROOT}"

breeze release-management generate-issue-content-providers --only-available-in-dist \
    --output-file files/provider_issue.md --answer no
```

By default, the command attempts to retrieve the GitHub token used to authenticate with `gh`. If you ran into GitHub rate limits, or do not have `gh` installed globally, you can generate a token in the GitHub web interface and pass it manually:

```shell script
breeze release-management generate-issue-content-providers --only-available-in-dist \
    --output-file files/provider_issue.md --answer no --github-token TOKEN
```

#### Filtering out noisy PRs (Optional)

Sometimes, large PRs that took place across many providers (like preparation mechanisms or boilerplate changes) create redundant noise. You can specify a comma-separated list of PRs to exclude:

```shell script
breeze release-management generate-issue-content-providers --only-available-in-dist \
    --output-file files/provider_issue.md --answer no --github-token TOKEN \
    --excluded-pr-list PR_NUMBER1,PR_NUMBER2
```

This local file (`files/provider_issue.md`) is now your working source of truth. You can preview or edit it directly before posting.

### 2. Always carry over checkmarks from the previous wave's testing issue

Whenever a provider in this wave is a **re-cut** of one that already appeared in
an earlier wave's testing issue — providers held back from the previous wave and
released again at `rc2`/`rc3`, or any provider whose previous RC was cancelled —
the PRs that were already ticked `[x]` (verified) in that earlier issue must stay
ticked in the new one. Testers should not be asked to re-verify unchanged code;
only the genuinely new commits in the re-cut are left unchecked. **Do this every
time** before creating the issue.

> [!IMPORTANT]
> **Prerequisite**: You must have generated the local `files/provider_issue.md` file using the command in Step 1 before running the `sed` commands below.

Extract the checked PRs from the previous issue and carry them over to the
generated body. Note that the `sed` command behaves differently on macOS and GNU/Linux:

```shell script
# PREV_ISSUE = the previous wave's testing-status issue number
gh issue view PREV_ISSUE --repo apache/airflow --json body -q .body > /tmp/prev_issue.md
checked=$(grep -E '^\s*- \[x\]' /tmp/prev_issue.md | grep -oE '#[0-9]+' | tr -d '#' | sort -u | paste -sd '|' -)

# On macOS:
sed -i '' -E "s/- \[ \] (.*\(#(${checked})\))/- [x] \1/" files/provider_issue.md

# On GNU/Linux:
sed -i -E "s/- \[ \] (.*\(#(${checked})\))/- [x] \1/" files/provider_issue.md
```

Review the resulting `[x]` lines in `files/provider_issue.md` (PRs only present in the new wave stay
unchecked). If the issue was already created, apply the same local edit and then edit the online issue as described in Step 3.

### 3. Create the issue on GitHub

Once you are satisfied with `files/provider_issue.md` (and any checkmarks have been carried over), create the issue from the file:

```shell script
# Fill prepared-on date by hand when RELEASE_DATE is unset, since an empty date formats as *today* on GNU date.
date_cmd=(date -d); [[ "${OSTYPE}" == *darwin* ]] && date_cmd=(date -j -f "%Y-%m-%d")
PREPARED_ON="<MONTH DD, YYYY>"; [[ -n "${RELEASE_DATE:-}" ]] && PREPARED_ON=$("${date_cmd[@]}" "${RELEASE_DATE%%_*}" +'%B %d, %Y')
gh issue create --repo apache/airflow \
    --title "Status of testing Providers that were prepared on ${PREPARED_ON}" \
    --body-file files/provider_issue.md --label "testing status,kind:meta"
```

If the issue has already been created on GitHub and you only need to update its description with the carried-over checkmarks:

```shell script
gh issue edit <ISSUE_NUMBER> --repo apache/airflow --body-file files/provider_issue.md
```

## Prepare voting email for Providers release candidate

Make sure the packages are in https://dist.apache.org/repos/dist/dev/airflow/providers/

* Before sending the vote email, gate on the same completeness check the PMC verifiers run, so a
  missing artifact (e.g. the `-source.tar.gz` tarball) fails here instead of in the vote thread.
  `files/packages.txt` was already generated by the PyPI upload step ("Publish the Regular
  distributions to PyPI" above); run the check against it:

```shell script
cd "$AIRFLOW_REPO_ROOT"
breeze release-management check-release-files providers --release-date "${RELEASE_DATE}" \
  --packages-file ./files/packages.txt \
  --path-to-airflow-svn "$(cd ../asf-dist/dev/airflow && pwd -P)"
```

  It exits non-zero and lists every missing file (including `.asc`/`.sha512` variants) if anything is
  absent. Only proceed to the vote once it prints `All expected files are present!`.

Send out a vote to the dev@airflow.apache.org mailing list. Here you can prepare text of the
email.

> [!NOTE]
> If you are a non-PMC Delegate running this step under the [delegated
> process](#delegating-release-duties-to-a-non-pmc-committer), set `IS_RM_VOTE_BINDING=false` below
> — your vote is not binding under ASF policy. Ask a PMC member to reply to the vote thread with
> their own explicit `+1 (binding)` as soon as they've verified the release; the vote is not valid
> until at least 3 such binding replies are posted, regardless of who sent the `[VOTE]` email.

```shell script
export VOTE_DURATION_IN_HOURS=72
export IS_SHORTEN_VOTE=$([ $VOTE_DURATION_IN_HOURS -ge 72 ] && echo "false" || echo "true")
export SHORTEN_VOTE_TEXT="This is a shortened ($VOTE_DURATION_IN_HOURS hours vote) as agreed by policy set it https://lists.apache.org/thread/cv194w1fqqykrhswhmm54zy9gnnv6kgm"
if [[ "${OSTYPE}" == *darwin* ]]; then
  export VOTE_END_TIME=$(date -u -v "+${VOTE_DURATION_IN_HOURS}H" -v "+10M" +'%Y-%m-%d %H:%M')
else  # Linux
  export VOTE_END_TIME=$(date --utc -d "now + $VOTE_DURATION_IN_HOURS hours + 10 minutes" +'%Y-%m-%d %H:%M')
fi
export RELEASE_MANAGER_NAME="TODO:RELEASE_MANAGER_NAME"
export GITHUB_ISSUE_LINK="TODO:ISSUE_LINK"
# true if the PMC itself is running the vote, false for a non-PMC Delegate (see note above)
export IS_RM_VOTE_BINDING=true
export RM_VOTE_BINDING_TEXT=$([ "$IS_RM_VOTE_BINDING" = "true" ] && echo "binding" || echo "non-binding")
export NON_PMC_RM_TEXT=$([ "$IS_RM_VOTE_BINDING" = "true" ] && echo "" || echo "I am a non-PMC committer running this release under Airflow's delegated release process; a PMC member will cast the binding votes needed to pass it.")
```

subject:

```shell script
cat <<EOF
$([ $VOTE_DURATION_IN_HOURS -ge 72 ] && echo "[VOTE]" || echo "[ACCELERATED VOTE]") Airflow Providers, release preparation date ${RELEASE_DATE}
EOF
```

```shell script
cat <<EOF
Hey all,

I have just cut the new wave Airflow Providers packages with release preparation date ${RELEASE_DATE}. This email is calling a vote on the release,
which will last for $VOTE_DURATION_IN_HOURS hours - which means that it will end on $VOTE_END_TIME UTC and until 3 binding +1 votes have been received.
$([ "$IS_SHORTEN_VOTE" = "true" ] && echo "${SHORTEN_VOTE_TEXT}" || echo "")

Consider this my ($RM_VOTE_BINDING_TEXT) +1.
$([ -n "$NON_PMC_RM_TEXT" ] && echo "$NON_PMC_RM_TEXT" || echo "")

<ADD ANY HIGH-LEVEL DESCRIPTION OF THE CHANGES HERE!>

Airflow Providers are available at:
https://dist.apache.org/repos/dist/dev/airflow/providers/${RELEASE_DATE}

*apache-airflow-providers-${RELEASE_DATE}-source.tar.gz* is the full source tarball of airflow repo - snapshot taken at the moment of provider's release.

*apache-airflow-providers-<PROVIDER>-*.tar.gz* are the convenience python "sdist" distributions that we publish in PyPI

*apache_airflow_providers_<PROVIDER>-*.whl are the convenience Python "wheel" distributions that we publish in PyPI.

The test procedure for PMC members is described in
https://github.com/apache/airflow/blob/main/dev/README_RELEASE_PROVIDERS.md#verify-the-release-candidate-by-pmc-members

The test procedure for and Contributors who would like to test this RC is described in:
https://github.com/apache/airflow/blob/main/dev/README_RELEASE_PROVIDERS.md#verify-the-release-candidate-by-contributors


Public keys are available at:
https://dist.apache.org/repos/dist/release/airflow/KEYS

Please vote accordingly:

[ ] +1 approve
[ ] +0 no opinion
[ ] -1 disapprove with the reason

Only votes from PMC members are binding, but members of the community are
encouraged to test the release and vote with "(non-binding)".

Please note that the version number excludes the 'rcX' string.
This will allow us to rename the artifact without modifying
the artifact checksums when we actually release it.

The status of testing the providers by the community is kept here:
$GITHUB_ISSUE_LINK

The issue is also the easiest way to see important PRs included in the RC candidates.
Detailed changelog for the providers will be published in the documentation after the
RC candidates are released.

You can find the RC packages in PyPI following these links:

<PASTE TWINE UPLOAD LINKS HERE. SORT THEM BEFORE!>

Cheers,
$RELEASE_MANAGER_NAME

EOF
```

Due to the nature of packages, not all packages have to be released as convenience
packages in the final release. During the voting process
the voting PMC members might decide to exclude certain packages from the release if some critical
problems have been found in some packages.

Please modify the message above accordingly to clearly exclude those packages.

Note, For RC2/3 you may refer to shorten vote period as agreed in mailing list [thread](https://lists.apache.org/thread/cv194w1fqqykrhswhmm54zy9gnnv6kgm).

# Release verification

## Verify the release candidate by PMC members

Set expected release tag (the same as announced in the vote email):

```shell script
export RELEASE_DATE=2025-11-03
````

Go to the directory where you have airflow checked out and set AIRFLOW_REPO_ROOT variable

```shell
export AIRFLOW_REPO_ROOT=$(pwd -P)
```

### SVN check

The files should be present in
[Airflow dist](https://dist.apache.org/repos/dist/dev/airflow/providers/)

The following files should be present (6 files):

* .tar.gz + .asc + .sha512 (one set of files per provider)
* -py3-none-any.whl + .asc + .sha512 (one set of files per provider)

As a PMC member, you should be able to clone the SVN repository:

```shell script
cd ..
[ -d asf-dist ] || svn checkout --depth=immediates https://dist.apache.org/repos/dist asf-dist
svn update --set-depth=infinity asf-dist/dev/airflow
```

Or update it if you already checked it out:

```shell script
svn update --set-depth=infinity asf-dist/dev/airflow
```


Set environment variables: PATH_TO_AIRFLOW_SVN to the root of folder where you have providers and RELEASE_DATE to
the release date you are verifying.

```shell script
cd asf-dist/dev/airflow
export PATH_TO_AIRFLOW_SVN=$(pwd -P)
```

Verify that all expected files are present in SVN. You can do this manually by inspecting the
directory listing against the file counts described above, but the recommended way is to run the
`breeze release-management check-release-files` command below, which checks completeness for you
(it is the same gate the release manager runs before sending the vote email). As a bonus it produces
a `Dockerfile.pmc` which helps with verifying installation of the packages.

Once you have cloned/updated the SVN repository, copy the PyPi URLs shared
in the email to a file called `packages.txt` in the `$AIRFLOW_REPO_ROOT/files`
directory (git-ignored, so it won't be accidentally committed).

```shell script
cd "$AIRFLOW_REPO_ROOT"
mkdir -p files
# Copy packages.txt extracted from the mail sent by the release manager here
breeze release-management check-release-files providers --release-date "${RELEASE_DATE}" --packages-file ./files/packages.txt --path-to-airflow-svn "${PATH_TO_AIRFLOW_SVN}"
```

After the above command completes you can build `Dockerfile.pmc` to trigger an installation of each provider
package and verify the correct versions are installed:

```shell script
docker build -f Dockerfile.pmc --tag local/airflow .
docker run --rm --entrypoint "airflow" local/airflow info
docker image rm local/airflow
```

### Reproducible package builds checks

For Provider distributions we introduced a reproducible build mechanism - which means that whoever wants
to use sources of Airflow from the release tag, can reproducibly build the same "wheel" and "sdist"
packages as the release manager and they will be byte-by-byte identical, which makes them easy to
verify - if they came from the same sources. This build is only done using released dependencies
from PyPI and source code in our repository - no other binary dependencies are used during the build
process and if the packages produced are byte-by-byte identical with the one we create from tagged sources
it means that the build has a verified provenance.

How to verify it:

1) Change directory to where your airflow sources are checked out:

```shell
cd "$AIRFLOW_REPO_ROOT"
```

2) Check out the ``providers/YYYY-MM-DD`` tag:

```shell
git fetch upstream --tags
git checkout providers/${RELEASE_DATE}
```

3) Remove all the packages you have in dist folder

```shell
rm -rf dist/*
```

4) Build the packages using checked out sources

```shell
breeze release-management prepare-provider-distributions --include-removed-providers --distribution-format both --version-suffix ""
breeze release-management prepare-tarball --tarball-type apache_airflow_providers --version "${RELEASE_DATE}"
```

5) Switch to the folder where you checked out the SVN dev files

```shell
cd ${PATH_TO_AIRFLOW_SVN}/providers/${RELEASE_DATE}
```

6) Compare the packages in SVN to the ones you just built

```shell
for i in *.tar.gz *.whl
do
