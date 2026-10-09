# Table audit 06 — `public.fare_rules`

**Audit date:** 2026-10-06  
**Repository:** `/home/ubuntu/ArenaAI`  
**Scope:** database contract, migrations, backend types/schemas/repository/service/routes, admin API/form/page, customer/public readers, cross-table lifecycle, and current live row/null evidence.

## Executive conclusion

`fare_rules` is populated and its core active-rule path is wired: the live table has **14 rows**, **one active row** (`rmuu3sir9`), no empty configs, and all rows contain the expected top-level `vehicles` and `outstation` configuration keys. The backend fare service reads the active row for both `GET /api/v1/fleet` and `POST /api/v1/fares/calculate`; booking creation stores the resulting version and complete fare snapshot in `bookings`.

The most important findings are:

1. **High — RLS is disabled on `fare_rules`.** This is a live security/configuration defect. The table can be reached through Supabase roles unless the application path is the only exposed database interface; reviewed read policies and denial of direct client writes are required. Do not apply bare `ENABLE ROW LEVEL SECURITY` without policies.
2. **High — PostgreSQL save/activate is multi-statement but not transaction-wrapped.** The repository first deactivates the current rule and then inserts/activates the target. A failure between statements can leave zero active rules; concurrent writers can also race. The repository exposes `transaction`, but the fare-rule admin methods do not use it.
3. **Medium/High — active selection ignores `effective_from` and `effective_to`.** `getActive()` selects any `is_active=true` row regardless of its effective interval. The admin contract accepts a caller-supplied `effectiveFrom`, so a future-dated active row would be used immediately.
4. **Medium — the JSON config contract is broader than what the engine consumes.** Admin validation accepts `localPackages`, `airportTransfers`, `notes`, and `dynamicConfig`, while the fare service only turns `config.vehicles` and `config.outstation` into fare-engine overrides; dossier/static sources supply other commercial values. Persisting an accepted key that is not authoritative is an avoidable source-of-truth ambiguity.
5. **Medium — public display parity is incomplete.** Fleet, Services, and Booking pages fetch the live fleet, but static home/fleet/catalog display components still contain baked-in rates and names. This does not override the final server quote, but it can show a customer a stale public rate or availability after an admin edit.

The targeted isolated fare-rule/version and fare-DB-sync tests pass (**8/8**). No production write, migration, webhook replay, deletion, or external submission was performed.

## Evidence and current live state

### Sources inspected

- `reports/live-schema-inventory.md` (generated from Supabase `list_tables` on 2026-10-05)
- `reports/schema-model-alignment.md`
- `reports/schema-audit-findings.md`
- `reports/phase1-table-scan-findings.md`
- `reports/2026-10-06-16-table-alignment-execution-plan.md`
- `backend/migrations/0007_create_catalog_reviews_promos.sql`
- `backend/migrations/0020_unique_active_fare_rule.sql`
- `backend/src/db/types.ts`, `backend/src/db/postgres.ts`, `backend/src/db/memory.ts`
- `backend/src/modules/fares/{fare.types.ts,fare.schema.ts,fare.service.ts,fare.engine.ts,fare.controller.ts,fare.routes.ts}`
- `backend/src/modules/admin/{admin.schema.ts,admin.service.ts,admin.controller.ts,admin.routes.ts}`
- `admin/src/lib/{api.ts,types.ts}` and `admin/src/pages/FaresPage.tsx`
- `react/src/services/catalog.ts`, `react/src/pages/{FleetPage.tsx,ServicesPage.tsx}`, and `react/src/features/booking/BookingPage.tsx`
- fare rule/version tests under `backend/tests/unit/`

### Read-only Supabase query

A SELECT-only query was run against project `trcmufqbpcymipqpemoq` to count rows and nulls and inspect active/version/temporal invariants. It returned:

