# Changelog generator

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

The generated PR body and the Actions log only show aggregate exclusion counts, because both are
public and excluded groups can reference private repositories. To audit individual exclusion
decisions, run preview mode for the same window and inspect `excluded-groups.json` in the
temporary directory it prints. `source-facts.json` holds the eligible groups sent to the model.

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
