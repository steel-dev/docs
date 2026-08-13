# Plan 002: Make root Markdown negotiation explicit

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report—do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b4d2ff07..HEAD -- middleware.ts tests/middleware.test.ts tests/e2e/llm-endpoints.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding. Treat a
> mismatch in root routing or negotiation behavior as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `b4d2ff07`, 2026-07-30

## Why this matters

The root route currently treats every request without `Sec-Fetch-Dest` as a
Markdown client. Search crawlers, link unfurlers, and generic HTTP libraries
typically omit that browser-only header, so they can receive a `200` Markdown
document while browser navigation receives a `307` to `/overview`. That makes
the homepage representation depend on a weak proxy for intent and creates an
avoidable indexing and cache-key mismatch.

This plan uses the existing explicit Markdown negotiation policy as the only
signal, makes middleware own both root outcomes, and verifies the final
responses' `Vary` headers. It does not characterize equivalent content as
deceptive cloaking; it removes the concrete divergent-response risk.

## Current state

- `middleware.ts` handles explicit `.md` routes, negotiated canonical docs
  routes, and the special root rewrite.
- `lib/markdown-negotiation.ts` defines the existing Markdown `Accept` and
  known-agent user-agent policy. It is deliberately out of scope.
- `app/(home)/page.tsx` redirects `/` to `/overview`; it remains a fallback.
- `tests/middleware.test.ts` currently pins generic curl as a Markdown client.
- `tests/e2e/llm-endpoints.test.ts` covers explicit Markdown negotiation but
  not generic clients or crawler-shaped requests.

Current heuristic in `middleware.ts:10-13`:

```ts
function isProgrammaticClient(request: NextRequest): boolean {
  // Browsers always send Sec-Fetch-Dest; curl/WebFetch/python-requests do not
  return !request.headers.has('sec-fetch-dest');
}
```

Current root branch in `middleware.ts:39-48`:

```ts
const wantsMarkdown = shouldServeMarkdown(request.headers);

if (pathname === '/' && (wantsMarkdown || isProgrammaticClient(request))) {
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = '/AGENTS.md';
  return withMarkdownVary(NextResponse.rewrite(rewriteUrl));
}
```

Current curl expectation in `tests/middleware.test.ts:57-66`:

```ts
test('serves the homepage as markdown to programmatic clients', () => {
  const response = middleware(
    new NextRequest('http://localhost/', {
      headers: { accept: 'text/html', 'user-agent': 'curl/8.7.1' },
    }),
  );
  const rewrite = response.headers.get('x-middleware-rewrite');
  expect(rewrite).not.toBeNull();
  expect(new URL(rewrite as string).pathname).toBe('/AGENTS.md');
});
```

