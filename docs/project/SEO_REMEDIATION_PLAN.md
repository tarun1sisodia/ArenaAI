# SEO Remediation Plan — RustySEO Findings

**Project:** SK Baghel Tour & Travels / ArenaAI  
**Source audit:** RustySEO exports from the shared Drive `Client` folder, generated 2026-10-01  
**Repository:** `tarun1sisodia/ArenaAI`  
**Status:** Phase 0 complete; Phase 1 starting

## 1. Executive diagnosis

RustySEO crawled **148 URLs** and found:

- **37 indexable pages / 111 non-indexable pages** — 75% of the crawl is `noindex, nofollow`.
- **24 HTTP 4xx/5xx errors**, primarily stale URLs that are rendered as the same 404 page.
- **108 duplicate titles** and **99 duplicate descriptions**.
- **101 duplicate H1 groups** and **233 duplicate H2 groups**.
- **116 pages under 300 words** and **113 pages with low text-to-HTML ratio**.
- **130 unique URLs affected by duplicate-content groups**, including 77 booking-query variants, 25 404 variants, and 18 more content duplicates.
- **63 topic-cluster rows**, with 43 marked thin and 20 deep; many cluster URLs are stale paths outside the current canonical URL system.
- Only one internal-link opportunity was exported, from the homepage to Mathura/Vrindavan, which indicates the current linking graph is not being surfaced effectively.

The repository’s current tracked audit is better than the raw crawl in several places, but it still reports repeated title/description warnings and does not yet treat dynamic catalog URLs as a controlled SEO lifecycle.

## 2. Non-negotiable SEO rules

1. **Only canonical, useful, stable URLs may be indexable.**
2. **Booking URLs with query parameters are conversion endpoints, not landing pages.** They remain `noindex, nofollow` and must not enter XML sitemaps.
3. **404 pages must return a real 404 at the edge/server and must never be included in a sitemap.** A client-rendered 404 with a 200 response is not acceptable.
4. **A published catalog item is not automatically an SEO page.** It becomes indexable only after it passes content, metadata, media, schema, canonical, and renderability gates.
5. **Every indexable page has one canonical URL, one H1, a unique title, a unique description, meaningful copy, internal links, and relevant structured data.**
6. **Archive/unpublish removes a URL from the sitemap and returns either a 410 or a relevant 301 only when a real replacement exists.** It must not silently become a generic 200/404 shell.
7. **The backend owns commercial truth.** The frontend never invents current fares, availability, publication status, or route identity.

## 3. Ten-phase implementation roadmap

### Phase 0 — Evidence and URL inventory (complete)

**Inputs used:**

- `reference/rustyseo/SEO-Crawl-Report.pdf`
- `reference/rustyseo/RustySEO-Duplicates.xlsx`
- `reference/rustyseo/RustySEO-Cannibalization.xlsx`
- `reference/rustyseo/RustySEO-TopicClusters.xlsx`
- `reference/rustyseo/RustySEO-Internal-Link-Opportunities.xlsx`
- `seo-audits/seo-audit-2026-10-01.csv`

**Deliverables:** URL classes, canonical policy, duplicate groups, indexability rules, and acceptance metrics.

### Phase 1 — Crawl/indexing correctness (first code slice)

**Goal:** remove crawl waste and false indexable states.

- Audit `react/scripts/prerender.ts`, `react/scripts/generate-sitemap.ts`, and hosting redirects.
- Keep `/book`, `/book.html`, 404 pages, legacy aliases, and query-param booking variants out of the sitemap.
- Ensure all legacy aliases resolve to a canonical destination with a real redirect, not a rendered “Redirecting…” 200 page.
- Add an automated check that every sitemap URL has a rendered HTML file and is not `noindex`.
- Add a route-status manifest for canonical, redirect, gone, and indexable states.
- Validate deployed response codes with an HTTP crawl after deployment.

### Phase 2 — Metadata quality and uniqueness

**Goal:** eliminate missing/duplicate/overlong metadata.

- Centralize title and description generation in `react/src/components/seo/SeoHead.tsx` / `getSeo`.
- Enforce title target 45–60 characters and description target 120–155 characters.
- Create unique templates per hub, vehicle, route, package, and published catalog item.
- Add a build failure for missing title, description, canonical, or H1 on indexable pages.
- Add duplicate title/description checks across generated HTML, not only per-page syntax checks.

### Phase 3 — 404, redirects, and legacy URL cleanup

**Goal:** fix the 24 error URLs and stale RustySEO URL groups.

- Build a redirect registry for known legacy paths that have a genuine replacement.
- Return 410 for removed pages with no replacement where the deployment platform supports it.
- Never redirect unrelated stale URLs to the homepage or a generic package page.
- Add integration tests for representative RustySEO 404 URLs and legacy aliases.
- Keep redirect pages out of the XML sitemap and prevent them from being treated as indexable content.

