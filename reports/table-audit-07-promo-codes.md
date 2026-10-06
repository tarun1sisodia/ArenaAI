# Table audit 07 — `public.promo_codes`

**Audit date:** 2026-10-06  
**Repository:** `/home/ubuntu/ArenaAI`  
**Scope:** live schema and row/null evidence; migrations; backend domain type, Zod contracts, mappers, SQL repositories, services/controllers/routes; admin API/form/page; customer/public readers; booking/payment lifecycle; relationships; mismatch severity; and a bounded non-production lifecycle test plan.

## Executive conclusion

`promo_codes` is populated and its field-level persistence contract is largely aligned. The live Supabase table contains **2 rows**, with RLS enabled. The PostgreSQL mapper, in-memory repository, admin CRUD contract, public featured endpoint, and server-side fare validation all represent the 12 live columns, including `allow_group_vehicles` and `is_broadcast` from migration `0026_promo_broadcast_and_group_vehicles.sql`. Existing isolated promo tests pass (**8/8**).

Three issues require attention:

1. **High — invalid/expired/inapplicable customer-entered codes are persisted to `bookings.promo_code` and can later be counted as redemptions.** `fare.engine.ts` deliberately returns the normalized input code even when `promoValid=false`; `booking.service.ts` persists that value in the nullable booking column; payment confirmation increments `redemption_count` whenever `booking.promoCode` is truthy, without checking that the booking actually received a discount. This can consume redemption counts for a booking that received no promotion.
2. **High — redemption-limit enforcement is not atomic or reserved at checkout.** Fare validation reads `redemption_count`, while payment confirmation later performs a read/modify/write increment. Concurrent checkouts can both pass the limit, and concurrent increments can lose updates. The payment path also swallows promo-update errors as non-critical. A bounded unit test should cover max-redemption concurrency and invalid-code persistence.
3. **Medium — public promotional copy and legacy client data are stale relative to the live source of truth.** Live `TEST99` is the current broadcast code, but public home copy and static client data advertise `ASTTCAR500OFF`; with the DB-backed production fare path, that static code is not a current row and is rejected unless a non-production/static fallback is active.

No production writes, migrations, webhook replays, deletes, or external submissions were performed. The only live database operation was a SELECT-only Supabase query.

## Evidence and current live state

### Sources inspected

- `reports/live-schema-inventory.md` — generated from Supabase `list_tables` on 2026-10-05; reports 2 rows and RLS enabled.
- `reports/schema-model-alignment.md`
- `reports/schema-audit-findings.md`
- `reports/phase1-table-scan-findings.md`
- `reports/2026-10-06-16-table-alignment-execution-plan.md`
- `backend/migrations/0007_create_catalog_reviews_promos.sql`
- `backend/migrations/0009_add_indexes_and_rls.sql`
- `backend/migrations/0016_comprehensive_rls_policies.sql` (public active-row read policy and service-role policy)
- `backend/migrations/0026_promo_broadcast_and_group_vehicles.sql`
- `backend/src/types/domain.ts:314-327`
- `backend/src/db/types.ts:216-224`, `backend/src/db/postgres.ts:1135-1241,1636-1650`, `backend/src/db/memory.ts:752-805`
- `backend/src/modules/promos/{promos.schema.ts,promos.service.ts,promos.controller.ts,promos.routes.ts}`
- `backend/src/modules/fares/{fare.engine.ts,fare.service.ts}`
- `backend/src/modules/bookings/booking.service.ts`
- `backend/src/modules/payments/payment.service.ts`
- `admin/src/lib/{types.ts,api.ts}`, `admin/src/pages/PromosPage.tsx`
- `react/src/services/api.ts`, `react/src/features/booking/BookingPage.tsx`, `react/src/data.ts`, `react/src/components/home/BenefitsSection.tsx`
- `backend/tests/unit/promos.test.ts`

### Read-only Supabase query

Project `trcmufqbpcymipqpemoq` was queried with a SELECT-only aggregate for row count, null counts, empty strings, and current rows. Result:

| Check | Current result | Interpretation |
|---|---:|---|
| Rows | **2** | Populated, not empty; agrees with `live-schema-inventory.md:19`. |
| NULL `id`, `code`, `discount_amount`, `min_total`, `description`, `is_active`, `redemption_count`, `allow_group_vehicles`, `is_broadcast` | **0 each** | All required/non-null fields are populated. |
| NULL `max_redemptions` | **2/2** | Unlimited redemption semantics are active for both live codes. |
| NULL `valid_from` | **1/2** | Open start boundary for `TEST99`; intentional. |
| NULL `valid_to` | **1/2** | Open end boundary for `TEST99`; intentional. |
| Empty `code` or `description` after trim | **0 each** | No empty required text values. |
| `TEST500` | active; discount 1999; minimum 2000; valid 2026-10-04 17:34Z through 2026-10-04 17:34Z; redemption count 0; not broadcast; group vehicles false | The row is now time-expired because `valid_to` is in the past, despite `is_active=true`. Date-window checks intentionally make it unusable. |
| `TEST99` | active; discount 10000; minimum 1; no date bounds; redemption count 2; broadcast; group vehicles true | Current featured candidate. It is unlimited because `max_redemptions IS NULL`. |

The inventory reports RLS **enabled** for `promo_codes`. Migration `0009` enables it, and migration `0016` defines public SELECT only for active rows plus service-role access. The public backend endpoint applies the stricter active/date/redemption selection described below.

## Database contract and column population matrix

The base table is created by `backend/migrations/0007_create_catalog_reviews_promos.sql:67-78`. Migration `0026` adds the two extension columns and a partial unique index.

| Column | Type / nullability / default | What fills it and under which condition | Writers | NULL/empty assessment |
|---|---|---|---|---|
| `id` | `uuid NOT NULL`, default `gen_random_uuid()` | PostgreSQL can generate it; admin service supplies `randomUUID()` before repository insert; seed/test fixtures can supply an ID. | DB default, `promos.service.ts:create`, fixtures/seed paths, PostgreSQL insert. | Required identity. No NULLs; empty is impossible. |
| `code` | `varchar(30) NOT NULL UNIQUE`, no default | Admin input is trimmed and uppercased by `PromoCodeFormat` and service normalization; repository lookup also uppercases. | Admin create/update; PostgreSQL insert/update; memory repository; fixtures/seed. | Required, non-empty by Zod (`3–30` chars) and unique in DB. Case-insensitive intent is implemented by normalization, not a functional unique index; direct out-of-band writes could still bypass the convention. |
| `discount_amount` | `numeric(8,2) NOT NULL`, DB check `>= 0`, no default | Admin requires a positive number; service persists it; fare engine caps the applied discount at the subtotal. | Admin create/update; repository SQL; fixtures/seed. | Required/non-empty. API is stricter than DB (DB permits zero, API does not). No live NULLs. |
| `min_total` | `numeric(10,2) NOT NULL`, DB check `>= 0`, no default | Admin defaults to `0`; service writes the value; fare validation requires subtotal to meet it. | Admin create/update; repository SQL; fixtures/seed. | Required/non-empty. Zero intentionally means no minimum. No live NULLs. |
| `description` | `text NOT NULL`, no default | Admin trims and requires at least one character; public featured response uses it for the customer callout; repository persists it. | Admin create/update; repository SQL; fixtures/seed. | Required/non-empty. No live empty strings. |
| `is_active` | `boolean NOT NULL DEFAULT true` | Admin create defaults true and update can toggle it. Fare validation rejects a DB row when false; featured query requires true. | Admin CRUD; repository SQL; fixtures/seed; DB default. | Always populated. `false` is an intentional disable state, not NULL. |
| `max_redemptions` | `int4 NULL`, no default | Admin empty field becomes `null`; a positive integer creates a cap. Fare validation rejects when `redemption_count >= max_redemptions`; featured query also excludes exhausted codes. | Admin CRUD; repository SQL; fixtures/seed. | NULL intentionally means unlimited. Current 2/2 NULLs are expected. DB has no positive-value check; API has one, so direct/service-role writes can create invalid zero/negative caps. |
| `redemption_count` | `int4 NOT NULL DEFAULT 0`, no DB non-negative check | Starts at zero on service create; payment confirmation increments it only when a booking transitions to `paid_confirmed` and has a truthy `booking.promoCode`. | DB default; `promos.service.ts:create`; `payment.service.ts` browser confirmation and webhook confirmation paths; repository update; fixtures/seed. | Zero is intentional for never-redeemed codes. It should never be negative. Current `TEST500=0`, `TEST99=2`. The increment is currently vulnerable to invalid-code counting, oversubscription, lost updates, and swallowed update failures (findings below). |
| `valid_from` | `timestamptz NULL`, no default | Admin optional datetime is converted to ISO or NULL. Fare and featured selection require `valid_from <= now()` when present. | Admin CRUD; repository SQL; fixtures/seed. | NULL intentionally means valid from the beginning. Current `TEST99` is open-ended at start. |
| `valid_to` | `timestamptz NULL`, no default | Admin optional datetime is converted to ISO or NULL. Fare and featured selection reject when `valid_to < now()`; equality is accepted. | Admin CRUD; repository SQL; fixtures/seed. | NULL intentionally means no expiry. Current `TEST99` is open-ended; `TEST500` has an expired bound. There is no DB check that `valid_to >= valid_from`; API also does not enforce ordering, so an inverted interval can be stored and simply behave as unusable. |
| `allow_group_vehicles` | `boolean NOT NULL DEFAULT false` (migration 0026) | Admin checkbox writes true/false; fare service reads it to permit promo application for group commercial vehicles (`tempo-traveller`/`urbania`); featured response exposes it so the customer UI can gate the callout/input. | Admin CRUD; repository SQL; fare service/featured reader; DB default; fixtures/seed. | False is intentional default (“cars only”), not NULL. Current `TEST99=true`, `TEST500=false`. |
| `is_broadcast` | `boolean NOT NULL DEFAULT false` (migration 0026), partial unique index `idx_promo_codes_single_broadcast` where true | Admin checkbox marks the one website-featured code. Service pre-checks for another broadcast; DB index is final race-safe guard. Featured query additionally requires active, date-valid, and non-exhausted. | Admin CRUD; repository SQL; DB default/index; fixtures/seed. | False is intentional for ordinary codes. At most one row can have true, but the DB uniqueness is stricter than “one currently live” because it also counts expired/inactive broadcast rows until explicitly turned off. Current `TEST99=true`, `TEST500=false`. |

