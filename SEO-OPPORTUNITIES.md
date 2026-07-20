# SEO Opportunities — docs.steel.dev

**Date:** 2026-07-18 · **Data:** live SERP research + DataForSEO Google Ads search-volume/CPC (US) + codebase audit

> **Bottom line:** Steel *already owns the exact pages* that map to the highest-volume terms in the browser-automation/agent space (selenium 110k, playwright 74k, langgraph 33k, puppeteer 27k, crewai 14.8k, browser-use 8.1k…) but **titles them generically** (`"Browser Use | Steel Docs"`), so it captures almost none of that demand. **Fixing titles/H1s/meta on ~15 existing pages is the single highest-ROI action** — low effort, huge existing assets. Then build ~6 new BOFU pages for high-intent, low-competition terms (anti-detection, Cloudflare bypass, captcha hub) where the SERP is winnable.

---

## Methodology & data sources

- **Quantitative:** DataForSEO `keywords_data/google_ads/search_volume/live` — real monthly volume, CPC, paid competition for 153 keywords (files: `scripts/dfs-keywords-seed.json`, `scripts/dfs-keywords-findings.json`). Note: the DataForSEO **Labs** module (organic difficulty) is not on this plan; `competition_index` is *paid* competition, not organic difficulty. Google Ads volume is US-only and **bucketed/under-reports low-volume dev terms** — entries of `10` or `—` mean "below ads threshold / no advertisers," **not zero demand**. Treat numbers as directional and combine with SERP evidence below.
- **Qualitative / SERP:** 3 deep research lenses (commercial, framework, problem-solving) ran live Google searches and inspected ranking pages (52 grounded findings, file: `scripts/recon-salvage.json`). Competitor/scraping/verification lenses did not complete (run was killed); their signals are partially folded in from the completed lenses + spot checks.
- **Technical:** live `curl` of 6 representative pages (`<title>`, meta description, canonical, JSON-LD, H1) + sitemap/robots + full codebase audit.
- **Reusable tool:** `scripts/seo/dfs-keywords.mjs` — pull volumes for any keyword list (reads `.env`). Append keywords to `scripts/seo/keywords-*.txt` and re-run.

---

## Strengths (don't break these)

- **AI/answer-engine visibility is already best-in-class:** `robots.txt` explicitly allows GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended, etc. Plus `llms.txt` + `llms-full.txt`. Steel is unusually well-placed for LLM/AEO traffic.
- **FAQ JSON-LD is already on integration pages** (rich-snippet eligible) — e.g. `/integrations/browser-use` ships a real `FAQPage`. Live-confirmed.
- **Per-page canonicals are correct**; dynamic `sitemap.xml` (149 URLs, changelog detail correctly excluded) with git-based `lastModified`.
- **Content rhythm is strong:** code-first, recipe-heavy cookbook + topical hubs (`/cookbook/topics/*`). This is exactly the format Google rewards for dev queries.
- **Topical-hub scaffolding exists** (`/cookbook/topics/agents`, `browser-automation`, `playwright`, `computer-use`, `captchas`, …) — ready to be promoted into pillars.

---

## Priority 0 — Optimize existing high-volume assets (quick wins, highest ROI)

These pages exist and rank's worth of demand sits behind them, but their `<title>`/H1/meta don't phrase-match search intent. **Effort: ~1–2 days of copy changes. No new pages.**

