# Table audit 11 — `public.route_catalog`

**Audit date:** 2026-10-06

**Repository:** `/home/ubuntu/ArenaAI`

**Scope:** `public.route_catalog` only, including its migrations, backend contract/repository/service/controller, admin API/form, fare-engine integration, public/manifest readers, and cross-table lifecycle connections. This audit was read-only: no production writes, migrations, deletes, webhook replays, or external submissions were performed.

## 1. Evidence reviewed

Required prior artifacts were read first:

- `reports/live-schema-inventory.md`
- `reports/schema-model-alignment.md`
- `reports/schema-audit-findings.md`
- `reports/phase1-table-scan-findings.md`
- `reports/2026-10-06-16-table-alignment-execution-plan.md`

Relevant source reviewed:

- Schema: `backend/migrations/0020_route_catalog.sql:1-26`; extension columns and seeded corridors in `backend/migrations/0024_dossier_content.sql:7-12,159-239`.
- Domain and validation: `backend/src/db/route-catalog-types.ts:1-29`; `backend/src/modules/route-catalog/route-catalog.schema.ts:4-51`.
- Service/lifecycle: `backend/src/modules/route-catalog/route-catalog.service.ts:10-37`.
- PostgreSQL mapper and SQL: `backend/src/db/postgres.ts:199-213,717-738`; in-memory repository `backend/src/db/memory.ts:450-456`.
- HTTP surface: `backend/src/modules/route-catalog/route-catalog.routes.ts:4-15`; controller `backend/src/modules/route-catalog/route-catalog.controller.ts:8-22`.
- Admin API/form: `admin/src/lib/api.ts:520-606`; `admin/src/lib/types.ts:275-293`; `admin/src/components/admin/RouteCatalogPanel.tsx:12-29`.
- Fare consumer: `backend/src/modules/fares/fare.service.ts:167-209`.
- Customer/public readers and generated route output: `react/src/services/catalog.ts:130-175`; `backend/src/modules/catalog/catalog.service.ts:36-93,165-237`; `react/scripts/build-manifest.ts:41-70`; `react/src/app/ServerApp.tsx:26-35`.
- Alternative writer/source risk: `backend/scripts/seed-routes.ts:15-84` writes `catalog_items`, not `route_catalog`; `backend/scripts/import-routes-from-csv.ts:43-247` generates static fare data.
- Regression test: `backend/tests/unit/route-catalog-contract.test.ts:4-42`.

The existing phase-1 report says the four extension-field persistence defects were fixed in commit `963428b` and that type-check/tests passed at that time. Current source confirms those fields are now represented end-to-end.

## 2. Current live status (Supabase, read-only)

Supabase project `trcmufqbpcymipqpemoq` was queried with `execute_sql` using only `SELECT` statements on 2026-10-06. The live inventory independently reports the same table count and contract (`reports/live-schema-inventory.md:396-424`).

- **Rows:** 10; table is non-empty.
- **Status:** 9 `draft`, 1 `published`, 0 `archived`.
- **Trip type:** 9 `one-way`, 1 `round-trip`, 0 `local-tour`.
- **RLS:** disabled (`relrowsecurity=false`).
- **Constraints/indexes:** primary key `id`; unique `slug`; checks only for slug pattern, status enum, and trip-type enum; indexes on PK, unique slug, status, and trip type. No foreign keys reference from or to `route_catalog`.
- **Migration evidence:** `0020_route_catalog.sql`, `0020_unique_active_fare_rule.sql`, and `0024_dossier_content.sql` are present in the live migration ledger.

### Live null/empty check

