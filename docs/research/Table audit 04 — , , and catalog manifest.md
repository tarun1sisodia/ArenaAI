# Table audit 04 — `catalog_items`, `catalog_item_media`, and catalog manifest

**Audit date:** 2026-10-06 session (repository at `/home/ubuntu/ArenaAI`)

**Scope:** The two database tables named above and the generated public catalog manifest. This is a read-only audit. No production writes, migrations, deletes, webhook replays, or external submissions were performed.

## 1. Evidence and live status

Reviewed first:

- `reports/live-schema-inventory.md` (generated from live Supabase `list_tables` on 2026-10-05)
- `reports/schema-model-alignment.md`
- `reports/schema-audit-findings.md`
- `reports/phase1-table-scan-findings.md`
- `reports/2026-10-06-16-table-alignment-execution-plan.md`

Relevant repository evidence:

- Migrations: `backend/migrations/0007_create_catalog_reviews_promos.sql`, `0009_add_indexes_and_rls.sql`, `0015_add_foreign_key_indexes.sql`, `0017_widen_catalog_slug.sql`, `0018_extend_catalog_for_live_trips.sql`, `0019_enforce_media_visibility_rls.sql`.
- Backend contract/domain: `backend/src/types/domain.ts:61-90,238-292`; `backend/src/modules/catalog/catalog.schema.ts:11-114`.
- Service/manifest/lifecycle: `backend/src/modules/catalog/catalog.service.ts:23-237,239-370,372-541,545-621`.
- PostgreSQL mapper/SQL: `backend/src/db/postgres.ts:994-1083,1566-1612,1683-1700`.
- HTTP surface: `backend/src/modules/catalog/catalog.routes.ts:8-75` and `catalog.controller.ts:20-151`.
- Admin client/UI: `admin/src/lib/api.ts:292-376,380-490`; `admin/src/lib/types.ts:100-150`; `admin/src/pages/CatalogPage.tsx:135-240,330-430,455-625`.
- Customer readers: `react/src/services/catalog.ts:1-175`; `react/src/components/catalog/LiveCatalogSection.tsx:12-232`; `react/src/services/catalogManifest.ts:44-223`; `react/src/pages/PackagesPage.tsx` imports `loadPublishedPackages`.

### Current Supabase evidence (read-only)

Project `trcmufqbpcymipqpemoq` was queried with Supabase MCP `execute_sql` using only `SELECT` statements:

- `public.catalog_items`: **0 rows**.
- `public.catalog_item_media`: **0 rows**.
- Status/type/media status counts returned no rows because both tables are empty; therefore no live row-level null/empty values can be observed.
- A separate null/empty aggregate query returned zero for every tested null/empty bucket, which is a consequence of zero rows, not proof that future rows cannot contain NULL.
- Current RLS: both tables `rls_enabled=true`, `force_rls=false`.
- Current FK actions: media → item is `ON DELETE CASCADE`, `ON UPDATE NO ACTION`; bookings.selected_catalog_item_id → item is `ON DELETE SET NULL`, `ON UPDATE NO ACTION`; reviews.catalog_item_id → item is `ON DELETE SET NULL`, `ON UPDATE NO ACTION`.

The live inventory independently records the same 0/0 row counts and the full column/type/null/default/check inventory (`reports/live-schema-inventory.md:192-253`). The empty live tables mean all lifecycle conclusions below are code/migration evidence, not observed live-row behavior.

## 2. Database contract and column population matrix

### 2.1 `public.catalog_items`

The original table is created in migration 0007. Migration 0017 widens `slug` to `VARCHAR(150)`. Migration 0018 changes `type` to `text` with a check constraint and adds the commercial fields (`distance_km`, `availability`, `seats_left`, `stops`, `trip_type`). The current live inventory reports the following effective contract:

| Column | Effective DB contract | What fills it / who writes it | NULL/empty meaning and assessment |
|---|---|---|---|
| `id` | `text NOT NULL`, PK | Admin create service generates `newId()` (`catalog.service.ts:252-276`); seed scripts supply stable IDs; PostgreSQL insert persists it. | Never NULL. Required identity; no defect. |
| `type` | `text NOT NULL`, check `ride/tour/package/route/vehicle/place` | Admin create/update payload and `CreateCatalogSchema`/`UpdateCatalogSchema`; service passes the value to `insertCatalog`/update SQL. | Never NULL. Enum/check is aligned, but type changes can interact with the media-limit policy (CAT-03). |
| `slug` | `varchar`/migration width 150, NOT NULL, unique (migration 0007) | Admin UI derives/edits it (`CatalogPage.tsx:330-350`), Zod validates it, service/SQL persists it. | Never NULL/empty by contract. DB/API length mismatch is CAT-01. |
| `title` | `text NOT NULL` | Admin form; Zod trims, strips tags, requires 3–160 chars; seed data also writes it. | Required and customer-visible; aligned. |
| `short_description` | `text NOT NULL` | Admin form `shortDescription`; create service; Zod requires 3–280 chars. Public reader displays it. | Required/non-empty by API; aligned. |
| `description` | `text NOT NULL` | Optional in create input but service defaults it to `shortDescription` (`catalog.service.ts:259-260`); update retains existing value when omitted; SQL writes it. | DB cannot be NULL. Fallback is intentional and prevents a missing optional form value becoming NULL. |
| `status` | `content_status_enum NOT NULL DEFAULT 'draft'` (`draft/published/archived`) | Create always starts `draft`; dedicated publish/archive service methods set status; update can retain/set status; all catalog routes currently require `super_admin` through `CONTENT_ROLES` (`roleGuard.ts:14-18`). | `draft` is intentional pre-publication; `published` exposes item; `archived` removes it from public readers/manifest while retaining history. |
| `duration_text` | `text NOT NULL` | Admin create/update and Zod (`min(1)`); public API returns it. | Required; aligned. |
| `route_summary` | `text NOT NULL` | Admin form `formPlaces`; Zod requires non-empty; manifest parses it for route origin/destination and uses it for package places. | Required; aligned. |
| `starting_price_inr` | `numeric NOT NULL`, `> 0` | Admin form/API, service, seed, PostgreSQL insert/update. | Required positive commercial value; aligned. |
| `version` | `int4 NOT NULL DEFAULT 1` | Create sets 1; service increments current version on update/publish/archive; SQL writes it. | Never NULL. No optimistic-lock check is implemented, so concurrent edits could last-write-wins; not observed with zero live rows. |
| `created_by` | `uuid NULL` | Admin create supplies `actor.id`; seed may supply an operator ID; SQL persists it. No FK exists in the migration. | Nullable permits legacy/system/import rows. For normal admin-created rows it should be populated; a future unattributed admin row would be a provenance defect, but none exists live. |
| `updated_by` | `uuid NULL` | Admin update/publish/archive supplies actor ID; seed supplies it. No FK exists. | Nullable for legacy/system rows; normal admin mutations should populate it. No live rows to assess. |
| `published_at` | `timestamptz NULL` | NULL on create/draft; publish sets current time; archive deliberately leaves prior publication timestamp; re-publish sets a new time. | NULL before first publication is intentional. Non-NULL on an archived item is historical publication evidence, not a defect. DB has no status/timestamp check, so direct SQL could violate the convention. |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | Service/seed provide timestamps; DB default covers direct inserts. | Required audit timestamp; aligned. |
| `updated_at` | `timestamptz NOT NULL DEFAULT now()` | Service supplies a new time on update/publish/archive; SQL writes it. | Required; aligned. |
| `distance_km` | `numeric NULL`, check NULL or `>=0` | Admin form sends number or `null`; service preserves explicit null; public reader displays it only when present. | NULL is intentional for packages/vehicles/places or offerings without route distance. Negative is rejected. |
| `availability` | `varchar NOT NULL DEFAULT 'available'`, check available/limited/unavailable | Admin form and create/update schemas; service/SQL persist it. | Never NULL. `available` is default; `unavailable` is an intentional “on request/paused” state. The `limited`/`seats_left` invariant is incompletely enforced on PATCH (CAT-02). |
| `seats_left` | `int4 NULL`, check NULL or `>=0` | Admin form sends number or null; service preserves explicit null; public UI shows “Only N left” when limited and non-null. | NULL is intentional when capacity is not tracked or availability is not limited. A limited item with NULL/0 is not rejected by the update schema (CAT-02). |
| `stops` | `text[] NOT NULL DEFAULT '{}'` | Admin form comma-splits, trims, caps at 24; Zod defaults `[]`; service/SQL persist it. | Empty array is intentional for direct rides, vehicles, and content without intermediate stops; public reader hides the stop UI when empty. |
| `trip_type` | `varchar NULL`, check NULL or one of four trip types | Admin form selects a type for trip categories; vehicle/place can leave it blank; service/SQL persist null or value. | NULL is intentional for non-trip content (vehicle/place) and unclassified legacy rows. Public filter only applies when requested. |