| Check | Current result | Interpretation |
|---|---:|---|
| Rows | **14** | Table is populated, not empty. This agrees with `live-schema-inventory.md:18`. |
| Active rows | **1** | Active version is `rmuu3sir9`. |
| NULL `id`, `version`, `config`, `effective_from`, `is_active`, `created_at` | **0 each** | Required columns are fully populated. |
| NULL `effective_to` | **2** | One is the current active open-ended row; one is inactive `rmusf47ry`, consistent with an inactive draft that has never been closed. |
| Empty `{}` config | **0** | Every live row has non-empty JSON configuration. |
| `vehicles` key present | **14/14** | Current rulesets all carry fleet overrides. |
| `outstation` key present | **14/14** | Current rulesets all carry outstation overrides. |
| Active temporal anomalies (`effective_to <= effective_from`) | **0** | No active row has an inverted interval. |
| Overlapping active intervals | **0** | The active uniqueness invariant is currently satisfied. |
| Inactive rows with `effective_to IS NULL` | **1** (`rmusf47ry`) | Intentional for a never-activated draft under the current code, but should be documented/validated. |
| Version length | 9–10 characters | Within `VARCHAR(20)`. |

The query also showed the current active row begins `2026-10-04T17:37:14.997Z`; prior activated rows have sequential end times. The live inventory reports **RLS disabled** for `fare_rules`.

## Database contract and column population matrix

The table is created by `backend/migrations/0007_create_catalog_reviews_promos.sql:57-65`:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
version VARCHAR(20) NOT NULL UNIQUE,
config JSONB NOT NULL,
effective_from TIMESTAMPTZ NOT NULL,
effective_to TIMESTAMPTZ,
is_active BOOLEAN NOT NULL DEFAULT FALSE,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

| Column | Type / nullability / default | What fills it and when | Writers | NULL/empty assessment |
|---|---|---|---|---|
| `id` | `uuid NOT NULL`, default `gen_random_uuid()` | PostgreSQL can generate it; admin service explicitly uses `newId()`; seed supplies UUIDs. | Migration default, `admin.service.updateFareRules`, seed runner, repository `save`. | **Not nullable and not empty by design.** No current NULLs. The admin-generated UUID is compatible with PostgreSQL. |
| `version` | `varchar(20) NOT NULL UNIQUE`, no default | Admin may submit a version; otherwise service generates `r${Date.now().toString(36)}`. Seed uses the default catalogue version. Activation looks up this value. | Admin `PUT /api/v1/ops/admin/fare-rules`, seed runner, repository upsert; `POST .../activate` reads it. | **Required identity/version.** No NULLs or empty values live. Zod enforces only max length, not non-empty/format; malformed/duplicate values are a contract gap, though the database unique constraint protects duplicates. |
| `config` | `jsonb NOT NULL`, no default | Admin request body is persisted as the whole config object. Seed writes `outstation`, `vehicles`, `packageUpgrades`, and `routes`. Fare service reads `vehicles` and `outstation`; dossier/static repositories supply other package/route values. | Admin service, seed runner, repository `save`. | **Required and non-empty intentionally.** Live empty-config count is 0. The database has no JSON shape/check constraint; API-level validation is the source of shape control. |
| `effective_from` | `timestamptz NOT NULL`, no default | Admin `effectiveFrom` if supplied; otherwise current service time. Activation resets it to `now`. | Admin service, repository `save`/`activate`, seed runner. | **Required start time.** No NULLs. Future timestamps are accepted by `AdminUpdateFareRulesSchema` and are not honored by `getActive()` (finding F3). |
| `effective_to` | `timestamptz NULL` | Closed when an active rule is replaced or an existing active rule is switched off. An inactive draft saved before ever becoming active can remain NULL. Current active rule is intentionally open-ended. | PostgreSQL `save`/`activate`, memory repository equivalents, seed runner. | **NULL is intentional for the current active rule and never-activated drafts.** For a row that was active and later deactivated, NULL would be a defect; the live query found one inactive open interval (`rmusf47ry`) that code semantics classify as an inactive draft. |
| `is_active` | `boolean NOT NULL DEFAULT false` | Admin update defaults to true unless explicitly given; activation sets target true and prior active rows false. Migration 0020 cleans duplicates and adds a partial unique index. | Admin service/repository, seed runner, migration 0020. | **Boolean is always populated.** Live count is exactly one active. The partial unique index enforces at most one active row, not a guaranteed minimum of one. |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | Admin service supplies current time; PostgreSQL default/seed can supply it. It is used for active-row ordering and version listing. | Admin service, repository insert, seed runner. | **Required immutable audit/order timestamp.** No current NULLs. It should not be used as a substitute for effective interval ordering. |