| Bucket | Current result | Interpretation |
|---|---:|---|
| `source_detail IS NULL` | 7/10 | Optional pickup/corridor detail; intentional when not supplied. |
| `destination_city IS NULL` | 0/10 | All current rows are non-local routes; valid. No local-tour sample exists to exercise the nullable case. |
| `distance_km IS NULL` | 0/10 | Current routes all have distance. DB/API permit omission for a draft/unknown route, but fare calculation needs a positive distance or fallback. |
| `duration_text IS NULL` | 1/10 | Optional display text; current published `anb-to-dfd-taxi` lacks it and is anomalous. |
| `toll_amount_inr IS NULL` | 9/10 | Intentional when toll is included or actual amount is not separately specified. The one published row has `toll_included=false` and `toll_amount_inr=0`, which is semantically suspicious. |
| `per_km_rate_override IS NULL` | 10/10 | Intentional unless a route needs a route-specific override. |
| `highway IS NULL` | 1/10 | Optional corridor label; intentional for an ordinary route, but coincides with the anomalous published row. |
| `all_inclusive_note IS NULL` | 1/10 | Optional customer note; intentional in general, but missing on the anomalous published row. |
| empty `available_fleets` | 0/10 | Required list is populated. |
| empty `fares_inr` | 0/10 | Required JSON object is populated. |
| empty `interstate_charges` | 10/10 | Intentional when no itemized interstate charge is stored. |
| empty `stops` | 10/10 | Intentional for non-local routes; local tours would require at least two stops at API level. |
| blank (non-NULL) text fields | 0 in every tested field | No blank-string rows observed. |
| `needs_review=true` | 9/10 | All seeded draft corridors await review; the published anomalous row is not marked for review. |
| `use_per_km=true` | 1/10 | Only the anomalous published row uses per-km mode; all seeded drafts use fixed fares. |

The published row is `anb-to-dfd-taxi` with source `anb`, destination `dfd`, distance `1`, no duration/highway/all-inclusive note, fares `{sedan:1, ertiga:2, innova:3, tempo:4, urbania:5}`, `toll_included=false`, `toll_amount_inr=0`, `use_per_km=true`, and `needs_review=false`. It is not one of the nine migration-seeded dossier corridors. This is strong evidence of a test/import artifact or an improperly published route, but the audit did not mutate it.

## 3. Column population and null/empty matrix

