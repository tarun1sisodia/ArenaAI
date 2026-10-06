# Table Audit 14 — `tour_packages` and `package_vehicle_upgrades`

**Audit scope.** This audit covers exactly `public.tour_packages` and `public.package_vehicle_upgrades`, their migrations, backend domain types/Zod contracts/mappers/SQL/services/controllers/routes, admin client/form/page code, fare readers, and customer/public readers. It also traces the one foreign-key relationship and the publication/fare lifecycle.

**Safety.** No production writes, migrations, deletes, webhook replays, or external submissions were performed. The live checks below were read-only Supabase MCP SQL queries against project `trcmufqbpcymipqpemoq`.

## Evidence reviewed

- `reports/live-schema-inventory.md` (generated from live Supabase `list_tables`, 2026-10-05), especially rows 30–31 and target definitions at rows 510–560.
- `reports/schema-model-alignment.md`, including the statement that Tour Packages aligned after migrations 0025/0030/0031 and the RLS advisory.
- `reports/schema-audit-findings.md` and `reports/phase1-table-scan-findings.md`, especially the prior conclusion that 11 packages and 4 upgrades are live, and that upgrades are separate rows rather than embedded package data.
- `reports/2026-10-06-16-table-alignment-execution-plan.md` for the required database → backend → admin → public → persisted-row chain and read-only constraint.
- Migrations `0024_dossier_content.sql`, `0025_remove_tour_package_legacy_pricing.sql`, `0030_tour_packages_gallery.sql`, and `0031_tour_packages_source_dest_inclusions.sql`.
- Backend `dossier-types.ts`, `db/types.ts`, `db/postgres.ts`, `db/memory.ts`, `db/dossier-seeds.ts`, `modules/tour-packages/*`, and fare service/engine.
- Admin `src/pages/TourPackagesPage.tsx`, `src/lib/api.ts`, and `src/lib/types.ts`.
- Customer/public `react/src/services/catalogManifest.ts`, `react/src/data.ts`, `DynamicPackageDetailPage.tsx`, and `PackageDetailPage.tsx`.

Backend and admin TypeScript checks both passed (`backend npm run typecheck`, `admin npm run typecheck`).

## Current live population and read-only null/empty check

The live inventory reports:

| Table | Rows | Status/RLS |
|---|---:|---|
| `tour_packages` | 11 | 1 published, 2 draft, 8 archived; RLS disabled |
| `package_vehicle_upgrades` | 4 | RLS disabled |

The read-only MCP query confirmed:

- `tour_packages`: 11 total; `published=1`, `draft=2`, `archived=8`.
- `image_url IS NULL`: 4/11.
- `gallery = []`: 4/11.
- `destination = ''`: 9/11.
- `inclusions = []`: 9/11.
- `exclusions = []`: 9/11.
- `itinerary = []`: 10/11.
- `inclusions_highlight IS NULL`: 0/11.
- `inclusions_note IS NULL`: 6/11.
- `package_vehicle_upgrades`: 4 rows; all 4 have `package_id IS NULL` (global upgrades), all 4 have non-null `passenger_note`, and all 4 have positive non-zero surcharges (`800`, `1800`, `3500`, `5500`). There are currently **0 package-specific upgrade rows** and **0 orphaned non-null package IDs**.
- The four global upgrade tiers are `ertiga`, `innova`, `tempo`, and `urbania`; no global `sedan` row is expected because sedan is the base tier.

The nine blank destinations, empty inclusion/exclusion arrays, and most empty itineraries are concentrated in archived/legacy rows. The single published row has a non-empty destination and inclusions/exclusions/itinerary. Four current rows are explicit test/throwaway or draft content according to the live package codes (`test-throwaway-1791104709066`, `test-throwaway-lifecycle`, and current drafts); this audit did not delete or alter them.

## Schema and lifecycle matrix — `tour_packages`

Live columns and defaults are from `reports/live-schema-inventory.md` rows 510–537; creation originated in migration 0024 and later columns in migrations 0030 and 0031.

