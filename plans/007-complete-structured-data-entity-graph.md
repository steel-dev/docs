# Plan 007: Complete the structured-data entity graph

- **Status:** TODO
- **Priority:** P2
- **Effort:** M
- **Risk:** MED
- **Category:** docs
- **Planned against:** `c4c074c8` on 2026-07-30
- **Depends on:** Plan 006 (DONE) and the merged homepage semantics work in PR #98

## Goal

Give crawlers a consistent, page-aware JSON-LD graph for Steel, the documentation
website, and each indexable HTML page while preserving the current visual construction
and reusing the schema already present in the repository.

Success means:

1. Every rendered HTML page inherits one canonical `Organization` and `WebSite` graph.
2. The docs homepage, changelog index, and dynamic docs pages emit an appropriate
   `WebPage` node with stable IDs and canonical URLs.
3. Existing `TechArticle` and recipe schemas refer to the same `Organization` and
   `WebPage` IDs instead of creating disconnected inline entities.
4. `sameAs` contains only first-party-verified Steel identity profiles.
5. Schema freshness dates are emitted only when they come from authored content or Git
   history; filesystem and build timestamps are never presented as content freshness.
6. Existing `BreadcrumbList`, `FAQPage`, recipe, and author-profile behavior remains
   intact.

## Why this is the next task

The original readiness report said JSON-LD was absent, but that finding is now only
partly accurate. The repository already emits:

- `BreadcrumbList` on dynamic docs pages.
- `TechArticle` on integration leaf pages.
- `TechArticle` for cookbook recipes.
- `FAQPage` from visible FAQ directives.
- `ProfilePage` and `Person` on cookbook author pages.

The remaining problem is fragmentation:

- The homepage has no schema describing Steel or the docs site.
- Ordinary documentation pages have breadcrumbs but no page entity.
- Existing article nodes reference a `WebPage` URL without emitting that `WebPage`.
- Organization authors are embedded inconsistently and have no stable entity ID.
- Steel's Twitter metadata still uses the stale `@steelsystems` handle.
- Integration freshness may fall back to filesystem modification time, which can reflect
  checkout or build time rather than a content edit.

Adding another isolated schema block would compound that fragmentation. This plan
completes one coherent graph.

## Assumptions

- `https://docs.steel.dev/` remains the canonical docs origin.
- The organization represented by this site is Steel, whose canonical website is
  `https://steel.dev/`.
- As verified from first-party links on 2026-07-30, the approved identity profiles are:
  - `https://github.com/steel-dev`
  - `https://x.com/steeldotdev`
- `Steel Documentation` remains the homepage's visible and structured-data title.
- The existing animated homepage logo remains visually unchanged.
- A missing freshness date is preferable to a fabricated or deployment-derived date.

## Stable entity coordinates

Use docs-root IDs so every reference points to an entity actually defined by this site:

| Entity | Stable `@id` |
|---|---|
| Steel organization | `https://docs.steel.dev/#organization` |
| Documentation website | `https://docs.steel.dev/#website` |
| Homepage | `https://docs.steel.dev/#webpage` |
| Any other HTML page | `<canonical-page-url>#webpage` |

These IDs are public coordinates. Do not rename them casually after release.

## Scope

### In scope

- Add shared schema constants and small pure builders.
- Emit site identity schema from the root layout.
- Emit page-specific `WebPage` schema on the homepage, changelog index, and dynamic docs.
- Link existing integration and cookbook article schema to the shared entities.
- Separate schema-safe Git freshness from the sitemap's current fallback behavior.
- Correct the stale Twitter identity metadata.
- Add unit and rendered-HTML coverage for the graph and eligibility rules.

### Out of scope

