# Table audit 16 — `public.schema_migrations`

**Audit date:** 2026-10-06  
**Scope:** Exactly `public.schema_migrations`; no production writes, migrations, webhook replays, deletes, or external submissions were performed.

## Executive summary

`public.schema_migrations` is the backend migration ledger, not a business-domain table. It is created lazily by `runMigrations()` and records one row per SQL filename after that file succeeds. The repository, live inventory, and direct read-only Supabase query agree that the live ledger has **32 rows**, all repository migrations through `0031_tour_packages_source_dest_inclusions.sql`, with `id` and `applied_at` fully populated.

The application path is simple and internally aligned: `backend/src/db/migrate.ts` creates the table if absent, sorts `*.sql` filenames, skips IDs already present, executes each new SQL file in a transaction, inserts the filename, and commits. There is no Zod/domain model/repository mapper/HTTP service/admin/customer reader for this table, by design. It is only read and written by the migration runner and inspected operationally.

The important current defect is **high severity security/data-integrity exposure**: Supabase reports RLS disabled, and the read-only privilege inspection shows `anon` and `authenticated` have INSERT/SELECT/UPDATE/DELETE/TRUNCATE (plus other table privileges) on this public table. There are no policies. A direct PostgREST/Supabase client could therefore tamper with migration history if those grants are effective on the exposed API. This is independent of the backend runner's correctness and must be fixed with reviewed privileges/RLS; do not blindly enable RLS on all tables without policies.

Two code-level operational weaknesses are also confirmed: there is no cross-process migration lock, and the ledger stores only a filename (no content checksum), so concurrent startup can race and changed historical SQL is not detected. No current checksum drift was proven by the available evidence.

## Evidence and current live state

### Existing audit artifacts read first

- `reports/live-schema-inventory.md` — generated from live Supabase `list_tables` on 2026-10-05; reports 32 rows, `id text NOT NULL`, `applied_at timestamptz NOT NULL DEFAULT now()`, primary key `id`, and RLS disabled.
- `reports/schema-model-alignment.md` — identifies `schema_migrations` among the 12 public tables with RLS disabled and recommends explicit policies rather than a bare enablement.
- `reports/schema-audit-findings.md` — records 32 applied repository migrations through `0031_tour_packages_source_dest_inclusions.sql` and the RLS advisory.
- `reports/phase1-table-scan-findings.md` — marks work unit 16 scanned and repeats the 32-row/RLS finding.
- `reports/2026-10-06-16-table-alignment-execution-plan.md` — requires column population, owning code, readers/writers, relationships, mismatch severity, and a bounded lifecycle test.

### Read-only Supabase checks

Project: `trcmufqbpcymipqpemoq` (`ClientServer2`). The following checks were executed through Supabase MCP using read-only `execute_sql`, `list_tables`, and `get_advisors` operations.

| Check | Result | Evidence |
|---|---|---|
| Row count | **32** | Direct `count(*)`; matches live inventory. |
| `id` NULL count | **0** | Direct `count(*) WHERE id IS NULL`. |
| `applied_at` NULL count | **0** | Direct `count(*) WHERE applied_at IS NULL`. |
| Empty/whitespace IDs | **0** | Direct `count(*) WHERE btrim(id) = ''`. |
| Duplicate IDs | **0** | Grouped duplicate check; also enforced by primary key. |
| Applied timestamp range | `2026-09-14 07:43:04.322103+00` through `2026-10-05 08:28:26.749603+00` | Direct `min`/`max`. |
| RLS | **disabled** (`relrowsecurity=false`) | Direct `pg_class` query and `list_tables`. |
| Policies | **none** | Direct `pg_policy` query. |
| Current grants | `anon` and `authenticated` each have INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER | Direct `information_schema.role_table_grants` query. |
| Foreign keys | **none** | Direct information-schema FK query. |
| Primary key/index | `schema_migrations_pkey` on `(id)` | Direct metadata query; unique btree index. |
| Supabase security advisory | ERROR `rls_disabled_in_public`, explicitly naming `public.schema_migrations` | `get_advisors(type=security)`, observed 2026-10-05 21:13:09Z. |
| Supabase `list_migrations` | returned `[]` | This is a separate Supabase migration service/ledger view; it does not invalidate the 32 rows in the application-owned public table. |

### Live ledger IDs

The live table contains these exact IDs, in `applied_at` order:

