# ArenaAI — Dossier Content: Admin → Frontend → Google Build Spec
**Companion:** `arenaai-dossier-db-template-v2.md` (the tables) · **This doc:** exactly what to add and where, so admin-created packages appear on the customer site and get indexed/ranked by Google.
**Repo:** `tarun1sisodia/ArenaAI` · verified against real files, 2026-10-04.

---

## 0. How the pipeline works today (the pattern to copy)

1. Admin edits in `admin/` → backend module flips row status (`draft`/`published`/`archived`).
2. On any publish/unpublish/archive, the service calls the deploy hook (`backend/src/modules/route-catalog/route-catalog.service.ts:21-22`, also `catalog.service.ts:18`) → `PAGES_DEPLOY_HOOK_URL` → Cloudflare Pages rebuilds.
3. At build time `react/scripts/build-manifest.ts` fetches the public manifest (`ROUTE_CATALOG_MANIFEST_URL` → `GET /api/v1/route-catalog/manifest`, controller `route-catalog.controller.ts:20`, route `route-catalog.routes.ts:5`, no auth, rate-limited) and writes snapshots: `react/src/data/generated-published-routes.json` (+ `routes-manifest.json`, `generated-catalog.json`, `generated-published-catalog.json`).
4. `react/scripts/prerender.ts` reads the snapshot (`prerender.ts:90`) and renders full static HTML per URL — crawlers get complete HTML, not a loading shell.
5. `react/scripts/generate-sitemap.ts` reads the snapshot (`generate-sitemap.ts:80`) and emits `sitemap.xml` with hreflang + source-owned `lastmod`, guarded by `isSitemapSafeSlug` denylist.
6. `react/src/app/ServerApp.tsx` resolves `/packages/:slug` and dynamic route slugs at runtime (`ServerApp.tsx:149, 351-352, 420-422`) with per-page SEO via `getSeo()`.

**Every new content type below copies this exact pipeline. Nothing in it is new infrastructure — it is new rows flowing through existing pipes.**

---

## 0.5 Architectural locks (settled — do not re-litigate during build)

1. **No `vehicle_tiers` / fleet table, ever.** Fleet identity + per-km rates live in the `VEHICLES` registry (`backend/src/modules/fares/fare.catalogue.ts:47-52`). The table was deliberately dropped (migrations `0004`/`0011`, "removed per client architecture requirements"). A table would create a second source of truth and reintroduce frontend↔backend fare drift.
2. **Per-km single source of truth:** `VEHICLES` const → optional override in `fare_rules.config.vehicles` (admin-editable via `FaresPage`, versioned, auditable) → fare engine (`fare.engine.ts`, same override pattern as line 215) **and** `build-manifest.ts` `getRate()` **both** prefer the override. The number on the frontend fleet page and the number the engine charges must always come from the same place. If admin-editable rates are wanted, implement the `fare_rules.config.vehicles` override — never a new table.
3. **Dossier is the commercial authority** for all seeded numbers (transfer fares, extra-km ₹10, night window **20:00–06:00**). Where the repo disagrees today (backend engine 22:00–05:00, frontend stale fares), the dossier value wins; make the night window configurable via `fare_rules.config.outstation.nightStartHour` / `nightEndHour`, defaulting to the dossier window.
4. **Seed commercial rows as `draft` / `needs_review`.** The dossier is pending client sign-off — only `published` rows reach the manifest, prerender, and sitemap. Nothing seeded may be auto-published.
5. **Never seed from `catalog.data.json`.** It contains junk slugs and stray `hatchbackFare` fields. Only the clean dossier rows are seeded.
6. **RLS:** only add RLS policies if the repo actually uses RLS somewhere — existing migrations (incl. `0020_route_catalog`) have none. If the backend uses a single privileged role, skip RLS.

---

## 1. Backend — what to add, where