| Column | Effective DB contract | What fills it, condition, and writer | NULL/empty meaning and assessment |
|---|---|---|---|
| `id` | `uuid NOT NULL DEFAULT gen_random_uuid()`, PK | Application `toRecord()` generates `newId()` on admin create; PostgreSQL insert persists it. DB default covers direct SQL. | Never NULL; required identity. Aligned. |
| `trip_type` | `text NOT NULL`, check `one-way`, `round-trip`, `local-tour` | Admin form selects it; API translates camelCase to `trip_type`; Zod enum validates; create/update service and SQL persist it. | Never NULL. Local-tour changes destination/stops rules. Aligned. |
| `source_city` | `text NOT NULL` | Admin create/update form; Zod `cleanText(2,80)`; service and SQL persist it. | Never NULL/blank through API. Aligned. |
| `source_detail` | `text NULL` | Optional admin field; empty UI input becomes `null`/omitted; service maps undefined to current value on PATCH. | NULL means no gate/address detail and is intentional. Live 7/10 NULL. |
| `destination_city` | `text NULL` | Admin form sends destination for one-way/round-trip and null for local-tour; Zod requires it for non-local and rejects it for local-tour. | NULL is intentional only for local-tour. No current local-tour rows; no live violation. Direct SQL has no conditional check. |
| `slug` | `text NOT NULL`, unique, regex 2–80 chars | Admin derives/edits on create; API/Zod validates; service rejects duplicate and makes slug immutable on update; SQL uses it for lookup. | Never NULL/blank. Public identity should be stable. Aligned within route_catalog. |
| `distance_km` | `numeric NULL`; migration has no DB range check; Zod positive, max 10,000 when supplied | Admin numeric input; service maps blank to null; fare service uses it to derive booking distance when route lookup succeeds. | NULL can represent an incomplete draft, but a published route without distance cannot provide reliable fare fallback. Live all populated. Recommend DB/API publication invariant. |
| `duration_text` | `text NULL` | Optional admin display field; blank becomes null; fare service uses it as package duration. | NULL is intentional for an incomplete/draft route, not ideal for published customer-facing routes. Live 1/10 NULL and that row is published. |
| `available_fleets` | `text[] NOT NULL DEFAULT {sedan,ertiga,innova,tempo,urbania}` | Admin fleet checkboxes; `/route-catalog/fleets` returns fare-catalogue vehicles; Zod requires at least one; SQL persists array. | Empty array would be a defect because fares must cover every selected fleet; none live. DB has no cardinality check. |
| `fares_inr` | `jsonb NOT NULL` | Admin manual fares or fare suggestion; Zod requires positive finite fare for every selected fleet and forbids extra fleet keys; service/SQL persist JSON. | `{}` or missing selected keys is invalid at API layer, but DB has no JSON invariant. None live. |
| `driver_charge_inr` | `numeric(10,2) NOT NULL DEFAULT 0` | Admin input; Zod nonnegative/default 0; persisted on create/update. | Zero means no separately stored driver charge and is intentional. No DB nonnegative check; direct SQL can bypass validation. |
| `night_halt_inr` | `numeric(10,2) NOT NULL DEFAULT 0` | Admin input; Zod nonnegative/default 0; persisted. | Zero means no night-halt add-on. Intentional. |
| `toll_included` | `boolean NOT NULL DEFAULT true` | Admin UI derives it as `!tollAmountInr`; Zod boolean/default true; persisted. | True with NULL toll amount means toll is included or not separately itemized. False should normally pair with a positive/known toll amount. Live published anomaly has false + `0`; classify as data-quality defect. No DB invariant. |
| `toll_amount_inr` | `numeric(10,2) NULL` | Admin optional toll amount; blank becomes null; Zod allows nonnegative value; SQL persists. | NULL intentional when included/unknown. `0` is technically allowed but semantically ambiguous when toll is excluded. |
| `interstate_charges` | `jsonb NOT NULL DEFAULT []` | Admin currently sends `[]`; Zod validates array of `{state, amount_inr, note?}` max 20; no current form editor for entries. | Empty array means no itemized state charge captured and is intentional, but all 10 rows have it empty; this is a capability gap if actuals need publication. |
| `min_km_per_day` | `integer NOT NULL DEFAULT 300` | Admin default/round-trip field; Zod integer 50–1000; persisted. Fare suggestion uses fare catalogue rules, not this route field. | 300 is a default commercial minimum; for one-way routes it is largely inert. Current values all 300. |
| `stops` | `jsonb NOT NULL DEFAULT []` | Local-tour admin editor; Zod validates stop objects max 24 and requires >=2 for local-tour; non-local stops rejected. | Empty is intentional for one-way/round-trip. All live rows are non-local, so all empty is expected. |
| `use_per_km` | `boolean NOT NULL DEFAULT true` | Admin checkbox; Zod default true; persisted in create/update. | True selects per-km mode and false selects stored fixed fares in the intended model. Live seeded rows false; only anomalous published row true. |
| `per_km_rate_override` | `numeric(10,2) NULL` | Optional admin override; Zod positive or null; service preserves explicit null and mapper reads it. | NULL means default fare-catalogue rate; intentional. All live NULL. There is no DB check requiring it when `use_per_km=true`. |
| `highway` | `text NULL` | Optional admin corridor field; cleaned/limited by Zod; service and mapper persist it. | NULL means no named corridor; intentional in drafts/ordinary routes. Live NULL only on anomalous published row. |
| `all_inclusive_note` | `text NULL` | Optional admin customer note; cleaned/limited by Zod; service and mapper persist it. | NULL means no explicit note; intentional generally. Published anomaly lacks one. |
| `status` | `text NOT NULL DEFAULT draft`, check `draft/published/archived` | Create always starts draft; only super-admin publish/archive endpoints change status; update preserves status and does not expose it in the create form. | Draft is intentional pre-review; archived is retained history and removed from route-catalog manifest. Direct SQL can publish without review. |
| `needs_review` | `boolean NOT NULL DEFAULT false` | Migration seeds true; admin form currently sends false on every save; API/Zod defaults false; service persists it. | True is a review gate marker; false means no outstanding review flag. Important risk: publish endpoint does not reject `needs_review=true`, so review is advisory, not enforced. |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | Service supplies clock timestamp; DB default covers direct insert. | Required audit timestamp. Aligned. |
| `updated_at` | `timestamptz NOT NULL DEFAULT now()` | Service supplies current clock time on create/update/publish/archive; mapper converts to ISO. | Required; aligned. |