| Column | Live type / nullability / default | What fills it, condition, and writer | NULL/empty meaning and assessment |
|---|---|---|---|
| `id` | `uuid NOT NULL`, default `gen_random_uuid()` | PostgreSQL default fills on direct SQL inserts; backend service creates `newId()` and explicitly sends it in `toRecord()`; memory seed supplies stable UUIDs. | Never intentionally empty. Aligned. |
| `package_code` | `text NOT NULL`, unique, regex `^[a-z0-9-]{2,80}$` | Admin create form derives a slug from the name and sends `package_code`; `CreateTourPackageSchema` validates it. Backend checks uniqueness before `tourPackages.create()`. It is immutable on update because it forms the public URL. | Never empty. DB unique constraint and service check are aligned. |
| `name` | `text NOT NULL` | Admin create/update form; strict Zod `cleanText(2,100)` strips HTML and trims. | Never empty. Aligned. |
| `duration_text` | `text NOT NULL` | Admin form; strict Zod `cleanText(2,60)`. | Never empty. Aligned. |
| `days` | `int4 NOT NULL`, default `1` | Admin form; Zod integer 1–30/default 1; service passes through. | Never NULL; `1` is the intentional one-day default. Aligned. |
| `nights` | `int4 NOT NULL`, default `0` | Admin form; Zod integer 0–30/default 0. | `0` intentionally means no overnight stay. Aligned. |
| `base_tier_code` | `text NOT NULL`, default `'sedan'` | Admin form default `sedan`; Zod cleaned text/default; fare engine uses this as package base metadata. | Never NULL; no database enum/check exists, so invalid tier text is possible at DB direct-write level. Application path is bounded but the database has no canonical-tier constraint (low hardening gap, not a currently observed row defect). |
| `starting_price_inr` | `numeric NOT NULL`, check `> 0` | Admin fleet-price editor keeps it synchronized to the base tier; Zod positive finite max 1,000,000; fare service uses it only as fallback when tier-specific price is unavailable. | Never NULL/zero. Aligned. |
| `fleet_prices` | `jsonb NOT NULL` | Admin sends the five canonical fleet prices; Zod requires a record of positive finite numbers; PostgreSQL mapper serializes JSON. Fare service reads this as the primary fixed-price source for published tour packages. | Never NULL. Empty object is not rejected by Zod, so a direct/application payload can omit all tiers and force fallback pricing; no such live defect was asserted by the read-only check. Recommended hardening is to require canonical tier keys. |
| `night_charge_inr` | `numeric NOT NULL`, default `0` | Admin form; Zod nonnegative/default 0; fare service reads it for package fare calculation. | `0` intentionally means no separate night charge. Aligned. |
| `inclusions_highlight` | `text NULL` | Admin short-summary field; Zod optional cleaned string; `toRecord()` maps absent to `null`; mapper preserves null. | NULL means no short highlight. Current live value is populated for all 11 rows. Intentional nullable field, not a defect. |
| `inclusions_note` | `text NULL` | Admin optional long note; Zod optional cleaned string; absent/blank admin payload is sent as `undefined`, service preserves or maps null. | NULL intentionally means no additional note; 6/11 are NULL. Not a defect. |
| `status` | `text NOT NULL`, default `'draft'`, check `draft/published/archived` | Create defaults to draft; admin publish/archive endpoints call dedicated service methods; update can carry status through backend schema but admin form publishes separately. Public manifest/by-code filters to published. | Draft/archived are intentional workflow states. Aligned. |
| `is_active` | `boolean NOT NULL`, default `true` | Admin form sends the boolean; Zod default true; service/repository persist it. | `true` is the intended default. Public readers currently gate on `status=published`, not `is_active`; this is a semantic observation: setting a published package inactive would not remove it from these readers. If `is_active` is intended as a kill switch, add the filter; otherwise document it as metadata. |
| `created_at` | `timestamptz NOT NULL`, default `now()` | Backend service uses its clock and sends `createdAt`; direct SQL uses DB default. | Never NULL; provenance timestamp. Aligned. |
| `updated_at` | `timestamptz NOT NULL`, default `now()` | Service sets a new ISO time on create/update/publish/archive; migration trigger conventions also exist for tables. | Never NULL; updated on lifecycle writes. Aligned. |
| `image_url` | `text NULL` | Admin can select a preset, add a custom URL, or upload through `/ops/admin/tour-packages/upload-image`; save payload sends `image_url` only when set. Migration 0030 seeded known legacy rows. | NULL means no cover image; 4/11 are NULL. Public mapper falls back to a static Taj image, so this is intentional resilience for draft/legacy rows, but a published package should normally have a cover. Current published row is NULL, so the public fallback is active for that row; classify as content completeness risk, not persistence loss. |
| `gallery` | `jsonb NOT NULL`, default `[]` | Admin page manages presets/uploads/custom URLs and sends `gallery`; migration 0030 seeded legacy gallery values. Mapper maps non-array to `[]`. | `[]` intentionally means no gallery; 4/11 are empty. Public mapper preserves array and detail page displays gallery when present. Published row currently has empty gallery, which is a content gap but not a nullability defect. |
| `source` | `text NOT NULL`, default `'Agra'` | Migration 0031 default/backfill; admin form sends trimmed value or `Agra`; service and SQL use `record.source ?? 'Agra'`; public mapper uses `item.source || 'Agra'`. | Never NULL. `Agra` is intentional default. Aligned. |
| `destination` | `text NOT NULL`, default `''` | Migration 0031 permits/creates empty default; admin form sends `form.destination.trim() || ''`; service preserves empty; public mapper falls back to package name when empty. | Empty means destination not yet authored in legacy/draft data. **There is a confirmed input-contract mismatch:** Zod declares `cleanText(1,200).default('')`, but an explicitly sent empty string fails the `min(1)` check. The admin form explicitly sends `''` when blank. Thus a new admin package with blank destination cannot be created even though DB/service defaults allow empty and 9/11 live rows are empty. See findings F-2. |
| `inclusions` | `jsonb NOT NULL`, default `[]` | Migration 0031 baseline population; admin inclusion manager sends string array; Zod max 50; service/repository JSON serialize. | `[]` means no structured inclusion list. 9/11 are empty, mostly archived/legacy; published baseline is populated. Public mapper supplies a presentation fallback when empty. Intentional for legacy rows, but new admin records default to empty unless editor adds items. |
| `exclusions` | `jsonb NOT NULL`, default `[]` | Same path as inclusions; admin exclusion manager sends string array; Zod max 50. | `[]` means no structured exclusion list; 9/11 are empty. Intentional legacy/default state, with public fallback. |
| `itinerary` | `jsonb NOT NULL`, default `[]` | Migration 0031 populated one baseline package; backend schema/service/mappers support an array of `{time?,title,desc}`; however `TourPackagesPage` does not expose an itinerary editor and its save payload omits `itinerary`, so new admin-created rows remain `[]` unless another caller supplies it. | `[]` is a supported fallback state; 10/11 are empty. `PackageDetailPage` generates a fallback timeline from `places`/static defaults. This is a confirmed authoring gap/feature integration gap (F-4), not a database null defect. |