```text
0001_enable_extensions.sql
0002_create_enums.sql
0003_create_profiles.sql
0004_create_vehicles_and_drivers.sql
0005_create_bookings.sql
0006_create_payments_and_refunds.sql
0007_create_catalog_reviews_promos.sql
0008_create_audit_notifications_inquiries.sql
0009_add_indexes_and_rls.sql
0010_add_updated_at_triggers.sql
0011_drop_vehicles_and_drivers.sql
0012_hyper_scale_indexes.sql
0013_consolidate_user_roles.sql
0014_inquiry_status_and_notes.sql
0015_add_foreign_key_indexes.sql
0016_comprehensive_rls_policies.sql
0017_widen_catalog_slug.sql
0018_extend_catalog_for_live_trips.sql
0019_enforce_media_visibility_rls.sql
0020_unique_active_fare_rule.sql
0020_route_catalog.sql
0021_create_rental_enquiries.sql
0022_create_customer_booking_intents.sql
0023_add_canonical_booking_selection.sql
0024_dossier_content.sql
0025_remove_tour_package_legacy_pricing.sql
0026_promo_broadcast_and_group_vehicles.sql
0027_fix_dossier_signoffs_approved_by_fkey.sql
0028_relax_advance_amount_check.sql
0029_remove_pet_taxi_offering.sql
0030_tour_packages_gallery.sql
0031_tour_packages_source_dest_inclusions.sql
```

The repository has the same 32 SQL files under `backend/migrations/`. There are two distinct filenames with numeric prefix `0020`; the primary key is the full filename, so the live rows are not duplicates.

## Physical schema and column population matrix

The table is created by the SQL string in `backend/src/db/migrate.ts:26-28`, not by a numbered migration file:

```sql
create table if not exists schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
)
```

The live metadata additionally shows the expected primary-key index and PostgreSQL-generated NOT NULL checks. There are no explicit application-level checks, enums, triggers, or foreign keys on this table.

| Column | Live type / constraint | What fills it and when | Writer | NULL/empty meaning | Assessment |
|---|---|---|---|---|---|
| `id` | `text NOT NULL`, primary key; no default | The migration runner passes the exact basename of each file ending in `.sql` (`migrate.ts:29`, `migrate.ts:31`, `migrate.ts:39`). A row is inserted only after that file's SQL succeeds. | Only `runMigrations()` / its CLI and production entrypoint. | NULL is prohibited; empty text is not blocked by a CHECK but the runner never generates an empty filename. Current NULL/empty counts are 0. | Intentional ledger key. A manually inserted arbitrary/empty ID would be an operational defect, not a normal lifecycle state. |
| `applied_at` | `timestamptz NOT NULL DEFAULT now()`; no default supplied by caller | The database supplies `now()` when the runner inserts only `id` (`migrate.ts:39`). It records ledger-insert time, after the file SQL has completed in the current transaction. | PostgreSQL default, triggered by the migration runner insert. | NULL is prohibited; there is no normal empty value. It is not updated by the runner. Current NULL count is 0. | Intentional immutable application timestamp. A timestamp does not prove the SQL content is unchanged or that an external deployment was healthy after commit. |

No column is conditionally nullable. `schema_migrations` has no business-state fields, soft-delete fields, status fields, empty-array semantics, or user/customer data.

## Owning code and lifecycle chain

### Migration runner

`backend/src/db/migrate.ts` is the sole owner:

1. `loadEnv()` obtains `DATABASE_URL`; missing it throws (`:12-16`).
2. A standalone `pg.Client` connects (`:22-23`).
3. `CREATE TABLE IF NOT EXISTS schema_migrations` runs (`:26-28`).
4. The migration directory defaults to the compiled source's `../../migrations` (`:18-20`); production Docker images copy `backend/migrations` into the runtime image (`backend/Dockerfile:37`, `backend/Dockerfile.chainguard:28`).
5. All `.sql` filenames are sorted lexically (`:29`).
6. Existing rows are skipped by exact full filename (`:31-33`).
7. For an absent filename, the runner reads the file, starts a transaction, executes the SQL, inserts the filename, commits, and appends it to the in-memory `applied` list (`:35-44`).
8. Any SQL or insert error rolls back the current transaction and is rethrown (`:45-47`); `client.end()` is guaranteed (`:51-53`).
9. The CLI wrapper logs the error and exits nonzero (`backend/scripts/migrate.ts:1-5`).

The production entrypoint runs `node dist/db/migrate.js` before `node dist/server.js` whenever `DATABASE_URL` is present, and aborts startup on migration failure (`backend/scripts/docker-entrypoint.sh:3-14`). The package script `npm run migrate` is the explicit local/operational entrypoint (`backend/package.json`, `backend/README.md:34`).

### Domain/backend/admin/customer coverage

There is intentionally **no**:

- backend domain type or Zod schema for `schema_migrations`;
- repository interface, Postgres mapper, or business-service/controller/route for it;
- admin API, form, page, or client type for it;
- customer/public reader or frontend display for it;
- webhook/job/cache writer for it.

