# Item 8 — Competitor Sitemap Research (T3 Sitemap Inspector)
**Date:** 2026-10-06 · **Status:** ✅ patterns extracted

## URL-pattern inventory (structure only — never copy their copy)

### Rinocab (rinocab.com) — ~501 URLs in page-sitemap.xml alone, Yoast index
- Pattern A (seater series): `/{n}-seater-tempo-traveller-on-rent-in-{city}/` (12/14/16/18/20/22/24/26/28/30)
- Pattern B (hub): `/outstation-tempo-traveller-on-rent-per-kilometer-in-{city}/` — full price table
- Takeaway: template × (sizes × cities). Each page ~600–900 words + price table + 5 FAQs.

### 24cabservice (24cabservice.com) — Yoast index, page-sitemap lastmod 2026-10-05 (actively maintained)
- `taxi-service-in-{city}/` (mathura, jaipur, rajasthan, noida, ghaziabad, gurgaon, aligarh, lucknow, varanasi, chandigarh…)
- `{from}-to-{to}-taxi-hire/` (delhi-to-mathura, delhi-airport-to-agra, delhi-to-khatu-shyam-ji…)
- `taxi-service/{from}-to-{to}/` (agra-to-gurgaon, agra-to-ghaziabad, agra-to-delhi)
- `{yatra}-by-tempo-traveller-in-{city}/` (chardham-yatra-…)
- `car-rental/{city}/`
- Junk observed: `/example-i/`, `/demo-2/` … `/demo-11/` — leftover template pages still indexed (their hygiene gap; we avoid this).
- Takeaway: **destination×vehicle matrix** + city-service pages + yatra pages. Active publishing (Oct 2026).

### SP Taxi (sptaxiservice.com) — ~1,000 URLs per sitemap file, 10+ files = ~10,000+ pages
- Single pattern: `/{from}-to-{to}-taxi/` — exhaustive India city-pair matrix (auli-to-badrinath, aonla-to-kainchi-dham…)
- Junk observed: `/ayodhya-tomuzaffarnagar-to-taxi/` — programmatic generation artifacts leak into the index.
- Takeaway: brute-force programmatic scale works for them, but quality is thin. **We do NOT chase 10k pages** — Google's starter guide says thin programmatic pages waste crawl budget (idea 32: keep 30–60 strong routes).

## Our sitemap (live, 2026-10-06) — 55 URLs, clean structure
- `/{from}-to-{to}-taxi/` — agra-to-delhi, delhi-to-agra, agra-to-jaipur, delhi-to-jaipur, agra-to-gwalior, agra-to-lucknow, agra-to-mathura
- `/vehicles/{sedan,ertiga,innova-crysta,tempo-traveller,urbania}/`
- `/packages/{taj-mahal-sunrise-tour,agra-sightseeing,agra-unhurried,mathura-vrindavan,gatimaan-express-agra-tour,golden-triangle,same-day-prem-mandir-tour}/`
- `/transfers/{delhi-igi-oneway,agra-to-airport-noida,agra-cantt-to-agra-airport}/`
- `/monuments/{taj-mahal,agra-red-fort,fatehpur-sikri,itmad-ud-daulah-baby-taj,mehtab-bagh}/`
- `/local-packages/{knowledge-parak-2-sightseeing,agra-extended-city-tour}/`
- 14 SEO landing slugs (delhi-to-agra-taxi, tempo-traveller-on-rent-agra, 12/16/18/20/24-seater…, same-day-agra-tour-from-delhi, taj-mahal-taxi-service, agra-fatehpur-sikri-one-day-tour)
- robots.txt: clean (disallows /book.html, /404.html, /design-guide/)
- **Already live → ideas 11, 13, 14, 15, 16, 19 partially covered.** Gap analysis vs the 40 ideas: see keyword master list.

## ⚠️ Data-quality flags found in our sitemap
1. `knowledge-parak-2-sightseeing` — "parak" is likely a typo for "park". Fix slug or confirm name.
2. Live sitemap (55 URLs) is AHEAD of local main's generator (was 39) — live deploys from another path; keep this in mind for the repo implementation phase.