### Backend ownership and persistence path

- `TourPackageRecord` is in `backend/src/db/dossier-types.ts` lines 45–69. The newer source/destination/content fields are optional in the TypeScript record even though the live DB columns are `NOT NULL`; the mapper and SQL apply the DB-compatible defaults (`Agra`, `''`, `[]`). This is tolerant backwards compatibility, not observed data loss.
- `CreateTourPackageSchema`/`UpdateTourPackageSchema` are strict in `tour-packages.schema.ts` lines 26–65. Update is partial, with status allowed separately.
- `mapTourPackage()` in `backend/src/db/postgres.ts` lines 86–112 reads all live columns and maps JSON arrays/defaults; `create()` and `update()` at lines 741–768 write every live package column.
- `tour-packages.service.ts` lines 20–45 maps admin snake_case input to the domain record; lines 70–131 implement create/update; lines 133–161 implement publish/archive/draft-only deletion.
- The in-memory repository mirrors package CRUD and is used for isolated tests, but it does not emulate PostgreSQL unique/FK constraints (see F-5).

## Schema and lifecycle matrix — `package_vehicle_upgrades`

Migration 0024 lines 72–85 creates the table, `package_id` FK, and two partial unique indexes.

| Column | Live type / nullability / default | What fills it, condition, and writer | NULL/empty meaning and assessment |
|---|---|---|---|
| `id` | `uuid NOT NULL`, default `gen_random_uuid()` | Service generates `newId()` unless an update payload supplies an ID; SQL insert receives it. Seed rows use stable UUIDs. | Never intentionally empty. |
| `package_id` | `uuid NULL`, no default; FK to `tour_packages(id)` `ON DELETE CASCADE` | Upgrade service accepts `package_id` nullable. `NULL` is deliberately used for global tier upgrades; non-null is intended for a package-specific override. Admin/seed writer currently seeds four global rows. | NULL is **intentional**, not a defect: all four live rows are global. A non-null ID must reference an existing package in PostgreSQL. Current live data has no package-specific row, so the package-specific override branch is unexercised. |
| `tier_code` | `text NOT NULL` | Upgrade Zod schema cleans 2–40 chars; service maps `tier_code`; seeded values are canonical vehicle IDs. | Never NULL. DB has no tier enum/check; direct SQL could write unknown tier. Application/fare mapping expects canonical internal/public keys. |
| `passenger_note` | `text NULL` | Upgrade schema optional cleaned text; service maps absent to null; seeds provide notes. | NULL means no passenger/capacity note. Current 0/4 are NULL. Intentional nullable field. |
| `surcharge_inr` | `numeric NOT NULL`, default `0` | Zod nonnegative max 100,000; service maps numeric; fare service overlays global then package-specific surcharges. | `0` is valid and intentionally means no additional charge; current four rows are positive. No DB nonnegative check exists, so direct SQL can violate application rule (low hardening gap). |
| `created_at` | `timestamptz NOT NULL`, default `now()` | Service clock on upgrade save; direct SQL default. | Never NULL. |
| `updated_at` | `timestamptz NOT NULL`, default `now()` | Service clock on save; SQL conflict branch updates it. | Never NULL; should change on a successful upsert. |

