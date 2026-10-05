# Prune List (idea 32) — keep 30–60 strong routes, noindex the rest
**Rule (Google starter guide):** don't waste crawl budget on thin/duplicate URLs. Our sitemap denylist (`SITEMAP_DENYLIST` in `react/scripts/generate-sitemap.ts`) already blocks test/QA slugs from ever reaching the sitemap.

## Method (T5 Site Crawler — run quarterly)
1. Fetch every sitemap URL → record status, word count, title, H1.
2. Flag: 404s (fix or 301), <300 words with no fare table (thin), duplicate titles across URLs.
3. For each flagged URL decide: **improve** (add real content), **noindex** (keep for users, drop from Google), or **301** (merge into the canonical route page).

## Current candidates (from the 2026-10-06 sitemap review)
- `/book?from=X&to=Y` parameter URLs — crawlable per the Oct audit; decide canonical vs noindex (robots currently only blocks `/book.html`).
- `knowledge-parak-2-sightseeing` — probable typo slug ("parak" → "park"); fix the slug with a 301, don't leave both live.
- Any route-catalog page rendering the generic fallback copy with no published fare — improve with real fares or noindex until fares are confirmed.

## Do NOT prune
The 22 SEO landing slugs (all have unique titles, fare tables, real FAQs and FAQ schema as of this branch), vehicle pages, package pages, monument guides.