**Mapper alignment:** `mapCatalog` maps every current DB column, including the 0018 extensions, to the camelCase domain record (`postgres.ts:1566-1589`). `insertCatalog` and catalog update SQL cover all current persisted columns (`postgres.ts:1000-1011,1683-1700`). No catalog item column is silently dropped at the repository boundary.

### 2.2 `public.catalog_item_media`

The original media table is migration 0007; migration 0018 adds inline-upload fields; migration 0019 tightens public visibility to require both published media and a published parent item.

| Column | Effective DB contract | What fills it / who writes it | NULL/empty meaning and assessment |
|---|---|---|---|
| `id` | `uuid NOT NULL`, PK, default `gen_random_uuid()` | Service generates `newId()`; DB default covers direct inserts. | Required identity; aligned. |
| `catalog_item_id` | `text NOT NULL`, FK to `catalog_items.id` | Attach-media admin service takes parent ID; repository insert persists it. | Never NULL. FK prevents orphan media; parent delete cascades. |
| `storage_path` | `text NOT NULL` | Path mode stores a validated relative asset path; inline mode stores `/api/v1/media/{id}`. The media storage object key is deterministic (`catalog/{catalogItemId}/{mediaId}.{ext}`). | Never NULL. For object-backed/inline media the API route is intentional; for path mode it is the static/external asset reference. |
| `media_type` | `varchar NOT NULL`, check `image` or `video` | Attach schema accepts image/video; admin UI currently sends image only; service persists it. | Never NULL. Video is accepted by backend but not rendered by the public LiveCatalog `<img>` path (CAT-04). |
| `alt_text` | `text NOT NULL` | Admin UI requires 3+ chars; Zod trims/strips tags and requires 3–200; service writes it. | Required accessibility metadata; aligned. |
| `caption` | `text NULL` | Admin upload/path form may omit it; service stores `null`; update may set/retain it. | NULL means no caption and is intentional. Mapper maps empty string to null (`postgres.ts:1599`), a benign normalization. |
| `sort_order` | `int4 NOT NULL DEFAULT 0` | Attach defaults 0 or admin sets active-media length; cover changes set one item to 0 and renumber competing covers. | Never NULL. Equal values are permitted and tie-break by creation time; public order is deterministic. |
| `status` | `content_status_enum NOT NULL DEFAULT 'draft'` | Attach-media deliberately publishes immediately (`catalog.service.ts:439-450`); update may archive/draft/publish; public media requires both statuses published. | Draft/archived are intentional non-public states. Immediate publish is an explicit product rule for new admin-uploaded covers. |
| `source_type` | `varchar NOT NULL DEFAULT 'admin_upload'` (no DB check) | Service always writes `admin_upload`; seed uses it. Domain permits `admin_upload/customer_upload/supplier`, but no current catalog API creates the latter two. | Never NULL. The unconstrained DB string versus narrow domain union is a contract hardening gap (CAT-06), not a live-row defect. |
| `copyright_owner` | `text NULL` | Seed records set it; current attach-media service hard-codes `null`, and update schema does not expose it. | NULL is accepted for current admin uploads, but it means provenance/licence owner is not captured by the current CMS. Treat as an operational governance gap if copyright evidence is required; no live rows to verify. |
| `created_by` | `uuid NULL` | Admin attach writes actor ID; seed writes operator ID. No FK exists. | Nullable for legacy/system rows; normal admin uploads should be attributed. |
| `approved_by` | `uuid NULL` | Attach sets actor ID because uploads publish immediately; update sets it when status is changed to `published`; seed can supply it. No FK exists. | NULL is intentional for draft/unapproved legacy media; should be populated for published admin-created media. |
| `published_at` | `timestamptz NULL` | Attach sets now because media is immediately published; update sets it when publishing; draft/archived historical media may remain null/previously populated. | NULL before publication is intentional. DB has no status/timestamp check. |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | Service/seed supply it; DB default covers direct inserts. | Required; aligned. |
| `mime_type` | `varchar NULL` | Inline upload requires/sets one of the image MIME types; path references set null; object-storage inline uploads still record MIME. | NULL is intentional for static/path references. Current media storage MIME map only supports images; this contributes to CAT-04 for video. |
| `content_base64` | `text NULL` | If inline and no object storage credentials, service stores the base64 payload in Postgres; if object storage is configured, it uploads bytes and leaves this null; path mode leaves it null. | NULL is intentional for path/object-storage media. Storing base64 in Postgres is an explicit local/test fallback, bounded to 2.5 MB decoded bytes. |
| `size_bytes` | `int4 NULL`, check NULL or `>=0` | Inline upload sets decoded byte length; path references set null. | NULL is intentional for references whose bytes are not owned by the API. |