### 1.1 Migration — `backend/migrations/0021_dossier_content.sql`
(Timestamp prefix must sort after `0020_route_catalog.sql`. Run via existing `runMigrations` flow.)
- Create tables per template v2: `transfer_routes`, `local_sightseeing_packages`, `tour_packages`, `package_vehicle_upgrades`, `cancellation_policies`, `company_profile`, `dossier_signoffs`, `monuments`, `pet_taxi_policy`. Every route/trip/package table carries `fleet_prices jsonb`, `use_per_km boolean NOT NULL DEFAULT true`, `per_km_rate_override numeric(10,2)`, `night_charge_inr numeric(10,2) NOT NULL DEFAULT 0`, `status` (`draft`/`published`/`archived`), `updated_at`.
- Extend: `ALTER TABLE route_catalog ADD COLUMN use_per_km boolean NOT NULL DEFAULT true, ADD COLUMN per_km_rate_override numeric(10,2);`
- Seed the 9 dossier corridors into `route_catalog` as **`status='draft', needs_review=true`** (dossier is pending client sign-off — Tarun publishes after sign-off, never auto-publish seeds). Seed `cancellation_policies` (3 cab rows + 6 tour slabs), `monuments` (10 rows), `pet_taxi_policy` (1 row), `company_profile` (1 row, contact fields `[TBD — confirm with client]`), `dossier_signoffs` (10 rows, all `pending`), `package_vehicle_upgrades` (4 global rows, `package_id NULL`).

### 1.2 Shared rebuild trigger — `backend/src/shared/deploy-hook.ts` (new file)
- Extract `triggerFrontendRebuild()` from `route-catalog.service.ts:21-22` (POST `PAGES_DEPLOY_HOOK_URL`, warn-and-continue if unset — same behavior as today).
- Replace the duplicated inline hook calls in `route-catalog.service.ts` and `catalog.service.ts:18` with the shared function.
- **Rule: every new module's service calls `triggerFrontendRebuild()` on publish, unpublish, archive, and any fare/price edit to a published row.**

### 1.3 New modules — `backend/src/modules/<name>/`
One module each: `tour-packages/`, `transfer-routes/`, `local-packages/`, `cancellation-policies/`, `monuments/`, `pet-policy/`, `company-profile/`, `dossier-signoffs/`.
- 4 files each, mirroring `route-catalog/`: `<name>.schema.ts` (zod `.strict()`, strip HTML like `catalog.schema.ts`, slug `^[a-z0-9-]{2,80}$` **plus the junk-slug refine** from `route-catalog.schema.ts` — junk slugs would pollute the sitemap), `<name>.service.ts`, `<name>.controller.ts`, `<name>.routes.ts`.
- `backend/src/app.ts`: mirror the route-catalog wiring — imports (`app.ts:45-47`), service creation (`app.ts:212`), route registration (`app.ts:241`).

### 1.4 Public manifest endpoints (no auth, rate-limited — mirror `route-catalog.routes.ts:5` + `controller.ts:20`)
- `GET /api/v1/tour-packages/manifest` → published tour packages
- `GET /api/v1/transfer-routes/manifest` → published transfers
- `GET /api/v1/local-packages/manifest` → published local packages
- `GET /api/v1/content/manifest` → monuments + pet policy + company profile + cancellation policies (small, single endpoint)
- Only `status='published'` rows are returned (same contract as the route manifest — `build-manifest.ts` filters on it).
- Cloudflare Pages env: add `TOUR_PACKAGES_MANIFEST_URL`, `TRANSFER_ROUTES_MANIFEST_URL`, `LOCAL_PACKAGES_MANIFEST_URL`, `CONTENT_MANIFEST_URL` next to the existing `ROUTE_CATALOG_MANIFEST_URL`.

### 1.5 Admin endpoints
- CRUD per module under the existing `/api/v1/ops/admin/...` convention (cf. `/api/v1/ops/admin/fare-rules`), reusing the admin auth middleware. No new auth scheme.

---

## 2. Build scripts — what to add, where (`react/scripts/`)

