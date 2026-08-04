# Changelog generator

## Cover images

The draft model returns a `coverMotif` scene description alongside the changelog body. The
generator renders it into `public/images/changelog/<n>.png` with the vendored imagegen pipeline
(`scripts/changelog/imagegen/`): a `gpt-image-2` background, an ordered dither, and the fixed
Figma card layout, quantized to PNG-8 before it is committed. The motif supplies only the scene;
the time of day comes from one of six color-grade presets picked at random per card, and the run
log and sidecar JSON record which one was used. If the motif is missing or the
render fails, the draft keeps the placeholder image and the PR body says so; a cover problem
never fails the run. Preview mode never generates images.

The undithered original and the sidecar JSON are uploaded as run artifacts, so a different
palette can be retried during PR review without paying for another generation:

```bash
bun run generate-changelog-image -- \
  --number 36 \
  --background changelog-36-source.png \
  --date 2026-07-31 \
  --palette Ocean \
  --scale 1 \
  --out public/images/changelog/36.png
```

Run `bun run generate-changelog-image -- --help` for the full flag list, including generating a
fresh background from a new motif with `--motif`. The CLI writes a full-color PNG; only the
automated path quantizes to PNG-8, so recompress a hand-retried cover before merging.

## Replay a historical week locally

Set a GitHub token and, when the window contains eligible facts, `OPENAI_API_KEY`, then run:

```bash
GITHUB_TOKEN="$(gh auth token)" bun run preview-changelog \
  --number 35 \
  --since 2026-07-17T15:58:38.000Z \
  --until 2026-07-24T13:35:35.621Z \
  --application-release-base-sha d2f91834047984bf37e09caba27231fb07a4109a \
  --application-release-head-sha 4cc44305bae19df7135edda12a602841ad90ffe7
```

Preview mode requires the exact application release commits at both historical cutoffs because
commit timestamps cannot reconstruct when the release branch moved. It uses the same collection,
filtering, and model paths as automation and writes the draft and its review evidence to a new
temporary directory. It does not update changelog content, metadata, generator state, or GitHub
Actions output.

For later replays, use `applicationReleaseSha` from the generator state at the previous and target
published changelog revisions.

## Auditing filtered evidence

Every run builds an evidence ledger recording each source group the filter dropped, and commits it
to `scripts/changelog/audit/<n>.json` in the draft pull request. Actions artifacts expire, so the
committed ledger is what makes an exclusion decision answerable months later.

Each exclusion carries a `confidence`:

- `heuristic`: a regex, a commit-type check, or missing changed-file data dropped the group, so a
  real change can hide behind it. The PR body lists these in an open **Needs review** block for a
  reviewer to confirm one by one.
- `structural`: the group was dropped for what it is rather than what it says (an automated author,
  a disabled source, a generated changelog, a submodule pointer). The PR body folds these away.

The ledger also reconciles collected commits against logical changes, eligible groups, and excluded
groups. Commits dropped by author never reach a group, so they are recorded separately in
`authorSkipped`; a non-zero `unaccounted` means a group disappeared between grouping and
classification and should be investigated.

Repository visibility in `config.ts` decides how much of a source reaches the public PR body.
Private sources keep their links, SHAs, and file counts but not their pull request titles, commit
subjects, or file paths, and an unconfigured repository is treated as private. The same rule
applies to the model's own discard list: its prose is kept only when every reference behind it is
public.

A quiet week opens no pull request, so its ledger is only rendered into the Actions run log. Run
preview mode for the same window to reconstruct it. Preview writes `ledger.json` next to
`source-facts.json` (the eligible groups sent to the model) and `model-output.json` in the
temporary directory it prints.

## Recovering from a failed run

The generator fails instead of drafting from incomplete evidence. Two failure modes need manual
recovery:

- **The application release comparison is not an ahead range** (for example after a rollback or
  force-push on the release branch). Update `applicationReleaseSha` in
  `scripts/changelog/state.json` to a commit that is an ancestor of the current release head,
  keep the other fields unchanged, and rerun.
- **The state file disagrees with the latest changelog file**, usually after a changelog was
  added by hand. See below.

A rolled-back browser submodule pointer does not fail the run; that host commit's expansion is
skipped with a warning in the run log.

## Publishing a changelog by hand

The generator and CI both require `scripts/changelog/state.json` to point at the latest
`changelog-NNN.mdx`. When adding a changelog outside the automation, update `changelogNumber` to
the new number, set `until` to the timestamp your entry covers through, and set
`applicationReleaseSha` to the release head at that point:

```bash
gh api repos/0xnenlabs/steel/branches/release --jq .commit.sha
```