**Media mapper/repository alignment:** `mapMedia` covers every current column (`postgres.ts:1592-1611`); insert includes all 17 columns and update intentionally changes only editable metadata/status (`postgres.ts:1043-1067`). Public `mediaSummary` excludes storage internals such as base64, MIME, and ownership; admin detail returns status/path/MIME/size but not base64/copyright owner.

## 3. Manifest contract and lifecycle

### Backend generation

`createCatalogService` owns a process-local `manifestVersion`, `lastRegeneratedAt`, `cachedManifest`, and weak ETag (`catalog.service.ts:23-34`). `buildManifest`:

1. Starts with the static `CATALOG_RAW_DATA` route baseline (`:36-63`).
2. Reads all catalog items and, for `ride`/`route`, deletes a baseline slug if the DB item is non-published; a published DB row overrides the baseline fare/origin/destination (`:65-96`).
3. Includes only published `package`/`tour` items (`:98-141`), reads only published child media, sorts by `sortOrder` then creation time, and uses the first media as cover. If no media exists, it uses `/assets/packages/taj-dawn.webp`.
4. Adds static `VEHICLES` from the fare catalogue (`:144-152`).
5. Returns `{version, updatedAt, routeCount, packageCount, routes, packages, vehicles}` (`:154-162`).

The public endpoint is `GET /api/v1/catalog/manifest` with `Cache-Control: public, max-age=60, stale-while-revalidate=300` and ETag/304 handling (`catalog.routes.ts:14-18`, `catalog.controller.ts:27-38`). Admin status and manual republish are exposed at `:30-36`; republish bumps the process-local version, rebuilds, and records an `admin_audit_logs` entry as `resourceType=catalog_manifest` (`catalog.service.ts:201-222`). Create/update/publish/archive/media mutations bump the local cache; publish/archive/media changes request the optional frontend deploy hook.

### Customer/public readers

- `GET /api/v1/catalog` returns only published items; optional `type` and `tripType` filters are parsed by `PublicCatalogQuerySchema` and service filters (`catalog.service.ts:172-183`). Each item includes published media gallery and cover.
- `GET /api/v1/catalog/:slug` resolves by slug or ID but rejects non-published items (`:225-236`). Published reviews are joined by catalog ID.
- `GET /api/v1/media/:id` returns bytes only when media and parent item are published unless authenticated staff preview is allowed (`catalog.controller.ts:130-151`, service `:507-541`). This matches migration 0019’s public RLS predicate.
- React `fetchPublishedCatalog` normalizes all public item fields and filters empty gallery URL entries (`react/src/services/catalog.ts:85-140`). `LiveCatalogSection` reads the endpoint for package/tour/route/ride, renders the cover via `resolveCatalogMediaUrl`, and intentionally renders nothing if no live items/API failure (`LiveCatalogSection.tsx:12-18,40-72,96-122`).
- `fetchCatalogManifest` uses the manifest endpoint with ETag/localStorage/in-memory cache, then falls back to cached manifest and `/routes-manifest.json` (`react/src/services/catalogManifest.ts:44-175`).

