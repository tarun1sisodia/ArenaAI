# Admin Publishing → Frontend Manifest → SEO Architecture Plan

**Project:** SK Baghel Tour & Travels / ArenaAI  
**Scope:** Admin-controlled packages, routes, tours/trips, fleet visibility, frontend manifest generation, crawlability, and indexing  
**Status:** Phase 0 complete; Phase 1 starting

## 1. The simple answer to the manifest concern

The frontend must not generate or decide the catalog truth. The backend database is the system of record. The admin panel sends validated commands to the backend. The backend stores the item, assigns publication state, and exposes a published-only manifest and detail API. The customer website reads that published data.

There are two different consumers:

| Consumer | What it needs | Correct source |
|---|---|---|
| Booking UI and route/package directories | Fresh availability, current commercial fields, published status | `GET /api/v1/catalog` and `GET /api/v1/catalog/manifest` with ETags |
| Google and other crawlers | Stable HTML, canonical links, visible text, schema, sitemap | Pre-rendered/edge-rendered public pages plus a published-only sitemap |

A JSON manifest alone is not an SEO solution. It helps the browser render current data, but Google should receive a URL that returns complete HTML containing the item’s title, description, H1, copy, canonical, internal links, and structured data.

## 2. Current repository findings

The repository already contains significant groundwork:

- `backend/src/modules/catalog/catalog.service.ts` stores catalog items, filters draft/archived items, builds a versioned manifest, exposes ETags, and audits admin actions.
- `backend/src/modules/catalog/catalog.routes.ts` exposes public catalog and manifest endpoints plus admin CRUD, publish, archive, status, and republish endpoints.
- `admin/src/pages/CatalogPage.tsx` supports create/edit/publish/archive and a manifest status/republish control.
- `react/src/services/catalogManifest.ts` fetches the live backend manifest, uses ETags and a bounded local cache, and falls back to static data when the API is unavailable.
- `react/src/pages/LivePackageDetailPage.tsx` can render a published package/tour detail at runtime with TouristTrip/Offer schema and dynamic metadata.
- `react/scripts/prerender.ts` statically renders a fixed allowlist of known pages.
- `react/scripts/generate-sitemap.ts` generates a fixed allowlist sitemap and deliberately excludes the large internal route catalog.
- `backend/src/modules/route-catalog/route-catalog.service.ts` has a separate route-catalog model and a deployment-hook call, which must be reconciled with the main catalog flow.

The gap is that publication is currently split between “live API visibility” and “static SEO visibility.” A newly published item can appear in customer runtime requests, but it is not automatically guaranteed to receive a statically rendered HTML page, a sitemap entry, a deploy completion status, or an indexing-ready SEO record.

## 3. Target lifecycle

```text
Admin creates draft
        ↓
Backend validates identity, slug, commercial fields, copy, media and audit record
        ↓
Admin reviews SEO preview and content readiness
        ↓
Publish command writes status=published + publishedAt + manifest revision
        ↓
Backend emits/queues a rebuild request with the manifest revision
        ↓
Frontend build fetches the published snapshot and renders approved canonical URLs
        ↓
Build validates HTML, schema, links and sitemap
        ↓
Customer deployment publishes HTML + manifest + sitemap atomically
        ↓
Admin sees build/deploy/sitemap status
        ↓
Google discovers the URL through internal links and sitemap, then crawls HTML
```

If the rebuild is delayed or fails, the live API may still show the published item for customers, but the item must remain **not submitted to the sitemap** until its canonical HTML build is successful. This separation protects SEO from half-published pages.

## 4. Publication states

Use explicit state semantics rather than treating `published` as automatically indexable:

| State | Customer API | Customer UI | Sitemap | Robots/indexing |
|---|---|---|---|---|
| `draft` | hidden | hidden | absent | absent |
| `review` | hidden or staff-only | hidden | absent | absent |
| `published` + build pending | visible in live catalog if desired | visible | absent | page may be `noindex` until build succeeds |
| `published` + SEO-ready | visible | visible | included | `index, follow` |
| `archived` with replacement | hidden | hidden | absent | 301 to the genuine replacement |
| `archived` without replacement | hidden | hidden | absent | 410 or controlled 404 |