The table has **no `created_at`/`updated_at` column**. This is not a mapper omission: neither migration nor live schema contains a timestamp. Administrative history is therefore not available from the promo row itself; the application should use `admin_audit_logs` if auditability is required.

## Backend model, schemas, mapper, and SQL alignment

### Domain and validation

- `PromoCodeRecord` contains all 12 live columns (`backend/src/types/domain.ts:314-327`).
- `Repositories.promos` exposes `getByCode`, `getById`, `list`, `getFeatured`, `create`, `update`, and `delete` (`backend/src/db/types.ts:216-224`).
- `CreatePromoSchema` and `UpdatePromoSchema` are strict. Code is trimmed, uppercased, and constrained to 3–30 uppercase alphanumeric/dash/underscore characters. Numeric/date/boolean fields map to the live columns. Optional empty date strings normalize to `null` (`promos.schema.ts:3-42`).
- Create sets `redemptionCount: 0`; update preserves the existing count because the request schema does not expose it directly (`promos.service.ts:59-72,110-123`).
- `promos.service.ts` rejects duplicate codes and rejects a second broadcast in application logic, with a DB unique-index error translation as a final guard.

### PostgreSQL mapper and SQL

- `getByCode` uppercases input and performs `select * from promo_codes where code=$1`; `getById`, `list`, and `getFeatured` are direct parameterized reads (`postgres.ts:1144-1168`).
- `getFeatured` requires `is_broadcast=true`, `is_active=true`, valid date bounds, and either unlimited redemptions or `redemption_count < max_redemptions`; it returns one row ordered by `valid_from desc nulls last`.
- `create` inserts all 12 columns; `update` writes all mutable columns while preserving the existing ID and count from the service record; `delete` removes by ID (`postgres.ts:1170-1241`).
- `mapPromo` maps snake_case to all 12 camelCase fields and converts nullable dates/limits to `null` (`postgres.ts:1636-1650`).
- The memory repository implements the same featured predicates, code normalization, broadcast conflict behavior, and CRUD shape for isolated tests (`memory.ts:752-805`).

No field-level database-to-backend drop was found. Numeric PostgreSQL values are converted through the shared `num()` mapper, and nullable dates/limits preserve NULL semantics.

