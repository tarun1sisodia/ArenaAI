# 40 SEO Ideas — 1-by-1 Implementation Plan
**Site:** agraskbagheltourandtravels.com (SK Baghel Tour & Travels / ArenaAI)
**Started:** 2026-10-06 · **Method:** implement in order, 1 → 40, across two weeks
**Governing doc:** [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) — every item below follows it: people-first unique content, descriptive URLs, good anchor text, crawlable pages, title/description control, no duplicate content, no ranking-date promises.
**Tools:** the 5-tool kit — `~/workspace/seo/seo-toolkit-5-tools.md`

## Progress legend
`⬜` not started · `🔄` in progress · `✅` done (result file linked) · `⛔` blocked (needs Tarun)

---

## A. Finding keywords (Week 1, days 1–3)

| # | Idea | Tool | Action | Result file | Status |
|---|---|---|---|---|---|
| 1 | Autocomplete alphabet trick | T2 SERP Probe | Browser task collecting a–z suggestions for 9 seed phrases | `seo-kw-01-autocomplete.md` | 🔄 |
| 2 | People Also Ask boxes | T2 SERP Probe | Same browser task — expand all PAA for 2 queries | `seo-kw-02-paa.md` | 🔄 |
| 3 | Related searches | T2 SERP Probe | Same browser task — bottom-of-page lists | (folded into kw-02) | 🔄 |
| 4 | Customers' own questions (WhatsApp/calls/email) | — | **Tarun:** export/share real customer questions | `seo-kw-04-customer-questions.md` | ⛔ |
| 5 | Hinglish + Hindi phrases | T2 SERP Probe | Included in alphabet task (seeds 8–9); expand after | `seo-kw-05-hinglish.md` | 🔄 |
| 6 | Google Keyword Planner | T4 Demand Lens | **Tarun:** Ads account access needed | `seo-kw-06-planner.md` | ⛔ |
| 7 | Google Trends | T4 Demand Lens | Browser task: 5 terms, 12-mo + 5-yr, seasonality, rising queries | `seo-kw-07-trends.md` | 🔄 |
| 8 | Competitor sitemaps | T3 Sitemap Inspector | Fetched rinocab / 24cabservice / sptaxiservice sitemaps → URL-pattern inventory | `~/workspace/seo/seo-kw-08-competitor-sitemaps.md` | ✅ |
| 9 | Search Console positions 8–30 | T1 Page Audit | **Tarun:** GSC read access needed | `seo-kw-09-gsc.md` | ⛔ |
| 10 | Forums/groups (TripAdvisor, Quora, Reddit, FB) | T2 SERP Probe | TripAdvisor threads mined; Reddit/Quora/FB expansion pending | `~/workspace/seo/seo-kw-10-forums.md` | ✅ |

**Consolidation:** all of the above merge into → `seo-keyword-master-list.md` (tiered: build now / later / skip)

## B. Page and content ideas (Week 1–2, days 4–10)