The only non-runner textual references are operational documentation (`docs/PAYMENT_RAZORPAY_AUDIT_2026-09-28.md:97`, `docs/agent/02_CHANGE_LEDGER.md:533`) and the pre-existing audit reports. This is correct separation: migration history should not be part of customer or admin business APIs.

## Relationships and cross-table lifecycle

- **Foreign keys:** none from or to `schema_migrations`. It does not participate in booking, payment, refund, profile, catalog, content, notification, or dossier lifecycles.
- **Cross-table connection:** the only connection is temporal/operational: successful migration rows enable the schema objects consumed by all other backend repositories. Migration files themselves create or alter those tables (for example, `0005` bookings, `0006` payments/refunds, `0007` catalog/reviews/promos, `0008` operational tables, and later dossier/content migrations).
- **Delete/update behavior:** no FK actions apply. The runner never updates or deletes ledger rows; it only conditionally inserts an ID. Manual deletion would cause the next startup to rerun that SQL file, which is unsafe for destructive/non-repeatable historical migrations.
- **RLS relationship:** `0009_add_indexes_and_rls.sql` enables RLS on many business tables but omits `schema_migrations`; later `0016_comprehensive_rls_policies.sql` also enumerates 14 business tables and omits `schema_migrations`. This explains the current missing RLS rather than indicating a mapper omission.

## Confirmed mismatches and severity

### FIND-16-01 — HIGH: public migration ledger has RLS disabled and broad client DML grants

**Status:** Confirmed current defect.  
**Evidence:** live `relrowsecurity=false`; `pg_policy` returns no policies; `get_advisors` emits ERROR `rls_disabled_in_public` naming this table; direct grants show `anon` and `authenticated` have INSERT/SELECT/UPDATE/DELETE/TRUNCATE, as well as REFERENCES/TRIGGER. The live inventory and prior reports independently record RLS disabled.

**Impact:** A direct Supabase/PostgREST caller can potentially read deployment history and, more seriously, insert fake IDs, change timestamps/IDs, delete ledger rows, or truncate the table. Deleting a ledger row can make the next backend startup rerun a historical migration. Exact effective exposure depends on Supabase API role/grant behavior, but the grants and missing RLS are sufficient to treat this as a production security/data-integrity defect.

**Fix:** Use a reviewed security migration/change: keep the ledger out of public client access, revoke `anon`/`authenticated` table privileges (at minimum all write privileges and preferably all privileges), enable RLS, and grant only the backend migration role/service role the access it needs. Test anonymous, authenticated, service-role, and backend-`DATABASE_URL` paths before deployment. Do not apply a bare `ENABLE ROW LEVEL SECURITY` without the intended access model.

### FIND-16-02 — MEDIUM: no cross-process migration lock

**Status:** Confirmed code-level concurrency defect; no live incident asserted.  
**Evidence:** `migrate.ts:29-41` performs `SELECT` for an absent filename, then executes the SQL and inserts the ledger row without `pg_advisory_lock`, a lock table, or an atomic `INSERT ... ON CONFLICT` claim. Production startup invokes this runner in each container (`docker-entrypoint.sh:3-14`).

**Impact:** Two simultaneous starts can both observe a missing ID and run the same migration. One can commit; the other can fail on the primary-key insert and abort its container even though the schema is already current. If a migration is not safely repeatable, concurrent SQL execution can also increase lock/deadlock risk. The per-file transaction protects a single runner from partial DDL+ledger commits, but does not serialize runners.

**Fix:** Acquire a database advisory lock around the entire migration pass (with a bounded timeout), or use a dedicated lock/claim protocol. Retain the primary key as the final guard. Add a disposable two-runner concurrency test.

### FIND-16-03 — MEDIUM: no migration-content checksum/drift detection

**Status:** Confirmed auditability/control weakness; current content drift is unverified.  
**Evidence:** The table has only `id` and `applied_at`; `runMigrations()` checks only `WHERE id=$1` and skips the file if the filename exists (`:31-33`). No file hash, SQL hash, or expected checksum is persisted or compared.

**Impact:** Editing an already-applied migration in the repository, or replacing a file with the same name, is silently ignored. The live ledger can therefore report a filename as applied while the live schema does not correspond to the current repository file. This is particularly risky because one historical migration includes destructive changes (`0011_drop_vehicles_and_drivers.sql`), although no current mismatch was proven.

**Fix:** Do not rewrite historical migration files. Add a checksum column or a separate manifest/checksum check for future migrations, fail closed on changed applied content, and document an explicit forward-migration repair path.

