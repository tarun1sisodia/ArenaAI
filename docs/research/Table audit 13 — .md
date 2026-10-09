# Table audit 13 — `public.transfer_routes`

**Audit scope.** This is a read-only audit of the `transfer_routes` database domain: migration and live schema, backend domain/type/Zod/repository/service/controller routes, admin client/form/page, fare and booking consumers, and public customer readers. No production write, migration, delete, webhook replay, or external submission was performed.

## Executive summary

The live table has **6 rows**: **3 published, 2 draft, 1 archived**. A live Supabase read-only SQL check on 2026-10-06 confirmed that all six rows have non-null `distance_text`, `direction_note`, and `fleet_prices`; no empty `route_code`/`name` or empty JSON price object was found. This agrees with `reports/live-schema-inventory.md` (6 rows, RLS disabled) and `reports/phase1-table-scan-findings.md` (3 published/2 draft/1 archived).

The database-to-backend/admin field contract is generally aligned: migration `0024_dossier_content.sql`, `TransferRouteRecord`, strict create/update Zod schemas, PostgreSQL mapper/CRUD SQL, in-memory repository, admin `TransferRouteItem`, API client, and form all use the same snake_case-at-HTTP / camelCase-in-domain mapping. The bounded integration suite passed the transfer publish-to-manifest assertion, and backend typecheck passed.

Two important lifecycle/security defects remain:

1. **High — live RLS is disabled.** The live inventory/advisory shows `public.transfer_routes` with RLS disabled. Because this is public content but also has admin-write data, direct Supabase client access is not constrained by reviewed public-read/service-role policies. This is a production security/configuration gap; do not fix by enabling RLS without policies.
2. **High — the customer “Book Transfer Now” link drops the transfer route identity.** `TransferDetailPage` sends only `/book.html?from=Agra&to=<display name>&vehicle=sedan`; `BookingPage` turns that into an `outstation` selection using a static supported-route matcher or a normalized city pair. It does not send the persisted `route_code`/transfer id, and `fare.service.ts` only loads `transfer_routes` when `packageId`, `localPackageKey=airport-transfer`, or `tripType=airport-transfer` is present. Consequently a customer can see a persisted transfer price on the public detail page but the authoritative booking quote can use a generic/static outstation route, or mark the display-name destination unsupported, instead of using that transfer row. This is a confirmed cross-layer lifecycle mismatch even though current published snapshot values match the live rows.

A smaller contract issue is that `TransferRouteCodeSchema` used by the admin availability check accepts arbitrary trimmed 2–80-character text, while create/update and the database require the lowercase `[a-z0-9-]` slug regex. This does not corrupt persisted rows but can report a code as “available” that the subsequent create will reject.

## Evidence reviewed

- `reports/live-schema-inventory.md`, especially the `public.transfer_routes` section and RLS advisory.
- `reports/schema-model-alignment.md`, `reports/schema-audit-findings.md`, `reports/phase1-table-scan-findings.md`, and `reports/2026-10-06-16-table-alignment-execution-plan.md`.
- `backend/migrations/0024_dossier_content.sql` lines 34–49 and seed inserts lines 344–373.
- `backend/src/db/dossier-types.ts` lines 24–37; `backend/src/db/types.ts`; `backend/src/db/postgres.ts` lines 69–84 and 822–871; `backend/src/db/memory.ts` lines 518–563.
- `backend/src/modules/transfer-routes/transfer-routes.schema.ts`, `.service.ts`, `.controller.ts`, and `.routes.ts`.
- `admin/src/lib/types.ts` (`TransferRouteItem`), `admin/src/lib/api.ts` lines 704–738, and `admin/src/pages/LocalTransfersPage.tsx`.
- `backend/src/modules/fares/fare.service.ts` lines 114–140 and `react/src/pages/TransferDetailPage.tsx`, `react/src/features/booking/BookingPage.tsx`, `react/src/app/ServerApp.tsx`, and `react/src/data/generated-published-transfer-routes.json`.
- `backend/tests/integration/dossier-manifest-modules.test.ts`; targeted test and typecheck execution.

## Current live state

A read-only Supabase `execute_sql` query against project `trcmufqbpcymipqpemoq` returned:

- `row_count = 6`.
- Status counts: `published = 3`, `draft = 2`, `archived = 1`.
- `distance_text IS NULL = 0`.
- `direction_note IS NULL = 0`.
- `fleet_prices IS NULL = 0`.
- Empty `route_code = 0`, empty `name = 0`, and `fleet_prices = '{}'::jsonb = 0`.
- All six live rows have `is_active = true`.

