# Plan 006: Make `/` the canonical docs homepage

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> STOP condition occurs, report it instead of improvising. When finished,
> update this plan's status in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 96fbf2af..HEAD -- 'app/(home)' app/layout.config.tsx app/sitemap.ts components/layouts/docs.tsx components/layouts/links.tsx lib/markdown-negotiation.ts middleware.ts tests/markdown-negotiation.test.ts tests/middleware.test.ts tests/e2e/llm-endpoints.test.ts`
> If routing, negotiation, metadata, or sitemap behavior has changed, compare
> the live code with "Current state" and stop on a material mismatch.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED
- **Depends on**: `plans/002-make-root-markdown-negotiation-explicit.md` (DONE)
- **Category**: migration
- **Planned at**: commit `96fbf2af`, 2026-07-30

## Why this matters

The visual docs homepage lives at `/overview`, while `/` performs content
negotiation and redirects HTML clients there. This makes the natural entry
point a routing shim and serves `/AGENTS.md` as a non-equivalent representation
of the homepage. Make `/` the single HTML canonical, preserve `/overview` as a
permanent compatibility redirect, and keep machine access on the explicit
agent endpoints and ordinary docs Markdown representations.

## Current state

- `app/(home)/page.tsx:1-5` redirects `/` to `/overview`.
- `app/(home)/overview/page.tsx:1-3` renders the homepage component from
  `app/(home)/overview/_pages/page.en.tsx`.
- `middleware.ts:34-46` rewrites Markdown-positive `/` requests to
  `/AGENTS.md` and redirects all other root requests to `/overview`.
- `lib/markdown-negotiation.ts:34-45` excludes `/overview` from negotiation,
  but not `/`.
- `app/layout.config.tsx:13-18` links the primary "Overview" navigation item
  to `/overview` with nested-path matching.
- `components/layouts/links.tsx:161-173` implements navigation active-state
  matching; naively using nested matching with `/` would mark Overview active
  on every route.
- `components/layouts/docs.tsx:180-285` derives the visible sidebar section
  from the first URL segment, so bare `/` currently matches no overview
  section.
- `app/sitemap.ts:7-23` emits only Fumadocs source pages; neither `/` nor the
  special `/overview` React page is currently emitted.
- `app/layout.tsx:16-45` supplies inherited metadata. Route metadata must retain
  the existing `/llms.txt` alternate because nested metadata objects replace,
  rather than deep-merge, inherited values.

The target contract is:

| Request | Result |
|---|---|
| `GET /` from browser, crawler, user-directed agent, or Markdown `Accept` | `200 text/html` |
| `GET /overview` with redirects disabled | `308 /` |
| `GET /overview/*` | unchanged docs behavior |
| `/AGENTS.md`, `/llms.txt`, explicit `.md`, ordinary docs negotiation | unchanged |

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Focused tests | `bun test tests/markdown-negotiation.test.ts tests/middleware.test.ts tests/e2e/llm-endpoints.test.ts` | all pass |
| Lint | `bun run check --error-on-warnings` | exit 0 |
| Typecheck | `bun run typecheck` | exit 0 |
| Full tests | `bun test` | all pass |
| Links | `bun run validate-links` | 0 errors |
| Build | `bun run build` | exit 0 |
| Diff | `git diff --check` | no output |

## Scope

**In scope**:

- `app/(home)/page.tsx`
- `app/(home)/overview/page.tsx`
- Move `app/(home)/overview/_pages/page.en.tsx` to
  `app/(home)/_pages/page.en.tsx`
- `app/layout.config.tsx`
- `app/sitemap.ts`
- `components/layouts/docs.tsx`
- `components/layouts/links.tsx`
- `lib/markdown-negotiation.ts`
- `middleware.ts`
- `tests/markdown-negotiation.test.ts`
- `tests/middleware.test.ts`
- `tests/e2e/llm-endpoints.test.ts`
- `plans/README.md` (status row only)

**Out of scope**:

- Renaming or redirecting any `/overview/*` documentation URL
- Creating a Markdown homepage; `/AGENTS.md` and `/llms.txt` remain explicit
- Homepage copy, headings, JSON-LD, social metadata, or freshness dates
- Crawler classification and ordinary docs Markdown negotiation
- The unused `lib/metadata.ts` helper
- Changing `/start` or unrelated redirects in `next.config.mjs`

## Git workflow

- Branch: `fix/canonical-docs-root`
- One logical commit: `fix(routes): make docs root canonical`
- Do not push or open a PR unless explicitly requested.

## Steps

### Step 1: Change the regression contract first

Update the three existing negotiation test files before implementation:

- Root requests from browsers, autonomous crawlers, user-directed agents, and
  `Accept: text/markdown` must pass through middleware and finish as
  `200 text/html` without `X-Robots-Tag: noindex`.
- `/overview` must return `308` with `Location: /` when redirects are disabled.
- A representative `/overview/sessions-api/...` page must retain its existing
  crawler-HTML and user-agent-Markdown behavior.