## Writers and readers / lifecycle chain

### Writers

1. **Migrations:** `0007` creates the base table; `0009` enables RLS; `0016` defines active public reads/service-role access; `0026` adds group-vehicle/broadcast columns and the single-broadcast partial unique index.
2. **Admin create:** `POST /api/v1/ops/admin/promos` → auth/role guard → `CreatePromoSchema` → `promos.service.create` → `db.promos.create`.
3. **Admin update:** `PATCH /api/v1/ops/admin/promos/:id` → auth/role guard → `UpdatePromoSchema` → `promos.service.update` → `db.promos.update`.
4. **Admin delete:** `DELETE /api/v1/ops/admin/promos/:id` → auth/role guard → `promos.service.remove` → `db.promos.delete`. There is no FK from bookings to promos, so this does not invalidate historical booking rows.
5. **Customer booking creation:** `booking.service.ts` calls the fare service, then persists `discountAmount`, `promoCode`, and the complete `fareSnapshot` in `bookings`. This is the primary cross-table application link.
6. **Payment confirmation:** both browser/server payment confirmation and signed webhook confirmation increment the matching promo after the booking transitions to `paid_confirmed` (`payment.service.ts` around lines 226-239 and 372-397). The status transition prevents the same booking from incrementing on repeated confirmation, but the promo update itself is not a compare-and-swap/atomic increment.
7. **Memory/test writers:** in-memory repositories and HTTP injection tests are isolated and do not touch production.

There are no promo writers from a scheduled job, notification worker, or raw webhook directly. The webhook payment path is an indirect writer through the payment lifecycle.

### Readers

1. **Fare service:** reads by code to validate active/date/minimum/redemption eligibility and group-vehicle permission before calculating the server-authoritative discount (`fare.service.ts:286-350`; `fare.engine.ts:57-91`).
2. **Public featured endpoint:** `GET /api/v1/promos/featured` is rate-limited and unauthenticated; it returns only code, discount, minimum, description, and group-vehicle permission (`promos.routes.ts:8-12`, `promos.controller.ts:54-57`, `promos.service.ts:31-40`).
3. **Customer booking page:** `react/src/services/api.ts:303-312` fetches the featured endpoint. `BookingPage.tsx` displays the broadcast callout, gates group-vehicle entry using `allowGroupVehicles`, posts `promoCode` to server fare/booking calls, and displays the server's `promoValid` result. The browser does not authoritatively calculate the final amount.
4. **Admin page:** `PromosPage.tsx` lists all rows, shows count/cap, date bounds, active/broadcast/group flags, and sends normalized create/update payloads. It intentionally renders `maxRedemptions=null` as `∞` and blank dates as absent.
5. **Legacy/static public code:** `react/src/data.ts` and `react/src/fares.ts` still define `ASTTCAR500OFF` and a local `applyPromo` fallback. The home Benefits section hardcodes the same code and ₹500 claim. These are not the DB-backed current promotional source.

## Cross-table relationships and lifecycle connections

- **No database foreign key references `promo_codes`, and none originates from it.** `bookings.promo_code` is a nullable `varchar`, not an FK to `promo_codes.code`. This is intentional for historical resilience (deleting a promo does not break a booking), but it permits stale/invalid values and prevents database-enforced referential integrity.
- The intended chain is: `promo_codes` eligibility → server fare result → `bookings.discount_amount`, `bookings.promo_code`, and `bookings.fare_snapshot` → payment captured/booking becomes `paid_confirmed` → `promo_codes.redemption_count` increment.
- Existing bookings retain the applied fare snapshot; editing/deleting a promo does not rewrite historical booking money. However, because the booking link is only a string, post-capture redemption accounting re-looks up the current promo by code and can count an invalid booking or behave differently after a promo is deleted/renamed.
- `admin_audit_logs` is a separate table with no DB FK to promos. The promo CRUD service does not append a promo-specific audit record, so changes/deletes are not independently reconstructible from the promo row. This is an operational auditability gap if the admin audit requirement applies uniformly to all admin domains.
- RLS is enabled on `promo_codes`; migration `0016` grants active public SELECT and service-role access. Backend writes use the service/database path, while admin API authorization is enforced in the controller with `ADMIN_ROLES` plus `requireUser`.

## Findings and severity