### Upgrade lookup and precedence

- `db.tourPackages.listUpgrades(packageId)` is specified in `backend/src/db/types.ts` lines 137–147.
- PostgreSQL `listUpgrades(packageId)` at `postgres.ts` lines 802–806 returns rows where `package_id=$1 OR package_id IS NULL`; with no ID it returns global rows only. The in-memory implementation mirrors this behavior at `memory.ts` lines 504–508.
- `tour-packages.controller.ts` uses this in the public manifest and by-code reader: it loads global upgrades, then package lookup, and returns package rows if present or global rows otherwise. Because the repository query already includes global rows, the effective intended result is global defaults plus package-specific overrides.
- `fare.service.ts` lines 84–110 loads global and package-specific rows separately and overlays package-specific `tierCode` values on the global map. `fare.engine.ts` lines 208–230 uses fixed package fleet prices first, then package base plus upgrade surcharge fallback; it never falls through to per-km pricing for a tour package.

## Foreign keys and cross-table lifecycle

1. `package_vehicle_upgrades.package_id → tour_packages.id` is the only direct relationship. Migration 0024 specifies `ON DELETE CASCADE`; deleting a draft package through the service therefore deletes any attached upgrades in PostgreSQL. The service refuses deletion of published/archived packages and requires archive instead, protecting public history. The in-memory repository does not cascade package deletion because its package delete method only removes the package map entry; this is a test-parity gap, not a live FK failure.
2. `package_id IS NULL` is the global/default lifecycle. Global rows are returned for every published package unless package-specific rows override the same tier.
3. A package-specific upgrade is saved by the admin POST endpoint with a UUID package ID; PostgreSQL FK validation is the final existence check. The current live state has no package-specific rows, so this branch requires a controlled disposable test before production use.
4. Package publication controls visibility. `manifest` and `by-code/:code` reject non-published packages; fare calculation also requires `status === 'published'`. `is_active` is persisted but not used by these readers.
5. A published package create/update/publish/archive operation triggers a frontend rebuild hook. Image uploads are stored in an in-memory cache and optionally remote media storage; the package row only stores URL/gallery metadata.
6. The booking/fare path reads the package by ID or package code, uses authoritative server-side fleet prices/upgrades, and produces booking fare data. It does not write back to either audited table.

