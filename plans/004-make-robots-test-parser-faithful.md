# Plan 004: Make the robots test parser faithful

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report—do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b4d2ff07..HEAD -- public/robots.txt tests/robots-txt.test.ts`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding. Treat a mismatch in
> the parser or Content Signals policy as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `b4d2ff07`, 2026-07-30

## Why this matters

The Content Signals declarations themselves are valid, but their test helper
does not model robots groups with consecutive `User-agent` records. It replaces
the active group on every user-agent line, so a future compact group can make
the test inspect directives under only the last agent. Repeated groups for the
same agent are also overwritten instead of combined.

This plan gives the local test helper just enough group semantics to test the
policy faithfully and removes the deprecated, unnecessary `Host` record that
the current test now pins. It does not introduce a general robots parser or
change Steel's Content Signals values.

## Current state

- `public/robots.txt` declares ten user-agent groups, each with the same open
  `Content-Signal` and `Allow: /`.
- It ends with a canonical sitemap and `Host: docs.steel.dev`.
- `tests/robots-txt.test.ts` contains a small purpose-built parser used only in
  that file.

Current parser in `tests/robots-txt.test.ts:12-34`:

```ts
function parseGroups(source: string): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  let current: string[] | null = null;

  for (const line of source.split('\n')) {
    // ...
    if (key === 'user-agent') {
      current = [];
      groups.set(value, current);
    } else if (current) {
      current.push(trimmed);
    }
  }

  return groups;
}
```

Current cleanup-pinning assertion in `tests/robots-txt.test.ts:73-78`:

```ts
test('keeps the crawl directives, sitemap and host', () => {
  expect(groups.get('*')).toContain('Allow: /');
  expect(groups.get('ClaudeBot')).toContain('Allow: /');
  expect(ROBOTS).toContain('Sitemap: https://docs.steel.dev/sitemap.xml');
  expect(ROBOTS).toContain('Host: docs.steel.dev');
});
```

Current tail of `public/robots.txt:48-53`:

```text
User-agent: Google-Extended
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /

Sitemap: https://docs.steel.dev/sitemap.xml
Host: docs.steel.dev
```

Match the existing test-file style: local helpers, Bun tests, and direct string
assertions. Do not add a dependency for this fixture parser.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Targeted tests | `bun test tests/robots-txt.test.ts` | all tests pass |
| Full tests | `bun run test` | all tests pass |
| Typecheck | `bun run typecheck` | exit 0, no errors |
| Lint/format check | `bun run check` | exit 0, no warnings |
| Link validation | `bun run validate-links` | exit 0 |
| Count signals | `rg -c '^Content-Signal:' public/robots.txt` | prints `10` |
| Confirm Host removal | `rg -n '^Host:' public/robots.txt` | no output, exit 1 |
| Diff hygiene | `git diff --check` | no output |

## Scope

**In scope** (the only files to modify):

- `public/robots.txt`
- `tests/robots-txt.test.ts`

**Out of scope**:

- Content Signals names or yes/no values
- User-agent coverage or crawl `Allow`/`Disallow` policy
- Sitemap generation
- A full RFC 9309 parser or parser dependency
- Middleware Markdown user-agent behavior
- Crawler-specific application logic

## Git workflow

- Branch: `fix/robots-group-parser`
- Use one logical Conventional Commit, for example:
  `fix(robots): test shared user-agent groups`
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add characterization tests for shared and repeated groups

In `tests/robots-txt.test.ts`, add a fixture string separate from the real
`ROBOTS` content. It must include:

1. two consecutive `User-agent` lines followed by one shared directive;
2. a later group for one of those agents with a second directive.

For example, use neutral fixture names rather than real crawler policy:

```text
User-agent: Agent-A
User-agent: Agent-B
Allow: /