Live published route identities and public snapshot were compared. The three published live rows (`delhi-igi-oneway`, `agra-to-airport-noida`, `agra-cantt-to-agra-airport`) exactly match the three entries in `react/src/data/generated-published-transfer-routes.json` for ids, names, distance/direction text, fleet prices, `usePerKm`, night charge, status, active flag, and timestamps. The archived `agc-station-drop` is absent from the generated published snapshot as expected.

## Database schema and column population matrix

Migration `0024_dossier_content.sql` creates the table. The live inventory confirms the same types/defaults/constraints. There are no foreign keys from or to `transfer_routes`.

| Column | Live type/null/default/constraint | What fills it, condition, writer, and NULL/empty meaning |
|---|---|---|
| `id` | `uuid`, NOT NULL, default `gen_random_uuid()`, PK | PostgreSQL generates it when direct SQL omits it; backend service normally supplies `newId()` and the PostgreSQL insert writes it. In-memory tests also supply an id. Never intentionally NULL/empty. |
| `route_code` | `text`, NOT NULL, UNIQUE; check `^[a-z0-9-]{2,80}$` | Admin create supplies `route_code`; `CreateTransferRouteSchema` trims and applies the same regex plus junk-pattern rejection. Service checks availability before insert; DB unique constraint is final protection. Service update deliberately rejects any code change because it is a public identity. Never intentionally NULL/empty. |
| `name` | `text`, NOT NULL | Admin create/update supplies the cleaned 2–100-character name. Public detail and admin list display it. Never intentionally NULL/empty. |
| `distance_text` | `text`, nullable, no default | Admin may omit/leave blank; service maps omitted create input to `null`, and admin converts blank form text to `undefined`. It is descriptive text such as `225 km` or `~15–20 km`, not a numeric distance column. NULL is intentional when a route has no editorial distance; empty string should be normalized to NULL, not stored. Mapper maps falsy DB values back to `null`. Current live rows: no NULLs. |
| `direction_note` | `text`, nullable, no default | Optional admin editorial service/direction note; omitted create input becomes `null`, and blank form input is omitted. NULL is intentional when no note is supplied; empty string should be normalized to NULL. Current live rows: no NULLs. |
| `fleet_prices` | `jsonb`, NOT NULL, no default | Admin form writes a five-key fleet price object (`sedan`, `ertiga`, `innova`, `tempo`, `urbania`); Zod requires a record of finite positive numbers; service/repository write JSONB. Required because it supplies the customer starting fare and server fare overrides. `{}` is structurally allowed by the current Zod record but is not useful; the admin form does not intentionally create it. Current live rows have non-empty objects. |
| `use_per_km` | `boolean`, NOT NULL, default `false` | Admin form carries the value (currently no visible toggle, so new form defaults it to false); Zod defaults false; service/repository persist it. Fare service reads it only after a published transfer lookup. `false` is intentional for fixed transfer fares; true is for a per-km corridor. Never NULL/empty. |
| `night_charge_inr` | `numeric(10,2)`, NOT NULL, default `0` | Admin payload sends numeric value or `0`; Zod nonnegative/max 100,000 default 0; service/repository persist it; fare service consumes it for a published transfer. Zero is intentional when no transfer-specific night charge applies. Never NULL. |
| `status` | `text`, NOT NULL, default `draft`; check `draft/published/archived` | Create defaults to draft unless explicitly supplied; admin Save & Publish first creates/updates then calls the super-admin publish endpoint. Publish/archive service methods update it and trigger a frontend rebuild. Public manifest and by-code endpoint expose only `published`; archived/draft are intentionally not public. Never NULL. |
| `is_active` | `boolean`, NOT NULL, default `true` | Admin domain/form carries it and create/update payloads send it; migration default is true. It appears intended as an independent enable/disable flag, but public manifest, public by-code, frontend snapshot filtering, and fare lookup currently test `status` only, not `is_active`. False therefore has no effective public/booking behavior. Never NULL; this is a lifecycle defect, not an intentional empty. |
| `created_at` | `timestamptz`, NOT NULL, default `now()` | Backend service stamps the create time and repository writes it; direct SQL can use DB default. Used for list ordering. Never NULL. |
| `updated_at` | `timestamptz`, NOT NULL, default `now()` | Backend service stamps updates, publish, and archive; repository writes it. No database trigger is present, so direct SQL updates would not automatically maintain it. Never NULL. |