| Page | Current title | Suggested title (targets) | Volume/mo behind it |
|---|---|---|---|
| `/integrations/selenium` | `Selenium \| Steel Docs` | **Run Selenium on Steel — a Selenium Grid alternative** | selenium **110k**, selenium grid 590, selenium alternative 210 ($17 CPC) |
| `/integrations/playwright` | `Playwright \| Steel Docs` | **Run Playwright on Steel Cloud Browsers** | playwright **74k**, playwright docker 320, playwright cloud 50 |
| `/integrations/langgraph` | `LangGraph \| Steel Docs` | **Build a LangGraph Browser Agent on Steel** | langgraph **33k**, langgraph browser agent |
| `/integrations/puppeteer` | `Puppeteer \| Steel Docs` | **Connect Puppeteer to Steel Cloud Browsers (CDP)** | puppeteer **27k**, puppeteer stealth 110, puppeteer as a service |
| `/integrations/crewai` | (generic) | **CrewAI Browser Agent — web browsing in crews** | crewai **14.8k**, crewai browser |
| `/integrations/claude-agent-sdk` | (generic) | **Claude Agent SDK + a Cloud Browser** | claude agent sdk **9.9k** |
| `/integrations/browser-use` | `Browser Use \| Steel Docs` | **Browser Use on Steel — run browser-use in the cloud** | browser use **8.1k**, browser use cloud 140, browser use alternative 50 |
| `/integrations/pydantic-ai` | (generic) | **Build a Pydantic AI Browser Agent** | pydantic ai **6.6k** |
| `/integrations/ai-sdk` | (generic) | **Browser Tool for the Vercel AI SDK** | vercel ai sdk **6.6k** |
| `/integrations/stagehand` | (generic) | **Run Stagehand on Steel (cloud or self-hosted)** | stagehand **5.4k**, stagehand docker/tutorial |
| `/integrations/openai-agents-sdk` | (generic) | **OpenAI Agents SDK + a Cloud Browser** | openai agents sdk 5.4k (**$42.80 CPC**) |
| `/overview/agent-traces/overview` | (generic) | **Agent Observability — Trace, Debug & Replay Browser Agents** | agent observability 320 (**$51.93 CPC**), browser observability |
| `/overview/stealth/captcha-solving` | `Captcha Solving` | **CAPTCHA Solving API — reCAPTCHA, Turnstile & Cloudflare** | captcha solving api, 2captcha alternative, cloudflare turnstile solver 30 |
| `/overview/stealth/proxies` | (generic) | **Proxies & Proxy Rotation for Browser Automation** | proxy rotation 590 (**$25 CPC**), rotating proxies 590, residential proxies **12.1k** |
| `/cookbook/scrape` | `Scrape a page to Markdown…` | **Scrape JavaScript-Rendered Pages to Markdown with Steel** | scrape javascript rendered page, web scraping javascript 390 |

**Per page, also:** make the **H1 carry the target phrase** (currently H1 is just the framework name, e.g. `Browser Use`), rewrite the meta description to lead with the target phrase + a differentiator (stealth / proxies / CAPTCHA / managed infra), and add a `"Why run X in the cloud"` section near the top. Add internal links: integration ↔ its cookbook recipe ↔ relevant topic hub.

---

## Priority 0/1 — New flagship BOFU pages (high intent, winnable SERPs)

These are *problem-solving* queries where a docs page can dominate — the SERPs are currently won by scattered listicles/SO/Reddit, not authoritative vendor docs.

| New page | Targets | Volume/mo | Notes |
|---|---|---|---|
| `/overview/stealth/anti-detection` (hub) | **browser fingerprinting**, headless browser detected, navigator.webdriver, undetected chromedriver | **1,300** + 390 | Table of detection signals (UA, webdriver, plugins, canvas/WebGL, permissions) → Steel mitigation. Becomes the hub for the whole stealth cluster. |
| `/cookbook/topics/cloudflare-bypass` | cloudflare bypass, cloudflare turnstile solver, bypass cloudflare | **260** + 30 | Flagship BOFU. Why CF blocks → Steel's layered approach → runnable recipe. HowTo JSON-LD. |
| `/cookbook/topics/captchas` (hub) | captcha solving api, recaptcha v2 solver, 2captcha alternative | 10–20 | Lists each supported type with code (reCAPTCHA v2/v3, Turnstile, image-to-text, AWS WAF). Cross-links existing recipes. |
| `/cookbook/topics/headless-browser` (hub) | headless chrome, headless browser, how to run headless chrome in the cloud | **1,000** + 480 | Consolidate the `headless-chrome` recipe + self-hosting quickstarts. |
| **"Undetected ChromeDriver alternative"** migration | undetected chromedriver | **390** | Migrate from `undetected-chromedriver` to a Steel Selenium/CDP session. Pairs with `/integrations/selenium`. |
| `/cookbook/topics/agents` → pillar | **agentic browser** (1,300), browser agent (5,400), cloud browser for ai agents | high | Promote existing hub into a "Cloud Browser for AI Agents" pillar linking all 30+ integrations. |
| **"browser-use vs Stagehand"** comparison | browser-use vs stagehand | (unowned) | No one owns this head-to-head. Side-by-side code → link both integrations. |