### Manifest source-of-truth caveat

The backend comments call the catalog the single source of trips, but `react/src/services/catalogManifest.ts:179-223` starts `loadPublishedPackages()` with the static SSG `packages` array, overlays manifest packages, then overlays the separate `/api/v1/tour-packages/manifest` dossier endpoint. `PackagesPage.tsx` uses this function. Therefore an archived/deleted catalog item can still be visible on the packages page if its slug exists in the static baseline or dossier source, even though it disappears from `/api/v1/catalog` and the backend manifest. This is the previously documented dual-source condition (`reports/phase1-table-scan-findings.md:76,92-95`) and requires an explicit source-of-truth decision (CAT-05).

## 4. Relationships and cross-table lifecycle

- `catalog_item_media.catalog_item_id → catalog_items.id`, `ON DELETE CASCADE`; deleting a parent removes child media. The service also removes an object-store object before deleting media when it is a bucket-backed admin upload (`catalog.service.ts:476-503`). There is no direct database write for parent deletion; the catalog API archives rather than deletes items.
- `bookings.selected_catalog_item_id → catalog_items.id`, `ON DELETE SET NULL`. The booking service resolves a `BookingSelection` with `source=catalog` and a published item into `selectedCatalogItemId` (`backend/src/modules/bookings/booking.service.ts:22-57,275-280`). Outstation/curated selections deliberately leave this FK NULL. A booking therefore snapshots/retains its semantic selection while the FK is nullable for non-catalog choices.
- `reviews.catalog_item_id → catalog_items.id`, `ON DELETE SET NULL`. Public item detail joins only published reviews by catalog ID; review submission/moderation is a separate workflow. A review can survive catalog archival/deletion without forcing a catalog row.
- `created_by`, `updated_by`, `approved_by` are UUIDs without actor FKs in the catalog migrations; application role checks, not DB references, provide attribution authorization.
- `admin_audit_logs` records item/media mutations and manifest republish; it is not an FK child and is retained as an audit trail.
- Catalog data is distinct from dossier tables (`tour_packages`, `local_sightseeing_packages`, `transfer_routes`, etc.). Those tables are populated in the live database while these two legacy/live-catalog tables are currently empty. The manifest’s backend package list only reads `catalog_items`; the React package reader also reads dossier/static sources.

## 5. Exact mismatch register

### CAT-01 — Medium — DB slug width (150) exceeds API/domain maximum (80)

**Evidence:** migration `0017_widen_catalog_slug.sql:1-2` documents a 150-character DB slug for the 980+ route inventory. `CatalogSlugParamSchema` and create schema cap slugs at 80 (`catalog.schema.ts:11-13,23-27`); admin input is passed through the same API. `BookingSelection` separately permits 120-character IDs/slugs (`bookingSelection.ts:3-4`).

**Impact:** A valid DB value up to 150 characters cannot be created/read through the catalog API, and the intended expanded route inventory has inconsistent length contracts. No live row currently demonstrates the failure because the table is empty.

**Fix:** Choose one canonical limit. Prefer 150 end-to-end if the migration’s route-inventory requirement remains: update Zod slug/param limits, admin type/API validation, booking-selection slug limit, and any frontend route constraints; add a boundary test at 150. Alternatively revert the DB width only through a reviewed migration after proving no long slugs exist.

### CAT-02 — Medium — PATCH does not enforce `availability=limited` ⇒ positive `seats_left`

