# Plan 008: Deliver a correct content-negotiation contract

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report—do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 92581223..HEAD -- lib/markdown-negotiation.ts middleware.ts next.config.mjs tests/markdown-negotiation.test.ts tests/middleware.test.ts tests/e2e/llm-endpoints.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding. Treat a
> mismatch in `acceptsMarkdown`, `appendMarkdownVaryHeader`, or the
> `next.config.mjs` `headers()` entries as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: 002, 006
- **Category**: bug
- **Planned at**: commit `92581223`, 2026-08-03
- **Execution status**: TODO

## Why this matters

Three defects were confirmed by live probes against `https://docs.steel.dev` on
2026-08-03. Each was verified against the production response, not inferred from
the source.

**1. `Vary` never reaches the client.** Both `middleware.ts` and
`app/llms.mdx/[[...slug]]/route.ts` call `appendMarkdownVaryHeader`, and
`tests/middleware.test.ts:98` asserts it. The delivered response carries only
Next's router tokens:

```
$ curl -sSI -H 'Accept: text/markdown' https://docs.steel.dev/overview/steel-cli
content-type: text/markdown; charset=utf-8
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
x-vercel-cache: HIT
```

The same URL returns HTML or Markdown depending on request headers, the response
is edge-cached, and the cache key does not include `Accept` or `User-Agent`.
A shared cache can therefore serve raw Markdown to a browser or HTML to an
agent, decided by whichever request warmed the entry. This is the highest-value
fix in the plan: it is a live cache-correctness defect, not a checklist item.

**2. `acceptsMarkdown` ignores client preference order and q-values.** It
returns true when any Markdown type appears with a non-zero q, without ever
comparing that q against `text/html`. RFC 9110 §12.5.1 makes the weight
authoritative:

```
$ curl -sSI -H 'Accept: text/markdown;q=0.5, text/html;q=1.0' https://docs.steel.dev/
content-type: text/markdown; charset=utf-8        # should be text/html
$ curl -sSI -H 'Accept: text/html, text/markdown, */*' https://docs.steel.dev/
content-type: text/markdown; charset=utf-8        # should be text/html
```

Real-world blast radius today is small, because browsers do not send
`text/markdown`. It still means the site cannot be steered toward HTML by a
client that accepts both, which is exactly the signal an unfurler or a
mixed-capability agent uses.

**3. `Accept: text/plain` gets 235KB of HTML.** A Markdown rendition already
exists for every negotiable path, and `text/plain` is a reasonable request from
a client that cannot parse HTML.

An AgentGrade report also flagged an unreachable OpenAPI spec and a
JSON-on-root failure. Both were checked and are addressed under
"Findings considered and rejected"; neither is in scope.

## Current state

- `lib/markdown-negotiation.ts` owns the Accept and user-agent policy.
  `acceptsMarkdown` is a per-entry `some()` with no cross-entry ranking.
- `middleware.ts` rewrites negotiated paths to `/llms.mdx/*` (or `/AGENTS.md`
  at the root) and wraps each negotiated response in `withMarkdownVary`.
- `app/llms.mdx/[[...slug]]/route.ts` sets `revalidate = false` and exports
  `generateStaticParams`, so these responses are prerendered at build time and
  served as static artifacts. Route-handler headers are replaced at the edge.
- `next.config.mjs` already has a `headers()` block. Its `/(.*)` `Link` entry is
  confirmed present on the live root response, which proves this layer reaches
  the client for prerendered routes where the route handler's own headers do
  not.
- `vercel.json` carries only `cleanUrls` and a COOP header. It is not the
  configuration surface this repo uses for response headers.

Current preference-blind check in `lib/markdown-negotiation.ts`:

```ts
export function acceptsMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;

  return acceptHeader.split(',').some((entry) => {
    const [rawMediaType, ...rawParams] = entry.split(';').map((part) => part.trim());
    const mediaType = rawMediaType.toLowerCase();

    return acceptsMarkdownType(mediaType) && hasNonZeroQuality(rawParams);
  });
}
```

Current `Vary` token list in `lib/markdown-negotiation.ts`:

```ts
const MARKDOWN_VARY_HEADERS = ['Accept', 'User-Agent'];
```

Note that `hasNonZeroQuality` is correct in isolation and
`tests/markdown-negotiation.test.ts:112` already pins `q=0` rejection. The
defect is the absence of ranking, not the absence of q parsing.

## Target behavior

For `GET` and `HEAD` on a negotiable docs path:

| `Accept` | Result |
|----------|--------|
| absent, or `text/html` only | HTML |
| `text/markdown` only | Markdown |
| `text/markdown, text/html, */*` | Markdown |
| `text/html, text/markdown, */*` | HTML |
| `text/markdown;q=0.5, text/html;q=1.0` | HTML |
| `text/html;q=0.5, text/markdown;q=1.0` | Markdown |
| `text/markdown;q=0` with any other type | HTML |
| `*/*` only | HTML |
| `text/plain` only | Markdown body, `Content-Type: text/plain; charset=utf-8` |
| `text/plain, text/html` | HTML |