## Backend contract and writers

### Migration and seed

`0024_dossier_content.sql` creates the table with a unique route code, editorial nullable text fields, required JSONB pricing, fixed/per-km switch, night charge, publication status, active flag, and timestamps. Its four seed routes are inserted as drafts with non-empty text and five fleet prices. The current live table has six rows, so later admin-created rows exist beyond the original four seeds.

### Domain and validation

`TransferRouteRecord` maps all 12 columns to camelCase and uses `string | null` for the two optional text fields. `transfer-routes.schema.ts` is strict and maps the database contract at the HTTP boundary:

- create requires `route_code`, `name`, and `fleet_prices`; optional fields are trimmed and HTML-stripped;
- `use_per_km`, `night_charge_inr`, and `is_active` have defaults;
- `status` is constrained to the three database values;
- update is partial but makes route code immutable in the service;
- id lookup requires UUID; code lookup/check uses a separate code schema.

`cleanOptional()` transforms a supplied whitespace-only string to `""`, not `null`. The current admin form avoids that for blank fields (`trim() || undefined`), but other API callers can still persist empty strings. The mapper treats empty strings as null on read. Recommended hardening: make optional Zod input transform empty strings to `undefined`/`null`, and/or use `NULLIF($n,'')` in repository SQL.

### Repository and mapper

`mapTransferRoute()` maps every DB column. The PostgreSQL create and update SQL write every domain column except generated/default behavior is bypassed because the service supplies all fields. `getById()` and `getByCode()` support UUID-or-code lookup defensively; list supports status and name/code search, orders by `created_at`, and applies pagination in memory after fetching matching rows. The in-memory repository mirrors create/update/list/delete and code index behavior for isolated tests.

There is no DB trigger to update timestamps and no JSONB check for the five canonical price keys or nonnegative values; application Zod is the enforcement boundary. DB direct writers could bypass those application guarantees.

### Service/controller/routes

Known backend writer actions:

- `POST /api/v1/ops/admin/transfer-routes`: content-role admin plus authenticated user; create defaults draft.
- `PATCH /api/v1/ops/admin/transfer-routes/:id`: content-role admin plus authenticated user; route code immutable.
- `POST /api/v1/ops/admin/transfer-routes/:id/publish`: super-admin only; sets status published and requests frontend rebuild.
- `POST /api/v1/ops/admin/transfer-routes/:id/archive`: super-admin only; sets archived and requests frontend rebuild.
- `DELETE /api/v1/ops/admin/transfer-routes/:id`: content-role admin; service permits deletion only while status is draft, otherwise returns `TRANSFER_ARCHIVE_INSTEAD`.

Public readers:

- `GET /api/v1/transfer-routes/manifest` lists `status = published`.
- `GET /api/v1/transfer-routes/by-code/:code` gets by code and returns 404 unless status is published.
- Admin list/get/check-code are authenticated/role guarded.

The role constants currently contain only `super_admin`, so the nominal content-role distinction is not yet granular in this deployment.

## Admin form and API alignment

`admin/src/lib/types.ts` defines `TransferRouteItem` with the same 12 domain fields. `admin/src/lib/api.ts` exposes list/get/create/update/publish/archive/delete/check-code and returns backend `data` without dropping fields. `LocalTransfersPage.tsx`:

- lists by status/search;
- pre-fills all persisted fields when editing;
- sends `route_code`, `name`, optional `distance_text`/`direction_note`, `fleet_prices`, `use_per_km`, `night_charge_inr`, and `is_active`;
- saves draft or performs save-then-publish;
- shows publish/archive/delete controls consistent with service behavior.

The visible transfer modal does not expose controls for `usePerKm`, `nightChargeInr`, or `isActive`; it carries their existing values when editing and defaults new records to `false`, `0`, and `true`. That is a product/UI limitation rather than a mapper loss: operators cannot intentionally configure a per-km or night-charge route from this form unless another API/client is used. If these columns are in scope for operations, add explicit controls and explanatory validation.

## Customer/public reader and cross-table lifecycle

The public build consumes `react/src/data/generated-published-transfer-routes.json`, generated by `react/scripts/build-manifest.ts` from `GET /api/v1/transfer-routes/manifest`. `ServerApp.tsx` loads entries with a slug and name; `TransferDetailPage` displays name, distance text, direction note, and all fleet prices and computes a displayed sedan starting fare. Current generated data exactly matches the live published rows.

