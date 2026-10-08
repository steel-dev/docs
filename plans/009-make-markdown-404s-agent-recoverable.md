# Plan 009: Make Markdown 404 responses agent-recoverable

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report—do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat a5d319f9..HEAD -- 'app/llms.mdx/[[...slug]]/route.ts' tests/e2e/llm-endpoints.test.ts`
> Stop if any other change altered missing-page handling, the `llm: false`
> exclusion, or the existing 404 tests.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 002
- **Category**: bug
- **Planned at**: commit `a5d319f9`, 2026-08-22
- **Execution status**: DONE

## Execution evidence (2026-08-22; clean branch reverified 2026-08-24)

- `bun run test` passed: 335 tests, 0 failures.
- `bun run typecheck`, `bun run check`, `bun run validate-links`,
  `bun run build`, and `git diff --check` passed.
- Local production probes confirmed recovery bodies for negotiated Markdown,
  explicit `.md`, and `llm: false` paths; the branded browser HTML 404 remained
  unchanged; HEAD returned status and headers without a body.
- Generated `/llms.txt`, `/llms-full.txt`, `/AGENTS.md`, `/DESIGN.md`,
  `/.well-known/api-catalog`, `/.well-known/agent-skills/index.json`,
  `/sitemap.xml`, `/robots.txt`, and `/openapi.json` were verified against the
  built local server.
- Preview deployment `dpl_6BFhKs1vSKpF8BCsgsXaimfhiTT9` built successfully at
  `https://docs-j2duyxy0g-nen-labs.vercel.app` in the `nen-labs/docs` project.
- Authenticated browser probes against the preview passed explicit and
  negotiated Markdown 404s. Each returned status 404, a 244-character recovery
  body, `text/markdown`, and `Vary` containing `Accept` and `User-Agent`.
- The preview HTML 404 remained HTML, and the Markdown `HEAD` response returned
  status 404, the negotiated headers, and a zero-byte body. The manual probe's
  displayed failures for those two rows came from applying recovery-body and
  negotiation-header assertions to representations where they do not apply.

## Why this matters

The site already returns the correct HTTP 404 status for nonexistent HTML and
Markdown paths. The HTML response is useful, but the Markdown representation
has a zero-byte body. An agent that follows a stale or mistyped docs link learns
only that retrieval failed; it receives no index or sitemap from which to
recover.

A live probe on 2026-08-22 confirmed the defect:

```text
$ curl -sS -D - -H 'Accept: text/markdown' \
    https://docs.steel.dev/this-page-does-not-exist-agent-audit-20260822
HTTP/2 404
content-length: 0
x-matched-path: /llms.mdx/[[...slug]]
```

The fix must preserve the real 404 status and the existing branded HTML 404.
Only the Markdown-backed representation should gain a short recovery body.

## Current state

- `app/llms.mdx/[[...slug]]/route.ts` serves Markdown renditions. Both a missing
  source page and a page with `llm: false` call Next.js `notFound()`.
- `app/not-found.tsx` already gives browser users a branded HTML 404 with links
  to the quickstart, Steel Skills, and `llms.txt`. It is out of scope.
- `tests/e2e/llm-endpoints.test.ts` boots a Next.js dev server and already tests
  explicit `.md` URLs. Its two 404 cases assert only the status code.
- The successful Markdown response already defines the representation headers.
  The 404 response must reuse that policy instead of defining a second one.

Current missing-page control flow in
`app/llms.mdx/[[...slug]]/route.ts:18-24`:

```ts
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();

  // Pages opted out of LLM surfaces (llm: false) are not served as markdown.
  if (!shouldIncludeLLMPage(page)) notFound();
```

Current regression tests in `tests/e2e/llm-endpoints.test.ts:480-492`:

```ts
test('returns 404 for a .md URL with no matching page', async () => {
  const response = await fetch(`${BASE_URL}/nonexistent-page.md`, {
    headers: BROWSER_HEADERS,
  });
  expect(response.status).toBe(404);
});

test('returns 404 for an llm: false page at its .md URL', async () => {
  const response = await fetch(`${BASE_URL}/cookbook/authors/hussufo.md`, {
    headers: BROWSER_HEADERS,
  });
  expect(response.status).toBe(404);
});
```