Equal weights tie-break to the client's written order, which is the only
ordering signal RFC 9110 leaves available. A recognized Markdown user agent
still selects Markdown when `Accept` expresses no preference between the two;
an explicit `Accept` preference always wins over the user-agent heuristic, as
it does today.

Every response on a negotiable path must carry `Accept` and `User-Agent` as
`Vary` tokens **as delivered by the CDN**, alongside Next's existing router
tokens.

Unchanged: explicit `.md` URLs, `/AGENTS.md`, `/llms.txt`, `/llms-full.txt`,
`/.well-known/*`, the crawler-gets-HTML policy in
`HTML_CRAWLER_USER_AGENT_SUBSTRINGS`, and all non-`GET`/`HEAD` handling.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Negotiation unit tests | `bun test tests/markdown-negotiation.test.ts` | all tests pass |
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

- `lib/markdown-negotiation.ts`
- `middleware.ts`
- `next.config.mjs` (the `headers()` block only)
- `app/llms.mdx/[[...slug]]/route.ts` (Content-Type selection only)
- `tests/markdown-negotiation.test.ts`
- `tests/middleware.test.ts`
- `tests/e2e/llm-endpoints.test.ts`

**Out of scope**:

- `vercel.json`
- A JSON 404 body, `app/not-found.tsx`
- `/skill.md`, `/agents.txt`, or any new discovery artifact
- The OpenAPI redirect in `next.config.mjs` `redirects()`
- `EXCLUDED_EXACT_PATHS`, `EXCLUDED_PATH_PREFIXES`, the crawler denylist, or any
  change to which paths are negotiable
- A third-party Accept-negotiation dependency. The media-type set here is four
  Markdown types plus `text/html` and `text/plain`; a local ranked parser is
  smaller than the integration surface of `negotiator`.

## Git workflow

- Branch: `fix/content-negotiation-contract`
- Three logical Conventional Commits, in this order:
  1. `fix(llms): rank accept media types by weight and order`
  2. `feat(llms): serve markdown to text/plain clients`
  3. `fix(llms): deliver vary accept from the platform header layer`
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Pin the ranking contract in failing unit tests

In `tests/markdown-negotiation.test.ts`, add a `describe` block for preference
ranking. Drive it from a table whose rows are the `Accept` values in the
"Target behavior" table, each with its expected representation.

Cover at minimum:

- `text/markdown, text/html, */*` → Markdown
- `text/html, text/markdown, */*` → HTML
- `text/markdown;q=0.5, text/html;q=1.0` → HTML
- `text/html;q=0.5, text/markdown;q=1.0` → Markdown
- `text/markdown;q=1.0, text/html;q=1.0` → Markdown (order tie-break)
- `text/html;q=1.0, text/markdown;q=1.0` → HTML (order tie-break)
- `text/markdown;q=0, text/html` → HTML
- `*/*` → HTML
- `application/json, text/html, */*` → HTML
- malformed weights: `text/markdown;q=abc`, `text/markdown;q=`, `text/markdown;q=2.5`
- whitespace and case noise: `TEXT/MARKDOWN ; Q=0.9 , text/html;q=0.8`
- `application/vnd.custom+markdown` still matching the `+markdown` suffix rule

Retain every existing test in the file unchanged.

**Verify**: `bun test tests/markdown-negotiation.test.ts` → the new
order-and-weight cases fail because the current implementation returns Markdown
for all of them. Confirm each failure names the ranking assertion and not a
crash.

### Step 2: Rank media types instead of scanning for a match

In `lib/markdown-negotiation.ts`, replace the body of `acceptsMarkdown` with a
ranked comparison. Keep the exported name and signature so callers do not
change.

1. Parse the header once into entries of `{ mediaType, quality, index }`.
   Reuse `hasNonZeroQuality`'s parsing rules for the weight; treat a malformed
   or absent `q` as `1`, and clamp above `1` to `1`.
2. Drop entries with quality `0`.
3. Compute the best Markdown score using `acceptsMarkdownType`, and the best
   HTML score from an exact `text/html` match. Do not let `*/*` or `text/*`
   contribute to either score: a wildcard expresses no preference, and treating
   it as HTML intent would regress the `text/markdown, */*` case that agents
   send today.
4. Return true only when a Markdown entry exists and its
   `(quality, -index)` pair sorts above HTML's. Absent HTML, any surviving
   Markdown entry wins.

Keep `hasNonZeroQuality` and `acceptsMarkdownType` as they are; they are already
covered by existing tests.

