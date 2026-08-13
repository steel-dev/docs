# Plan 005: Bound CI runtime and preserve the spawn flake investigation

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report—do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b4d2ff07..HEAD -- .github/workflows/ci.yml tests/imagegen/e2e/cli.test.ts`
> If either path changed since this plan was written, compare the "Current
> state" excerpts against the live code. `tests/imagegen/e2e/cli.test.ts` is
> read-only in this plan; treat a changed timeout or spawn helper as a STOP
> condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `b4d2ff07`, 2026-07-30

## Why this matters

The Chromium-backed test budgets raised in PR #87 are sound. The original
claim that a synchronous Bun spawn defeats the test timeout is not: a direct
probe on the repository's Bun 1.3.9 showed the outer test timeout interrupting
`Bun.spawnSync` and terminating its child at the configured deadline.

The workflow still has no job-level ceiling, so a runner/runtime deadlock
outside normal test cancellation can consume GitHub's six-hour default. This
plan adds one defense-in-depth workflow limit and preserves an issue-ready
investigation brief for the separate intermittent undefined-stdout failure.
It deliberately does not patch an un-reproduced subprocess anomaly.

## Current state

- `.github/workflows/ci.yml` has one `lint` job on `ubuntu-latest` and no
  `timeout-minutes`.
- `tests/imagegen/e2e/cli.test.ts` gives each test a 120-second budget and uses
  `Bun.spawnSync`.
- PR #87 reports an intermittent
  `TypeError: undefined is not an object (evaluating 'result.stdout.toString')`
  under imagegen load, but repeat runs were clean.
- No source or test change is justified for that flake without diagnostic
  evidence.

Current job declaration in `.github/workflows/ci.yml:10-14`:

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest

    steps:
```

Current test budget and spawn helper in
`tests/imagegen/e2e/cli.test.ts:11-31`:

```ts
setDefaultTimeout(120000);

function cli(args: string[]): CliResult {
  const result = Bun.spawnSync([process.execPath, CLI, ...args], {
    env: { ...process.env, OPENAI_API_KEY: '' },
  });

  return {
    code: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}
```

The workflow installs dependencies and Playwright, then runs checks, the full
test suite, spelling, generated docs, internal links, and external Lychee
validation. Use a 30-minute job ceiling so normal contention and external-link
variance have room while a true stall ends far earlier than six hours.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Parse workflow | `bun -e "import { load } from 'js-yaml'; import { readFileSync } from 'node:fs'; const workflow = load(readFileSync('.github/workflows/ci.yml', 'utf8')) as any; if (workflow.jobs.lint['timeout-minutes'] !== 30) process.exit(1)"` | exit 0 |
| Targeted CLI tests | `bun test tests/imagegen/e2e/cli.test.ts` | all tests pass |
| Full tests | `bun run test` | all tests pass |
| Typecheck | `bun run typecheck` | exit 0, no errors |
| Lint/format check | `bun run check` | exit 0, no warnings |
| Diff hygiene | `git diff --check` | no output |

## Scope

**In scope** (the only source file to modify):

- `.github/workflows/ci.yml`

`plans/README.md` may be updated when the plan completes.

**Read-only evidence**:

- `tests/imagegen/e2e/cli.test.ts`
- PR #87: <https://github.com/steel-dev/docs/pull/87>

**Out of scope**:

- Any edit to `tests/imagegen/e2e/cli.test.ts`
- Any edit to the render or run integration suites
- Adding `timeout` to `Bun.spawnSync`
- Optional chaining, retries, or fallback buffers for missing stdout
- Converting the helper back to asynchronous spawning
- Changing the three 120-second test budgets
- Creating a GitHub issue without explicit operator authorization

## Git workflow

- Branch: `ci/bound-workflow-runtime`
- Use one Conventional Commit, for example:
  `ci: bound the test workflow runtime`
- Do not push, create an issue, or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the workflow-level ceiling

In `.github/workflows/ci.yml`, add exactly:

```yaml
timeout-minutes: 30
```

immediately below `runs-on: ubuntu-latest` in `jobs.lint`.

Do not add per-step timeouts or reorder the workflow. Do not change the test
command or Bun version in this plan.

**Verify**:

```sh
bun -e "import { load } from 'js-yaml'; import { readFileSync } from 'node:fs'; const workflow = load(readFileSync('.github/workflows/ci.yml', 'utf8')) as any; if (workflow.jobs.lint['timeout-minutes'] !== 30) process.exit(1)"
```

Expected: exit 0. Also run `git diff --check`; expected: no output.

### Step 2: Confirm the existing test budget remains healthy

Run:

```sh
bun test tests/imagegen/e2e/cli.test.ts
bun run test
bun run typecheck
bun run check
```