**Evidence:** create schema has the refinement (`catalog.schema.ts:50-53`), but `UpdateCatalogSchema` is built from `CreateCatalogObjectSchema.partial().extend({status})` (`:55-57`) and therefore omits that refinement. The DB only checks `seats_left IS NULL OR seats_left >= 0` (`0018:30-33`), not the cross-field rule. Admin UI displays the same rule but cannot prevent a crafted PATCH.

**Impact:** An update can persist `availability=limited` with `seats_left=0` or NULL, producing an invalid “limited seats” state and inconsistent urgency messaging.

**Fix:** Apply the same refinement to the update schema (or a shared cross-field schema), and add a DB check if this invariant must hold for all writers. Add create and PATCH tests for null, zero, and positive seats.

### CAT-03 — Medium — Type changes can leave a package/route with a multi-image gallery

**Evidence:** gallery policy is `place=12`, every other type=1 (`domain.ts:76-85`, admin types `types.ts:106-118`). `attachMedia` enforces the limit only when adding media based on the current item type (`catalog.service.ts:379-393`). Admin PATCH permits changing `type` (`UpdateCatalogSchema` and `CatalogPage.tsx:355-371`) but does not reconcile existing media.

**Impact:** A `place` with two or more media can be changed to `package`, `tour`, `route`, `ride`, or `vehicle`; it then violates the stated single-cover policy and public `gallery` returns multiple entries. No live rows exist, and existing tests cover adding media but not changing type after a gallery exists.

**Fix:** Either make `type` immutable after media exists, reject a type change that exceeds the target limit, or explicitly archive/retain only the cover in a reviewed transition. Add a bounded in-memory regression test.

### CAT-04 — Medium — Backend accepts videos but customer reader/storage path is image-only

**Evidence:** `AttachMediaSchema` permits `mediaType=video` but requires `storagePath` for videos (`catalog.schema.ts:73-88`). The public gallery exposes `mediaType`, but `LiveCatalogSection` renders every cover as `<img src=...>` (`LiveCatalogSection.tsx:102-117`); the API has no video-specific renderer. `media.storage.ts:38-53` maps only image MIME extensions, and `getMediaContent` requires a MIME type and only handles inline/object-storage bytes (`catalog.service.ts:512-540`). Admin UI currently offers image upload/path only, so the defect is latent rather than observed in live data.

**Impact:** A video accepted through the API can be published and returned to public readers but display as a broken image or be unservable through `/api/v1/media`.

**Fix:** Either remove `video` from the schema/domain/DB check until end-to-end video delivery exists, or implement a video-capable public component, MIME/storage handling, and explicit tests for path and object-backed videos.

### CAT-05 — Medium/High — Public package pages do not have one authoritative catalog source

**Evidence:** backend manifest packages are built only from published `catalog_items` (`catalog.service.ts:98-141`), but React `loadPublishedPackages` first loads static `packages`, then overlays catalog manifest packages, then overlays dossier `/api/v1/tour-packages/manifest` (`catalogManifest.ts:179-223`). The phase-one report already flags catalog tables versus dossier content as a source-of-truth decision.

**Impact:** Catalog archive/public removal is guaranteed for `/api/v1/catalog` and the backend manifest, but not necessarily for package pages using the merge. A same-slug static/dossier package can remain visible after its catalog row is archived. This also makes price/image/status provenance ambiguous.

**Fix:** Declare the canonical source. If catalog tables are canonical, remove or status-gate static/dossier overlays for matching slugs and make fallback explicit only when the live API is unavailable; if dossier tables are canonical, stop advertising catalog as the single source and add a deliberate adapter/manifest path. Add a cross-source collision/archive test.

### CAT-06 — Low — `source_type` DB contract is looser than domain contract

**Evidence:** DB column is an unconstrained `varchar` (`0007:29` and live inventory), while domain union permits only three values (`domain.ts:280-283`). Current service always writes `admin_upload`, so no live error is observed.

**Fix:** Add a DB check or widen/version the domain contract and provide explicit writers for customer/supplier sources. At minimum validate mapper values before returning them.

### Operational limitation (not classified as a confirmed live defect)