- Any visual, layout, logo-size, typography, or animation changes.
- Adding `SoftwareApplication`, `Product`, `Service`, `Review`, or rating schema.
- Adding a homepage `datePublished` or `dateModified`.
- Bulk-adding dates to frontmatter.
- Treating filesystem mtime, checkout time, build time, or deployment time as freshness.
- Adding an organization logo until a canonical, appropriately sized brand asset is
  explicitly approved for structured data.
- Changing FAQ extraction, breadcrumb labels, recipe authors, or author-profile content.
- Adding `agent.json`, MCP descriptors, or other agent protocols without a real endpoint.
- Citation-content work, comparison pages, backlinks, or authority-building.
- Cleaning up unrelated metadata helpers such as `lib/metadata.ts`.

## Target files

| Path | Intended change |
|---|---|
| `lib/structured-data.ts` | New constants and pure builders for IDs, identity graph, and page nodes. |
| `components/page-jsonld.tsx` | Render site identity and page nodes; connect integration articles to shared IDs. |
| `components/recipe-jsonld.tsx` | Add shared publisher and emitted-page references without changing recipe authors. |
| `app/layout.tsx` | Render the site identity graph and correct the Twitter handle. |
| `app/(home)/page.tsx` | Render the homepage `WebPage` node. |
| `app/(home)/changelog/page.tsx` | Render a changelog-index `WebPage` node. |
| `app/[...slug]/page.tsx` | Render the correct page node and use schema-safe freshness for integrations. |
| `lib/last-modified.ts` | Expose Git-only freshness while preserving sitemap fallback behavior. |
| `tests/structured-data.test.ts` | New pure graph and ID contract tests. |
| `tests/last-modified.test.ts` | New provenance test for Git-only schema dates. |
| `tests/e2e/llm-endpoints.test.ts` | Verify JSON-LD in raw rendered HTML across representative routes. |

## Eligibility matrix

| Route kind | Site identity | `WebPage` | Existing specialized schema | Freshness |
|---|---:|---:|---|---|
| `/` | Yes | Yes | None | Omit |
| `/changelog` | Yes | Yes | None | Omit |
| Ordinary dynamic docs page | Yes | Yes | `BreadcrumbList`; optional `FAQPage` | Omit unless a separately supported schema owns a trusted date |
| Integration leaf page | Yes | Yes | `BreadcrumbList` + `TechArticle` | Authored `publishedAt`; Git-only `dateModified` |
| Cookbook recipe | Yes | Yes | `BreadcrumbList` + recipe `TechArticle`; optional `FAQPage` | Existing recipe source dates |
| Cookbook author profile | Yes | No generic duplicate | Existing `ProfilePage` + `Person` | Existing behavior |
| Redirect or route handler | Not applicable | No | Existing behavior | Omit |
| Not-found HTML response | Inherited from layout | No | Existing behavior | Omit |

`ProfilePage` is already a specialized page type. Excluding author routes from the
generic node avoids two competing page entities for the same canonical URL.

## Implementation

### 1. Lock the schema contract with pure tests

Create `tests/structured-data.test.ts` before wiring the renderers.

Cover:

- Exact stable IDs from the table above.
- One `Organization` and one `WebSite` node in the identity graph.
- Organization name `Steel`, canonical URL `https://steel.dev/`, and the exact verified
  `sameAs` list.
- `WebSite.publisher` resolves to the emitted organization ID.
- Homepage `WebPage` uses:
  - name `Steel Documentation`
  - canonical docs-root URL
  - `isPartOf` pointing to the website ID
  - `about` and `publisher` pointing to the organization ID
- Non-root page IDs append `#webpage` to the canonical URL.
- Optional fields are omitted rather than serialized as `null` or empty strings.
- Homepage and ordinary page builders do not add freshness dates.
- Article nodes use the emitted page ID as `mainEntityOfPage`.

Verify:

```bash
bun test tests/structured-data.test.ts
```

### 2. Add one shared identity vocabulary

Create `lib/structured-data.ts` with only the cross-consumer pieces:

- Docs and organization URLs.
- Stable organization and website IDs.
- The verified `sameAs` profiles.
- A helper that derives `<canonical-url>#webpage`.
- Pure builders for:
  - the site identity graph
  - a generic page node

Keep descriptions aligned with visible, current copy. Do not introduce legal names,
founding data, employee data, contact points, prices, ratings, or product capabilities
that are not established on the page.

In `components/page-jsonld.tsx`:

- Add a renderer for the identity graph.
- Add a renderer for page nodes.
- Preserve the existing JSON-LD script pattern and `BreadcrumbJsonLd` API.
- Update integration `TechArticle` output so:
  - `author` refers to the shared organization ID
  - `publisher` refers to the shared organization ID
  - `mainEntityOfPage` refers to the emitted `#webpage` ID

Do not build a general-purpose schema framework. These are a few stable constants and
builders shared by multiple existing renderers.

### 3. Render identity once and page semantics at route ownership boundaries

In `app/layout.tsx`:

- Render the `Organization` + `WebSite` graph once for every HTML page.
- Change Twitter `site` and `creator` from `@steelsystems` to `@steeldotdev`.
- Leave all unrelated metadata untouched.

In `app/(home)/page.tsx`:

- Render the homepage `WebPage` node.
- Reuse the existing title and description.
- Do not alter `SteelDocs`, the animated logo, or any classes.

In `app/(home)/changelog/page.tsx`:

- Render a `WebPage` node using the route's existing title, description, and canonical URL.
- Do not add article schema to the listing page.

In `app/[...slug]/page.tsx`:

- Render a generic `WebPage` node for canonical dynamic docs pages.
- Exclude cookbook author-profile routes because `AuthorProfile` already emits a
  specialized `ProfilePage`.
- Keep breadcrumbs and content rendering unchanged.
- Continue limiting docs `TechArticle` to the existing integration-leaf eligibility rule.

### 4. Join cookbook article nodes to the same graph

In `components/recipe-jsonld.tsx`:

- Preserve the existing person authors and source-provided dates.
- Add `publisher: { "@id": "https://docs.steel.dev/#organization" }`.
- Change `mainEntityOfPage` to the recipe's emitted `<canonical-url>#webpage` ID.
- Do not change recipe eligibility or derive new dates.

The generic dynamic-page node supplies the target `WebPage`; the root layout supplies
the target `Organization`.

### 5. Make schema freshness provenance explicit

In `lib/last-modified.ts`:

- Expose a Git-only lookup that returns `undefined` when Git history is unavailable.
- Keep `getLastModified` and its filesystem fallback intact for sitemap compatibility.
- Name or document the Git-only function so callers cannot mistake it for a general file
  modification timestamp.

In `app/[...slug]/page.tsx`:

- Use the Git-only function for integration `TechArticle.dateModified`.
- Preserve authored `publishedAt` handling.
- Omit `dateModified` when Git history is unavailable.

In `tests/last-modified.test.ts`:

- Create a temporary untracked file.
- Assert the Git-only lookup returns `undefined`.
- Assert the existing sitemap-oriented lookup can still return the filesystem date.

This test protects the distinction between discovery freshness and claimable content
freshness.

Verify:

```bash
bun test tests/last-modified.test.ts
```

### 6. Verify the rendered HTML, not just component objects

Extend the existing single-server E2E suite rather than starting another dev server.
Add a helper that extracts and parses all
`script[type="application/ld+json"]` payloads from raw HTML.

Representative assertions:

1. `/`
   - Contains one organization and one website node.
   - Contains a homepage `WebPage` named `Steel Documentation`.
   - All graph references resolve to the expected IDs.
   - Contains the exact verified `sameAs` list.
   - Contains no homepage freshness dates.
   - Twitter metadata uses `@steeldotdev`.
2. `/overview/sessions-api/quickstart`
   - Contains a generic `WebPage` and `BreadcrumbList`.
   - Does not gain an integration `TechArticle`.
   - Existing FAQ schema, if present, remains independently valid.