### FIND-16-04 — LOW: duplicate numeric migration prefix creates fresh-install ordering ambiguity

**Status:** Confirmed repository/ledger ordering ambiguity, not a demonstrated SQL failure.  
**Evidence:** Both `0020_unique_active_fare_rule.sql` and `0020_route_catalog.sql` exist and are present as distinct live IDs. The runner sorts full filenames lexically, so a fresh install orders `0020_route_catalog.sql` before `0020_unique_active_fare_rule.sql`; the live timestamps show the reverse historical application order (unique fare rule on 2026-09-29, route catalog on 2026-09-30).

**Impact:** The full filename primary key prevents duplicate-row collision, and inspection found no demonstrated dependency between these two files. However, the numeric prefix convention no longer uniquely communicates sequence, and a fresh database can have a different order from the recorded live history.

**Fix:** Preserve already-applied filenames; do not rename them in place. Add CI linting that rejects duplicate numeric prefixes for new migrations, and use an explicit dependency/order policy for future files. If a true dependency exists, add a new forward migration rather than editing history.

## Intentional empty/NULL states

1. `id` NULL/empty: **not intentional**. The schema rejects NULL, the primary key rejects duplicates, and the runner always supplies a non-empty SQL basename. Live empty/NULL count is zero.
2. `applied_at` NULL: **not intentional**. The schema rejects NULL and the database default supplies a timestamp. Live NULL count is zero.
3. Zero rows: **not applicable to the current deployed database**. On a brand-new database, the table is created empty before the first migration; after the runner completes, one row exists per successfully applied file. It is not a business “no data yet” state.
4. Missing IDs for repository files: **intentional only before that migration runs**. In production, all 32 repository filenames are present. A missing ID paired with missing schema objects indicates a failed/not-yet-applied migration; a missing ID after objects were manually created requires investigation, not automatic insertion.
5. No other nullable/empty columns exist.

## Bounded lifecycle test and read-only boundary

### Production-safe checks completed

- Read-only live row count, NULL/empty count, duplicate check, timestamp range, metadata, RLS/policy state, grants, and FK inspection were run through Supabase MCP.
- The repository file set and live IDs were compared conceptually and match at 32 entries.
- No `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, DDL, migration execution, webhook replay, or external submission was performed.

### Recommended disposable lifecycle test (not production)

Run only against an isolated temporary PostgreSQL database/schema with a disposable `DATABASE_URL` and a temporary migrations directory containing harmless test SQL:

1. First `runMigrations({connectionString, migrationsDir, silent:true})`: assert the table is created, every file is applied once, `applied` equals the sorted file set, and each row has non-null ID/timestamp.
2. Second run: assert `applied=[]`, row count is unchanged, and no SQL is rerun.
3. Add a failing test migration: assert the SQL and its ledger insert roll back together; rerun after removing/fixing it and confirm only the corrected migration is applied.
4. Start two runner processes concurrently: assert advisory-lock/serialization behavior after the recommended fix and verify no duplicate or partial ledger state.
5. Change the content of an already-applied test file: current behavior should demonstrate the checksum gap (it skips by filename); the future checksum guard should fail closed.

This test must remain disposable because the runner is intentionally a write path and historical SQL may include destructive or irreversible DDL. The live database should receive only the read-only verification queries above until an explicitly reviewed security/concurrency/checksum change is approved.

## Recommended fixes (ordered)

1. **Security first:** remove `anon`/`authenticated` access to `public.schema_migrations`; enable a reviewed RLS/privilege model and verify all four access classes (anonymous, authenticated, service role, backend database role).
2. Add a single-instance migration advisory lock with timeout and preserve the primary key as a final race guard.
3. Add applied-SQL checksum/drift detection without mutating historical migration files; use forward migrations for repairs.
4. Add CI validation for duplicate numeric prefixes, filename syntax, lexical ordering, and migration SQL review; document that the full filename is the immutable ledger identity.
5. Add disposable integration tests for first run, idempotent rerun, rollback-on-failure, concurrent startup, and changed-file detection.

## Final classification

- **Current row population:** aligned; 32/32 IDs and timestamps are populated, with no NULL/empty/duplicate values.
- **Domain/API alignment:** aligned by intentional absence; no business model or public/admin reader should expose this table.
- **Confirmed defects:** FIND-16-01 (HIGH security/data-integrity exposure), FIND-16-02 (MEDIUM concurrency), FIND-16-03 (MEDIUM drift-control gap), FIND-16-04 (LOW ordering ambiguity).
- **Configuration blocker:** none required to explain the current row population. Security remediation requires a separately reviewed database privilege/RLS change; it was intentionally not applied during this audit.