The public detail page's `Book Transfer Now` link is:

```text
/book.html?from=Agra&to=<encoded display name>&vehicle=sedan
```

It does **not** pass `route_code`, transfer id, `packageId`, `trip=airport-transfer`, or a booking-selection source marker. `BookingPage.tsx` parses only `from`, `to`, `vehicle`, and optional generic trip/package parameters. Its outstation selection is `{ kind: "outstation", id: static-route-id-or-normalized-city-pair, tripType, originName, destinationName }`; it has no transfer-route identity field. The authoritative fare request and final booking draft both send that selection.

`fare.service.ts` loads a transfer route only in the dossier transfer branch when `input.packageId` exists or the input is an airport-transfer/local-package path. It then copies `fleetPrices`, `usePerKm`, `nightChargeInr`, name, distance, and ride type into fare overrides. A generic outstation selection from the transfer detail page does not satisfy that branch. This disconnect means the displayed persisted transfer price is not guaranteed to be the price used by `/fares/calculate` and the booking row's fare snapshot. This is the primary application lifecycle defect.

When the route identity is correctly carried through a booking flow, the downstream chain is: published `transfer_routes` row → fare override → server-calculated fare → booking draft/final booking `fare_snapshot` and denormalized fare fields. There is no FK from `bookings` to `transfer_routes`, so after quote/booking creation the relationship is by snapshot/selection semantics, not referential integrity. A later route edit therefore must not retroactively alter a booked fare; a route code/id should be retained in `booking_selection` or a dedicated booking column for auditability.

## Foreign keys and lifecycle connections

- **Direct FKs:** none. No table references `transfer_routes`, and it references no table.
- **Fare connection:** `fare.service.ts` reads a published route by id/code only when the transfer branch is selected; it supplies fleet prices, per-km mode, night charge, display name, duration/distance, and ride type to the fare engine.
- **Booking connection:** bookings receive calculated, immutable-at-booking fare fields/snapshot. The current outstation transfer link does not preserve the source route identity; this is the cross-table mismatch described above.
- **Public build connection:** published manifest → generated JSON snapshot → SSR/static customer pages. Publish/price edit/archive calls `triggerFrontendRebuild`; the generated snapshot is therefore deployment-sensitive.
- **RLS/security:** no FK issue, but live RLS is disabled. Direct Supabase exposure must be constrained with reviewed policies while backend service-role/direct-Postgres writes remain server-only.
- **Delete behavior:** draft-only delete is application-enforced; published and archived records must be archived rather than deleted. There are no dependent rows to cascade.

## Findings and severity

### Confirmed defects

1. **High — customer booking loses the transfer route identity and can quote the wrong source.** Evidence: `TransferDetailPage.tsx:51–56` builds a generic `from/to/vehicle` URL; `BookingPage.tsx:350–397` creates only package/local/outstation selections and no transfer-route id/code; `fare.service.ts:114–140` only reads `transferRoutes` for package/airport-transfer conditions. The page displays `transfer_routes.fleet_prices`, but authoritative fare calculation is not guaranteed to read that row. **Fix:** include `package=<route_code>` or a dedicated `transferRouteCode`/`transferRouteId` query and preserve it in the canonical booking selection; update booking/fare schemas to resolve only a published active transfer route by code/id, and persist the source identity in the booking selection/snapshot. Add a regression test with a published route whose price differs from static fares.
2. **High — `is_active` is a dead lifecycle flag for public and fare readers.** Evidence: migration/domain/admin carry `is_active`; transfer manifest and by-code only filter `status`, frontend snapshot filter only checks slug/name, and fare lookup checks only `status === "published"`. An operator/API caller can set a row `published` + `is_active=false` and it remains manifest-visible, page-visible, and fare-eligible. Current live rows are all active, so this is a code-confirmed latent defect rather than an observed bad current row. **Fix:** require `status='published' AND is_active=true` in manifest, by-code, fare resolution, generated snapshot/build validation, and any booking catalog path; add a test for inactive publication.
3. **Low — check-code validation is weaker than create/update validation.** `TransferRouteCodeSchema` for `/check-code` trims and checks only length; it does not apply the database slug regex or reserved/junk pattern. A value such as `Bad_Code` can be reported available and then rejected by create. **Fix:** reuse one `routeCodeSchema` in both check-code and create/update.
4. **Low/data quality — optional text can be persisted as empty string by non-admin callers.** `cleanOptional()` returns an empty string after trimming/HTML stripping; the DB permits it because fields are nullable without checks. The admin form intentionally converts blanks to `undefined`, and the mapper normalizes falsy values to null, so no current live empty-string defect was found. **Fix:** canonicalize blanks to null at schema/repository boundary.