Expected: every command exits 0. The only source diff must remain the
one-line workflow addition.

Do not add a spawn timeout if the targeted test happens to be slow. The outer
120-second test budget already cancels the synchronous child; the new
30-minute job limit covers a broader runner/runtime stall.

### Step 3: Preserve the separate stdout investigation without guessing

Do not create an issue unless the operator separately authorizes GitHub writes.
When authorized, use this prepared issue:

**Title**

```text
test: investigate Bun.spawnSync returning undefined stdout under imagegen load
```

**Body**

```markdown
## Context

PR #87 recorded an intermittent failure while running `bun test
tests/imagegen` under load. Three cases in
`tests/imagegen/e2e/cli.test.ts` failed at `result.stdout.toString()` because
`Bun.spawnSync` returned no stdout. Repeat runs on main and the PR branch were
clean, so PR #87 intentionally did not apply a blind fix.

## Investigation

- Record the exact Bun version, OS/runner, test order, and load when reproduced.
- Capture `exitCode`, `signalCode`, `success`, `stdout`, and `stderr` presence
  without converting missing fields to empty strings.
- Compare isolated `cli.test.ts` runs with the full imagegen directory and full
  suite.
- Check whether earlier Chromium launches or synchronous-spawn resource
  pressure are required.
- Produce a minimal reproducer or a diagnostic assertion before changing the
  helper.

## Acceptance criteria

- The failure has a repeatable reproducer or enough captured subprocess state
  to identify whether it is a Bun/runtime issue or test-order issue.
- Any eventual fix preserves nonzero exits and stderr rather than retrying or
  hiding missing output.
- A regression test fails before the fix and passes after it.
```

If the issue is filed, add its URL to this plan's maintenance notes and the
relevant `plans/README.md` row. Issue creation is not required for the one-line
CI hardening commit unless explicitly authorized.

**Verify**: `git status --short` → no test source file is modified.

### Step 4: Verify the hosted workflow

After an authorized push or PR, require the next CI run to:

- be accepted as valid GitHub Actions YAML;
- show `timeout-minutes: 30` in the job configuration;
- complete normally under the ceiling.

If recent successful baseline runs already exceed 20 minutes before this
change is pushed, stop and choose a ceiling from observed data rather than
merging 30 minutes blindly.

**Verify**: the GitHub CI check is green. Do not mark the plan DONE before a
hosted run has parsed and exercised the workflow.

## Test plan

- Parse `.github/workflows/ci.yml` locally and assert the numeric job value is
  exactly 30.
- Run `tests/imagegen/e2e/cli.test.ts` unchanged to prove the current
  120-second budget still works.
- Run the complete test, typecheck, and check commands.
- Use one hosted CI run as the actual workflow-schema and timing test.
- No new test code is expected.

## Done criteria

- [ ] `jobs.lint.timeout-minutes` is numeric `30`.
- [ ] No workflow step or command was reordered or otherwise changed.
- [ ] The 120-second imagegen test budgets remain unchanged.
- [ ] `Bun.spawnSync` remains unchanged and has no duplicate inner timeout.
- [ ] No retry, optional chaining, or empty-output fallback hides the stdout
      anomaly.
- [ ] The issue-ready investigation brief remains available here, and a GitHub
      issue is filed only if explicitly authorized.
- [ ] `bun test tests/imagegen/e2e/cli.test.ts`, `bun run test`,
      `bun run typecheck`, and `bun run check` all exit 0.
- [ ] `git diff --check` has no output.
- [ ] A hosted CI run accepts and passes the updated workflow.
- [ ] No source file outside `.github/workflows/ci.yml` changed.
- [ ] `plans/README.md` status row is updated.

## STOP conditions

Stop and report back instead of improvising if:

- Recent successful workflow runs exceed 20 minutes, making a 30-minute ceiling
  too close to normal behavior.
- The targeted CLI test reproduces missing stdout. Capture the subprocess
  fields and move the work to the investigation issue; do not patch it here.
- The Bun version or test helper changed since `b4d2ff07`.
- GitHub rejects the workflow or the job times out during otherwise normal
  progress.
- Any in-scope verification fails twice after checking the one-line YAML edit.

## Maintenance notes

- The 30-minute value is a job safety ceiling, not a test performance target.
  Revisit it using hosted run durations if CI grows materially.
- GitHub's default maximum is six hours; the explicit value prevents a rare
  runner/runtime deadlock from consuming that entire window.
- The stdout anomaly remains an investigation, not a diagnosis. Reviewers
  should reject patches that simply coerce missing output or retry the command.
- If the prepared issue is later filed, link it back to PR #87 so the original
  observation and its load-dependent context remain discoverable.