### F1 — Invalid code can be persisted and later counted as a redemption (**High, confirmed defect**)

**Evidence:**

- `fare.engine.ts:641-642`: when a promo is invalid, the result still sets `promoCode` to the normalized input (`args.promoCode.trim().toUpperCase()`) while setting `promoValid=false` and `discountAmount=0`.
- `fare.service.ts:348-350`: the DB-backed path does the same for an unknown, inactive, expired, below-minimum, or exhausted code.
- `booking.service.ts:292-298`: `promoCode` is persisted from `fare.promoValid ? fare.promoCode : input.promoCode?.toUpperCase() ?? null`; therefore invalid input is stored in `bookings.promo_code`.
- `payment.service.ts` increments the promo whenever `booking.promoCode` is truthy, without checking `booking.discountAmount > 0` or the fare snapshot's `promoValid` flag.

**Impact:** A paid booking with an invalid/expired/inapplicable code and no discount can increment the corresponding promo's `redemption_count`. For a code with a cap, legitimate customers can be denied later; analytics also become incorrect. A code that is deleted before payment does not increment, but a stale code still present does.

**Fix:** Persist `promoCode` as `null` unless `promoValid=true` (and preferably persist a canonical promo ID or immutable promotion snapshot). At confirmation, increment only when the stored fare snapshot proves a valid discount was applied. Add a regression test for unknown, expired, below-minimum, group-ineligible, and exhausted codes.

### F2 — Redemption limits are check-then-act and increments are non-atomic (**High, confirmed defect**)

**Evidence:**

- Fare validation checks `redemptionCount >= maxRedemptions` during quote creation (`fare.engine.ts:71-74`).
- Payment confirmation later reads the promo and writes `redemptionCount: promo.redemptionCount + 1` (`payment.service.ts` around 383-391; equivalent browser path around 230-234).
- The repository update writes the whole row (`postgres.ts:1194-1225`) rather than `redemption_count = redemption_count + 1` with a `WHERE` guard.
- Promo update errors are caught and ignored as “non-critical” (`payment.service.ts` around 392-395), so a paid booking can have no accounting update.

**Impact:** Two checkouts can both observe the last available redemption and both later capture; the count can exceed the cap. Concurrent read/modify/write confirmations can lose an increment. Swallowed failures create silent under-counting. Payment confirmation should not fail because of analytics, but the system needs an explicit durable reconciliation/outbox path if it chooses that trade-off.

**Fix:** Reserve/consume atomically at the business event that defines redemption. A PostgreSQL statement/function should update only when `max_redemptions IS NULL OR redemption_count < max_redemptions`, check the affected row count, and be idempotent by booking/payment ID. Alternatively add a redemption ledger with a unique booking/promo key and derive the count. Do not rely on an uncoupled quote-time read.

### F3 — Public customer copy is not aligned with live broadcast source (**Medium, confirmed display defect**)

**Evidence:**

- Live read shows `TEST99` is `is_broadcast=true`, active, open-ended, group-vehicle-enabled; `TEST500` is expired and not broadcast.
- `react/src/components/home/BenefitsSection.tsx:104-110` hardcodes “Coupon ASTTCAR500OFF” and “flat ₹500 off”.
- `react/src/data.ts:949-951,1075-1079` and `react/src/fares.ts:150-159` retain a static `ASTTCAR500OFF` rule.
- The current booking flow fetches `/api/v1/promos/featured` and server-validates entered codes, so the hardcoded home claim can advertise a code that is not present in the live promo table.

**Impact:** Customers can be directed to a stale/invalid code or see a discount claim that does not match the live database. The final server amount remains authoritative, so this is primarily a display/conversion defect rather than a payment-integrity defect.

**Fix:** Render public promotional copy from the featured endpoint or remove the hardcoded coupon claim. Keep any static fallback explicitly marked for local/offline development and do not use it in production when the DB-backed fare service is configured.

### F4 — Missing interval and numeric invariants are hardening gaps (**Medium, unverified live defect**)

The DB has no checks for `valid_to >= valid_from`, `max_redemptions > 0` when non-NULL, or `redemption_count >= 0`. Zod enforces positive `maxRedemptions` on admin writes but does not enforce date ordering; `redemption_count` is not admin-editable through the request schema. No violating live row was observed in the two-row query, but out-of-band/service-role writes could store inconsistent states. Add database checks or a single validated write function, with explicit handling for an already-expired `is_broadcast=true` row.