The existing known-agent policy includes deliberate crawler-like values such
as `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, and `PerplexityBot`. This plan does
not change that site-wide policy. Googlebot, Bingbot, Slackbot, generic curl,
and generic Python clients do not match it and will follow the HTML branch
unless they explicitly request Markdown.

## Target behavior

For root `GET` and `HEAD` requests:

| Request signal | Result | Required `Vary` |
|----------------|--------|-----------------|
| Markdown `Accept` | `200 text/markdown` via `/AGENTS.md` rewrite | `Accept, User-Agent` |
| Existing recognized agent UA, such as `claude-code` | `200 text/markdown` via `/AGENTS.md` rewrite | `Accept, User-Agent` |
| Browser HTML navigation | `307 /overview` | `Accept, User-Agent` |
| Generic curl/Python client | `307 /overview` | `Accept, User-Agent` |
| Googlebot or Bingbot with HTML intent | `307 /overview` | `Accept, User-Agent` |
| Slackbot without Markdown intent | `307 /overview` | `Accept, User-Agent` |

Explicit `.md` URLs, direct `/AGENTS.md`, non-root docs negotiation, and
non-`GET`/`HEAD` behavior remain unchanged. `curl -L /` will now reach the
HTML overview; callers wanting Markdown must send `Accept: text/markdown` or
request `/AGENTS.md` directly.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Middleware tests | `bun test tests/middleware.test.ts` | all tests pass |
| Runtime tests | `bun test tests/e2e/llm-endpoints.test.ts` | all tests pass |
| Full tests | `bun run test` | all tests pass |
| Typecheck | `bun run typecheck` | exit 0, no errors |
| Lint/format check | `bun run check` | exit 0, no warnings |
| Link validation | `bun run validate-links` | exit 0 |
| Production build | `bun run build` | exit 0 |
| Diff hygiene | `git diff --check` | no output |

## Scope

**In scope** (the only files to modify):

- `middleware.ts`
- `tests/middleware.test.ts`
- `tests/e2e/llm-endpoints.test.ts`

**Out of scope**:

- `lib/markdown-negotiation.ts` and its known-agent lists
- `app/(home)/page.tsx`
- `app/AGENTS.md/route.ts`
- `/llms.txt`, `/llms-full.txt`, or `.md` route behavior
- A crawler or unfurler denylist
- SEO metadata or robots policy

## Git workflow

- Branch: `fix/root-markdown-negotiation`
- Use one logical Conventional Commit, for example:
  `fix(llms): require explicit root markdown intent`
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a root negotiation behavior matrix to middleware tests

In `tests/middleware.test.ts`, replace the test that expects a generic curl
request to receive Markdown.

Add table-driven cases for generic curl, Googlebot, Bingbot, and Slackbot
requests. Give each a non-Markdown `Accept` value and omit
`Sec-Fetch-Dest` for at least one case. Each must:

- have no `x-middleware-rewrite`;
- return status `307`;
- resolve `Location` to `/overview`;
- contain `Accept` and `User-Agent` as case-insensitive, comma-separated
  `Vary` tokens.

Add or retain positive cases for:

- `Accept: text/markdown` → rewrite to `/AGENTS.md`;
- `claude-code/1.0` with a non-Markdown `Accept` → rewrite to `/AGENTS.md`;
- one root `HEAD` request on each branch.

Parse `Vary` into normalized tokens in a small test helper; do not use
substring matching. Add one paired case showing that adding or removing
`Sec-Fetch-Dest` does not alter the outcome when `Accept` and `User-Agent`
are identical.

**Verify**: `bun test tests/middleware.test.ts` → the new redirect cases fail
against the current implementation for the expected reason.

### Step 2: Remove the weak signal and own both root responses in middleware

In `middleware.ts`:

1. Delete `isProgrammaticClient` and its comment.
2. Keep calculating `wantsMarkdown` with the existing
   `shouldServeMarkdown(request.headers)`.
3. Handle every root `GET` or `HEAD` request in one branch.
4. Rewrite Markdown-positive requests to `/AGENTS.md`.
5. Return a middleware-owned `307` redirect to `/overview` for every other
   root request.
6. Pass both responses through `withMarkdownVary`.

Target shape:

```ts
if (pathname === '/') {
  if (wantsMarkdown) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = '/AGENTS.md';
    return withMarkdownVary(NextResponse.rewrite(rewriteUrl));
  }

  return withMarkdownVary(NextResponse.redirect(new URL('/overview', request.url)));
}
```

Middleware must own the redirect because the fallback server-component redirect
can replace the middleware response and drop `Accept`/`User-Agent` from the
final `Vary`. Keep `app/(home)/page.tsx` unchanged as defense in depth.

Do not add `Sec-Fetch-Dest` to `Vary`; after this change it does not select a
representation.

**Verify**: `bun test tests/middleware.test.ts` → all middleware tests pass.

### Step 3: Prove final runtime behavior

Expand `tests/e2e/llm-endpoints.test.ts`:

- Retain the explicit `Accept: text/markdown` root test and assert that final
  `Vary` has both required tokens.
- Add a recognized `claude-code/1.0` root request and assert
  `200 text/markdown`.
- Add table-driven generic curl, Googlebot, Bingbot, and Slackbot requests with
  `redirect: 'manual'`.
- For each negative case, assert status `307`, a `Location` that resolves to
  `/overview`, no Markdown content type, and both `Vary` tokens.
- Cover one `HEAD` response without reading a body.

Normalize `Location` with `new URL(location, BASE_URL)` so semantically
equivalent absolute and relative headers both pass.

**Verify**: `bun test tests/e2e/llm-endpoints.test.ts` → all endpoint tests pass.

### Step 4: Run all repository gates

Run:

```sh
bun run test
bun run typecheck
bun run check
bun run validate-links
bun run build
git diff --check
git status --short
```

Expected: every quality command exits 0, `git diff --check` prints nothing, and
only the three in-scope source/test files plus the plan-status update are
tracked changes.

If Plan 001 has already landed and `bun run build` fails only because the
required GitHub token is absent or invalid, satisfy Plan 001's operational
prerequisite and rerun; do not weaken its failure behavior from this plan.

## Test plan

- `tests/middleware.test.ts` is the unit/integration boundary for exact rewrite,
  redirect, method, and header selection.
- `tests/e2e/llm-endpoints.test.ts` proves the final Next.js response retains
  the status, representation, `Location`, and `Vary` values.
- Positive cases: Markdown `Accept`, recognized agent UA, GET, HEAD.
- Negative cases: browser, curl, Googlebot, Bingbot, Slackbot, missing
  `Sec-Fetch-Dest`.
- Regression invariant: changing only `Sec-Fetch-Dest` never changes the root
  representation.
- Run both targeted files first, then `bun run test`.

## Done criteria

- [ ] `middleware.ts` contains no `isProgrammaticClient` helper.
- [ ] Root representation selection does not read `Sec-Fetch-Dest`.
- [ ] Explicit Markdown and existing recognized agent requests still receive
      `200 text/markdown` at `/`.
- [ ] Generic curl, Googlebot, Bingbot, Slackbot, and browser requests receive
      `307 /overview`.
- [ ] Both root outcomes include `Vary: Accept, User-Agent`.
- [ ] Explicit `.md` and non-root negotiation behavior remains covered and
      passing.
- [ ] `app/(home)/page.tsx` and `lib/markdown-negotiation.ts` are unchanged.
- [ ] `bun run test`, `bun run typecheck`, `bun run check`,
      `bun run validate-links`, and `bun run build` all exit 0.
- [ ] `git diff --check` has no output.
- [ ] No tracked files outside the in-scope list changed.
- [ ] `plans/README.md` status row is updated.

## STOP conditions

Stop and report back instead of improvising if:

- Product intent is to make existing recognized AI crawler UAs receive HTML
  at every docs URL. That requires a separate change to the shared UA policy.
- An external agent-readiness scanner requires `200 text/markdown` while
  sending neither Markdown `Accept` nor a recognized UA. That contract cannot
  be distinguished reliably from an unknown crawler without a product choice.
- A middleware-owned redirect does not remain `307 /overview` end to end.
- Either final root response loses `Accept` or `User-Agent` from `Vary`.
- Fixing final headers appears to require a broad global header rule.
- Any targeted verification fails twice after a reasonable in-scope fix.

## Maintenance notes

- Reviewers should inspect the request/response matrix rather than only the
  helper deletion. The redirect must be produced in middleware to preserve
  cache semantics.
- `curl -L /` changing to HTML is intentional. Automation should use
  `Accept: text/markdown`, `/AGENTS.md`, or `/llms.txt` explicitly.
- The known-agent UA lists still contain crawler identities by design. Revisit
  them only as a site-wide policy change with tests for canonical docs routes.
- Do not reintroduce missing browser-client-hint headers as an intent signal;
  they describe the requester implementation, not the desired media type.
