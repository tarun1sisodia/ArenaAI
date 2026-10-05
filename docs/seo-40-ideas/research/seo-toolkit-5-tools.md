# The 5-Tool SEO Kit — SK Baghel / ArenaAI
**Created:** 2026-10-06 · **For:** the 40-idea SEO implementation (items 1–40)
Each tool has one job: analyze, find, or debug. Run them in this order for any new page or keyword.

## T1 — Page Audit Skill (ANALYZE: a page's on-page SEO + competitive position)
- **What:** `~/workspace/skills/page-audit/SKILL.md`
- **Use when:** auditing any live page (ours or a competitor's) — route page, fleet page, guide.
- **How:** give it one URL; it fetches the page, IDs the primary keyword, Googles it, reads the top-3 competitors, and scores 7 dimensions (information gain, semantic depth, E-E-A-T, structure, technical on-page, engagement, conversion) with rewritten title/meta/H1.
- **Output:** audit report → feeds the "top 5 quick wins" per page.
- **Limitation:** no GSC data — can't weight by impressions; use prominence + severity instead.

## T2 — SERP Probe (FIND: real search language — autocomplete, PAA, related searches)
- **What:** live browser task on google.co.in (India, signed out) + `browser.search`
- **Use when:** keyword discovery (ideas 1–3, 10).
- **How:** the alphabet trick — type `"delhi to agra taxi a"` … `"z"`, note every suggestion; expand every People Also Ask box; copy bottom-of-page related searches; mine TripAdvisor/Quora/Reddit/FB groups via search for real traveler questions.
- **Output:** raw suggestion lists → cleaned keyword master list.
- **Limitation:** suggestions reflect national + personalization-free baseline; verify against Keyword Planner for volume.

## T3 — Sitemap Inspector (FIND + DEBUG: what competitors built / what's in our index)
- **What:** `curl` + small parsers over `/sitemap.xml`, `/wp-sitemap.xml`, `/sitemap_index.xml`, `/robots.txt`
- **Use when:** competitor research (idea 8), pruning thin pages (idea 32), validating our own sitemap.
- **How:** fetch competitor sitemaps → count URLs, extract URL patterns (route matrix, seater series, locality pages) → copy the *structure*, never the copy. For our site: diff sitemap vs live routes, flag orphan/thin URLs for noindex.
- **Output:** competitor page-inventory tables; our prune list.

## T4 — Demand Lens (ANALYZE: which phrases actually have demand + seasonality)
- **What:** Google Trends (live browser, no login) + Google Keyword Planner (needs Tarun's Google Ads account)
- **Use when:** ideas 6–7 — comparing "delhi to agra taxi" vs "agra to delhi taxi", spotting wedding-season/Holi/winter-fog seasonality.
- **How:** Trends compare view, 12-month + 5-year, "rising" related queries; Planner for absolute volume + CPC (proxy for buying intent).
- **Output:** prioritized keyword tiers (build now / later / skip).
- **Limitation:** Planner needs Tarun's login — **blocked until he grants it.**

## T5 — Site Crawler (DEBUG: broken links, thin pages, crawl waste)
- **What:** Python script over our sitemap + live pages (replaces the desktop-only Rusty SEO on this VM)
- **Use when:** idea 32 (prune thin route pages), broken-link fixes, `/book?from=X&to=Y` crawlable-URL cleanup.
- **How:** fetch every sitemap URL → status code, word count, title/H1 presence, internal-link count → flag: 404s, <300-word thin pages, duplicate titles, parameter URLs.
- **Output:** crawl report CSV → prune/noindex/fix list.
- **Script:** `~/workspace/seo/crawl_site.py` (to be built in week 1).

## Tool → idea map
| Tool | Ideas served |
|---|---|
| T1 Page Audit | 25–28, 30 (page-level fixes), 40 (monthly refresh) |
| T2 SERP Probe | 1, 2, 3, 5, 10 |
| T3 Sitemap Inspector | 8, 32 |
| T4 Demand Lens | 6, 7 |
| T5 Site Crawler | 30, 32, debug |

## Blocked / needs Tarun
- **T4 Planner half:** Google Ads account access (idea 6).
- **T1 weighting:** Search Console read access (idea 9) — needed to find positions 8–30.
- **T2 source gold:** his WhatsApp/call/email customer questions (idea 4) — no competitor has this.