---

## Priority 1 — Concept / glossary pages (top-of-funnel, very low competition)

| New page | Targets | Volume/mo |
|---|---|---|
| What is a headless browser | what is a headless browser | 390 |
| What is browser fingerprinting | what is browser fingerprinting | 260 |
| How proxies work for scraping / proxy rotation explainer | proxy rotation, rotating proxies | 590 ($25 CPC) |
| What is a browser session | what is a browser session | 20 |

---

## Priority 1 — Comparison / migration pages (docs-owned, high converting)

| Page | Targets | Volume/mo | Note |
|---|---|---|---|
| **Steel vs Selenium Grid** | selenium grid, selenium grid alternative, selenium alternative | 590 / 210 ($17) | Docs-owned — technical migration. |
| **Beyond puppeteer-extra-stealth** (section on `/integrations/puppeteer`) | puppeteer stealth, puppeteer extra stealth | 110 / 30 | Steel as managed stealth layer. |
| **Playwright headless detection** guide | playwright headless detection, playwright stealth | (590 stealth) | Links stealth + playwright. |
| **Migrate from Browserless** (cookbook recipe) | browserless alternative | 20 | API/session migration snippets. |

---

## Priority 2 — Marketing-owned (flag for the steel.dev team, **not docs**)

These are buyer/pricing/comparison-intent — `docs.steel.dev` shouldn't own them, but they're high-value and some Steel blog posts already hint at them:

- `/alternatives/browserbase` — browserbase **6,600/mo**, browserbase alternative 90 ($13 CPC). (A `steel-vs-browserbase` blog post already exists.)
- `/alternatives/browserless`, `/alternatives/apify` (apify alternative 110, **$36 CPC**), `/alternatives/hyperbrowser` (hyperbrowser 1,000, $26 CPC), `/alternatives/2captcha`.
- **"Playwright Cloud"** and **"Puppeteer as a Service"** landing pages (commercial head terms).
- **"Best scraping api"** (30/mo but **$46 CPC**) + `best web scraping api` (110) listicle — refresh annually.
- **Agent observability** ($52 CPC) — if Steel positions a product feature, marketing should mirror the docs page.
- Ensure `steel.dev` has a public **pricing page** ("cloud browser pricing"/"headless browser cost") and link it from `/overview/pricinglimits`.

Docs' supporting role for these: keep an objective technical-capabilities comparison in `/overview` that the marketing pages can deep-link to (E-E-A-T signal).

---

## Technical fixes

| # | Issue | Severity | Effort | Fix |
|---|---|---|---|---|
| 1 | Generic, non-targeted `<title>`/H1 on integration & key pages (see P0 table) | **High** | Low | Rewrite titles/H1/descriptions to phrase-match demand. |
| 2 | Only `FAQPage` JSON-LD present; missing `BreadcrumbList`, `TechArticle`/`HowTo`, `SoftwareApplication` | Medium | Low/Med | Add `BreadcrumbList` site-wide; `TechArticle` (datePublished/Modified, author) on recipes/integrations; `HowTo` on step-by-step recipes. |
| 3 | Changelog posts are `noindex` (35 posts) | Medium | Low | Reconsider — indexed changelog posts capture feature-name long-tail ("steel [feature]"). At minimum index the highest-signal ones. (Trade-off: keep thin/low-value ones noindex.) |
| 4 | Internal-linking depth: integration ↔ cookbook ↔ topic hub not consistently cross-linked | Medium | Low | Add "related" links blocks; ensure no ORFan pages. |
| 5 | Meta-description inconsistency: `lib/metadata.ts` references `/images/logo.png` (800×600) vs layout's `/og` route (1200×630) | Low | Low | Standardize on the dynamic OG route; ensure every page has a unique OG. |
| 6 | Topic hubs exist but aren't promoted to **pillars** with canonical aggregation | Medium | Med | Promote `/cookbook/topics/agents`, `headless-browser`, `captchas`, `cloudflare-bypass` into authoritative pillars that link out and back. |
| 7 | No comparison/`vs` page architecture | Medium | Med | Establish a `/integrations/.../vs-...` or `/cookbook/topics/...-vs-...` pattern. |

