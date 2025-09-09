## De-internationalization plan (remove i18n entirely; fallback: remove Spanish and make English root)

This plan removes internationalization with minimal code additions, simplifying structure and behavior. It is designed to be executed in phases with validation at each step. If full removal proves too risky, a fallback path removes Spanish while keeping the architecture largely intact and making English the root at `/`.

### High-level overview of current i18n

- Middleware: `middleware.ts` uses `createI18nMiddleware(i18n)` and locale detection/redirects; assumes first path segment is a locale. Also has referer-based redirect logic.
- Routing structure: The app is nested under `app/[locale]/...` with localized home pages in `app/[locale]/(home)/*` and a catch-all `app/[locale]/[...slug]/page.tsx` that loads MDX via `source` using `[locale]`.
- Root redirect: `app/page.tsx` redirects `/` to `/en`.
- Provider: `app/[locale]/layout.tsx` wraps children in `I18nProvider` and provides available locales from `lib/i18n.ts`.
- Locale-aware hooks and utils:
  - `hooks/use-translations.tsx` and `lib/translations/*` provide UI strings and infer locale from path/cookie.
  - `hooks/use-breadcrumb.tsx` strips locale from the first path segment to build breadcrumbs.
  - `lib/locale-utils.ts` extracts locale from path and request for API use.
  - `app/api/search/route.ts` filters search results by current locale.
- UI: `components/language-switcher.tsx` and `components/layout/language-toggle.tsx` expose language switch UI and rely on `I18nProvider`.
- Content: Localized MDX content under `content/docs/en/...` and `content/docs/es/...`. The `lib/source.ts` loader is locale-agnostic, but routes prepend `[locale]` when resolving.
- Layouts: `components/layouts/{home,docs}.tsx` render `LanguageSwitcher` and rely on `useTranslations()` for text.

### Objective A: Fully remove i18n (preferred)

Key changes:

- Remove locale prefix from routes; move app out of `app/[locale]` so English pages live at `/...`.
- Remove `I18nProvider` and all `useI18n`/`i18n`-dependent code.
- Remove Spanish content and translation dictionaries; de-localize UI strings to plain English.
- Simplify middleware by removing i18n and referer locale redirects.
- Make search return all English results without locale filtering.

Plan steps with validation

1. Make English the root and bypass locale prefix

   - Edit `app/page.tsx`: remove `redirect('/en')`. Replace with the current English home content layout (from `app/[locale]/(home)/page.tsx` English variant).
   - Move home section routes out of `app/[locale]/(home)` into `app/(home)` and point them directly to the existing `*_en` pages or inline the English variant.
   - Remove `app/[locale]/layout.tsx` and related `generateStaticParams()`.
   - Validation:
     - Navigate to `/`, `/tools`, `/apis`, `/resources`, `/reference` and ensure pages render with English content under `/` (no `/en`).
     - Dev console free of 404s for `/en/*`.

2. Remove i18n middleware and locale detection

   - Edit `middleware.ts`:
     - Remove `createI18nMiddleware` and referer-based locale logic.
     - Keep only non-i18n matchers if needed (e.g., MD file passthrough) or delete file if not required.
   - Validation:
     - Hitting root and deep routes no longer adds locale prefixes or redirects.
     - No references to `i18n` in middleware remain.

3. Flatten the catch-all docs route to be locale-less

   - Edit `app/[locale]/[...slug]/page.tsx` logic:
     - Create `app/[...slug]/page.tsx` that resolves `source.getPage(slug)` without prepending `[locale]`.
     - Remove `[locale]` param handling, metadata generation, and multi-locale `generateStaticParams()`.
   - Update `sitemap.ts` to continue using `source.getPages()`; URLs should now be `/...`.
   - Validation:
     - Deep links like `/tools/clarinet` and MDX-powered routes resolve without the locale prefix.
     - `sitemap` outputs paths without `/en`.

4. Remove `I18nProvider` and UI locale dependencies

   - Delete `app/[locale]/layout.tsx` and remove all imports of `I18nProvider`.
   - Replace `components/layout/language-toggle.tsx` and `components/language-switcher.tsx` usages with nothing (remove these controls from `components/layouts/{home,docs}.tsx`).
   - Validation:
     - Layouts build with no `useI18n` context errors.
     - Navbar shows as expected without language controls.

5. Replace translation hooks with static English strings

   - Remove `hooks/use-translations.tsx` and any `lib/translations/*` consumers.
   - Inline English strings where `useTranslations()` was used:
     - `hooks/use-localized-navigation.tsx`: convert to `useNavigation()` returning English strings, or consume existing `app/layout.config.tsx` base options to avoid duplication.
     - `components/layout/search-toggle.tsx`: replace `t.navigation.search` etc. with string literals.
     - `hooks/use-breadcrumb.tsx`: remove translation dictionary lookups for breadcrumb labels; keep capitalization logic.
   - Validation:
     - Build succeeds; TypeScript finds no missing `Translations` types.
     - UI labels render in English consistently.