### Nested configuration semantics

The top-level JSON is intentionally flexible, but the effective path is not equally broad:

- `config.vehicles[]`: matched by tier/id in `fare.service.ts:42-56` and `fare.engine.ts:280-292`; fills live vehicle name, seats, bags, per-km rate, and availability. `active:false` blocks that tier from a backend quote.
- `config.outstation`: `minKmPerDay`, round multiplier, night allowances, driver allowance, and configurable night window are read in `fare.service.ts:211-277` and passed to the pure engine.
- `config.localPackages`, `airportTransfers`, `notes`, and `dynamicConfig` are accepted by `AdminUpdateFareRulesSchema` but are not used by `fare.service.ts` as authoritative fare overrides. Dossier repositories (`localPackages`, `transferRoutes`, `tourPackages`, `routeCatalog`) take precedence for published offerings.
- A booking does not re-read mutable rule JSON: it persists `fare_rules_version` and `fare_snapshot` in `bookings`, which is the intended historical immutability boundary.

## Backend model, schema, mapper, and SQL alignment

### Domain and validation

- `FareRuleRecord` in `backend/src/db/types.ts:289-297` maps all seven columns, including nullable `effectiveTo`.
- `Repositories.fareRules` exposes `getActive`, `getByVersion`, `listAll`, `save`, and `activate` (`types.ts:268-274`).
- Admin request validation is `AdminUpdateFareRulesSchema` (`admin.schema.ts:59-88`): version/effectiveFrom/outstation/vehicles/localPackages/airportTransfers/notes/dynamicConfig. Vehicle `tier` is a free string rather than the canonical vehicle enum, and the object is not `.strict()`.
- Activation validation is `AdminActivateFareRuleSchema` (`admin.schema.ts:90-93`).
- Public fare calculation validation is strict and does not trust client distance or fare version (`fare.schema.ts:6-64`). The server resolves the active rule and sets the returned `fareVersion`.

### PostgreSQL mapper and repository

`backend/src/db/postgres.ts:1459-1544` is aligned at the field level:

- Reads map snake_case `effective_from`, `effective_to`, `is_active`, and `created_at` to the domain record.
- `getActive()` executes `select * from fare_rules where is_active=true order by created_at desc limit 1`.
- `getByVersion()` and `listAll()` are direct version/all-row reads.
- `save()` deactivates other active rows, then upserts by unique `version`.
- `activate()` deactivates the current active row, then sets the target active and clears its `effective_to`.

The SQL has no fare-rule foreign keys and no delete path. Application audit rows use `resourceType: "fare_rules"` and `resourceId: version`, but this is not a database FK.

## Writers and readers / lifecycle chain

### Writers

