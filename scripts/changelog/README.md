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