The first implementation may keep the existing database status values and add derived readiness fields. The important rule is that **publication and indexability are separate decisions**.

## 5. Canonical URL model

Use stable, human-readable paths:

- Packages and tours: `/en/packages/{slug}/`
- Editorial route pages: `/en/{route-slug}/`
- Fleet detail: `/en/vehicles/{vehicle-slug}/`
- Hubs: `/en/packages/`, `/en/routes/`, `/en/fleet/`, `/en/services/`
- Booking flow: `/book` and `/en/book/` are utility endpoints and remain noindex.

The slug is immutable after publication. If a business rename requires a slug change, create an explicit redirect record from the old canonical URL to the new one and preserve the old URL’s history.

## 6. Backend implementation phases

### Backend Phase 1 — One published catalog contract

Reconcile the main catalog and legacy route-catalog paths. The public contract should expose one published item shape with:

- `id`, `type`, `slug`, `title`, `shortDescription`, `description`
- `sourceCity`, `destinationCity`, `routeSummary`, `tripType`, `stops`
- `durationText`, `distanceKm`, `startingPriceInr`, `fares` where appropriate
- `availability`, `seatsLeft`, `coverImage`, `gallery`
- `publishedAt`, `updatedAt`, `manifestVersion`
- SEO fields: `metaTitle`, `metaDescription`, `h1`, `canonicalPath`, `noindexReason`, `schemaType`

Never expose draft/archived data through public endpoints.

### Backend Phase 2 — Publication validation

At publish time, validate slug uniqueness, required copy, price validity, route/package type compatibility, media policy, and SEO fields. Reject publication with a structured error if required fields are missing. Do not let an empty description or placeholder text become indexable.

### Backend Phase 3 — Manifest revision and cache invalidation

Each content mutation that affects public output increments a manifest revision and changes the ETag. The affected mutations are publish, archive, edits to a published item, media changes, and SEO metadata changes. Persist the revision if the service can run multiple instances; an in-memory version is not sufficient for a multi-instance production deployment.

### Backend Phase 4 — Build/rebuild event

After a successful mutation, create an idempotent rebuild request containing `manifestVersion`, changed slugs, and action. The current `PAGES_DEPLOY_HOOK_URL` approach can be used as an adapter, but it must report request status and avoid duplicate deploy storms. A queue/outbox is the robust production design.

The backend must not claim that a page is SEO-ready merely because the deploy hook was called. Readiness is set only after the frontend build and post-deploy verification succeed.

### Backend Phase 5 — Published sitemap source

Expose a published-only URL feed or sitemap endpoint that includes only catalog records with successful SEO-ready builds. It must include `lastmod` from `updatedAt`, omit drafts and archives, and never include query-string booking URLs. If the site is deployed as static files, the frontend build materializes the feed into `sitemap.xml`; if edge/server rendering is introduced, the endpoint can become the authoritative sitemap directly.

## 7. Frontend implementation phases

### Frontend Phase 1 — Runtime catalog correctness

`react/src/services/catalogManifest.ts` continues to read the live manifest for customer UI freshness. The static file remains a build fallback, not a claim of current operational truth. If the live request fails, the UI should label stale data where it affects availability or price.

### Frontend Phase 2 — Dynamic detail rendering

Every SEO-ready published package, tour, and route must resolve to a detail page from the slug. The detail page must render meaningful HTML without waiting for a client-only fetch. Options, in order of preference:

1. Build-time snapshot + SSG for the current published manifest.
2. Edge/server rendering that fetches the backend manifest/detail endpoint before returning HTML.
3. Runtime client rendering only as a fallback; it is not sufficient for the canonical SEO path.

The existing `LivePackageDetailPage.tsx` is a good foundation, but it needs a server/build data path and a non-loading HTML contract.

### Frontend Phase 3 — Build-time manifest snapshot

During `npm --prefix react run build`, fetch the published backend snapshot, validate its revision, and generate:

- `public/routes-manifest.json` for compressed route calculations.
- `src/data/generated-catalog.json` for typed customer data.
- Static detail pages for every SEO-ready published item.
- A sitemap containing exactly those successfully rendered URLs.
- A build metadata file containing manifest revision, item count, generated timestamp, and source API URL (never secrets).

