# SEO 40-Ideas Implementation — `feat/seo-40-ideas-2026-10`
**Branch:** `feat/seo-40-ideas-2026-10` (cut from local `main` @ d53fade)
**Date:** 2026-10-06 · **Governing doc:** [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

## What this branch contains (merge-ready)

### Code — 8 new SEO landing pages (ideas 11–24)
| Slug | Idea | Key fare (published) |
|---|---|---|
| `/en/delhi-airport-to-agra-taxi/` | 13 airport transfers | sedan ₹3,499 … urbania ₹14,000 |
| `/en/delhi-to-agra-sedan-taxi-fare/` | 12 route+vehicle+fare | one-way ₹3,499, ₹10/km |
| `/en/delhi-to-agra-ertiga-taxi-fare/` | 12 | ₹14/km |
| `/en/delhi-to-agra-innova-crysta-taxi-fare/` | 12 | ₹18/km |
| `/en/delhi-to-agra-tempo-traveller-fare/` | 12 | ₹25/km |
| `/en/agra-to-vrindavan-taxi/` | 21 pilgrimage | tour ₹4,200 |
| `/en/delhi-to-agra-cab-vs-train-vs-bus/` | 20 comparison | from ₹3,499/car |
| `/en/taxi-near-taj-mahal-agra/` | 17 Taj Ganj pickup | from ₹1,900 |

Every fare is published in `react/src/data/prices.ts` or `react/src/data.ts` — nothing invented (build guardrail fails on TBD text).

### Code — on-page/technical (ideas 24–27, 29, 31–32)
- **25/26:** `react/src/data/seoLandingMeta.ts` — single source of truth for all 22 landing-page titles (keyword + benefit + brand, ≤60 chars) and descriptions (price + promise + CTA, ≤155 chars). Used by `getSeo()` in both `App.tsx` and `ServerApp.tsx`.
- **24:** every FAQ now has a **real answer** grounded in published fares and fare-engine invariants (300 km/day minimum, 28% advance, 24-hr 100% cab refund, Yamuna toll included one-way). Fare tables carry "Fares last updated October 2026."
- **27:** visible breadcrumb nav (Home / hub / page) + `BreadcrumbList` schema; hub-and-spoke related links on every page (routes hub `/en/routes/`, fleet hub `/en/fleet/`).
- **29:** sticky call + WhatsApp hero CTAs on every landing page (chrome suite is LOCKED — untouched).
- **31:** `FAQPage` JSON-LD added alongside `LocalBusiness` + `BreadcrumbList` in the `@graph`.
- **32:** sitemap denylist guard already on `main` (WIP); prune candidates documented in `prune-list.md`.

### Files changed
- `react/src/data/seoLandingSlugs.ts` — +8 slugs (sitemap + prerender pick them up automatically)
- `react/src/data/seoLandingMeta.ts` — NEW, 22 title/description pairs
- `react/src/pages/SeoLandingPage.tsx` — rewritten pageModel: real FAQs, FAQ schema, breadcrumbs, related links
- `react/src/app/ServerApp.tsx`, `react/src/app/App.tsx` — getSeo reads SEO_LANDING_META
- `react/public/sitemap.xml` — regenerated (47 URLs)

### Verified
- `npx tsc --noEmit` ✅ · `npm run customer:build` ✅ (57 pages prerendered, SEO guardrail `assertBuildSafeSeo` passed on every build) · `npm run customer:seo` ✅

### Docs in this folder
- `research/` — keyword research files (autocomplete, PAA, Trends, competitor sitemaps, forums)
- `offpage-playbook.md` — ideas 33–38 (GBP, reviews, citations, partners, video, press)
- `monthly-loop.md` — idea 40 tracker
- `photo-shot-list.md` — idea 28 (original photos + alt/filename convention)
- `prune-list.md` — idea 32 (noindex candidates + method)

### NOT in this branch (needs Tarun)
- Ideas 4 (customer WhatsApp questions), 6 (Keyword Planner — needs Ads login), 9 (GSC positions 8–30), 33 (GBP claim), 39 (Ads test budget)
- Pre-existing uncommitted WIP on this branch's working tree (`react/index.html`, sitemap/prerender scripts, App/ServerApp price-titles, InstantRouteCalculator) — left untouched, not committed here
- Live deploys from another path; local sitemap (47) trails live (55) — reconcile before/after merge

## Merge notes
- Nothing here touches LOCKED components (chrome, tokens, fare engine, booking flow, reviews marquee, homepage).
- After merge: deploy, then "Request indexing" the 8 new URLs in Search Console; add them to the rank tracker (see `monthly-loop.md`).