User-agent: Agent-A
Disallow: /private
```

Assert:

- both agents receive `Allow: /`;
- `Agent-A` also receives `Disallow: /private`;
- `Agent-B` does not receive the later directive.

These assertions define the exact limited semantics the helper needs:
consecutive user-agent records share following directives, and repeated
matching groups combine.

**Verify**: `bun test tests/robots-txt.test.ts` → the new fixture assertions
fail against the current parser while the existing real-file tests pass.

### Step 2: Track all active agents while parsing a group

Replace the single `current` directive array with:

- `activeAgents: string[]`;
- a boolean that records whether the current group has begun receiving
  directives.

Use this algorithm:

1. On `User-agent` before any directive, append the name to `activeAgents`.
2. On `User-agent` after directives, begin a fresh group by replacing
   `activeAgents` with the new name and resetting the directive flag.
3. Initialize a map entry only when an agent is first seen.
4. For every non-user-agent record while agents are active, append the original
   trimmed directive to every active agent's array.
5. When an agent appears in a later group, append to its existing array rather
   than overwriting it.

Keep key matching case-insensitive as it is now. Keep directive strings in
their original spelling because the existing assertions depend on that.

This helper need not distinguish global extension records such as `Sitemap`
from the final group; no test uses the helper for those records.

**Verify**: `bun test tests/robots-txt.test.ts` → shared/repeated fixture tests
and all real-file tests pass.

### Step 3: Remove the deprecated Host record and unpin it

Delete only this line from `public/robots.txt`:

```text
Host: docs.steel.dev
```

Keep the sitemap and all ten Content Signals groups byte-for-byte otherwise.

Rename the last test to mention crawl directives and sitemap only, and remove
the positive `Host` assertion. Do not add a permanent negative `Host` unit
assertion; its absence is cleanup, not part of the Content Signals contract.

**Verify**:

```sh
bun test tests/robots-txt.test.ts
rg -c '^Content-Signal:' public/robots.txt
rg -n '^Host:' public/robots.txt
```

Expected: tests pass, signal count is `10`, and the final `rg` prints nothing
and exits 1.

### Step 4: Run repository gates

Run:

```sh
bun run test
bun run typecheck
bun run check
bun run validate-links
git diff --check
git status --short
```

Expected: all quality commands exit 0, diff check prints nothing, and only the
two in-scope files plus the plan-status update are tracked changes.

## Test plan

- New local fixture covers two stacked user-agent records.
- The same fixture covers a repeated group and union behavior.
- Existing tests continue proving every actual group has one valid declaration
  for `search`, `ai-input`, and `ai-train`.
- Existing crawl and sitemap assertions remain.
- Command-line count proves no real Content Signal declaration was removed.
- Run targeted tests first, then `bun run test`.

## Done criteria

- [ ] Consecutive `User-agent` lines share following directives in the test
      helper.
- [ ] Repeated groups for one agent combine rather than overwrite directives.
- [ ] The fixture proves directives do not leak to an unrelated active agent.
- [ ] All ten real Content Signals declarations and all `Allow: /` records
      remain.
- [ ] The sitemap remains unchanged.
- [ ] `Host: docs.steel.dev` is removed and no test requires it.
- [ ] No robots parser dependency is added.
- [ ] `bun run test`, `bun run typecheck`, `bun run check`, and
      `bun run validate-links` all exit 0.
- [ ] `git diff --check` has no output.
- [ ] No tracked files outside the in-scope list changed.
- [ ] `plans/README.md` status row is updated.

## STOP conditions

Stop and report back instead of improvising if:

- Product policy calls for changing any Content Signals value or crawler list.
- The test helper is imported outside `tests/robots-txt.test.ts` or must become
  a production parser.
- Correct fixture behavior appears to require implementing the complete robots
  standard.
- Removing `Host` breaks a documented, current downstream integration.
- Any targeted verification fails twice after a reasonable in-scope fix.

## Maintenance notes

- This parser is intentionally test-local and incomplete. If production code
  ever needs to interpret robots files, use a maintained parser and a separate
  contract.
- Reviewers should compare the final `public/robots.txt` diff carefully; only
  the `Host` line should disappear.
- The parser bug was introduced with the Content Signals tests; it is not a
  pre-existing limitation of a shared repository utility.
- Stacked user-agent groups are not required in today's file, but the test
  helper should not silently mis-evaluate them when the file is compacted later.
