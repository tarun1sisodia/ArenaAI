# Table audit 10 — `public.location_cache`

**Audit date:** 2026-10-06  
**Repository:** `/home/ubuntu/ArenaAI`  
**Scope:** Read-only audit of the database table and its full application lifecycle. No production writes, migrations, deletes, webhook replays, or external submissions were performed.

## 1. Executive summary

`location_cache` is a backend-owned, key/value cache for normalized LocationIQ (or fallback-provider) autocomplete results. The database contract, backend repository interface, PostgreSQL SQL, in-memory test repository, public autocomplete endpoint, and customer React reader are aligned for the normal path:

```text
customer types location
  -> GET /api/v1/locations/autocomplete?q=...
  -> validate/normalize query
  -> location_cache.get(normalized key)
  -> fresh hit, or LocationIQ/static provider
  -> sanitize and cap suggestions at 8
  -> location_cache.set(key, suggestions, now)
  -> response to customer UI
  -> selected location is later copied into booking input fields
```

The current live row count is **40**, with **zero NULLs** in all three columns and **zero empty suggestion arrays**. A read-only Supabase SQL check on project `trcmufqbpcymipqpemoq` found 286 suggestion elements across the rows; every row is a JSON array, every element is an object, and all elements contain `placeId`, `displayName`, and `country` with numeric-or-null latitude/longitude types. All 40 rows were within the 30-day freshness window at the time of the check (`database_now=2026-10-05 20:46:30.566716+00`, oldest `stored_at=2026-09-28 12:20:06.242+00`, newest `2026-10-03 11:16:43.622+00`).

One **confirmed latent operational defect (P2/medium)** remains: the service treats entries older than 30 days as misses but never deletes them, and the repository has no eviction/list/delete operation or scheduled cleanup. This does not currently affect freshness and no row was stale in the live check, but unique search terms can accumulate indefinitely. It is a bounded-storage/maintenance defect, not evidence of current bad rows.

There is also a **P2 contract-hardening gap (not observed in live data)**: `suggestions` is unconstrained JSONB and PostgreSQL reads are cast directly to `LocationSuggestion[]` without runtime validation. The provider paths currently produce the expected shape, but a malformed row introduced by a direct service-role write, old migration, or manual operation would be returned as trusted data. The live shape query found no such malformed rows.

## 2. Evidence inspected

### Existing audit artifacts

- `reports/live-schema-inventory.md`, lines 24 and 388-395: live row count, RLS state, primary key, and the three-column table definition.
- `reports/schema-model-alignment.md`: prior cross-domain alignment and live-schema context.
- `reports/schema-audit-findings.md`: prior audit evidence and source project identification.
- `reports/phase1-table-scan-findings.md`, lines 18 and 71-80: prior location-cache scan status and lifecycle interpretations.
- `reports/2026-10-06-16-table-alignment-execution-plan.md`, lines 30-41 and 77-80: required cache-key, JSONB, TTL, stale-cache, and read-only test scope.

### Repository sources

- `backend/migrations/0008_create_audit_notifications_inquiries.sql`, lines 53-57: table creation.
- `backend/migrations/0009_add_indexes_and_rls.sql`, lines 5-18: RLS enabled on `location_cache`.
- `backend/migrations/0016_comprehensive_rls_policies.sql`, lines 11-25: service-role `FOR ALL` policy includes `location_cache`.
- `backend/src/types/domain.ts`, lines 397-405: `LocationSuggestion` domain type.
- `backend/src/db/types.ts`, lines 257-260: `Repositories.locationCache` interface.
- `backend/src/db/postgres.ts`, lines 1395-1413: PostgreSQL read/upsert mapper and SQL.
- `backend/src/db/memory.ts`, lines 899-906: in-memory equivalent used by tests.
- `backend/src/modules/locations/location.schema.ts`, lines 3-10: Zod query contract.
- `backend/src/modules/locations/location.service.ts`, lines 9-53: validation, key normalization, TTL, provider call, sanitization, cache write, and fallback.
- `backend/src/modules/locations/location.controller.ts`, lines 6-12, and `location.routes.ts`, lines 4-11: public endpoint wiring and rate limit.
- `backend/src/providers/GeocodingProvider.ts`, lines 3-71: static fallback and LocationIQ adapter output shape.
- `backend/src/db/seedData.ts`, lines 950-979, and `backend/scripts/seed.ts`, lines 538-551: fixture and upsert seed path.
- `backend/tests/unit/location-proxy.test.ts`: five in-memory lifecycle/security tests.
- `react/src/hooks/useLocationIQ.ts`: secure browser client, response normalization, debounce and abort handling.
- `react/src/components/search/LocationCombobox.tsx`, lines 30-267 and 391-437: curated public destinations plus proxy results.
- `react/src/features/booking/BookingPage.tsx` and `backend/src/modules/bookings/booking.service.ts`: selected names/address values later copied into booking data; no cache foreign key is created.