Each page gets: URL slug, title (formula #25), meta description (#26), H1, full body copy, fare table with "last updated" (#24), FAQs (#24), internal links (#27), schema (#31). Copy lives in result files; repo wiring on `feat/seo-40-ideas` branch.

| # | Idea | Pages to build | Result file | Status |
|---|---|---|---|---|
| 11 | Reverse routes | `/agra-to-delhi-taxi` exists — add `/delhi-to-agra-taxi` as its own page | `seo-copy-11-reverse-routes.md` | ⬜ |
| 12 | Route + vehicle + fare | Delhi→Agra × (Dzire, Ertiga, Innova Crysta, Tempo Traveller) fare pages | `seo-copy-12-route-vehicle-fare.md` | ⬜ |
| 13 | Airport/station transfers | Delhi airport, Agra Cantt, Agra Fort, Idgah, Mathura Jn transfer pages | `seo-copy-13-transfers.md` | ⬜ |
| 14 | Same-day trips | Delhi→Agra same-day, Agra→Fatehpur Sikri | `seo-copy-14-sameday.md` | ⬜ |
| 15 | Golden Triangle packages | 3N/4D Delhi–Agra–Jaipur package page | `seo-copy-15-golden-triangle.md` | ⬜ |
| 16 | Vehicle pages | Dzire / Ertiga / Innova Crysta / Tempo Traveller "on rent in Agra" | `seo-copy-16-vehicles.md` | ⬜ |
| 17 | Taxi near Taj Mahal / hotel pickup | Taj Ganj pickup page | `seo-copy-17-taj-ganj.md` | ⬜ |
| 18 | Seasonal pages | Winter fog, Holi (Mathura-Vrindavan), Diwali, wedding season | `seo-copy-18-seasonal.md` | ⬜ |
| 19 | Information guides | Taj timings, Friday closure, ticket prices, best time to visit | `seo-copy-19-guides.md` | ⬜ |
| 20 | Comparison pages | Delhi→Agra: car vs Gatimaan train vs bus | `seo-copy-20-compare.md` | ⬜ |
| 21 | Pilgrimage routes | Vrindavan, Mathura, Govardhan, Khatu Shyam, Ajmer/Pushkar, Haridwar | `seo-copy-21-pilgrimage.md` | ⬜ |
| 22 | Day trips from Agra | Fatehpur Sikri, Keoladeo, Chambal safari, Sikandra, Mehtab Bagh | `seo-copy-22-daytrips.md` | ⬜ |
| 23 | Group/wedding/corporate | 3 pages | `seo-copy-23-group.md` | ⬜ |
| 24 | Fare tables + FAQs | Template applied to every page above (last-updated date, real-answer FAQs) | (in each copy file) | ⬜ |

## C. On-page + technical quick wins (Week 1, days 5–7)

| # | Idea | Tool | Action | Status |
|---|---|---|---|---|
| 25 | Title formula: keyword + benefit + brand | T1 | Apply to all new + existing route pages; verify vs current titles | ⬜ |
| 26 | Meta descriptions (price + promise + CTA) | T1 | Write per page; ≤155 chars | ⬜ |
| 27 | Hub-and-spoke internal links + breadcrumbs | T5 | Hub "Agra Outstation Taxi" ↔ route pages; BreadcrumbList schema | ⬜ |
| 28 | Original photos, descriptive alt + filenames | — | Shot list + alt-text/filename convention (`innova-crysta-agra-taj-mahal.webp`) | ⬜ |
| 29 | Sticky click-to-call + WhatsApp | repo | Verify on all templates (mobile-first) | ⬜ |
| 30 | Speed: WebP, caching, Cloudflare, LCP < 2.5s | T5 | PageSpeed check on new templates | ⬜ |
| 31 | Schema: TravelAgency/LocalBusiness + BreadcrumbList + TouristTrip | T1 | JSON-LD per page type | ⬜ |
| 32 | Prune thin route pages (keep 30–60, noindex rest) | T3+T5 | Crawl our sitemap → thin/duplicate list → noindex candidates | ⬜ |

## D. Local + off-page (Week 2, days 11–13)

| # | Idea | Action | Result file | Status |
|---|---|---|---|---|
| 33 | Google Business Profile | **Tarun:** claim/complete profile — photos, services, hours, weekly posts, Q&A | `seo-offpage-33-gbp-checklist.md` | ⛔ |
| 34 | Review system | WhatsApp review-link flow after each trip; reply-to-every-review SOP (no incentives) | `seo-offpage-34-reviews.md` | ⬜ |
| 35 | Local citations | JustDial, Sulekha, IndiaMART, TradeIndia, TripAdvisor — identical NAP (+91 97628 17598) | `seo-offpage-35-citations.md` | ⬜ |
| 36 | Partner referrals | Taj Ganj hotels/guesthouses/guides outreach list + link-ask template | `seo-offpage-36-partners.md` | ⬜ |
| 37 | Video + social | Reels/YouTube shot list: Delhi→Agra drive, Taj sunrise pickup, driver intros | `seo-offpage-37-video.md` | ⬜ |
| 38 | Press + travel blogs | Guest-post pitch list: Agra/India travel sites + fare-insight angles | `seo-offpage-38-press.md` | ⬜ |

## E. Test + improve (Week 2, day 14)

| # | Idea | Action | Result file | Status |
|---|---|---|---|---|
| 39 | Small Google Ads test (optional, paid) | **Tarun's call:** 3–5 day search-ads test to learn which phrases convert | `seo-test-39-ads-plan.md` | ⛔ |
| 40 | Monthly loop | GSC review → refresh positions 8–30 → track 10 target phrases → competitor watch | `seo-test-40-monthly-loop.md` | ⬜ |

---

## Blocked on Tarun (needed to unblock 4, 6, 9, 33, 39)
1. **Customer questions** (idea 4) — forward real WhatsApp/call/email questions travelers ask.
2. **Google Ads access** (idea 6) — for Keyword Planner volumes.
3. **Search Console access** (idea 9) — positions 8–30 to prioritize refreshes.
4. **Google Business Profile** (idea 33) — claim/verify; then I build the posting routine.
5. **Ads test budget decision** (idea 39) — optional paid test.

## Repo note
Implementation branch: `feat/seo-40-ideas` (to be cut from local main). Nothing pushed — Tarun pushes from his machine (standing rule). Uncommitted WIP on main (`react/index.html`, sitemap/prerender scripts, App/ServerApp) left untouched.