## 4. Lifecycle and writers/readers

### Admin write lifecycle

1. `GET /api/v1/route-catalog/fleets` is public and returns current static fare vehicles.
2. Admin list/detail/create/update/delete use `/api/v1/ops/admin/route-catalog...`; controller applies `CONTENT_ROLES`, and mutating operations require a user. Publish/archive require `SUPER_ADMIN_ROLES` (`route-catalog.controller.ts:9-17`).
3. Admin `RouteCatalogPanel` builds camelCase payloads, sends them through `admin/src/lib/api.ts`, which translates to snake_case. It supports create/update, draft save, publish, archive, fare suggestion, route corridor fields, and local-tour stops.
4. Create uses `toRecord()` and always persists `status: "draft"`; it rejects a duplicate slug. Update merges field-by-field, preserving NULL versus omitted values, and rejects slug changes. Publish/archive update the whole record and call `triggerFrontendRebuild()`.
5. Draft deletion is allowed; published/archived deletion is rejected with `ROUTE_ARCHIVE_INSTEAD`. The PostgreSQL delete itself is a direct `DELETE` and has no child-FK consequences because the table has no FKs.
6. Migration `0024_dossier_content.sql` seeded nine draft, `needs_review=true` corridors. That is the only repository migration writer for these rows; the `seed-routes.ts` script writes `catalog_items`, not this table.

### Readers

- The route-catalog admin list/detail reads this table through `list`, `getById`, and `getBySlug`.
- `GET /api/v1/route-catalog/manifest` is unauthenticated and returns published route-catalog records through the dedicated controller (`controller.manifest` calls `service.list({status:"published", limit:100})`). `GET /api/v1/route-catalog/fleets` is also unauthenticated.
- Fare calculation consults route_catalog only after higher-priority dossier entities (tour package, transfer route, local package) fail. It can look up by supplied `packageId` as id/slug. Its origin/destination fallback constructs `${slugifyPlace(origin)}-to-${slugifyPlace(destination)}` (`fare.service.ts:175-177`).
- Customer catalog APIs and the React customer site do **not** read this table. `backend/src/modules/catalog/catalog.service.ts` builds public routes from `CATALOG_RAW_DATA` and `catalog_items` (`:36-93`); `react/src/services/catalog.ts` calls `/api/v1/catalog`; generated route files are produced from the catalog manifest/build pipeline, not from `/api/v1/route-catalog/manifest`. Thus publishing a route_catalog row does not by itself make it appear in the main customer catalog or route detail pages.

## 5. Relationships and cross-table lifecycle

`route_catalog` has **no declared foreign keys**, and no table has a FK to it. It is an isolated commercial data table joined by application-level identifiers:

- `fare.service` may use a route `id`/`slug` supplied as `booking` `packageId`, or a derived origin/destination slug. No persisted booking FK is created.
- Booking/fare snapshots persist the calculated result rather than a route_catalog FK; later route edits do not rewrite a booking’s fare snapshot.
- `catalog_items` is a separate route/ride source. `catalog_items` can be selected by `bookings.selected_catalog_item_id`, but `route_catalog` cannot. `catalog_items` and `route_catalog` therefore have no database-level identity or publication synchronization.
- Media, reviews, and booking selection attach to `catalog_items`, not route_catalog. Archiving/deleting a route_catalog row cannot cascade or null any child row.
- The separate static fare catalogue (`backend/src/modules/fares/fare.catalogue.ts` and generated React data) remains a third route source. This is the documented dual/multiple-source-of-truth concern.

## 6. Exact findings, severity, and evidence

### Confirmed defect — High: route_catalog publication is not connected to the main customer/public catalog