## Target behavior

| Request | Status | Content type | Body |
|---------|--------|--------------|------|
| Missing path with `Accept: text/markdown` | 404 | `text/markdown` | Recovery Markdown |
| Missing explicit `.md` path | 404 | `text/markdown` | Recovery Markdown |
| Existing `llm: false` page requested as `.md` | 404 | `text/markdown` | Same generic body; no page details |
| Missing browser HTML path | 404 | `text/html` | Existing branded HTML page unchanged |
| `HEAD` for a missing negotiated path | 404 | Negotiated type | Empty body, normal HEAD semantics |

The recovery body must be concise and contain all of these relative links:

- `/` — documentation home
- `/llms.txt` — agent-readable documentation index
- `/sitemap.xml` — complete URL inventory
- `/.well-known/api-catalog` — API description and documentation discovery

It must not echo the requested path, reveal whether an `llm: false` page exists,
or contain an HTML document shell.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install | `bun install --frozen-lockfile` | exit 0 |
| Runtime tests | `bun test tests/e2e/llm-endpoints.test.ts` | all tests pass |
| Full tests | `bun run test` | all tests pass |
| Typecheck | `bun run typecheck` | exit 0, no errors |
| Lint/format check | `bun run check` | exit 0, no warnings |
| Link validation | `bun run validate-links` | exit 0 |
| Production build | `bun run build` | exit 0 |
| Diff hygiene | `git diff --check` | no output |

## Scope

**In scope** (the only implementation and test files to modify):

- `app/llms.mdx/[[...slug]]/route.ts`
- `tests/e2e/llm-endpoints.test.ts`
- `plans/README.md` for the final status update

**Out of scope**:

- `app/not-found.tsx` and the visual HTML 404 design
- `middleware.ts` and the set of negotiable paths
- `lib/markdown-negotiation.ts` and Accept ranking
- New `/about`, `/contact`, `/developers`, or `/privacy` pages
- API behavior on `api.steel.dev`, including JSON errors, rate-limit headers,
  versioning, deprecation, and sunset policy
- Organization address, telephone, or contact schema
- Cache-policy changes or redirects

## Git workflow

- Branch: `plan/agent-readiness-audit`
- One logical Conventional Commit:
  `fix(llms): add recovery links to markdown 404s`
- Do not push or open a PR unless the operator instructs it.

## Steps

### Step 1: Expand the existing 404 tests before changing the route

In `tests/e2e/llm-endpoints.test.ts`, extend the two existing `.md` 404 cases
and add negotiated canonical-path, browser HTML, and `HEAD` cases from the
target matrix.

For the Markdown responses, assert:

- status is exactly 404;
- `Content-Type` matches the negotiated representation;
- `X-Robots-Tag` contains `noindex`;
- the body starts with `# Page not found`;
- all four recovery links are present;
- `<html` and `<!DOCTYPE` are absent.

For the `llm: false` page, additionally assert that the body does not contain
the page title or source content. Use the same generic body as a genuinely
missing page so the response does not disclose excluded content.

For the browser request, use the existing `BROWSER_HEADERS` fixture and assert
that `Page not found` remains in an HTML response. For `HEAD`, assert the status
and content type but require an empty body.

**Verify**: `bun test tests/e2e/llm-endpoints.test.ts` → the new Markdown-body
assertions fail because the current response is empty; existing non-404 tests
continue to pass.

### Step 2: Return a local recovery response from the Markdown route

In `app/llms.mdx/[[...slug]]/route.ts`:

1. Add one module-local constant containing the short recovery Markdown. Keep
   the four links relative and the wording generic.
2. Add one module-local response helper. It must return `NextResponse` with
   status 404, `X-Robots-Tag: noindex`, and `Content-Type: text/markdown`.
3. Apply the same `Vary` construction used by successful responses. Do not
   create a second header policy.
4. Replace both `notFound()` branches with this helper and remove the now-unused
   `notFound` import.
5. Keep `getPage`, `shouldIncludeLLMPage`, `getLLMText`, `revalidate`, and
   `generateStaticParams` behavior unchanged.