### 2.1 `build-manifest.ts`
- Mirror the `ROUTE_CATALOG_MANIFEST_URL` fetch block: for each new manifest URL, fetch, keep `status==='published'` rows, write snapshots (same try/catch warn-and-continue pattern):
  - `react/src/data/generated-published-tour-packages.json`
  - `react/src/data/generated-published-transfer-routes.json`
  - `react/src/data/generated-published-local-packages.json`
  - `react/src/data/generated-published-content.json`
- **Fleet consistency:** if the `fare_rules.config.vehicles` per-km override (§0.5 lock 2) is implemented, `getRate()` in this script must prefer the override over the `VEHICLES` const — the frontend fleet/pricing page and the fare engine must never disagree.

### 2.2 `prerender.ts`
- Extend `routesToRender` (line 125): read the new snapshots (same pattern as line 90) and push `/packages/<slug>`, `/transfers/<slug>`, `/local-packages/<slug>`.
- Keep them in the English set (prerender is English-only per the line 124–125 comment; bilingual URLs follow the existing i18n mechanism — verify, don't invent).

### 2.3 `generate-sitemap.ts`
- Read the new snapshots (same pattern as line 80), append entries with **`lastmod` from the row's `updated_at`** (the script requires source-owned lastmod, lines 29–31 — never build time).
- Run every slug through the existing `isSitemapSafeSlug()` denylist guard.
- Suggested priorities: tour packages `0.8` weekly, transfers `0.7` weekly, local packages `0.7` weekly, monuments `0.5` monthly.

---

## 3. Customer frontend — what to add, where (`react/src/`)

### 3.1 `react/src/app/ServerApp.tsx` — dynamic resolution
Mirror the `dynamicRoute` pattern (lines 351–352, 417–418):
- `/packages/<slug>`: existing static `packages.find()` (lines 149, 354) first → then `generated-published-tour-packages.json` → render `PackageDetailPage` (exists, line 420) / `LivePackageDetailPage` (line 422, accepts `slug` + `initialItem`).
- `/transfers/<slug>`: new snapshot → reuse `RouteDetailPage` (transfers are point-to-point; same shape) unless transfer-specific fields demand a new `TransferDetailPage`.
- `/local-packages/<slug>`: new `LocalPackageDetailPage`.
- `getSeo()` (ServerApp.tsx/App.tsx): add branches per type — **title formula with price** (winning pattern, e.g. `Same Day Agra Taj Mahal Tour @ ₹3,499 | SK Baghel Tour & Travels`), meta description, canonical, JSON-LD (`TouristTrip` + itinerary for packages; `Offer` for fares).

### 3.2 Detail page components (`react/src/pages/`)
Each page: **one H1**, dated fare table ("Fares updated <date>"), **8–13 FAQs with FAQ schema**, **phone in H2**, breadcrumb, JSON-LD, CTA into the booking flow. (These are the repo's proven winning patterns — price in title, dated fare tables, FAQ count, phone in H2.)

### 3.3 Listing + internal linking
- Packages index renders new cards from the snapshot (in addition to static `packages`).
- Link every new page from the homepage, the relevant index page, and related route pages — internal links are what get new URLs crawled and ranked.

---

## 4. Admin UI — what to add, where (`admin/`)

### 4.1 `admin/src/components/admin/Sidebar.tsx` — nav array (lines 28–35)
Add: `{ to: "/tour-packages", label: "Tour Packages" }`, `{ to: "/local-transfers", label: "Local & Transfers" }`, `{ to: "/policies", label: "Policies & Company" }`, `{ to: "/sign-off", label: "Client Sign-off" }`.

### 4.2 New pages (`admin/src/pages/`)
- **`TourPackagesPage.tsx`** — table + editor: name, slug (auto-generated, validated), days, nights, base tier select, starting price, **per-fleet price editor** (5 tier inputs → `fleet_prices` jsonb), **per-km toggle** (`use_per_km`), `per_km_rate_override`, `night_charge_inr`, `flat_charge_inr`, inclusions textarea, status `draft`/`published`/`archived`, Publish button.
- **`LocalPackagesPage.tsx`** + **`TransferRoutesPage.tsx`** — same editor shape (fleet prices, per-km toggle, night charge; local adds extra-rates editor).
- **`PoliciesPage.tsx`** — tabs: Cancellation slabs (editable table: notice period / fee % / refund %), Pet policy (single form), Company profile (NAP form showing `[TBD]` markers where unconfirmed).
- **`SignoffPage.tsx`** — the 10-row client checklist: status select (`pending`/`approved`/`modification_requested`) + notes + approver name; progress bar (x/10 approved); when 10/10, `company_profile.dossier_status` → `signed_off`.

### 4.3 `admin/src/lib/api.ts` + `admin/src/lib/types.ts`
Typed CRUD functions per module (mirror `createAdminCatalogItem`); add types (mirror `RouteCatalogItem`).

### 4.4 Extend `CatalogPage.tsx`
Route-catalog form gains the `use_per_km` toggle + `per_km_rate_override` input (columns from §1.1).

---

## 5. Google indexing & ranking checklist (per published item)

1. Unique slug URL → 2. prerendered static HTML (`prerender.ts`) → 3. sitemap entry with real `lastmod` (`generate-sitemap.ts`) → 4. canonical + hreflang → 5. JSON-LD → 6. unique title/meta (`getSeo()`) → 7. one H1 → 8. internal links from homepage/index/related pages.
2. After publish: deploy hook rebuilds → sitemap refreshes → **request indexing in GSC on money pages** (note: GSC verification + sitemap 'Success' status still unconfirmed — sitemap submitted 2026-10-03).
3. Guards that keep Google clean: slug zod refine rejects junk patterns (defense before the sitemap denylist); never publish test/QA slugs; `status='draft'` is the default — only `published` rows reach the manifest, the prerender, and the sitemap.

---

## 6. Build order + verification (agent must report output for each)

1. **Migration** — verify: `\d transfer_routes` etc. show all tables; `\d route_catalog` shows new columns; seed counts (`select count(*)`) match dossier (9 corridors draft, 9 policy rows, 10 monuments, 10 sign-off rows, 4 upgrade rows).
2. **Backend modules** — verify: `curl <base>/api/v1/tour-packages/manifest` returns `[]` (empty, not error); admin CRUD round-trip on one draft row; publish triggers deploy-hook log line.
3. **Admin UI** — verify: new nav items render; create→publish→archive one test package flows through without console errors.
4. **Engine wiring (dedicated step — do NOT fold into backend modules or frontend):**
   - Fare precedence per row: admin `fleet_prices` → per-package upgrade surcharge → global upgrade matrix → per-km (`per_km_rate_override` if set, else tier base rate).
   - Night window: default **20:00–06:00** per dossier §5; wire `fare_rules.config.outstation.nightStartHour` / `nightEndHour` through `fare.service.ts` → `fare.engine.ts` `isNightPickup` (currently static 22:00–05:00 at `fare.catalogue.ts:41` / `fare.engine.ts:31`).
   - Consume `route_catalog.night_halt_inr` and per-row `night_charge_inr` in pricing (currently stored but unread); multi-day packages multiply per-night charge by `nights`.
   - Apply `cancellation_policies` slabs at booking cancel/refund time (currently FAQ prose only).
   - Verify: engine unit tests for precedence, night-boundary hours (19:59 vs 20:00, 05:59 vs 06:00), and a cancellation refund math test per slab.
5. **Build scripts** — verify: `generated-published-*.json` files exist after build; `grep <slug> dist/.../sitemap.xml`; prerendered HTML file exists per URL.
6. **Frontend** — verify: new URLs render with H1 + fare table + FAQ schema in served HTML (curl, not just browser).
7. **Cleanup** — unpublish/delete the test rows so no test slug ever reaches the sitemap.