### Configuration/security blockers

- **Live RLS disabled on `public.transfer_routes`.** This is documented by the live inventory/advisory and is a security exposure if Supabase client roles can reach the table. Add reviewed policies: public read only for published+active rows, no direct anon/authenticated writes, and service-role/backend writes. Do not apply bare `ENABLE ROW LEVEL SECURITY` without policies because it would block intended reads.
- **Frontend rebuild hook is environment-dependent.** Publish, archive, and price-edit call `triggerFrontendRebuild`. Targeted tests warn `PAGES_DEPLOY_HOOK_URL not set`; that warning is expected in the isolated test environment, not proof of production misconfiguration. If the production hook is absent or wrong, live DB changes will not refresh the static generated transfer snapshot. Verify deployment configuration separately without replaying a production hook during this audit.
- **No database-level JSONB shape/check constraint.** Application Zod enforces positive finite prices, but direct DB writers can store missing/extra/negative fleet keys. Treat as a hardening backlog item, not a current live defect; any DB constraint should be designed against actual supported fleet aliases first.

## Bounded lifecycle test / read-only boundary

Completed safe validation:

- `npm run typecheck` in `backend`: passed.
- `npm run test -- tests/integration/dossier-manifest-modules.test.ts --run`: **8/8 passed**, including `admin can publish transfer route and it appears in manifest` and the draft filtering assertion. The test uses an isolated in-memory/test app repository; it did not mutate production.
- Read-only Supabase row count/null/status and full-row checks completed successfully.

A bounded future regression test should remain isolated/in-memory (or use a disposable database branch), not production:

1. Seed a transfer route with a unique test code and a distinctive fleet price, status draft, active true.
2. Assert admin create/update mapping preserves every field and blanks normalize to null.
3. Assert draft is absent from public manifest/by-code and fare lookup rejects it.
4. Publish it in the isolated repository; assert manifest/detail and fare calculation use the distinctive price.
5. Set `is_active=false` while published; assert manifest/detail/fare reject it after the proposed fix.
6. Exercise the real public detail booking URL/selection path and assert it carries the route code into `/fares/calculate`, draft booking selection, and fare snapshot.
7. Archive/delete only the isolated record and assert archive is not deletable while draft deletion is allowed.

The production audit must remain read-only because create/publish/archive/delete would alter public content, trigger rebuild hooks, or change customer fare behavior. No production mutation is necessary to establish the defects above.

## Recommended fixes (dependency order)

1. **Fix identity propagation first:** add a canonical `transferRouteCode`/`transferRouteId` to public booking URL and `BookingSelectionPayload`; resolve it server-side by code/id, require published+active, and persist the source identity in the booking selection/fare snapshot.
2. **Enforce active semantics:** change transfer manifest, by-code, fare lookup, and generated snapshot/build filters to require both `published` and `is_active`; add isolated inactive-route tests.
3. **Unify code validation:** export one route-code Zod schema with lowercase slug and reserved-pattern checks and reuse it in create/update/check-code.
4. **Normalize nullable editorial fields:** map blank optional values to null before persistence and add a contract test; keep null as the intentional “not provided” state.
5. **Expose operational controls:** add admin controls for `use_per_km`, `night_charge_inr`, and `is_active`, or remove those columns if the product does not support them. Do not silently carry values operators cannot edit.
6. **Secure the live table:** draft and review RLS policies for public published+active reads and backend/service-role/admin writes, then apply through a separate reviewed migration. Validate anon/authenticated/admin/backend access in a disposable branch first.
7. **Protect the static/public refresh path:** verify the production Pages deploy hook and build-manifest environment, then run a controlled non-production publish/price-change check. Do not replay production hooks as part of this audit.
8. **Add optional JSONB hardening only after confirming canonical fleet-key policy:** application validation currently works for normal admin traffic, but direct DB writers are not constrained.

## Audit conclusion

The storage and admin contract for existing `transfer_routes` rows is substantially aligned and current live values are internally complete. The main risks are not missing columns: they are **route identity loss at the public booking boundary**, **inactive status not being honored**, and **disabled RLS**. The current three published rows happen to have matching generated public snapshots, but that does not cure the booking-selection mismatch or guarantee future static refresh without deployment configuration.