### F5 — Promo CRUD is not independently audit-logged (**Medium, governance gap; requirement-dependent**)

`promos.service.ts` create/update/remove calls only `db.promos`; it does not append to `db.audit`. The table has no timestamps. If the application’s admin audit policy requires every admin mutation to be reconstructible, this is a confirmed coverage gap. Add create/update/delete audit entries with before/after state and request ID, ideally in a transaction/outbox boundary. If promo audit is intentionally excluded, document that exception.

### Non-findings / intentional empty or NULL states

- `max_redemptions=NULL` is intentional unlimited-cap semantics; both current rows use it.
- `valid_from=NULL` means immediately eligible; `valid_to=NULL` means no expiry. These are intentional open bounds.
- `redemption_count=0` is intentional for an unused code (`TEST500`); it is not evidence of a failed insert.
- `is_active=false`, `is_broadcast=false`, and `allow_group_vehicles=false` are explicit boolean states, not missing data.
- An active row can be time-expired: `is_active` is a manual enable flag, while `valid_to` is a separate eligibility window. `TEST500` demonstrates this; the fare and featured predicates correctly reject it.
- No direct FK means deleting a promo does not cascade into bookings. This avoids historical FK breakage but is the reason the application must validate persisted promo usage carefully.

## Bounded lifecycle test plan (non-production)

The audit must remain read-only against the live project: a true production create, booking, capture, promo increment, webhook replay, rollback, or delete is prohibited. The following bounded test can run against `createMemoryRepositories()` and Fastify `app.inject()` only, with disposable IDs and no external provider:

1. **Create/read alignment:** create a promo through the admin HTTP route with uppercase/lowercase input, blank optional dates, a finite cap, `allowGroupVehicles`, and `isBroadcast`; assert the returned record and memory row contain all 12 fields with blank dates converted to `null` and `redemptionCount=0`.
2. **Featured eligibility:** test active/current, inactive, future, expired, and cap-exhausted rows through `getFeatured`/public endpoint; assert only the current non-exhausted broadcast is returned.
3. **Fare eligibility:** test normal vehicle versus group vehicle; test valid, below-minimum, inactive, expired, and exhausted codes; assert discount, `promoValid`, and group gating.
4. **Invalid persistence regression:** create a booking with an unknown or expired code, assert `booking.promoCode === null` after the fix and `discountAmount===0`; before the fix this test should reproduce the defect (normalized code stored).
5. **Redemption transition:** use a disposable pending booking and fake successful payment confirmation; assert exactly one increment when transitioning to `paid_confirmed`, and no second increment for duplicate confirmation. Assert no increment when the fare snapshot says `promoValid=false` or discount is zero.
6. **Cap race/atomicity:** run two isolated confirmation attempts against a promo with `maxRedemptions=1`; the database-backed implementation should allow only one consumption. A memory-only test can verify the intended contract, but PostgreSQL concurrency must eventually be validated in a disposable branch or transaction test—not production.
7. **Admin contract:** create/update/delete through authenticated app injection; assert unauthorized requests fail, a second broadcast is rejected, and the update preserves `redemptionCount`.

Current validation: `npm run test:ci -- tests/unit/promos.test.ts` passed **8/8**. Those tests cover group-vehicle permission, featured eligibility, broadcast conflict, public endpoint shape, and admin auth/CRUD, but do **not** cover F1 invalid-code persistence or F2 concurrent/atomic redemption accounting.

## Recommended fix order

1. Change booking persistence to store `promoCode` only on `promoValid=true`; add the invalid-code regression test.
2. Introduce atomic/idempotent redemption consumption (conditional increment or redemption ledger) and stop silently losing accounting updates; add the cap/concurrency test.
3. Remove or dynamically source hardcoded public `ASTTCAR500OFF` copy and legacy production fallback.
4. Add DB/API invariant checks for date ordering, positive finite cap, and non-negative count; decide whether broadcast uniqueness should mean `is_broadcast=true` or only currently live rows.
5. Add promo admin audit entries or document the deliberate exception.
6. Run a controlled disposable integration test against a non-production database/branch after code changes; keep live verification SELECT-only.