1. **Migration:** `0007_create_catalog_reviews_promos.sql` creates the table; `0020_unique_active_fare_rule.sql` cleans duplicate active rows and adds `idx_fare_rules_unique_active`.
2. **Seed runner:** `backend/scripts/seed.ts:86-101` upserts `SEED_FARE_RULES` by version. This is an operational seed, not a customer workflow.
3. **Admin update:** `PUT /api/v1/ops/admin/fare-rules` → `admin.controller.ts:89-95` → Zod parse → `admin.service.updateFareRules()` (`admin.service.ts:160-195`) → `db.fareRules.save()`; then appends an audit log.
4. **Admin activation:** `POST /api/v1/ops/admin/fare-rules/activate` → controller `97-103` → `admin.service.activateFareRules()` (`197-220`) → `db.fareRules.activate()`; then appends an activation audit log.
5. **Memory repository/tests:** `backend/src/db/memory.ts:923-976` implements the same logical lifecycle for isolated tests. It is not production persistence.

There are **no customer, webhook, payment, notification, or background-job writers** to `fare_rules`.

### Readers

1. **Backend fare service:** `createFareService()` reads the active rule for `getFleet()` (`fare.service.ts:24-59`) and `calculate()` (`211-284`). The app wires this service with the configured repository in `app.ts:225-230`.
2. **Public backend routes:** `GET /api/v1/fleet` and `POST /api/v1/fares/calculate` (`fare.routes.ts:8-16`, controller `fare.controller.ts:8-18`).
3. **Booking creation:** `booking.service.ts:139-209` delegates to the same fare service; it writes `fareRulesVersion: fare.fareVersion` and `fareSnapshot: fare` at `booking.service.ts:285-299`. `0005_create_bookings.sql:27-28` stores both as non-null fields, but there is no FK to `fare_rules.version`.
4. **Admin:** `GET /api/v1/ops/admin/fare-rules` reads the active rule and merges it with static constants (`admin.service.ts:127-157`). The admin client maps it to `FareRuleset` (`admin/src/lib/api.ts:232-271`); the Fares page edits fleet and outstation values (`FaresPage.tsx:104-145`).
5. **Customer/public:** `react/src/services/catalog.ts:177-192` consumes `/api/v1/fleet`. `FleetPage`, `ServicesPage`, and `BookingPage` call `fetchLiveFleet`; `BookingPage` also uses the live active fleet to select an available tier and then posts a final server quote. Other public display components retain static values from `react/src/data.ts`/component constants, so they are not all live-rule readers.

## Cross-table relationships and lifecycle connections

- **No database FK originates from or targets `fare_rules`.** This is deliberate historical/configuration storage rather than a parent table.
- `bookings.fare_rules_version VARCHAR(20) NOT NULL DEFAULT 'v1'` is an application-level version pointer, not a foreign key. `bookings.fare_snapshot JSONB NOT NULL DEFAULT '{}'` captures the actual amounts and labels at quote/booking time. Therefore editing or activating a later fare rule must not rewrite existing booking totals.
- `admin_audit_logs` receives application-level entries after update/activation. The audit insert is not part of the same database transaction as the fare-rule write (finding F2); a write can succeed while its audit append fails, or vice versa depending on failure timing.
- `payments`, `refunds`, `raw_webhooks`, and customer booking-intent tables connect to `bookings`, not to `fare_rules`. Their lifecycle must use the booking snapshot, not a current mutable rule.
- Published dossier content can supersede portions of global fare rules: tour packages, transfer routes, local packages, and route catalog rows supply fleet prices and package/route-specific pricing through `fare.service.ts:83-187`. The global rule still supplies active fleet metadata and outstation settings where applicable.
- There is no delete/update cascade behavior for fare rules. Historical rows remain addressable by version; replacing a rule closes the prior active interval in application code.

## Findings with severity and exact evidence

### F1 — RLS disabled on `fare_rules` (High security/configuration defect)

**Evidence:** `reports/live-schema-inventory.md:18` marks `fare_rules` RLS `DISABLED`; `reports/schema-audit-findings.md:34-35` and `schema-model-alignment.md:48-52` identify this as one of 12 live tables with RLS disabled. The table contains pricing/fleet configuration and is therefore not a harmless empty table.