## 3. Live database state (read-only)

| Check | Result | Interpretation |
|---|---:|---|
| Row count | 40 | Non-empty cache; matches the existing live inventory. |
| `cache_key` NULL count | 0 | Satisfies `NOT NULL`/primary key contract. |
| `suggestions` NULL count | 0 | Satisfies `NOT NULL` contract. |
| `stored_at` NULL count | 0 | Satisfies `NOT NULL` contract. |
| Empty `suggestions = []` rows | 0 | No empty cached result currently persisted. |
| Oldest `stored_at` | 2026-09-28 12:20:06.242+00 | Within 30 days at audit time. |
| Newest `stored_at` | 2026-10-03 11:16:43.622+00 | Recent cache activity. |
| Fresh rows (`stored_at >= CURRENT_TIMESTAMP - 30 days`) | 40 | No currently stale rows. |
| Stale rows (>30 days) | 0 | No live stale-data incident observed. |
| JSONB non-array rows | 0 | Current rows match expected array container. |
| Empty arrays | 0 | Current rows all have at least one suggestion. |
| Non-object array elements | 0 | Current elements match expected object shape. |
| Elements missing `placeId` / `displayName` / `country` | 0 / 0 / 0 | Required observed fields are present. |
| Invalid latitude/longitude JSON types | 0 / 0 | Current coordinates are number or JSON null. |
| Total suggestion elements | 286 | Current cache payload volume. |

The live SQL checks were read-only `SELECT` statements through Supabase MCP. No row sample containing customer-sensitive data was required or exported.

## 4. Database contract and column population matrix

Migration `0008` defines:

```sql
CREATE TABLE IF NOT EXISTS location_cache (
    cache_key TEXT PRIMARY KEY,
    suggestions JSONB NOT NULL,
    stored_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column | Type / DB contract | What fills it | Condition and writer | NULL/empty meaning | Audit result |
|---|---|---|---|---|---|
| `cache_key` | `text`, `NOT NULL`, primary key, no explicit default | `location.service.ts` computes `trimmed.toLowerCase().replace(/\\s+/g, " ")`; PostgreSQL `locationCache.set()` passes it as `$1` | Written only on a provider-success cache write (`location.service.ts:27-43`) or the seed script (`scripts/seed.ts:538-551`). Upsert conflict replaces the payload and timestamp for an existing key. | NULL is impossible through the database contract. Empty text is not explicitly prohibited at the database layer, but the public Zod/service path rejects queries shorter than two characters before a key can be written. A direct repository caller could bypass that guard; this is a hardening gap, not observed live. | All live keys are non-NULL. No admin/customer direct key writer exists. |
| `suggestions` | `jsonb`, `NOT NULL`, no DB shape/check constraint | The external `GeocodingProvider` result is capped to eight and has `displayName` HTML tags stripped and length-capped at 200 (`location.service.ts:35-42`). The safe array is serialized with `JSON.stringify()` and bound as `$2::jsonb`. Static fallback results are returned but are **not** cached because the write is inside the provider-success `try` branch. | Filled only after a successful provider response, or by the seed script. The cache read casts JSONB to `LocationSuggestion[]` (`postgres.ts:1400-1402`). | NULL is prohibited. An empty array would represent a provider returning no results, but the current service would still cache an empty successful provider array; public fallback is only used when the provider throws. The live table has no empty arrays. JSONB shape is application-enforced only; current live shape is valid. | No current null/empty/shape defect. Missing DB-level JSON schema validation is a latent contract gap (P2 hardening). |
| `stored_at` | `timestamptz`, `NOT NULL`, default `now()` | `toIso(deps.clock.now())` is explicitly passed by the service on each provider-success cache write. Seed data passes fixed timestamps. The DB default is used only if some other insert omits the column. | Written on initial insert and every upsert refresh (`postgres.ts:1405-1411`). A cached value is considered fresh when age is `< 30 days` and non-negative (`location.service.ts:28-32`). Future timestamps are treated as misses. | NULL is prohibited. Staleness is intentional cache behavior: stale values are bypassed and refreshed/fallbacked, not returned. There is no automatic deletion or timestamp-based cleanup. | All live values are non-NULL and fresh now. Lack of eviction is the confirmed latent operational defect described below. |

## 5. Backend model, schema, mapper, and SQL alignment

### Domain model and Zod

`LocationSuggestion` is:

```ts
{
  placeId: string;
  displayName: string;
  city: string | null;
  state: string | null;
  country: string;
  lat: number | null;
  lon: number | null;
}
```

`AutocompleteQuerySchema` requires a trimmed string of 2-80 characters and rejects `<script`/`javascript:` patterns. The service repeats these checks defensively, normalizes case and whitespace for cache-key reuse, and never exposes the LocationIQ token to the browser.

There is no separate Zod schema for the JSONB suggestion payload. `location.service.ts` trusts the provider interface and `postgres.ts` uses a TypeScript cast on read. The two provider implementations currently construct the expected fields; the live JSONB shape check found no malformed rows. This is a defense-in-depth gap rather than a demonstrated current data mismatch.

### PostgreSQL mapper/repository

- `get(key)` executes `select suggestions, stored_at from location_cache where cache_key=$1`.
- A missing row returns `null`.
- A hit maps `suggestions` to the domain array and converts `stored_at` to ISO.
- `set(key, suggestions, storedAt)` executes an atomic `INSERT ... ON CONFLICT (cache_key) DO UPDATE SET suggestions=excluded.suggestions, stored_at=excluded.stored_at`.
- No delete, list, expired-row purge, or row-count method exists.

The in-memory repository mirrors the same `get`/`set` contract, using a `Map`. This supports deterministic tests without touching production data.

### Seed behavior

The fixture contains three static entries (`delhi`, `agra`, `jaipur`) with representative normalized suggestion objects. `scripts/seed.ts` upserts those entries inside a transaction. The live count of 40 is therefore not expected to equal the three fixture keys: production/runtime provider searches add more keys; the seed script does not delete keys outside its fixture set.

## 6. Writers and readers

### Writers

1. **Location service / provider-success path** — public `GET /api/v1/locations/autocomplete` calls `locationCache.set()` after a successful external provider response. The cache is refreshed on an expired or missing key only if the provider succeeds.
2. **Seed script** — `backend/scripts/seed.ts` upserts fixture rows. This is an operational/bootstrap writer, not a customer workflow.
3. **In-memory test repository** — test-only writer used by `location-proxy.test.ts`; it never persists to Supabase.
4. **Service-role SQL access** — RLS migration `0016_comprehensive_rls_policies.sql` allows backend service-role access. No admin API is provided for this table, and no admin form/page references it.

There are **no known webhook, payment, booking, admin CMS, or scheduled-job writers** for this table.

### Readers

1. **Backend location service** — reads by normalized key before calling the provider.
2. **Public customer endpoint** — controller returns `{ source: "cache" | "provider" | "fallback", suggestions }` through the standard success envelope.
3. **React customer UI** — `useLocationIQ` calls only the secure backend proxy, supports the object envelope and suggestion list, maps `placeId/displayName/city/state/lat/lon` into the browser model, debounces 300 ms, and aborts superseded requests.
4. **`LocationCombobox`** — merges live results with the static curated destination list and allows customers to select or type a location.
5. **Booking flow** — selected names and free-text addresses are copied into booking intent/booking payload fields. The chosen suggestion is not linked back to `location_cache` by foreign key or cache key.

No admin page or public direct Supabase/PostgREST reader is present. The table is intentionally an internal cache, not a customer-facing catalog/source-of-truth table.

## 7. Cross-table lifecycle and foreign keys

`location_cache` has **no foreign keys** and no references from other tables. This is appropriate for an expiring cache: cache rows must not block deletion or lifecycle transitions for bookings, profiles, catalog items, routes, packages, or inquiries.

The only cross-domain connection is application-level:

- autocomplete result -> customer-selected location text/coordinates in the React form;
- booking service persists sanitized `originName`, `destinationName`, `pickupAddress`, and `dropAddress` in `bookings`/booking-intent payloads;
- later booking reads return those booking-owned values, not a live join to `location_cache`.

Consequences are intentional: deleting or expiring a cache entry does not alter any existing booking. A booking does not guarantee that its original provider suggestion remains available in the cache.

## 8. Exact mismatches and severity

### Finding LC-001 — stale rows are never evicted (confirmed latent operational defect, P2/medium)

**Evidence:**

- `location.service.ts:28-34` bypasses a cached row when age is 30 days or more but does not delete it.
- `Repositories.locationCache` in `backend/src/db/types.ts:257-260` exposes only `get` and `set`.
- `postgres.ts:1395-1413` has no `DELETE`, purge, expiry predicate, or cleanup operation.
- Migration `0008` has no `stored_at` index and no retention mechanism.
- No scheduled cleanup job or maintenance command references `location_cache`.

**Impact:** Every previously queried key remains stored forever unless the database is manually cleaned. The 30-day rule limits use of stale data but does not bound table size. This can create unbounded growth and stale-row storage over long operation. It is not currently causing bad reads: the live read-only check found 40/40 fresh rows and 0 stale rows.

**Recommended fix:** Add a bounded maintenance operation (for example, `DELETE FROM location_cache WHERE stored_at < now() - interval '30 days'`, with an index on `stored_at`) run by a controlled backend maintenance job, or add deletion on a stale miss if the write path can safely delete. Prefer a separate maintenance job so provider failures do not make a user request perform destructive cleanup. Add a dry-run count metric and retention test before enabling production cleanup.

### Finding LC-002 — JSONB payload shape is not enforced at the DB or read boundary (contract-hardening gap, P2/medium; not observed live)

**Evidence:**

- Migration defines `suggestions JSONB NOT NULL` but no JSON type/array/object/field checks.
- `postgres.ts:1401` uses `row.suggestions as LocationSuggestion[]`, which is compile-time only.
- No Zod schema validates cached suggestion objects on read.
- The provider adapter constructs the shape, and the live read-only shape query found 0 malformed rows across 286 elements.

**Impact:** A malformed service-role insert or historical data can reach the public endpoint and frontend as trusted data. This is a resilience/integrity risk, not a current production mismatch.

**Recommended fix:** Add a small `LocationSuggestionSchema`/array schema shared by the provider boundary and cache read/write path; reject or ignore malformed cache rows and refresh from provider. Optionally add a lightweight JSONB check for array container type, while keeping detailed field validation in application code.

### Finding LC-003 — stale/refresh branch is not covered by the checked-in test suite (test coverage gap, P3/low)

**Evidence:** `backend/tests/unit/location-proxy.test.ts` has five passing tests: invalid query, static fallback, fresh cache hit, sanitization/8-item cap, and provider failure. It does not advance the clock beyond 30 days and assert provider refresh, future timestamp miss, or behavior when a stale row is retained.

**Impact:** The core TTL branch can regress unnoticed even though the documented execution plan explicitly calls for expired/stale behavior.

**Recommended fix:** Add deterministic in-memory tests for exactly those branches; no production write is required.

### Non-findings / intentionally aligned behavior

- `checkout_url`-style nullable semantics are not applicable here; all three cache columns are intentionally non-null.
- `stored_at` is explicitly set by application code rather than relying on the DB default so the injected test clock controls TTL deterministically.
- Fallback results are not cached. This avoids persisting a static/error response as if it were a successful provider result; it is intentional.
- Cache rows have no foreign keys. This avoids coupling ephemeral data to customer or booking lifecycles.
- RLS is enabled and the comprehensive migration provides service-role access. The public autocomplete route is served by Fastify/backend SQL, not by direct anonymous Supabase table reads. No public `location_cache` SELECT policy is needed for the observed architecture.

## 9. Bounded lifecycle test and read-only boundary

The audit ran:

```text
cd /home/ubuntu/ArenaAI/backend
npm test -- --run tests/unit/location-proxy.test.ts
```

Result: **1 test file, 5 tests passed**. This used only the in-memory repository and a mock provider. It covered query validation, fallback behavior, provider success, cache write/read hit, output sanitization, and the eight-item limit.

The additional recommended bounded test should remain in-memory and deterministic:

1. Use a mutable fake clock and mock provider.
2. First lookup of a normalized key: assert one provider call, `source=provider`, and one cache write.
3. Immediate repeated lookup with case/whitespace variation: assert `source=cache` and no additional provider call.
4. Advance clock to exactly 30 days: assert cache is treated as stale (`age < TTL` is false), provider is called, and the timestamp/payload is refreshed on success.
5. Set provider failure after expiry: assert static fallback/unavailable behavior and confirm stale data is not returned as fresh.
6. Test future `stored_at`: assert it is not treated as a valid hit (`age >= 0` guard).
7. If implementing cleanup, test the purge as a separate repository/maintenance operation against disposable rows; do not run it against production during this audit.

A live lifecycle test must remain read-only because the requested audit prohibits production writes, deletes, migrations, and external provider submissions. The Supabase count/null/shape/current-TTL checks above are therefore the maximum safe production verification performed.

## 10. Recommended remediation order

1. **Add deterministic stale-branch tests** in memory (no production impact).
2. **Add runtime JSONB schema validation** on cache writes and reads; treat invalid cached data as a miss.
3. **Design and review retention cleanup**: `stored_at` index, bounded purge job, metrics/dry-run, and service-role-only execution.
4. **Re-run read-only live checks** for row count, stale count, JSONB shape, and cache-hit/refresh metrics after deployment.
5. **Keep `location_cache` internal**; do not add direct anonymous table policies or admin CRUD unless the source-of-truth/security design changes.

## Audit conclusion

The normal location autocomplete cache path is currently populated and aligned: **40 live rows, no NULLs, no empty arrays, no observed malformed suggestion elements, and all rows fresh at audit time**. The main remediation is operational retention/eviction, followed by defense-in-depth payload validation and explicit stale-branch tests. No production mutation was required or performed.
