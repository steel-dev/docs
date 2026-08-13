# Plan 003: Complete the RFC 9727 HTTP contract

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report—do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b4d2ff07..HEAD -- next.config.mjs public/.well-known/api-catalog tests/api-catalog.test.ts tests/e2e/llm-endpoints.test.ts`
> Plan 001 is expected to add a narrowly scoped Agent Skills archive header
> elsewhere in `next.config.mjs`. That addition alone is not a mismatch.
> Compare the global `Link` rule below against the live code; treat any other
> in-scope mismatch as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/001-publish-complete-agent-skill-archives.md`
- **Category**: bug
- **Planned at**: commit `b4d2ff07`, 2026-07-30

## Why this matters

The API catalog document and media type are valid, but the endpoint does not
yet satisfy RFC 9727's full HTTP discovery contract. A `HEAD` request to
`/.well-known/api-catalog` must include a `Link` header whose relation is
`api-catalog`; the live response currently advertises only the Markdown
alternates. The catalog also hints that the canonical OpenAPI URL returns
`application/openapi+json`, while that URL currently serves
`application/json`.

This plan adds the mandatory relation through the existing global `Link`
header, which also provides the useful optional advertisement on normal pages,
and makes the service-description hint truthful. RFC 9727's GET, HEAD, Link,
and Linkset requirements are at
<https://www.rfc-editor.org/rfc/rfc9727.html#section-2>.

## Current state

- `public/.well-known/api-catalog` is a valid RFC 9264 JSON Linkset.
- `next.config.mjs` supplies the correct Linkset media type to the extensionless
  static file.
- The existing catch-all `Link` header advertises only `llms.txt` variants.
- `tests/api-catalog.test.ts` pins the more specific, but inaccurate,
  OpenAPI media-type hint.
- `tests/e2e/llm-endpoints.test.ts` tests GET but not HEAD discovery or
  page-level advertisement.

Current header rules in `next.config.mjs:210-231`:

```js
{
  source: "/.well-known/api-catalog",
  headers: [
    {
      key: "Content-Type",
      value: 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
    },
  ],
},
{
  source: "/(.*)",
  headers: [
    {
      key: "Link",
      value: '</llms.txt>; rel="alternate"; type="text/markdown", </llms-full.txt>; rel="alternate"; type="text/markdown"',
    },
  ],
},
```

Current service description in `public/.well-known/api-catalog:13-17`:

```json
"service-desc": [
  {
    "href": "https://api.steel.dev/sdk-openapi.json",
    "type": "application/openapi+json"
  }
]
```

Current assertion in `tests/api-catalog.test.ts:41-48`:

```ts
expect(desc?.href).toBe('https://api.steel.dev/sdk-openapi.json');
expect(desc?.type).toBe('application/openapi+json');
```

The canonical API URL returned `Content-Type: application/json; charset=utf-8`
when this plan was written. Recheck that live contract before changing the
hint.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Confirm upstream type | `curl -sSI https://api.steel.dev/sdk-openapi.json` | `200` and `Content-Type: application/json...` |
| Catalog tests | `bun test tests/api-catalog.test.ts` | all tests pass |
| Runtime tests | `bun test tests/e2e/llm-endpoints.test.ts` | all tests pass |
| Full tests | `bun run test` | all tests pass |
| Typecheck | `bun run typecheck` | exit 0, no errors |
| Lint/format check | `bun run check` | exit 0, no warnings |
| Link validation | `bun run validate-links` | exit 0 |
| Production build | `bun run build` | exit 0 |
| Diff hygiene | `git diff --check` | no output |

## Scope

**In scope** (the only files to modify):

- `next.config.mjs`
- `public/.well-known/api-catalog`
- `tests/api-catalog.test.ts`
- `tests/e2e/llm-endpoints.test.ts`

**Out of scope**:

- The Steel API repository or the headers returned by `api.steel.dev`
- A docs-hosted OpenAPI copy
- `lib/markdown-negotiation.ts`
- A route handler for the static catalog
- An HTML `<link>` element
- Publishing the well-known catalog on additional API domains
- Catalog schema redesign or additional API entries

## Git workflow

- Branch: `fix/api-catalog-discovery-header`
- Use one logical Conventional Commit, for example:
  `fix(api): advertise the API catalog relation`
- Start after Plan 001 to avoid parallel edits to `next.config.mjs`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Reconfirm the canonical OpenAPI representation

Run:

```sh
curl -sSI https://api.steel.dev/sdk-openapi.json
```

Expected at plan time: status `200` and a `Content-Type` beginning with
`application/json`.

If the API now returns `application/openapi+json`, do not change the catalog's
existing type or its unit assertion; continue with the discovery-header work.
If it returns another successful JSON media type, use that exact base media
type. If the URL no longer resolves successfully or is no longer the canonical
spec, stop.

**Verify**: record the response status and base media type in the PR
description without copying unrelated response headers.

### Step 2: Add the API catalog relation to the existing Link header