**Verify**: `bun test tests/markdown-negotiation.test.ts` → all tests pass,
including every pre-existing case. Then `bun test tests/middleware.test.ts` and
`bun run test` → pass.

### Step 3: Add `text/plain` as a Markdown-bodied rendition

`text/plain` must select the Markdown body but must not be advertised as
Markdown, so it cannot simply join `MARKDOWN_ACCEPT_TYPES`.

1. In `lib/markdown-negotiation.ts`, export a
   `resolveNegotiatedContentType(acceptHeader: string | null): 'text/markdown' | 'text/plain' | null`
   built on the Step 2 parser. It returns `'text/plain'` only when `text/plain`
   outranks both `text/html` and every Markdown type, `'text/markdown'` when
   Markdown wins, and `null` when HTML wins or nothing matches.
2. Have `shouldServeMarkdown` return true for either non-null outcome so
   `middleware.ts` routing is unchanged.
3. In `middleware.ts`, when the resolved type is `text/plain`, forward that
   intent to the rewrite target on a request header, for example
   `x-negotiated-content-type`. Do not encode it in the rewritten pathname:
   `/llms.mdx/*` is prerendered per path, and a second path variant would
   double the build output.
4. In `app/llms.mdx/[[...slug]]/route.ts`, read that request header and set
   `Content-Type: text/plain; charset=utf-8` when it is present, keeping
   `text/markdown; charset=utf-8` as the default. The body is identical either
   way. Leave `X-Robots-Tag: noindex` and the `appendMarkdownVaryHeader` call in
   place.

Add unit cases in `tests/markdown-negotiation.test.ts` for `text/plain` alone,
`text/plain, text/html` (HTML wins), and
`text/plain;q=0.9, text/markdown;q=1.0` (Markdown wins). Add a middleware case
asserting the forwarded request header appears on the rewrite and is absent for
a Markdown-only request.

**Verify**: `bun run test` → all tests pass. `bun run typecheck` → exit 0.

### Step 4: Deliver `Vary` from the layer that survives the edge

Route-handler and middleware headers are replaced for prerendered responses.
The `Link` header in `next.config.mjs` `headers()` is confirmed live on
production, so that is the layer to use.

In the `next.config.mjs` `headers()` array, add one entry per negotiable
top-level section rather than a single `/(.*)`:

- `/`
- `/overview/:path*`
- `/cookbook/:path*`
- `/integrations/:path*`
- `/changelog/:path*`

Each entry sets one `Vary` key whose value is the union of Next's router tokens
and ours:

```
RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept, User-Agent
```

Include the router tokens deliberately: this layer replaces the header rather
than appending to it, and dropping them would break RSC client navigation
caching. Add a comment saying exactly that, so a future reader does not
"simplify" the value down to `Accept, User-Agent`.

Do not use `/(.*)`. `Vary: User-Agent` on `/_next/*` and image assets would
fragment the edge cache by user-agent string across the highest-volume paths on
the site for no correctness gain, since those paths never negotiate.

Leave `appendMarkdownVaryHeader` and both of its call sites in place. They are
correct, they are the source of truth for dynamic responses, and removing them
would make the negotiation modules silently dependent on platform config.

**Verify**: `bun run build` → exit 0. `bun run check` → exit 0.
Then start the production server (`bun run start`) and confirm locally:

```
curl -sSI -H 'Accept: text/markdown' http://localhost:3000/overview/steel-cli
```

`Vary` must contain `Accept` and `User-Agent`, and `Content-Type` must be
`text/markdown`.

### Step 5: Extend the runtime matrix

In `tests/e2e/llm-endpoints.test.ts`, add cases over the full "Target behavior"
table for at least one docs path and the root.

Each case asserts the resolved `Content-Type` and that `Vary`, parsed into
normalized comma-separated tokens, contains `accept` and `user-agent`. Use a
token helper; do not substring-match the header. Add one `HEAD` case per branch.

**Verify**: `bun test tests/e2e/llm-endpoints.test.ts` → all tests pass.

### Step 6: Full gate

Run, in order:

1. `bun run test`
2. `bun run typecheck`
3. `bun run check`
4. `bun run validate-links`
5. `bun run build`
6. `git diff --check`

All must pass with no output beyond success.

### Step 7: Post-deploy verification

`Vary` delivery cannot be fully proven before deploy, because the header is
applied by the platform routing layer. On the preview deployment, run each of
these against the preview host:

| Probe | Expected |
|-------|----------|
| `-H 'Accept: text/markdown'` on a docs page | `text/markdown`, `Vary` contains `Accept` and `User-Agent` |
| `-H 'Accept: text/html, text/markdown, */*'` | `text/html` |
| `-H 'Accept: text/markdown;q=0.5, text/html;q=1.0'` | `text/html` |
| `-H 'Accept: text/plain'` | `text/plain; charset=utf-8` |
| `-A 'ClaudeBot/1.0'` with no `Accept` | `text/html` (crawler policy unchanged) |
| `-A 'claude-user/1.0'` with no `Accept` | `text/markdown` |
| a browser-shaped `Accept` on `/_next/static/...` | `Vary` has no `User-Agent` |
| repeat the first two probes twice each | second call may report `x-vercel-cache: HIT`; `Content-Type` must still match the request |

The last row is the actual regression being fixed. If a cached response returns
the wrong `Content-Type` for its `Accept`, the fix has not landed.

## STOP conditions

Stop and report rather than improvising if any of these occur:

- Adding `Vary` via `next.config.mjs` `headers()` does not appear on the built
  production response in Step 4. The header layer's precedence is the plan's
  central assumption; if it is wrong, the fix needs a different surface and a
  new plan, not a `vercel.json` experiment.
- Setting `Vary` breaks client-side navigation or RSC prefetching in local
  production. That means the router token list is incomplete or renamed.
- Any pre-existing test in `tests/markdown-negotiation.test.ts` or
  `tests/middleware.test.ts` fails after Step 2. The ranking change must be
  additive to the current contract, not a redefinition of it.
- `bun run build` output size or route count changes materially after Step 3.
  That indicates `text/plain` created a second prerendered path variant, which
  Step 3.3 exists to prevent.
- The crawler-gets-HTML policy changes for any user agent in
  `HTML_CRAWLER_USER_AGENT_SUBSTRINGS`. That policy was settled by Plan 002 and
  PR #96 and is out of scope here.

## Done criteria

- Every row of the "Target behavior" table holds on the preview deployment.
- `Vary` as delivered by the CDN contains `Accept` and `User-Agent` on
  negotiable paths, and does not contain `User-Agent` on `/_next/*`.
- A second, cache-hit request returns the representation its own `Accept` asked
  for.
- `bun run test`, `typecheck`, `check`, `validate-links`, and `build` all pass.
- `plans/README.md` has this plan's row updated.

## Findings considered and rejected

These come from the AgentGrade report dated 2026-08-03. Each was verified by
direct probe; recording the outcome here prevents re-litigation.

- **"OpenAPI spec declares 30 paths, 0 reachable" and "Response matches spec":**
  rejected as false. The spec declares
  `servers: [{ url: "https://api.steel.dev" }]`, and `/openapi.json` is a 308 to
  `https://api.steel.dev/sdk-openapi.json`. Probing the declared server gives
  `GET /health` → `200 application/json` and `GET /v1/sessions` →
  `401 application/json`, which satisfies the scanner's own stated criteria. The
  scanner probed `docs.steel.dev` instead of the spec's declared server. No
  change is warranted.
- **"llms.txt does not reference the OpenAPI spec":** rejected. The site
  publishes `/.well-known/api-catalog` per RFC 9727 with a `service-desc` link
  to the spec, which Plan 003 established as the correct mechanism. Duplicating
  the pointer into `llms.txt` adds a second thing to keep in sync.
- **"Agent UA gets non-HTML" scored as passing:** rejected as a scanner error in
  our favor. `ClaudeBot/1.0` receives 235KB of HTML by design, as the report's
  own bot-parity table shows at 100%. `HTML_CRAWLER_USER_AGENT_SUBSTRINGS`
  exists so indexing crawlers get indexable HTML. Nothing to fix.
- **`Accept: application/json` on the root returning HTML:** rejected for this
  plan. There is no JSON rendition of a documentation page, and inventing one to
  satisfy a check aimed at API origins would ship a surface with no consumer.
  The machine-readable entry points that do exist are advertised through the
  `Link` header and the API catalog.
- **A JSON 404 body:** deferred, not rejected. The status code is already a
  correct `404`; only the body is HTML. Negotiating `app/not-found.tsx` is a
  self-contained change that does not share any file with this plan, so it
  belongs in its own plan rather than widening this diff.
- **`/skill.md` and `/agents.txt`:** deferred as a product decision, not a
  defect. Both are early conventions with thin adoption, and the site already
  serves `/AGENTS.md`, `/llms.txt`, `/llms-full.txt`, `.md` on every page, and
  an Agent Skills discovery index. Adding another manifest is a question of
  which conventions Steel wants to endorse, which is not an executor's call.
- **`Cache-Control: private` or `no-store` as the `Vary` fix:** rejected. It
  satisfies the check by disabling shared caching for the whole docs site. The
  goal is a correct cache key, not the absence of a cache.
- **Retiring `appendMarkdownVaryHeader` once the platform header lands:**
  rejected. It remains correct for dynamic responses and keeps the negotiation
  policy self-describing in the module that owns it.