Manifest cache/version/ETag are process-local (`catalog.service.ts:23-34`). In a multi-instance deployment, an admin mutation or republish on one instance does not invalidate another instance’s in-memory manifest. The repository does not contain a distributed invalidation mechanism. Confirm deployment topology before classifying this as a production defect; a persisted manifest version or shared cache/invalidation channel would be the bounded fix.

## 6. Intentional NULL/empty states versus defects

Intentional states established by code/schema:

1. `catalog_items.distance_km`, `seats_left`, and `trip_type` are nullable for content types without route distance, seat inventory, or trip classification.
2. `catalog_items.stops='{}'` is a deliberate empty array for offerings with no intermediate stops.
3. `catalog_items.published_at=NULL` before first publication; archived rows may retain a historical timestamp.
4. `catalog_item_media.caption`, `copyright_owner`, `created_by`, `approved_by`, `published_at`, `mime_type`, `content_base64`, and `size_bytes` are nullable because caption/licensing/approval are conditional and storage mode determines MIME/bytes/size ownership.
5. `content_base64=NULL` for path references and object-storage uploads; inline DB fallback is used only when no media storage backend is configured.
6. Empty live tables are intentional in the current environment: catalog rows are created only by the admin CMS/seed script, and no live catalog CMS seed has been applied. The dossier tables are a separate populated source.

Potential defects/gaps rather than intentional absence:

- Limited availability with NULL/0 seats on PATCH (CAT-02).
- Missing copyright-owner attribution on all current CMS uploads if licensing requires it (the API hard-codes NULL).
- Video rows accepted without a public video reader (CAT-04).
- Cross-source package visibility after archive (CAT-05).

## 7. Bounded lifecycle testing and read-only boundary

The existing in-memory/application tests were run; they do not mutate production:

- `npm test -- --run tests/integration/catalog-manifest-f4.test.ts`: **6/6 passed**. Covers ETag/304, draft/archive exclusion, publish/archive version invalidation, republish audit, published media cover replacement, and published route override/archive behavior.
- `npm test -- --run tests/integration/catalog-live.test.ts tests/unit/media-visibility.test.ts`: **10/10 passed**. Covers published-only public listing, commercial field round-trip, media limit (one cover except place gallery), inline upload/immutable serving, admin validation/body limit, fleet exposure, and anonymous draft/archived media denial.

These tests are bounded because `createTestApp` uses in-memory repositories/test fixtures. They do not validate current live rows (there are none) or object-storage credentials. A production lifecycle test must remain read-only: current production tables are empty, and creating/publishing/archiving a real row would be a production write. A safe follow-up is a disposable Supabase branch or isolated local database seeded only with a test fixture, then assert:

1. Create draft item → no public listing/manifest entry; all required DB columns are persisted.
2. PATCH all commercial fields, including `limited` with null/0/positive seats (expected rejection for invalid values after CAT-02 fix).
3. Add inline and path media; assert storage-mode-specific nulls and parent/media publication gate.
4. Publish item → `/catalog`, detail, cover/gallery, booking selection resolution, and manifest agree; ETag/version changes.
5. Change/archive item → public readers and manifest remove it, FK-linked booking/review behavior remains correct; parent delete in a disposable DB cascades media.
6. Create a place gallery then change type to a single-cover type (expected rejection/controlled archive after CAT-03 fix).
7. Exercise a deliberate slug boundary and video decision.

## 8. Recommended implementation order

1. Decide catalog versus dossier/static source of truth (CAT-05) before additional content population.
2. Fix the PATCH cross-field availability invariant and add a DB-level check if direct writers must be protected (CAT-02).
3. Resolve slug length canonically across DB, Zod, booking selection, admin, and public routes (CAT-01).
4. Prevent invalid media-limit transitions on type changes (CAT-03).
5. Remove unsupported video acceptance or complete video delivery (CAT-04).
6. Add `source_type` constraint and/or copyright-owner workflow if supplier/customer media is planned (CAT-06 and governance gap).
7. Add the bounded disposable-DB lifecycle suite and, only after source-of-truth is selected, verify distributed manifest invalidation for the actual deployment topology.
