# Changelog generator

## Replay a historical week locally

Set `OPENAI_API_KEY` and a GitHub token, then run:

```bash
GITHUB_TOKEN="$(gh auth token)" bun run preview-changelog \
  --number 35 \
  --since 2026-07-17T15:58:38.000Z \
  --until 2026-07-24T13:35:35.621Z
```

Preview mode resolves the application release branch at both historical cutoffs, uses the same
collection, filtering, and model paths as automation, and writes the draft and its review evidence
to a new temporary directory. It does not update changelog content, metadata, generator state, or
GitHub Actions output.

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