## Writers and readers

### Writers

- **Migrations:** 0024 creates/seeds the domain tables; 0025 drops legacy `use_per_km`/`flat_charge_inr`; 0030 adds/seed-fills `image_url`/`gallery`; 0031 adds/seed-fills source/destination/inclusions/exclusions/itinerary.
- **Admin package CRUD:** `POST/PATCH /api/v1/ops/admin/tour-packages`, publish/archive/delete routes, guarded by content/super-admin roles in `tour-packages.controller.ts`. `TourPackagesPage.tsx` builds snake_case payloads at lines 379–398.
- **Admin upgrade CRUD:** POST `/api/v1/ops/admin/tour-packages/upgrades` and DELETE `/api/v1/ops/admin/tour-packages/upgrades/:id`, guarded by content roles. The backend service supports global (`package_id=null`) and package-specific rows.
- **Seeds:** `dossier-seeds.ts` lines 126 onward seed packages for memory mode and lines 273–310 seed four global upgrades. The live rows match the four global tier pattern.
- **No webhook/job/cache writes:** none of the audited tables are written by payment webhooks, notification jobs, or cache jobs.

### Readers

- **Public backend:** `GET /api/v1/tour-packages/manifest`, `GET /api/v1/tour-packages/by-code/:code`, and public upgrade GET route. Only published packages are exposed.
- **Customer React:** `loadPublishedPackages()` and `fetchTourPackageBySlug()` in `catalogManifest.ts`; `toDossierTourPackage()` maps live backend camelCase fields into `TourPackage`; `DynamicPackageDetailPage` passes it to `PackageDetailPage`.
- **Fare engine:** authoritative package and upgrade reads described above.
- **Admin:** package list/detail response is consumed by `TourPackagesPage`; admin upgrade client methods exist but are not called by any admin page.

## Confirmed mismatches and findings

### F-1 — **High: PostgreSQL upgrade upsert cannot match the partial unique indexes**

**Evidence:** Migration 0024 creates only partial unique indexes:

- global uniqueness: `(tier_code) WHERE package_id IS NULL`;
- package uniqueness: `(package_id, tier_code) WHERE package_id IS NOT NULL`.

`backend/src/db/postgres.ts` lines 808–816 issues:

```sql
insert into package_vehicle_upgrades (...)
values (...)
on conflict (package_id, tier_code)
do update set ...
```

PostgreSQL cannot infer that unconstrained `ON CONFLICT (package_id, tier_code)` target from either partial index. The global index also has a different conflict column list and NULL never conflicts normally. Therefore the production Postgres save path is expected to fail with “there is no unique or exclusion constraint matching the ON CONFLICT specification” before it can save either a global or package-specific row. The in-memory map path masks this because it simply sets by ID.

**Severity:** High for upgrade administration and lifecycle correctness. The four current seed rows exist, but an attempted admin upgrade save/update is not proven functional and is structurally blocked by the SQL/index contract.

**Fix:** Use two explicit branches in a transaction (or a select/update/insert strategy): one `ON CONFLICT (tier_code) WHERE package_id IS NULL` branch for global rows and one `ON CONFLICT (package_id, tier_code) WHERE package_id IS NOT NULL` branch for package-specific rows, with a regression test against PostgreSQL. Return the actual persisted row ID rather than blindly returning the input record after a conflict.

### F-2 — **Medium: Admin GET upgrade client has no matching route and also uses the wrong query key**

**Evidence:** `admin/src/lib/api.ts` lines 643–646 calls:

```text
/api/v1/ops/admin/tour-packages/upgrades?package_id=...
```