If the backend cannot be reached, fail the production SEO build instead of silently shipping stale data. Local development may use the existing static fallback.

### Frontend Phase 4 — Atomic deploy

Deploy the generated customer bundle as one immutable artifact. The manifest, detail HTML, sitemap, robots file, and assets must refer to the same catalog revision. The admin panel must display that revision and deploy result.

## 8. Admin panel implementation phases

### Admin Phase 1 — SEO preview before publish

Extend `admin/src/pages/CatalogPage.tsx` with a preview panel showing the exact canonical URL, title, meta description, H1, summary, cover image/alt, schema type, indexability decision, and warnings. Make the publish action explain what will happen: “visible in live catalog” versus “eligible for indexing after build.”

### Admin Phase 2 — Build status

Show:

- Current database manifest revision.
- Last requested build revision.
- Build status: pending, running, succeeded, failed.
- Last successful deployed revision.
- Sitemap inclusion status per item.
- Failure reason and retry action.

### Admin Phase 3 — Safe archive and redirect management

Archiving must require selecting either a genuine replacement URL or “no replacement.” The backend then records the redirect/410 policy and the frontend removes the old URL from the sitemap.

## 9. SEO and Google indexing behavior

Google does not need a special “manifest indexing” mechanism. It needs accessible URLs. The correct signal chain is:

1. Internal links point to the canonical URL.
2. The canonical URL returns stable HTML with the page’s visible content and metadata.
3. The URL appears in the XML sitemap only after it is valid and deployed.
4. `robots.txt` allows crawling of the canonical page and points to the sitemap.
5. Structured data matches the visible content; it does not guarantee rankings.
6. Google crawls and decides indexing based on quality, duplication, canonical signals, internal links, response codes, and overall site trust.

Publishing is therefore not a guarantee of ranking. It is a controlled way to make a page discoverable and technically eligible. Content quality, unique intent, real-world business information, and ongoing performance still determine results.

## 10. Failure handling

| Failure | Customer behavior | SEO behavior | Admin behavior |
|---|---|---|---|
| Backend unavailable during build | Use last known deployed bundle only if explicitly approved | Do not generate a new sitemap | Show build failed/stale |
| Publish succeeds, rebuild fails | Live API may serve item; static page remains old | Do not add URL to sitemap; keep noindex/pending | Show retry and error |
| Archive succeeds, deploy pending | Live API hides item immediately | Keep old URL temporarily controlled, then 301/410 after deploy | Show removal pending |
| Duplicate slug | Reject command | No change | Show validation error |
| Missing SEO fields | Keep draft/review | Never index | Show required fields |
| Stale client manifest | Customer UI uses ETag/cache fallback | Sitemap and HTML remain authoritative | Show revision mismatch if detected |

## 11. Testing strategy

Backend tests must cover draft exclusion, publish inclusion, archive removal, slug immutability, revision/ETag changes, media changes, SEO validation, audit logging, and idempotent rebuild requests.

Frontend tests must cover build snapshot consistency, dynamic published detail rendering, noindex booking paths, sitemap membership, canonical/metadata uniqueness, structured data, and 404/redirect response generation.

The end-to-end acceptance test should create a package in the admin API, publish it, verify that the manifest contains it, run the customer build against that revision, verify `/en/packages/{slug}/index.html` contains the title/H1/canonical/schema, verify `sitemap.xml` contains it, then archive it and verify the next deployed artifact removes it.

## 12. Recommended order of delivery

1. Keep the current live manifest contract and add a persisted/observable publication revision.
2. Add SEO readiness validation and admin preview.
3. Add a build snapshot step that renders published catalog detail pages.
4. Generate the sitemap from the successfully rendered snapshot.
5. Wire publish/archive/media/SEO mutations to an idempotent deploy request.
6. Add build and deploy status to admin.
7. Add redirect/410 management.
8. Run the RustySEO crawl again and reconcile every remaining URL class.

## 13. Definition of done

The feature is complete when an admin can create and publish a package, route, or trip; the backend is the only source of truth; the customer UI receives the live published data; the customer deployment renders the canonical detail HTML; the sitemap includes only the deployed SEO-ready URL; archive removes or redirects it safely; the admin can see the manifest/build/sitemap status; and automated tests prove the full lifecycle.
