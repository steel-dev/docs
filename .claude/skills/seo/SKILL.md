---
name: seo
description: Run Steel's recurring (monthly) SEO pulse check for docs.steel.dev and steel.dev. Refreshes DataForSEO keyword search-volume/CPC/trend data for the tracked keyword set, checks current Google SERP positions for priority terms, audits technical SEO (titles, meta descriptions, canonicals, JSON-LD, indexability) for regressions, detects demand drift and new opportunities, and writes a dated delta report compared to the previous month. Use this skill whenever the user wants a monthly or weekly SEO check, an SEO progress report, a keyword ranking update, an SEO regression/health audit, or asks "how are our SEO changes doing", "is the SEO work paying off", "refresh the SEO data", "SEO report for Steel", or mentions tracking docs.steel.dev / steel.dev SEO, rankings, or keywords over time. Also use it when the user wants to add, remove, or change the tracked SEO keywords or pages for Steel.
---

# Steel SEO Pulse

A repeatable **monthly** SEO check for Steel's two web properties — **docs.steel.dev** (docs) and **steel.dev** (marketing). It answers "is the SEO work paying off, and what moved since last month?" by combining real DataForSEO keyword + SERP data with a live technical audit of the key pages, then writing a dated delta report.

## What it produces

Each run writes, under `scripts/seo/pulse/`:
- **Snapshots** (`snapshots/volumes-YYYY-MM.json`, `ranks-YYYY-MM.json`, `tech-YYYY-MM.json`) — the raw state for this month. Next month's run diffs against these.
- **`reports/seo-YYYY-MM.md`** — the human-readable delta report (the deliverable).

Snapshots are gitignored (regenerable state); reports are kept for history.

## Prerequisites

- **DataForSEO credentials** in the repo-root `.env`: `DATAFORSEO_AUTH=<base64 login:password>` (plus `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD`). If `.env` lacks them, ask the user to add them before proceeding.
- The account must be **email-verified** and have a positive balance (SERP calls cost credits — see Cost below).
- Run all scripts from the **repo root** (`/home/agent/steel-docs`).

## How to read the numbers (important)

The keyword data comes from DataForSEO's `keywords_data/google_ads/search_volume/live`. Understand its limits so you interpret it correctly:
- It's **Google Ads planner data**: US-only, **bucketed**, and it **under-reports low-volume developer terms**. A `volume` of `10` or a row with `volume: null` means "below the ads reporting threshold / no advertisers" — **not zero demand**. Plenty of real organic traffic lives at `10`/`null`.
- `paid_competition` / `competition_index` is **paid-search competition, not organic ranking difficulty.** Don't treat "LOW competition" as "easy to rank."
- `cpc` is a great **commercial-intent signal**: a high CPC on a modest-volume term (e.g. `openai agents sdk` ~$43, `best scraping api` ~$46) flags strong buyer intent worth pursuing.
- The `trend` field holds the prior 12 months of monthly volume — use it to spot **momentum** (a term spiking is often more valuable than a high-but-flat one).

So: weight **volume × CPC × momentum** together, and treat the numbers as directional, not exact.

## The monthly workflow

Run the three deterministic scripts in order (they print summaries and write snapshots), then add judgment for drift/discovery, then synthesize the report. The split is deliberate — **scripts handle the mechanical, repeatable data; you handle synthesis and judgment.** (A prior attempt to do everything in one big agent fan-out got stuck in loops; scripts are reliable and cheap to re-run.)

### Phase 1 — Refresh demand

```bash
node .claude/skills/seo/scripts/dfs-volumes.mjs
```
Pulls volume/CPC/12-month trend for every keyword in `config.json` → `tracked_keywords`, writes `volumes-YYYY-MM.json`, and prints **movers** (Δvolume ≥50 or trend slope ≥25% vs last month). For a cheap smoke test add `--limit 10`.

### Phase 2 — Track SERP positions  ⚠️ costs credits