**Impact:** If a client can reach Supabase REST/PostgREST directly, `anon`/`authenticated` access is not constrained by row policies. Direct writes are especially dangerous because a client could alter prices or activate a rule outside the audited admin path.

**Fix:** Define and test explicit policies: public read only if direct public reads are intended, no direct anon/authenticated writes, and service-role/backend-only writes. Apply only through a reviewed migration after testing anonymous, authenticated, admin, and backend access. Do not perform this migration as part of this audit.

### F2 — PostgreSQL save/activate is not atomic (High reliability/integrity defect)

**Evidence:** `postgres.ts:1498-1519` performs an `UPDATE` to deactivate the current rule and a separate `INSERT ... ON CONFLICT` to save the new rule. `postgres.ts:1522-1543` similarly performs a deactivation `UPDATE` followed by a target `UPDATE ... RETURNING`. `Repositories` has a transaction method (`db/types.ts:80`), but `admin.service.ts:176` and `202-203` call `save`/`activate` directly; no transaction surrounds the multi-statement lifecycle or its audit append.

**Impact:** A database/network/constraint failure after the first statement can leave zero active rows. The fare service then falls back to the environment/static version (`fare.service.ts:211-214`, `fare.engine.ts:295`), silently breaking the promised active DB pricing. Concurrent admin updates can also race around the deactivation/upsert sequence.

**Fix:** Make `save` and `activate` single transaction operations (or invoke `db.transaction()` from the service), lock/serialize the active-row transition, and include the audit append in the same transaction where supported. Retain the partial unique index as a backstop.

### F3 — Effective interval is stored but not enforced by active reads (Medium/High pricing lifecycle defect)

**Evidence:** `AdminUpdateFareRulesSchema` accepts arbitrary `effectiveFrom` (`admin.schema.ts:59-61`); `admin.service.ts:171` stores it. But `postgres.ts:1461` and memory `memory.ts:924-929` select by `is_active` only. Neither checks `effective_from <= now` nor `effective_to > now`; `fare.service.ts:211-214` consumes that result immediately.

**Impact:** A future-dated row marked active becomes the current customer quote/fleet rule before its stated effective time. An active row with a past `effective_to` would also remain eligible. The live data has no active interval anomaly today, but the code permits one.

**Fix:** Decide whether `is_active` means “selected now” or “published for future.” If intervals are authoritative, query `is_active AND effective_from <= now() AND (effective_to IS NULL OR effective_to > now())`, validate `effective_to > effective_from`, and test boundary instants. If activation is always immediate, remove/rename the misleading future-effective field and forbid future values.

### F4 — JSON config has accepted but non-authoritative keys (Medium contract/source-of-truth defect)

**Evidence:** `AdminUpdateFareRulesSchema` accepts `localPackages`, `airportTransfers`, `notes`, and `dynamicConfig` (`admin.schema.ts:84-87`); `admin.service.ts:167-174` persists the entire update body in `config`. In contrast, `fare.service.ts:242-276` constructs overrides only from `cfg.vehicles` and `cfg.outstation`; package/route values are read from dossier/static repositories at `fare.service.ts:83-187`. The seed config also contains `packageUpgrades` and `routes`, which the active-rule read path does not use as general overrides.

**Impact:** An operator or API client can believe an accepted JSON key changed production pricing while the quote engine ignores it. This is not a current row loss—the live top-level keys are present—but it is a persistent contract ambiguity.

**Fix:** Either remove unsupported keys from the admin schema and document the fare-rule boundary, or define a typed `FareRuleConfigSchema` and wire every accepted key through the engine with explicit precedence. Prefer keeping dossier rows authoritative for published package/route-specific prices and limiting `fare_rules.config` to global fleet/outstation controls.

### F5 — Not every public display consumes the live fare-rule fleet (Medium display parity defect)