**Evidence:** route-catalog publish only updates `route_catalog` and triggers a frontend rebuild (`route-catalog.service.ts:34`); customer `catalog.service.ts:65-93,172-183` reads `catalog_items`/static `CATALOG_RAW_DATA`, and `react/src/services/catalog.ts:130-175` calls `/api/v1/catalog`. The React build reads generated catalog route snapshots, not route-catalog. No customer code references `/api/v1/route-catalog/manifest`.

**Impact:** An admin can see “published” in Route Catalog and the dedicated manifest can expose it, but the customer route list/detail and booking selection may continue to show a different catalog source. This is a source-of-truth/lifecycle mismatch, not a column persistence defect.

**Bounded fix:** choose one canonical route source. Either (a) make the customer catalog and build pipeline consume published route_catalog rows and map their full fare/route shape, or (b) retire/repurpose route_catalog and have the admin form write the canonical `catalog_items`/fare model. Add an end-to-end publish/read assertion before any migration.

### Confirmed defect — High: fare-service origin/destination fallback cannot find seeded route slugs

**Evidence:** `fare.service.ts:175-177` derives `agra-to-delhi` from origin/destination, while migration seeds `agra-to-delhi-taxi`, `agra-to-jaipur-taxi`, etc. (`0024_dossier_content.sql:167-227`). The fallback therefore returns no route row unless the caller passes the full route slug as `packageId`. The subsequent distance/fare fallback uses static `findRoute()` instead (`fare.service.ts:190-207`), so route_catalog prices can be silently bypassed.

**Impact:** A published route may not supply its stored fleet fare, night-halt, duration, or distance when a normal fare request provides only origin/destination. This undermines the intended route_catalog-to-booking lifecycle.

**Bounded fix:** use a canonical lookup: first exact `route_catalog` fields (`source_city`, `destination_city`, trip type), or append the documented `-taxi` suffix consistently; add a unique normalized corridor key if needed. Test both packageId and origin/destination requests against a disposable in-memory route.

### Confirmed defect — Medium: a junk/anomalous published row bypasses review and is customer-visible through the dedicated public endpoint

**Evidence:** live read-only query found published `anb-to-dfd-taxi` with 1 km distance, fares 1–5 INR, no duration/highway/note, `toll_included=false` + `toll_amount_inr=0`, `use_per_km=true`, and `needs_review=false`. It is not one of the nine migration-seeded corridors. `/api/v1/route-catalog/manifest` has no customer auth and lists published rows. The publish service does not reject `needsReview=true` or enforce commercial completeness.

**Assessment:** This is a confirmed data-quality/publication defect in the current live state. It was not deleted or modified. Whether it came from a prior test or import cannot be proven from the read-only evidence.

**Bounded fix:** quarantine/review the row through an explicitly approved admin action; add publication invariants (positive realistic fare/distance, duration, destination for non-local, `toll_included`/amount consistency) and require `needs_review=false` before publish. Do not clean it during this audit.

### Configuration/security blocker — Critical: RLS disabled

**Evidence:** Supabase metadata query reports `route_catalog.relrowsecurity=false`; the inventory and existing findings list route_catalog among 12 tables with RLS disabled. Direct Supabase roles may be able to read/write it depending on grants/API exposure. No policies were added because bare RLS enablement without reviewed policies would block intended reads and the task forbids production schema changes.

**Required remediation:** reviewed migration with explicit public-read policy only for intended published rows, no direct client writes, and service-role/backend/admin write policy; then test anonymous, authenticated, staff, and service access. This is a deployment/security blocker, not an application mapper mismatch.

### Previously confirmed defect — fixed, regression-protected: extension fields were dropped

The prior phase report identified `use_per_km`, `per_km_rate_override`, `highway`, and `all_inclusive_note` being rejected/dropped. Current schema, domain type, Zod contract, service merge, mapper, and SQL all include them (`route-catalog.schema.ts:27-30`; `route-catalog-types.ts:21-24`; `route-catalog.service.ts:19,33`; `postgres.ts:199-213,719-724`). `route-catalog-contract.test.ts:20-41` covers create and partial update. No remaining code-path drop was found.