In the `source: "/(.*)"` rule in `next.config.mjs`, append this link-value to
the current comma-separated `Link` field:

```text
</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"
```

Keep both existing `alternate` links unchanged. Use one valid combined `Link`
field rather than adding a second header with the same name, because multiple
matching Next.js header rules can overwrite same-name values.

The catch-all rule is intentional:

- `HEAD /.well-known/api-catalog` receives the mandatory relation.
- Normal docs pages receive the optional discovery advertisement.

Do not add an HTML tag or duplicate path-specific `Link` header.

**Verify**: `bun run build` → Next.js accepts the header value and exits 0.

### Step 3: Make the service-description type match the canonical response

If Step 1 still shows `application/json`, change
`public/.well-known/api-catalog` so the `service-desc` object has:

```json
"type": "application/json"
```

Update the corresponding assertion in `tests/api-catalog.test.ts`. Keep the
canonical `href` and all Linkset anchors/relations unchanged.

This is a truthful current hint, not a declaration that generic JSON is the
ideal API behavior. A later API-side change to
`application/openapi+json` should update this field and test in the same PR.

**Verify**: `bun test tests/api-catalog.test.ts` → all catalog document tests
pass.

### Step 4: Add HEAD and normal-page runtime regressions

In `tests/e2e/llm-endpoints.test.ts`, add a test that sends:

```ts
fetch(`${BASE_URL}/.well-known/api-catalog`, {
  method: 'HEAD',
  redirect: 'manual',
})
```

Assert:

- status is `200`;
- `Content-Type` starts with `application/linkset+json`;
- the parsed `Link` header contains a link-value targeting
  `/.well-known/api-catalog` with relation `api-catalog`.

Do not rely on a raw substring that could match a different relation token.
Add a tiny test helper that splits the known, comma-separated header values
and matches target plus `rel` parameter.

Extend the existing canonical HTML-page test near the end of the file to
assert the same catalog relation is present on a normal docs response. Keep
its existing HTML status/content-type assertions.

**Verify**: `bun test tests/e2e/llm-endpoints.test.ts` → all endpoint tests pass.

### Step 5: Run repository and live gates

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

Expected: all quality commands exit 0, diff check prints nothing, and only the
four in-scope files plus the plan-status update are tracked changes.

After an authorized deployment, run:

```sh
curl -sSI https://docs.steel.dev/.well-known/api-catalog
curl -sSI https://docs.steel.dev/overview
```

Expected: the catalog response has the profiled Linkset content type and both
responses contain the `api-catalog` relation.

## Test plan

- `tests/api-catalog.test.ts` remains the source-of-truth test for Linkset
  structure, canonical URLs, and media-type hints.
- `tests/e2e/llm-endpoints.test.ts` proves Next.js header merging for:
  - GET catalog;
  - HEAD catalog;
  - catalog requests from Markdown clients;
  - a normal HTML docs page.
- Regression: HEAD must contain the `api-catalog` relation.
- Regression: the catalog's advertised OpenAPI type must match the live API's
  current response.
- Run both targeted files and then `bun run test`.

## Done criteria

- [ ] `HEAD /.well-known/api-catalog` returns `200`.
- [ ] That HEAD response contains `rel="api-catalog"` targeting the catalog.
- [ ] The catalog still returns the profiled `application/linkset+json`
      content type.
- [ ] A normal docs page advertises the same catalog relation.
- [ ] Both existing Markdown alternate links remain in the global `Link`
      header.
- [ ] The `service-desc` type matches the live canonical OpenAPI response.
- [ ] The catalog href still points to the API-owned canonical spec.
- [ ] `bun run test`, `bun run typecheck`, `bun run check`,
      `bun run validate-links`, and `bun run build` all exit 0.
- [ ] `git diff --check` has no output.
- [ ] No tracked files outside the in-scope list changed.
- [ ] `plans/README.md` status row is updated.

## STOP conditions

Stop and report back instead of improvising if:

- Plan 001 changed the global `Link` rule rather than only adding its scoped
  archive content-type rule.
- The canonical OpenAPI URL no longer returns a successful JSON
  representation.
- The API already changed to `application/openapi+json`; retain the current
  catalog hint rather than changing it to generic JSON.
- Next.js header merging causes either the catalog content type or existing
  Markdown alternate links to disappear.
- A correct `Link` header requires replacing the static catalog with a route
  handler.
- Any targeted verification fails twice after a reasonable in-scope fix.

## Maintenance notes

- The relation on `HEAD` is normative RFC 9727 behavior; the relation on every
  docs page is useful extra discovery and comes from the same header rule.
- If `api.steel.dev` adopts `application/openapi+json`, update the catalog hint
  and test together. That API-side improvement is deliberately not part of
  this docs plan.
- RFC 9727 recommends publishing or redirecting the well-known catalog from
  each API domain. That requires ownership of `api.steel.dev` and is deferred.
- Reviewers should inspect the final merged `Link` response, not only
  `next.config.mjs`, because same-name header merging is deployment-sensitive.