**Evidence:** `react/src/services/catalog.ts:177-192` and page integrations in `FleetPage.tsx`, `ServicesPage.tsx`, and `BookingPage.tsx` consume `/api/v1/fleet`. However, `react/src/components/home/FleetSection.tsx` contains hard-coded vehicle names/specs/starting fares, and other public components use static `react/src/data.ts` values. The Fares page promises changes “flow to the customer site” (`FaresPage.tsx:186-190`), but that is only true for the live-integrated pages.

**Impact:** Admin-edited rate/name/availability can disagree with homepage, static landing, route, or package display values. The final booking quote remains server-authoritative, so this is a customer-facing consistency defect rather than a direct undercharge path.

**Fix:** Use one shared live-fleet hook/data merge for every customer display that claims to show current rates, or explicitly label static/indicative displays and link to a live quote. Add a parity test for each public reader.

### F6 — Nested vehicle contract is under-validated (Low/Medium data-quality defect)

**Evidence:** `AdminUpdateFareRulesSchema` allows any `tier: z.string()` and does not make the vehicle object strict (`admin.schema.ts:72-83`). The UI validates positive seats/rates, but an API caller can persist unknown tiers or extra fields. The engine only matches canonical tier/id values (`fare.service.ts:46-55`, `fare.engine.ts:280-292`).

**Impact:** Invalid rows can be displayed in admin or silently ignored by quote calculation; the database cannot detect the mismatch because `config` is unconstrained JSONB.

**Fix:** Add a typed strict config schema with canonical tier enum, finite bounded rates/seats, valid night-hour bounds, and reject unknown nested keys. Keep engine-level defensive checks.

## Intentional NULL/empty states

- `effective_to = NULL` for the single current active rule is intentional: it is open-ended until another rule replaces it.
- `effective_to = NULL` for an inactive never-activated draft is intentional under current `save()` semantics; the live query identified `rmusf47ry`. If the business requires every inactive row to have a closed interval, change the model and backfill/validate drafts.
- All other columns are non-null by schema and should not be empty. Current live evidence has no NULLs in those columns and no `{}` configs.
- No customer/webhook/worker emptiness applies to this table because those actors never write it.

## Bounded lifecycle validation (read-only production posture)

Production mutation is not appropriate for this audit because a fare-rule activation changes prices for subsequent customer quotes. The controlled test already run used only the in-memory repository and passed:

```text
npm --prefix backend test -- --run tests/unit/fare-rules-versioning.test.ts tests/unit/fare-db-sync.test.ts
8 tests passed
```

Coverage includes:

- saving a new active rule deactivates the prior active rule and closes its interval;
- saving an inactive draft leaves the current active version unchanged;
- activating a prior version updates the memory lifecycle and writes an audit entry;
- active DB vehicle rates and disabled vehicle tiers affect quote calculation;
- booking creation stores the active fare version and snapshot;
- published/draft catalog behavior remains separate from global rules.

The tests are **not sufficient** to prove PostgreSQL atomicity, concurrent activation, effective-time boundaries, or RLS. A safe follow-up in disposable staging should create uniquely prefixed temporary versions inside a transaction, test failure injection between deactivation and upsert, test two concurrent activations, and roll back/drop only those disposable rows. Production should remain read-only until that validation and the RLS policy review are complete.

## Recommended fix order

1. **Security:** design/test explicit RLS policies for `fare_rules`; deny direct client writes and preserve backend service-role operation.
2. **Integrity:** transaction-wrap `save`, `activate`, and their audit log; add concurrency/failure tests.
3. **Temporal semantics:** enforce/consume `effective_from` and `effective_to`, or remove misleading future-effective behavior.
4. **Contract:** replace loose JSON acceptance with a typed strict config schema and document global-vs-dossier precedence.
5. **Customer parity:** route all public fleet/rate displays through the live fleet service or label them as static/indicative.
6. **Regression:** add tests for active count, interval boundaries, unknown vehicle tiers, historical booking snapshots, and every public reader.