3. One existing integration leaf
   - Contains `WebPage`, `BreadcrumbList`, and `TechArticle`.
   - `mainEntityOfPage`, author, and publisher point to emitted/shared IDs.
   - `dateModified`, when present, is a valid ISO timestamp.
4. One existing cookbook recipe
   - Retains its recipe article and person authors.
   - Links publisher and page IDs to the shared graph.
5. One cookbook author page
   - Retains `ProfilePage` and `Person`.
   - Does not emit a duplicate generic `WebPage`.
6. `/changelog`
   - Emits a listing-page `WebPage`, not `TechArticle`.

Select representative routes from the current content tree during implementation; do not
invent fixtures for routes that do not exist.

Verify:

```bash
bun test tests/e2e/llm-endpoints.test.ts
```

## Full verification

Run in this order:

```bash
bun test tests/structured-data.test.ts tests/last-modified.test.ts
bun test tests/e2e/llm-endpoints.test.ts
bun run check --error-on-warnings
bun run typecheck
bun run validate-links
bun test
bun run build
git diff --check
```

After the production build, inspect the built or served HTML for `/`, one ordinary docs
page, one integration, and one cookbook recipe. Confirm there is no duplicate entity with
the same `@id` in a single document.

Optionally validate those four rendered documents with Schema.org's validator as a manual
review aid. Do not make an external validator a flaky CI dependency.

## Acceptance criteria

- [ ] The root layout emits exactly one Steel `Organization` and docs `WebSite` identity graph.
- [ ] Organization `sameAs` contains only the two verified first-party profiles.
- [ ] Root, changelog, and eligible dynamic pages emit canonical page nodes.
- [ ] `Steel Documentation` remains both the visible homepage title and structured page name.
- [ ] The animated homepage logo is unchanged in markup, size, and behavior.
- [ ] Integration articles reference the shared page and organization IDs.
- [ ] Cookbook recipes retain person authors and reference the shared publisher/page IDs.
- [ ] Cookbook author pages do not gain a duplicate generic page entity.
- [ ] No homepage or ordinary-page freshness date is invented.
- [ ] Integration schema never uses filesystem mtime as `dateModified`.
- [ ] Sitemap last-modified behavior remains unchanged.
- [ ] Twitter identity metadata uses `@steeldotdev`.
- [ ] Focused tests, full tests, Biome, typecheck, link validation, and production build pass.

## STOP conditions

Stop and request direction if any of these occur:

- First-party Steel properties no longer link both approved `sameAs` URLs, or the brand
  owner confirms different canonical profiles.
- The requested schema requires an unverified legal name, logo, price, rating, product
  category, or other unsupported claim.
- Runtime inspection shows two nodes with the same `@id` but materially different data.
- A cookbook author route cannot be reliably distinguished from generic dynamic pages
  using existing route/content information.
- A freshness requirement can only be satisfied with filesystem, build, checkout, or
  deployment timestamps.
- Implementing the graph requires changing visible homepage construction or the animated
  logo.
- Existing recipe/profile/FAQ schema has a separate correctness defect that cannot be
  fixed surgically within the reference-link changes above. Record it as a follow-up
  instead of broadening this task silently.

## Delivery

Suggested branch:

```text
agent/complete-structured-data-graph
```

Suggested commit:

```text
feat(seo): complete structured data entity graph
```

Do not push or open a pull request unless explicitly requested.

## Maintenance notes

- Treat `@id` values like stable public identifiers, not presentation copy.
- Re-verify `sameAs` against first-party properties before adding or replacing profiles.
- Missing dates are valid; inaccurate freshness signals are not.
- Structured data must describe visible content. It does not replace answerable page copy.
- If a canonical square Steel logo is later approved, add it to the shared organization
  node in a separate, asset-reviewed change.