But `tour-packages.routes.ts` lines 14–17 registers only the public GET route `/api/v1/tour-packages/upgrades`; there is no GET route under `/api/v1/ops/admin/tour-packages/upgrades`. Even if the client path is corrected, `tour-packages.controller.ts` lines 90–92 reads `request.query.packageId` (camelCase), while the client sends `package_id` (snake_case), so a package-specific request would be interpreted as `null` and return global rows.

**Severity:** Medium/high for the admin upgrade read contract; currently hidden because no admin page calls the method.

**Fix:** Choose one route/query contract. Recommended: add a guarded admin GET route only if admin-specific access is required, or use the public read route for the same non-sensitive content; accept/validate `packageId` consistently (or translate `package_id` at the boundary). Add an endpoint contract test for global and package-specific reads.

### F-3 — **Medium: Upgrade CRUD exists in backend/API types but is not wired to the admin page**

**Evidence:** `TourPackagesPage.tsx` imports package CRUD methods only (lines 10–18); it contains no calls to `fetchTourPackageUpgrades`, `saveTourPackageUpgrade`, or `deleteTourPackageUpgrade`. `rg` confirms those upgrade API methods appear only in `admin/src/lib/api.ts`, not in an admin component/page. The page has no upgrade editor. The live four rows therefore come from seed/migration data and cannot be maintained through the current CMS UI.

**Severity:** Medium product/admin lifecycle gap. It is not a database persistence defect, but it prevents an operator from creating the package-specific rows needed to test override precedence.

**Fix:** Add a bounded upgrade matrix editor to the package page (or a dedicated admin page), with global/package-specific scope, canonical tier selection, surcharge/note validation, and explicit reload after save. Wire it to the corrected route and add UI/API contract tests.

### F-4 — **Medium: Itinerary is persisted/read but cannot be authored in the current admin form**

**Evidence:** Zod/service/SQL all support `itinerary`, and the public detail page renders it when non-empty. However `TourPackagesPage.tsx` save payload lines 379–398 omits `itinerary`, and the page has no itinerary editor. Live SQL reports 10/11 rows with `itinerary=[]`; the customer reader then generates static/place-based fallback stops.

**Severity:** Medium content-authoring gap. The fallback keeps the page usable, so it is not a data-loss defect for existing rows.

**Fix:** Add an ordered itinerary editor or explicitly document that itinerary is migration/seed-only and the fallback is the supported behavior. If editorial itinerary is required, make published-package validation require non-empty itinerary.

### F-5 — **Low/Medium test-parity gap: memory repository does not enforce FK, unique-index, or cascade semantics**

`db/memory.ts` accepts arbitrary `packageId`, does not enforce the two partial uniqueness rules, and package deletion does not remove attached upgrade rows. This is useful for unit tests but cannot validate the production constraints and would not expose F-1. Add repository contract tests or a disposable Postgres/Supabase branch test after SQL is fixed. No production mutation was performed in this audit.

### F-6 — **Configuration blocker: RLS is disabled on both audited tables**

The live inventory and prior advisory report RLS disabled on `tour_packages` and `package_vehicle_upgrades` (part of the 12-table advisory set). This is not a mapper/schema mismatch, but direct Supabase `anon`/`authenticated` access is not protected by table RLS. Do not blindly enable RLS: define reviewed public-read policies, deny direct client writes, and reserve writes for the authenticated backend/service role in a separate security migration. This audit made no policy changes.

## Intentional NULL/empty states versus defects