### Hardening gaps — Low/Medium

- DB has no checks for nonnegative monetary values, positive distance, fare JSON shape, `available_fleets`/`fares_inr` parity, toll consistency, or publication completeness. API validation protects the admin path but direct SQL/RLS-disabled access bypasses it.
- `needs_review` is advisory. Admin currently sends `needsReview:false` on save; publish does not require review completion.
- `route_catalog` has no audit-log write in its service, unlike the main catalog CMS; author/change provenance is therefore not recorded for route edits.
- `route-catalog` uses a process-local frontend rebuild hook/cache pattern, so successful database publication and actual generated/static deployment can diverge if the hook is unavailable. This was not externally replayed or tested in production.

## 7. Intentional NULL/empty states

1. `source_detail`, `highway`, and `all_inclusive_note` are optional descriptive fields; NULL means no extra corridor/gate/customer note.
2. `destination_city` is NULL for local tours by design; current data has no local-tour row.
3. `distance_km` and `duration_text` can be NULL while a draft is being prepared; published routes should be complete because fare and customer display need them.
4. `toll_amount_inr` is NULL when toll is included or not separately itemized; a nonzero value should accompany an excluded/actual toll.
5. `per_km_rate_override` is NULL when the default fare catalogue rate is used.
6. `interstate_charges=[]` means no itemized state charge stored; `stops=[]` means no intermediate stops and is expected for non-local routes.
7. `draft` and `archived` status are lifecycle states, not missing data. `needs_review=true` is expected for seeded drafts but should block publication if it is a real review gate.

## 8. Bounded lifecycle test / read-only boundary

No live lifecycle mutation was run because the table has 10 production rows, RLS is disabled, and the task forbids production writes. The earlier phase report records the extension contract tests as passed; the current environment could not rerun the test because `pnpm exec vitest` attempted dependency installation and was blocked by `ERR_PNPM_IGNORED_BUILDS` for `esbuild/workerd`.

A bounded non-production test should use the existing in-memory repository (`backend/src/db/memory.ts`) and a fixed clock:

1. Create a one-way draft through the service with all four extension fields, optional NULLs, five fleets, and positive fares; assert the in-memory record contains every field.
2. Read it by ID and slug; assert mapper-equivalent values and slug immutability.
3. Patch `per_km_rate_override:null`, highway, note, and toll fields; assert explicit NULL is retained and omitted fields are preserved.
4. Assert a non-local route with stops or missing destination is rejected; assert a local-tour with destination is rejected and fewer than two stops is rejected.
5. Publish, assert status changes and the dedicated published list contains it; archive, assert it is absent from the published list.
6. Exercise fare calculation twice: with `packageId=<full slug>` and with origin/destination only. The latter should fail under the current `-taxi` mismatch, making the defect a regression target.
7. Separately test the public catalog endpoint and assert that publishing route_catalog does **not** currently make the row appear, documenting the source-of-truth mismatch until fixed.

## 9. Recommended fixes, in order

1. Decide and document the canonical route source (`route_catalog` versus `catalog_items`/static fare catalogue); wire admin publish, customer readers, generated manifests, booking selection, and fare calculation to that same source.
2. Fix fare-service lookup to match the seeded route slug contract or query by normalized source/destination/trip type; add regression tests for both lookup modes.
3. Add a publication readiness policy: require review cleared, positive distance/fares, duration, destination when applicable, fleet/fare parity, and consistent toll fields. Prefer API checks plus DB checks for critical invariants.
4. Review/quarantine the live `anb-to-dfd-taxi` row through an approved operational workflow; do not delete it as part of this audit.
5. Add route mutation audit-log entries and a rebuild/deployment verification that confirms the published row reaches the actual customer reader.
6. Draft and review RLS policies before enabling RLS on route_catalog; verify direct Supabase anon/authenticated access cannot write content.
7. Re-run the bounded in-memory lifecycle test, then perform only explicitly approved read-only live endpoint checks. No production migration or data cleanup is implied by this report.