- Root HTML must contain exactly one canonical link resolving to
  `https://docs.steel.dev/` and retain the `/llms.txt` alternate.
- Root HTML must retain a representative overview-sidebar link, and the
  Overview navigation item must be active on `/` and `/overview/*`, but not on
  `/integrations`.
- `/sitemap.xml` must contain exactly one root `<loc>` and no exact
  `https://docs.steel.dev/overview` entry.

Keep these cases in the existing server fixture in
`tests/e2e/llm-endpoints.test.ts`; do not start a second Next.js server.

**Verify**: the focused test command must fail against the current code only
for the new root-canonical expectations.

### Step 2: Render the homepage at `/` and redirect the old exact path

Move the English homepage component to `app/(home)/_pages/page.en.tsx`.
Render it from `app/(home)/page.tsx`. Export route metadata there with:

```ts
alternates: {
  canonical: '/',
  types: { 'text/plain': '/llms.txt' },
}
```

Do not add partial `openGraph` or `twitter` objects in this plan; that would
replace complete inherited objects. Change `app/(home)/overview/page.tsx` to
call `permanentRedirect('/')`.

Change the exact "Overview" navigation URL in `app/layout.config.tsx` to `/`
and change its active mode from `nested-url` to `url`; nested matching on `/`
would incorrectly mark Overview active on every route. Add a narrow root-link
case to `isNavItemActive` in `components/layouts/links.tsx` so this item is
active for `/` and the retained `/overview/*` documentation namespace, but not
for unrelated routes. In `components/layouts/docs.tsx`, treat `/` as the
overview section only for sidebar filtering so the homepage keeps the same
sidebar contents it had at `/overview`.

**Verify**: `bun run typecheck` passes, `/` renders the existing homepage, and
the focused runtime test sees `308 /` from exact `/overview`.

### Step 3: Make both landing paths invariant HTML in negotiation

Add `/` to the exact non-negotiable paths in
`lib/markdown-negotiation.ts`. Keep `/overview` and `/overview/` excluded.
Delete the special root branch from `middleware.ts`; root requests should
reach the App Router regardless of `Accept` or user agent.

Do not change `shouldServeMarkdown`, crawler lists, explicit `.md` handling, or
negotiation for ordinary documentation pages.

**Verify**: focused tests pass. In particular, root Markdown-positive requests
must no longer rewrite to `/AGENTS.md`.

### Step 4: Publish the root canonical in the sitemap

Prepend one explicit `https://docs.steel.dev/` entry in `app/sitemap.ts`, with
weekly frequency and priority `1`. Do not invent `lastModified`; the special
React page has no trustworthy content-date source. Deduplicate by final URL so
a future Fumadocs root page cannot create two entries.

**Verify**: the sitemap runtime assertions pass with one root entry and no
exact `/overview` entry.

### Step 5: Run all gates

Run the commands in the table in order, with `bun run build` last because it
runs networked generators. Confirm `git status --short` contains only the
in-scope files and the plan-status update.

## Test plan

- Extend `tests/markdown-negotiation.test.ts` for root path invariance.
- Update `tests/middleware.test.ts` for root pass-through while retaining the
  existing crawler/user-client matrix on a normal docs URL.
- Reuse the one server fixture in `tests/e2e/llm-endpoints.test.ts` for root
  HTML, the permanent compatibility redirect, canonical/alternate tags,
  sidebar/nav behavior, and sitemap assertions.
- Keep a regression case proving `/overview/sessions-api/quickstart` does not
  redirect to `/`.

## Done criteria

- [ ] `/` is the rendered homepage and its canonical URL.
- [ ] `/overview` returns permanent `308 /`; `/overview/*` is unchanged.
- [ ] `/` is HTML for every request class and is never rewritten to
      `/AGENTS.md`.
- [ ] Explicit agent endpoints and ordinary docs Markdown negotiation pass.
- [ ] Navigation points directly to `/`.
- [ ] Overview navigation is active at `/` and `/overview/*`, not unrelated
      sections, and the root sidebar still shows the overview documentation
      section.
- [ ] Sitemap contains exactly one root URL and no exact `/overview` URL.
- [ ] All focused and repository-wide gates pass.
- [ ] No out-of-scope files changed.

## STOP conditions

- Product requirements still demand `200 text/markdown` at `/`. A genuine
  equivalent Markdown homepage must be designed first; do not reuse
  `/AGENTS.md`.
- Exact `/overview` cannot return `308 /` without moving the redirect back into
  middleware.
- A Fumadocs source page already claims `/`, creating a route or sitemap
  collision.
- Any `/overview/*` documentation route changes status, representation, or URL.
- A focused or full verification fails twice after an in-scope correction.

## Maintenance notes

- Review the exact-path boundary carefully: `/overview` moves, but the large
  `/overview/*` docs namespace does not.
- External links to `/overview` remain valid through the permanent redirect.
- A future Markdown homepage should represent the homepage itself; only then
  should `/` be reintroduced to content negotiation.