- `tour_packages.inclusions_highlight=NULL`: intentional optional long-lived content; currently no NULLs.
- `tour_packages.inclusions_note=NULL`: intentional optional note; 6/11 NULL.
- `tour_packages.image_url=NULL`: intentional for rows without a cover; 4/11, with public static fallback. For a published row it is a content-completeness concern, not a persistence defect.
- `tour_packages.gallery=[]`: intentional no-gallery state; 4/11. Published row currently uses fallback/no gallery; content issue only.
- `tour_packages.destination=''`: allowed by DB/service for legacy/default state, but explicit empty admin input conflicts with Zod min length (the destination mismatch is F-7 below; F-2 is the separate upgrade GET route/query-key issue).
- `tour_packages.inclusions/exclusions=[]`: intentional default/legacy state; public reader supplies conservative fallback text. Published row is populated.
- `tour_packages.itinerary=[]`: supported fallback state; current admin cannot author it (F-4).
- `package_vehicle_upgrades.package_id=NULL`: intentional global default scope; all four current rows are global.
- `package_vehicle_upgrades.passenger_note=NULL`: intentional optional note; none current.
- `surcharge_inr=0`: valid no-surcharge state; none current.

### F-7 — **Medium: destination schema default is internally contradictory**

This is separated from the upgrade GET issue to avoid ambiguity. `tour-packages.schema.ts` uses `cleanText(1, 200).default('')`, while migration 0031 and the service explicitly allow `destination=''`, and the admin form sends `''` when blank. Explicit `''` fails the schema's minimum length. Fix by making destination truly required (`cleanText(1,200)` with a UI requirement and no empty DB default) or by using an optional/nullable/empty-allowed schema that matches the existing data contract. Current published content is non-empty, but new blank-destination draft creation is blocked.

## Bounded lifecycle test plan (read-only audit disposition)

No live lifecycle mutation should be run as part of this audit because the requested scope prohibits production writes, migrations, deletes, and external submissions, and the current live set includes published content plus test/throwaway rows.

1. **In-memory unit contract (safe/disposable):** create a draft package with all required fields, verify mapper defaults, update content, publish, confirm the public service hides draft and returns published, archive, and verify draft-only delete guard. Run global upgrade lookup and fare evaluation to confirm fixed fleet price precedence and global surcharge fallback.
2. **Schema contract test (no DB write):** parse a representative admin payload through create/update/upgrade Zod schemas, including explicit blank destination, global `package_id=null`, and package-specific UUID. Assert the intended decision for blank destination after F-7 is fixed.
3. **Static SQL/index contract test:** inspect migration indexes and assert the repository uses a conflict target with a matching predicate; this catches F-1 without touching production.
4. **Disposable Postgres/Supabase branch test after fixes:** in a fresh branch/test database only, insert a draft package, insert a global upgrade, insert a package-specific upgrade, read by package and verify global+specific precedence, update each natural key, delete the draft and verify `ON DELETE CASCADE`. This is the correct place to validate FK and partial-index behavior; it was intentionally not run against the live project.
5. **Read-only live checks already completed:** current counts/null/empty distributions, global/package-specific upgrade split, orphan count, and status distribution were obtained through Supabase MCP read-only SQL. No admin authentication, public write, publish, archive, or delete action was invoked.

## Recommended fix order

1. **Fix F-1 first:** make PostgreSQL upgrade save/upsert compatible with the partial unique indexes and return the actual persisted row.
2. Fix F-2 route and query-key contract; add global/package-specific GET tests.
3. Add/enable an admin upgrade editor (F-3) and test it against a disposable DB.
4. Resolve F-7 destination semantics; either require destination consistently or permit empty consistently.
5. Decide whether itinerary is required editorial content; if yes, add editor and publish validation (F-4).
6. Add repository contract tests for FK/partial uniqueness/cascade (F-5).
7. Separately review RLS policies for both tables (F-6); do not apply bare `ENABLE ROW LEVEL SECURITY` without reviewed policies.

## Overall conclusion

The package table’s ordinary create/update/publish/read mapping is substantially aligned and the live published row is readable through the public fallback path. Nullable content fields and global upgrade rows are intentional. The principal database defect is the PostgreSQL upgrade upsert conflict target, which does not match the partial unique indexes and blocks upgrade writes. The principal application-contract defects are the missing admin GET route/wrong query key, lack of any admin upgrade UI, and the contradictory blank-destination schema. Public fare calculation does consume global/package-specific upgrade rows server-side, but the React public mapper currently drops the `upgrades` property and the package page does not render an upgrade matrix; this should be resolved if public upgrade display is part of the intended contract.