6. Remove locale utilities and API filtering

   - Remove `lib/locale-utils.ts` and its usage in `app/api/search/route.ts`.
   - Edit `app/api/search/route.ts` to return original search results without locale filtering.
   - Validation:
     - Searching returns English results identical to before when visiting `/en`.
     - No runtime errors from missing utils.

7. Remove `lib/i18n.ts` and dependent code

   - Delete `lib/i18n.ts` and remove any imports.
   - Remove `i18n` typed props or config mentions in `components/layouts/shared.tsx` and any component that allowed an `i18n` prop.
   - Validation:
     - Repo compiles without `I18nConfig` references.

8. Remove Spanish content and localized app pages

   - Delete `content/docs/es/` directory.
   - Delete localized home `_pages/page.es.tsx` across home sections under `app/(home)` after the routes are moved.
   - Validation:
     - No references to `.es.tsx` or `es` in codebase.
     - Build succeeds; site serves English-only content.

9. Clean up: remove unused components and imports

   - Remove `components/language-switcher.tsx` and `components/layout/language-toggle.tsx` if unused.
   - Remove any `useI18n` imports in `components/layout/*` such as `toc.tsx` and `nav.tsx` (replace text lookups with English constants).
   - Validation:
     - Lint and type-check without unused imports/errors.

10. Final verification

- Navigate all major sections and a representative set of deep reference pages to confirm they load and UI labels are English.
- Manual checks for common URLs with and without `/en` prefix:
  - `/` (200), `/en` (404 or redirect to `/` optional), `/tools/clarinet` (200), `/en/tools/clarinet` (404 or redirect to `/tools/clarinet` optional).
- Confirm sitemap and robots are unaffected.

Potential pitfalls and mitigations

- Hard-coded locale assumptions in `nav.tsx`, `toc.tsx`, and other layout components using `useI18n` from `fumadocs-ui/provider`.
  - Mitigation: Replace `useI18n().text` labels with literal English strings consistent across components.
- `source` structure is locale-agnostic, but current routing prepends `[locale]` to `slug`.
  - Mitigation: Ensure `app/[...slug]/page.tsx` resolves directly with `source.getPage(slug)`.
- External links and redirects to `/en/...` may exist outside the repo.
  - Mitigation: Optionally add an application-level redirect from `/en/*` to `/*` for backward-compatibility (lightweight and isolated in middleware/redirects config if desired).

Work estimate

- Code edits: medium (8–15 files). Content cleanup: large (removing Spanish tree). Risk: medium due to many small i18n references.

### Objective B: Minimal change fallback (keep scaffolding, drop Spanish, make English root)

If full removal is too invasive, do the following minimal set:

1. Make English the root

   - Edit `app/page.tsx` to render English home (remove redirect to `/en`).
   - Edit `middleware.ts` to set `i18n.languages = ['en']` and ensure it does not force `/en` prefix. If framework requires a locale, set `defaultLanguage: 'en'` and configure to hide default locale path (no prefix) if supported.
   - Validation: `/` renders English; no `/en` in URLs.

2. Remove Spanish

   - Delete `content/docs/es/` and all `*.es.tsx` localized home pages.
   - Remove `es` from `lib/i18n.ts` and `lib/translations/index.ts` (drop `es` import and map entry).
   - Validation: Build succeeds; only English content.

3. Remove language UI

   - Remove `LanguageSwitcher` from layouts; keep `I18nProvider` only if required by `fumadocs-ui` for text labels, but configure with a single locale `en`.
   - Validation: Navbar shows without language toggle.

4. Remove locale filtering in search

   - Simplify `app/api/search/route.ts` to return `originalGET(request)` without filtering.
   - Validation: Search still works with English results.

5. Optional redirect for legacy links
   - Add redirect rule `/en/(.*) -> /$1` in `next.config.mjs` or middleware.
   - Validation: Visiting `/en/tools/clarinet` lands on `/tools/clarinet`.

Rollback strategy

- Each step is isolated; revert the specific edit or restore files removed in that step if issues arise. Commit after each validated step.

Post-removal cleanup checklist

- No files import from `lib/i18n.ts`, `lib/locale-utils.ts`, or `lib/translations/*`.
- No `useI18n` usage remains; all labels plain English.
- `app/[locale]` directory removed; routes exist without locale param.
- `middleware.ts` has no i18n code, or is removed if unnecessary.
- `content/docs/es` deleted, sitemap shows only English URLs.

Validation commands (guidance)

- Typecheck: `bunx tsc -p tsconfig.json --noEmit`
- Lint: `bun run lint` (or biome if configured)
- Grep sanity:
  - `rg "useI18n\(|I18nProvider|lib/i18n|locale-utils|use-translations|/en/"`
  - Expect zero results (except for this plan file) after full removal.