```bash
node .claude/skills/seo/scripts/dfs-rank.mjs
# budget tight? →  node dfs-rank.mjs --limit 10
```
Checks Google rank (top 20) for `docs.steel.dev` **and** `steel.dev` on the **ownable** terms in `config.json` → `rank_keywords` (not head terms — Steel won't displace Wikipedia/official docs on "selenium", so tracking it wastes money). Prints rank changes vs last month. If you hit `40200 Payment Required`, the DataForSEO balance is exhausted — stop, tell the user to top up at app.dataforseo.com, and note in the report that rank tracking was partial.

### Phase 3 — Technical SEO audit

```bash
node .claude/skills/seo/scripts/tech-audit.mjs
```
Fetches every page in `config.json` → `key_pages`, checks status, title length, description length, canonical correctness, JSON-LD presence, accidental `noindex`, and whether each P0 page's **title still carries its target intent phrase** (`target_any`). Prints: which P0 titles are **still generic** (the title fix hasn't shipped yet — this is the main progress tracker), short/missing descriptions, and any regressions vs last month (broken page, lost canonical/JSON-LD, new noindex). No DataForSEO cost — pure live fetches.

### Phase 4 — Drift & discovery (your judgment)

The scripts can't see emerging demand or competitor moves; you can. Spend a few minutes:
- Scan the **movers** from Phase 1 — which terms are *rising*? In the fast-moving AI-agent space (computer-use, new frameworks), a spiking term is a leading indicator of a page worth building.
- For 3–5 top ownable terms, run `WebSearch` and note **SERP drift**: new competitor "vs"/alternative pages, new listicles, or a Steel page that quietly started ranking.
- Propose **new keywords/pages** to add to `config.json` next month.

### Phase 5 — Synthesize the report

Read the three script summaries + your Phase 4 notes and write `scripts/seo/pulse/reports/seo-YYYY-MM.md` (create `reports/` if missing). Use this template:

```markdown
# Steel SEO Pulse — YYYY-MM

**vs previous:** YYYY-MM · **generated:** YYYY-MM-DD

## TL;DR
2–4 sentences: did the P0 title fixes ship / move rankings? Any regressions? Biggest new opportunity?

## Demand movers
- 📈 Rising: <term> (prev → now, +X% trend) — why it matters / suggested action
- 📉 Falling: <term> …

## Rankings (ownable terms)
- Table of docs.steel.dev / steel.dev positions, bolding changes vs last month (↑ improved / ↓ declined / new / dropped).
- Note if rank tracking was partial due to DataForSEO balance.

## Technical health
- Title optimization progress: X/N P0 pages now optimized; still-generic list (with URLs).
- New regressions (broken pages, lost canonical/JSON-LD, new noindex) — or "none."
- Description fixes still owed (Phase 3 flags short/missing meta descriptions).

## Drift & discovery
- New competitor pages / SERP changes observed.
- Emerging keywords to add to tracking next month.

## Recommended actions this month
3–6 concrete, prioritized items (impact × effort), tagged docs vs marketing.
```

Keep it tight and skimmable — the reader is busy. Lead with what changed, not a re-explanation of the basics.

## The prioritization framework (reuse when recommending actions)

When the report calls for new work, rank opportunities by **impact × effort**, and use the lenses from the original `SEO-OPPORTUNITIES.md`:
- **Volume × CPC × momentum** (Phase 1 data) for demand.
- **Intent × rankability**: prefer *informational / problem-solving / framework-tutorial / comparison* queries (docs can own these) over pure buyer/pricing queries.
- **Existing-asset leverage**: optimizing a page Steel already has (e.g. a generic-titled integration page behind a 110k/mo term) beats building from scratch.
- **Ownership**: buyer/pricing/comparison-landing intent → **steel.dev marketing**; tutorial/concept/troubleshooting/migration intent → **docs.steel.dev**. Don't recommend docs pages for things the marketing site must own.

## Config & maintenance

All tracked keywords, key pages, and competitors live in `.claude/skills/seo/config.json`. To maintain tracking quality:
- Add newly-discovered ownable terms to `tracked_keywords` (and `rank_keywords` if worth tracking position).
- Add a `key_pages` entry (with `target_any` = the intent phrase the title should carry) whenever a new high-value page is published, so the audit tracks whether its title gets optimized.
- Remove terms that have gone stale.

## Cost awareness

- **Volumes**: ~$0.02/run (45 keywords, batched 25/call). Negligible — run freely.
- **SERP ranks**: ~$0.05–0.10/keyword → ~$2–3 for the full `rank_keywords` set. This is the costly phase and the account balance is finite. Use `--limit`, and if you see `40200`, stop and flag it. If budget is a recurring constraint, trim `rank_keywords` to the ~10 terms that matter most.
- **Tech audit**: free (live fetches only).

If DataForSEO is unavailable (not verified, or balance exhausted), you can still run Phase 3 (free) and do a qualitative Phase 4 via `WebSearch` — note the gap in the report rather than skipping the whole pulse.