Do not create a shared abstraction for this single route. A small local helper
keeps the error and success representations visibly consistent without widening
the change.

**Verify**: `bun test tests/e2e/llm-endpoints.test.ts` → all cases pass.

### Step 3: Verify production-mode behavior

Run `bun run build`, then start the built app with `bun run start`. Against the
local production server, repeat these probes:

```bash
curl -si -H 'Accept: text/markdown' http://localhost:3000/nonexistent-agent-page
curl -si http://localhost:3000/nonexistent-agent-page.md
curl -si -H 'Accept: text/html' http://localhost:3000/nonexistent-agent-page
curl -sI -H 'Accept: text/markdown' http://localhost:3000/nonexistent-agent-page
```

The first two responses must follow the target matrix. The third must remain
the branded HTML 404. The fourth must have status 404 and an empty body.

**Verify**: all four probes match the target matrix. Stop the production server
before continuing.

### Step 4: Run the complete repository gates

Run, in order:

1. `bun run test`
2. `bun run typecheck`
3. `bun run check`
4. `bun run validate-links`
5. `bun run build`
6. `git diff --check`

All commands must exit 0. Only the in-scope files and the plan status row may be
modified.

### Step 5: Verify the deployed public contract

After a preview deployment, replace `<preview-host>` below and run:

```bash
curl -si -H 'Accept: text/markdown' https://<preview-host>/nonexistent-agent-page
curl -si https://<preview-host>/nonexistent-agent-page.md
curl -si -H 'Accept: text/html' https://<preview-host>/nonexistent-agent-page
curl -sI -H 'Accept: text/markdown' https://<preview-host>/nonexistent-agent-page
```

Confirm the status, content type, body, and HEAD behavior against the target
matrix. The Markdown response's delivered `Vary` must contain `Accept` and
`User-Agent`. Repeat the first and third probes once to exercise a potential CDN
cache hit; each must retain its requested representation.

## Test plan

- Extend `tests/e2e/llm-endpoints.test.ts`; do not introduce a second test
  harness for the route.
- Cover explicit `.md`, canonical Accept negotiation, browser HTML, `HEAD`, and
  the existing `llm: false` exclusion.
- Assert semantics and headers rather than the complete error string so minor
  copy edits do not make the test brittle.
- Retain every existing test and assertion.

## Done criteria

- [x] Missing negotiated and explicit `.md` paths return status 404 with a
      non-empty recovery body and the correct content type.
- [x] The recovery body contains `/`, `/llms.txt`, `/sitemap.xml`, and
      `/.well-known/api-catalog` and contains no HTML shell.
- [x] An `llm: false` page returns the same generic 404 without disclosing its
      title or content.
- [x] Browser HTML 404 appearance and behavior are unchanged.
- [x] `HEAD` returns 404 with the negotiated headers and no body.
- [x] Preview/CDN probes preserve the correct representation on repeated calls.
- [x] `bun run test`, `bun run typecheck`, `bun run check`,
      `bun run validate-links`, and `bun run build` all pass.
- [x] `git diff --check` emits no output.
- [x] No files outside the in-scope list are modified.
- [x] `plans/README.md` marks Plan 009 DONE.

## STOP conditions

Stop and report rather than improvising if any of these occur:

- The route no longer handles missing pages through the two branches shown in
  "Current state".
- A custom 404 response changes the status from 404, loses `X-Robots-Tag`, or
  causes a missing browser path to receive Markdown without requesting it.
- Returning the local 404 response causes `generateStaticParams` or the build
  route count to change materially.
- The fix requires modifying middleware, the HTML 404, or another out-of-scope
  file.
- A verification command fails twice after one reasonable correction.

## Maintenance notes

- Keep the recovery links stable and machine-readable. If the canonical agent
  index or API catalog URL changes, update this body and its E2E assertions in
  the same change.
- Reviewers should confirm that the `llm: false` response remains
  indistinguishable from a missing page.
- This plan does not establish API-wide error conventions. JSON API errors and
  rate-limit metadata belong to the API service and require a separate owner.