---

## 90-day roadmap

**Days 0–14 — Quick wins (P0):**
1. Rewrite titles/H1/meta for the 15 pages in the P0 table. → verify: each title contains its primary target phrase; submit to IndexNow/GSC.
2. Add `BreadcrumbList` JSON-LD site-wide + `TechArticle` to recipes/integrations.
3. Internal-link each integration ↔ its cookbook recipe ↔ its topic hub.

**Days 14–45 — Build the BOFU flagship pages (P0/P1):**
4. Ship `/overview/stealth/anti-detection` (browser fingerprinting 1,300) + `/cookbook/topics/cloudflare-bypass` (260) + `/cookbook/topics/captchas` hub.
5. Ship `/cookbook/topics/headless-browser` hub + "undetected chromedriver alternative" migration page.
6. Promote `/cookbook/topics/agents` into the "Cloud browser for AI agents" pillar.

**Days 45–75 — Comparisons + glossary (P1):**
7. "Steel vs Selenium Grid", "browser-use vs Stagehand", Playwright-headless-detection, beyond-puppeteer-extra-stealth.
8. Glossary: "what is a headless browser", "what is browser fingerprinting", proxy-rotation explainer.
9. Reconsider changelog `noindex` for high-signal posts.

**Days 75–90 — Measure & programmatic:**
10. Re-pull volumes via `scripts/seo/dfs-keywords.mjs`; track GSC impressions/CTR/position for the P0 pages.
11. Scope programmatic SEO: one page per high-value anti-bot target / per framework "in production" guide.

**Hand off to marketing (parallel, any time):** the `/alternatives/*` and commercial landing pages in P2.

---

## Appendix — keyword volume data

Full 153-keyword volume/CPC table: **`scripts/seo/keyword-volume-table.md`**.
Raw DataForSEO JSON: `scripts/seo/dfs-keywords-seed.json`, `scripts/seo/dfs-keywords-findings.json`.
Raw research findings (52, SERP-grounded): `scripts/seo/recon-salvage.json`.

**Top demand by category (volume/mo, CPC):**

- *Framework head terms (Steel owns the pages):* selenium 110k, playwright 74k, langgraph 33k, puppeteer 27k, crewai 14.8k, claude agent sdk 9.9k, browser use 8.1k, pydantic ai 6.6k, vercel ai sdk 6.6k, stagehand 5.4k, openai agents sdk 5.4k ($43), mastra 4.4k, agno 2.9k, claude computer use 2.9k, chromiumoxide 1.9k.
- *Agentic/AI-agent:* browser agent 5.4k, agentic browser 1.3k, ai web scraping 590, ai browser agent 320 ($21), ai scraper 320 ($18), computer using agent 1k, openai computer use 320 ($51), agent observability 320 ($52).
- *Stealth/anti-bot:* residential proxies 12.1k, anti detect browser 6.6k, browser fingerprinting 1.3k ($14), proxy rotation 590 ($25), undetected chromedriver 390, cloudflare bypass 260, 2captcha 3.6k, navigator.webdriver 50.
- *Comparison (competitor-branded):* browserbase 6.6k, apify 33k, scraperapi 1.9k, scrapingbee 1.6k, browserless 1.3k, hyperbrowser 1k ($26), zenrows 880, browserbase alternative 90, apify alternative 110 ($36).
- *Category:* browser automation 720 ($15), web scraping api 2.4k ($16), web scraping 9.9k, best scraping api 30 ($46), best web scraping api 110, headless browser 1k, cloud browser 2.9k, browser as a service 40.