### Phase 4 — Duplicate and cannibalization resolution

**Goal:** stop multiple URLs competing for the same intent.

- Canonical intent map for Agra routes, vehicle capacity pages, packages, local tours, and booking flows.
- Merge or redirect obsolete pages such as stale package slugs and locality-generated pages.
- Keep one primary page per search intent; use supporting pages only when their copy and intent are genuinely distinct.
- Add a duplicate-content regression report to `react/scripts/audit-seo.ts`.
- Use `rel=canonical` only for near-duplicates; do not use canonical as a substitute for removing a wrong page.

### Phase 5 — Thin-content and on-page content improvements

**Goal:** make indexable pages useful before asking Google to index them.

- Expand hubs and landing pages with original, location-specific explanations, fare context, eligibility, route constraints, FAQs, and booking guidance.
- Give each route/package/vehicle page a distinct opening paragraph, comparison details, and relevant FAQs.
- Do not mass-generate hundreds of near-identical locality pages.
- Require minimum useful content by page type, with exceptions only for utility pages that are intentionally noindex.
- Keep generated commercial data separate from editorial copy so admin updates do not erase editorial quality.

### Phase 6 — Internal linking and topic clusters

**Goal:** connect pillar pages to supporting pages and strengthen discovery.

- Use `/en/routes/`, `/en/packages/`, `/en/fleet/`, and `/en/services/` as controlled hubs.
- Link route pages to relevant vehicles, packages, FAQ, contact, and booking pages.
- Link package pages to related destinations, vehicles, and route pages.
- Implement the RustySEO Mathura/Vrindavan opportunity with contextual anchor text, then expand based on a reviewed map rather than automated keyword stuffing.
- Keep orphan-page and weak-inlink checks in CI.

### Phase 7 — Structured data and media quality

**Goal:** make page meaning machine-readable without inventing claims.

- Validate `LocalBusiness`, `TravelAgency`, `TouristTrip`, `Offer`, `BreadcrumbList`, and FAQ schema against visible page content.
- Tie offer availability to the published backend item rather than hard-coding `InStock`.
- Require an absolute image URL, meaningful alt text, and stable image dimensions for indexable catalog pages.
- Test JSON-LD syntax and schema invariants in CI.

### Phase 8 — Performance and rendering reliability

**Goal:** reduce the crawl’s 2.833-second average response concern and ensure HTML-first discovery.

- Keep canonical marketing pages statically rendered or edge-rendered.
- Ensure published catalog pages are rendered into HTML before inclusion in the sitemap.
- Bound manifest fetches, use ETags, and label stale fallback data in the UI.
- Audit CSS duplication, asset sizes, cache headers, and layout shift.
- Verify no page requires JavaScript to expose its primary title, copy, links, or canonical metadata.

### Phase 9 — Admin publication SEO gates

**Goal:** make publishing safe by default.

- Add an admin SEO preview/checklist: slug, title, description, H1, summary length, canonical path, image/alt, structured-data readiness, and indexability.
- Publish only creates a public catalog record; an item becomes **SEO-ready** only after validation.
- Provide explicit states: draft → review → published/noindex → indexable.
- Show manifest version, last build, deploy status, sitemap status, and any failed page checks in the admin panel.

### Phase 10 — Monitoring, Search Console, and re-audit

**Goal:** prove improvements after deployment.

- Run a post-deploy HTTP crawl and generated HTML audit.
- Submit the canonical sitemap in Google Search Console; do not request indexing for every URL indiscriminately.
- Monitor 404s, indexed pages, excluded pages, duplicate/canonical reports, and Core Web Vitals.
- Re-run RustySEO after each major URL migration and monthly thereafter.
- Success gates: zero accidental sitemap 404s, zero indexable missing metadata, no booking-query URLs in sitemap, no published page without static/edge HTML, and a measurable reduction in duplicate groups.

## 4. First implementation slice

The first slice is intentionally low-risk and testable:

1. Preserve the existing noindex policy for booking and 404 routes.
2. Add a sitemap/renderability regression check so a URL cannot enter the sitemap unless its canonical HTML is rendered and indexable.
3. Add duplicate title/description checks to the audit output.
4. Shorten the current overlong hub metadata without changing URL intent.
5. Add tests before broad content rewrites.

## 5. Acceptance checklist

- [ ] Sitemap contains only canonical, rendered, indexable URLs.
- [ ] Booking query URLs are absent from sitemap and have `noindex, nofollow`.
- [ ] Every sitemap URL returns 200 with one H1 and unique title/description.
- [ ] Every known redirect returns a real 3xx response and is absent from sitemap.
- [ ] No stale RustySEO 404 URL is accidentally indexable.
- [ ] New admin-published catalog pages pass the SEO gate before being submitted to crawlers.
- [ ] Post-deploy RustySEO crawl confirms the same rules on the public domain.
