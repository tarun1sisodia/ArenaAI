# Table audit 02 — `bookings` and `customer_booking_intents`

**Audit date:** 2026-10-06  
**Scope:** Exactly `public.bookings` and `public.customer_booking_intents`; no production writes, migrations, deletes, webhook replays, or external submissions were performed.

## Executive summary

The two tables are substantially aligned end to end. The live Supabase project (`trcmufqbpcymipqpemoq`) currently has **8 bookings** and **12 customer booking intents**. A read-only aggregate query confirmed 4 bookings are `pending_payment` and 4 are `paid_confirmed`; 8 intents are consumed/claimed/resulting-booking-linked and 4 remain unconsumed. All 12 intents are expired at the time of the query, which is consistent with a short-lived continuation table and not, by itself, a write defect.

The strongest confirmed defect is a **live enum/domain/state-machine contract mismatch**: live `booking_status_enum` contains `driver_assigned`, while `backend/src/types/domain.ts`, `booking.schema`/admin schema, and `stateMachine.ts` omit it. The current rows do not use that status, but any live row at that value cannot be represented or transitioned safely by the current application contract. This is a high-severity forward-lifecycle defect, not evidence of corruption in the current eight rows.

No current referential-integrity break was found in read-only checks: every non-null `bookings.user_id` resolves to `profiles`, every non-null `selected_catalog_item_id` resolves to `catalog_items`, every claimed intent resolves to a profile, and every `resulting_booking_id` resolves to a booking. The in-memory bounded lifecycle suite passed **13/13 tests** across booking-intent authentication, canonical selection, draft creation, checkout, webhook capture, and customer history. Those tests are disposable/in-memory only; a production lifecycle mutation remains out of scope.

## Evidence and live population

### Sources inspected

- `reports/live-schema-inventory.md` (live inventory generated 2026-10-05; prior counts: bookings 8, intents 12).
- `reports/schema-model-alignment.md`, `reports/schema-audit-findings.md`, `reports/phase1-table-scan-findings.md`, and `reports/2026-10-06-16-table-alignment-execution-plan.md`.
- Migrations `backend/migrations/0002_create_enums.sql`, `0005_create_bookings.sql`, `0022_create_customer_booking_intents.sql`, `0023_add_canonical_booking_selection.sql`, and `0012_hyper_scale_indexes.sql`.
- Backend domain types, Zod schemas, services/controllers/routes, PostgreSQL and memory repositories, admin service/controller/routes, and customer React/API readers.
- Supabase MCP, read-only `execute_sql` against project `trcmufqbpcymipqpemoq`, queried during this audit. The query used only `SELECT` and aggregate/join checks.

### Current read-only Supabase results

| Check | Result |
|---|---:|
| `bookings` rows | 8 |
| `bookings.status = pending_payment` | 4 |
| `bookings.status = paid_confirmed` | 4 |
| `customer_booking_intents` rows | 12 |
| intents with `consumed_at` | 8 |
| intents with `claimed_user_id` | 8 |
| intents with `resulting_booking_id` | 8 |
| unconsumed intents | 4 |
| expired intents (`expires_at <= now()`) | 12 |
| intents with fare reconfirmation pending | 0 |
| intent claimed/consumed consistency mismatches | 0 |
| resulting booking FK missing | 0 |
| claimed profile FK missing | 0 |
| booking user profile FK missing | 0 |
| selected catalog-item FK missing | 0 |

Booking nullable-field counts from the same query: `user_id` NULL 0/8; `origin_name` NULL 0/8; `destination_name` NULL 0/8; `customer_email` NULL 0/8; `drop_address` NULL 5/8; `return_datetime` NULL 8/8; `flight_train_number` NULL 8/8; `promo_code` NULL 2/8; `special_notes` NULL 8/8; `package_id` NULL 8/8; `booking_selection` NULL 0/8; `selected_catalog_item_id` NULL 8/8. These are current population facts, not schema changes.

## Schema-to-model alignment

### `public.bookings` column matrix

| Column | Live definition | What fills it / writer | NULL or empty meaning and assessment |
|---|---|---|---|
| `id` | `uuid NOT NULL`, `gen_random_uuid()` | `BookingRecord.id` from `newId()` in `booking.service.ts`; PostgreSQL insert writes it. | Never NULL; generated identity. |
| `ticket_id` | `varchar NOT NULL`, format `AGR-YYYYMMDD-NNNN` | `newTicketId()` with collision checks, then draft creation through `POST /api/v1/bookings/draft` (customer or admin UI). Unique constraint plus repository `ticketExists`. | Never NULL; defect if collision allocation fails, which service rejects. |
| `user_id` | `uuid NULL`, FK `profiles(id) ON DELETE SET NULL` | Authenticated owner ID passed to `createDraft`; intent finalization passes authenticated actor. Guest direct draft stores NULL. Current live rows are all non-null. | NULL is intentional for guest-created draft bookings; if the profile is deleted, SET NULL preserves the booking. |
| `guest_access_token` | `varchar NOT NULL` | `newGuestAccessToken()` at draft creation; returned once to customer and used for guest payment/voucher access. | Never NULL; secret-bearing value should not be displayed in ordinary admin/customer projections. |
| `trip_type` | enum NOT NULL | `CreateDraftBookingSchema`/`BookingSelectionSchema`; service derives authoritative value from selection/fare result. | Required enum; invalid values rejected. |
| `vehicle_tier` | enum NOT NULL | Zod request (default sedan) and server fare/booking service. | Required enum; invalid values rejected. |
| `origin_name` | `text NULL` after migration 0023 | Legacy draft request or outstation selection. For local/package canonical selections, service intentionally stores NULL or package-compatible values; public projection uses typed selection. | NULL is intentional for canonical local/package rows. Current population happens to be 0 NULL. |
| `destination_name` | `text NULL` after migration 0023 | Legacy request or outstation selection; local/package canonical selections may not have a route destination. | NULL is intentional for canonical local/package rows. Current population happens to be 0 NULL. |
| `pickup_address` | `text NOT NULL` | Validated `SafeAddressSchema`, sanitized in `createDraft`, then inserted. Customer and admin manual form both supply it. | Required; empty is rejected. |
| `drop_address` | `text NULL` | Optional request field; sanitized when present. Admin manual form supplies destination as fallback. | NULL is intentional where the trip does not need a separate drop address. Current 5/8 NULL is not a defect. |
| `pickup_datetime` | `timestamptz NOT NULL` | Validated ISO request, minimum future window, normalized to ISO by booking service. | Required; past/invalid values rejected. |
| `return_datetime` | `timestamptz NULL` | Optional round-trip/package request; schema checks ordering and maximum duration. | NULL is intentional for one-way/local trips. Current 8/8 NULL is consistent with the current rows. |
| `flight_train_number` | `varchar NULL` | Optional customer/admin field; schema restricts characters and length. | NULL is intentional unless an airport/rail-specific workflow requires it. Current 8/8 NULL does not prove a defect. |
| `distance_km` | `numeric NOT NULL`, `> 0` | Server-derived by fare service/route catalogue or curated package rules; client distance is deliberately ignored. | Required authoritative commercial input; client omission is intentional. |
| `customer_name` | `text NOT NULL` | `SafeNameSchema`, then `sanitizeText`; customer or admin manual create. | Required; empty/unsafe value rejected. |
| `customer_phone` | `varchar NOT NULL` | Validated request, persisted as contact/ownership key, used for duplicate detection and phone voucher verification. | Required; empty/invalid rejected. |
| `customer_email` | `varchar NULL` | Optional request; lowercased/trimmed by service. Profile creation can fall back to authenticated actor email. | NULL is intentional for phone-only bookings. Current 0/8 NULL is just population. |
| `base_fare` | `numeric NOT NULL`, `>= 0` | Server fare engine; client totals are ignored. | Required monetary snapshot component. |
| `night_allowance` | `numeric NOT NULL`, default 0, `>= 0` | Fare engine; 0 when night rule does not apply. | Zero is intentional, not missing. |
| `driver_allowance` | `numeric NOT NULL`, default 0, `>= 0` | Fare engine; rule-dependent. | Zero is intentional when no allowance applies. |
| `discount_amount` | `numeric NOT NULL`, default 0, `>= 0` | Fare engine/promo validation. | Zero is intentional when no valid promo applies. |
| `promo_code` | `varchar NULL` | Optional customer/admin input; service stores only a valid promo or normalized attempted code according to fare result. | NULL is intentional without a promo. Current 2/8 NULL. |
| `total_fare` | `numeric NOT NULL`, `> 0` | Server fare calculation; immutable commercial snapshot at draft creation. | Required; client cannot set authoritative amount. |
| `advance_amount` | `numeric NOT NULL` | Server fare engine; migration 0028 relaxed old minimum check, while service still computes policy amount. | Required; payment checkout uses this amount. |
| `balance_amount` | `numeric NOT NULL`, `>= 0` | Server fare engine as total minus advance. | Required; zero can be intentional for fully advanced fare. |
| `fare_rules_version` | `varchar NOT NULL`, default `v1` | Fare engine/environment version. | Required snapshot provenance. |
| `fare_snapshot` | `jsonb NOT NULL`, default `{}` | Full `FareBreakdown` produced by fare engine; PostgreSQL mapper serializes JSONB. | `{}` is only a database fallback; normal service writes a populated snapshot. Current intent/booking paths use populated snapshots. |
| `status` | enum NOT NULL, default `pending_payment` | Draft creation starts `pending_payment`; payment capture changes to `paid_confirmed`; admin transition service handles operational transitions; cancellation/refund paths update it. | Required lifecycle state. See confirmed enum mismatch below. |
| `version` | `int NOT NULL`, default 1 | Starts at 1; repository update requires monotonic increment and SQL optimistic lock. | Required concurrency token. |
| `special_notes` | `text NULL` | Optional sanitized customer/admin notes. | NULL intentional when no notes; current 8/8 NULL. |
| `package_id` | `varchar NULL` | Legacy package path only when no canonical `bookingSelection`; canonical selections use JSONB and optional catalog FK. | NULL intentional for non-legacy packages; current 8/8 NULL. |
| `created_at` | `timestamptz NOT NULL`, default now | Service timestamp for normal writes; DB default is fallback. | Required audit timestamp. |
| `updated_at` | `timestamptz NOT NULL`, default now | Service updates and `set_updated_at`/repository updates. | Required audit timestamp. |
| `booking_selection` | `jsonb NULL` | Migration 0023 canonical immutable typed snapshot; service resolves and stores outstation/local/package selection. Legacy rows can remain NULL and are projected compatibly. | NULL is intentional for legacy rows. Current 0/8 NULL indicates all current rows have canonical selection, but legacy compatibility remains supported. |
| `selected_catalog_item_id` | `text NULL`, FK `catalog_items(id) ON DELETE SET NULL` | Filled only when a published catalog item is selected and validated by `resolveBookingSelection`; curated/outstation selections remain NULL. | NULL intentional for curated/outstation rows. Current 8/8 NULL; not a defect because current live rows need not be catalog-backed. |

### `public.customer_booking_intents` column matrix

| Column | Live definition | What fills it / writer | NULL or empty meaning and assessment |
|---|---|---|---|
| `id` | `uuid NOT NULL`, generated | `newId()` in `booking-intent.service.ts`. | Never NULL. |
| `idempotency_key` | `uuid NOT NULL UNIQUE` | Customer booking form generates/submits UUID; service checks existing key and rotates continuation secret on retry. | Never NULL; uniqueness is intentional replay protection. |
| `resume_secret_hash` | `char(64) NOT NULL` | Service hashes a one-time `newGuestAccessToken()`; raw secret is returned only in create/retry response and stored in browser session storage. | Never NULL; raw secret must not be stored. |
| `payload` | `jsonb NOT NULL` | Validated/normalized create request (excluding idempotency key), stored before finalization. | Never NULL/empty in normal flow; current empty-payload count 0. |
| `quote` | `jsonb NOT NULL` | Fare service quote at intent creation; refreshed on finalize if fare changed. | Never NULL/empty in normal flow; current empty-quote count 0. |
| `quote_total_fare` | `numeric NOT NULL` | Scalar copy from quote for stable lookup/response. | Required denormalized quote scalar. |
| `quote_advance_amount` | `numeric NOT NULL` | Scalar copy from quote. | Required. |
| `quote_balance_amount` | `numeric NOT NULL` | Scalar copy from quote. | Required. |
| `fare_reconfirmation_pending` | `bool NOT NULL DEFAULT false` | Set true when current fare differs during finalize; set false after accepted/finalized quote. | False is intentional normal state; current 0 pending. |
| `expires_at` | `timestamptz NOT NULL` | `created_at + 15 minutes` in service. | Never NULL. Expired rows are expected short-lived records; all 12 are currently expired and should be excluded from recover/finalize. |
| `created_at` | `timestamptz NOT NULL`, default now | Service/DB. | Required. |
| `updated_at` | `timestamptz NOT NULL`, default now | Intent retries, fare reconfirmation, and finalization; trigger also maintains timestamp. | Required. |
| `consumed_at` | `timestamptz NULL` | Set only after successful transaction creates the resulting booking. | NULL means intent is not consumed. Current 4/12 NULL is intentional for unfinalized/expired intents. Read-only evidence shows no mismatch with resulting-booking linkage. |
| `claimed_user_id` | `uuid NULL`, FK `profiles(id) ON DELETE SET NULL` | Set to authenticated actor only during successful finalize; intent creation/recovery is anonymous-secret based. | NULL means no account has claimed it. Current 4/12 NULL; intentional. |
| `resulting_booking_id` | `uuid NULL`, FK `bookings(id) ON DELETE SET NULL` | Set to the booking created by successful finalize; replay uses this ID. | NULL means no booking was created. Current 4/12 NULL; intentional. |

## Writers and readers

### Booking writers

1. **Customer/public direct draft:** `POST /api/v1/bookings/draft`, registered by `app.ts`, validates `CreateDraftBookingSchema`, calls `bookingService.createDraft`, and writes a pending-payment booking. Authentication is optional unless `CUSTOMER_AUTH_REQUIRED_FOR_NEW_BOOKINGS` is enabled.
2. **Customer intent finalization:** `POST /api/v1/booking-intents/:id/finalize` requires an authenticated user plus `X-Booking-Intent-Secret`; the transaction creates the booking and updates the intent atomically.
3. **Payment lifecycle:** payment service/webhook or signed browser verification updates booking status to `paid_confirmed` after a captured payment; this is the payment-to-booking lifecycle writer.
4. **Admin manual create:** `BookingsPage.tsx` calls `createAdminBooking`, but the current API function posts to the same customer draft endpoint rather than a distinct admin-only create endpoint. The authenticated admin bearer is sent by `apiFetch`; server-side booking creation remains the common service path.
5. **Admin operations:** `POST /api/v1/ops/admin/bookings/:id/transition` invokes `bookingService.transition` with expected-version locking. Current backend `ADMIN_ROLES`/`DISPATCH_ROLES` are effectively `super_admin` only.
6. **Cancellation/refund:** transition cancellation may create a refund record; payment refund completion can transition the booking to `refunded`.

### Booking readers

- Guest voucher reader: `GET /api/v1/bookings/:ticketId` using guest token or matching phone; default PII is masked.
- Authenticated customer readers: `GET /api/v1/me/bookings`, `GET /api/v1/me/bookings/:bookingId`, and `GET /api/v1/me/profile`; ownership is enforced by `user_id`.
- Admin reader: `GET /api/v1/ops/admin/bookings`; service returns masked contact fields and canonical selection projection.
- Payment service reads by ticket/ID to create checkout, verify ownership, and drive capture/refund transitions.
- Notification/device/review/payment/refund tables read booking IDs through their FKs. Customer React `MyBookingsPage` reads account-owned summaries and offers payment resume for pending/draft states.

### Intent writers/readers

- Customer `BookingPage.tsx` calls `createBookingIntent`, stores `intentId`/raw one-time secret in `sessionStorage`, recovers via `GET /api/v1/booking-intents/:id`, then finalizes via POST with authenticated customer and secret.
- Only backend booking-intent service writes the table. No admin page/API lists or edits intents, which is appropriate because it is a secret-protected short-lived continuation store rather than an operations ledger.
- PostgreSQL repository uses `FOR UPDATE` for intent reads inside transactions; memory repository uses a transaction lock/snapshot. Both enforce idempotency and replay semantics.

## Foreign-key and lifecycle relationships

1. `bookings.user_id -> profiles.id ON DELETE SET NULL`: account ownership is optional and guest bookings survive profile deletion.
2. `customer_booking_intents.claimed_user_id -> profiles.id ON DELETE SET NULL`: claim attribution is optional until authenticated finalize; deletion does not delete the intent.
3. `customer_booking_intents.resulting_booking_id -> bookings.id ON DELETE SET NULL`: an intent may create at most one booking; replay returns the same booking. The FK is nullable because unfinalized intents have no resulting booking and SET NULL preserves the intent if a booking is deleted.
4. `bookings.selected_catalog_item_id -> catalog_items.id ON DELETE SET NULL`: canonical selection can retain its immutable JSONB snapshot if the catalog item is deleted/archived.
5. Other booking consumers: payments, refunds, notification jobs, device registrations, and reviews reference `bookings.id`; those tables do not change the booking/intents contract directly.
6. The service-level intent transaction is the key cross-table lifecycle: lock intent → verify secret/actor/expiry → recalculate fare → optionally set reconfirmation state → create profile if needed → create booking → set claimed user/resulting booking/consumed timestamp. The read-only live checks found all eight resulting-booking links valid.

## Confirmed mismatches and severity

### DEF-BOOKING-01 — live `driver_assigned` status is absent from application contract (**High**, confirmed)

**Evidence:** Supabase `pg_enum` read-only query returned live labels `draft`, `pending_payment`, `paid_confirmed`, **`driver_assigned`**, `in_transit`, `completed`, `cancelled`, `refunded`. The repository migration `0002_create_enums.sql` defines the enum without `driver_assigned`; `backend/src/types/domain.ts` `BOOKING_STATUSES` also omits it; `backend/src/shared/stateMachine.ts` has no `driver_assigned` key or transitions; admin Zod status schemas derive from the same incomplete list. The current eight live rows are only pending-payment/paid-confirmed, so there is no current row corruption, but the database can contain a value the TypeScript service cannot safely validate, transition, or expose as a supported admin state.

**Recommended bounded fix:** decide one source of truth. If `driver_assigned` is still a required operational state, add it to domain constants, Zod/admin types, state-machine transitions, UI status lists, tests, and migration documentation, then verify the live migration history. If it was retired, use a separately reviewed migration only after checking for live rows and indexes, and remove the label consistently. Do not alter production during this audit.

### DEF-BOOKING-02 — role contract/documentation drift (**Medium**, confirmed code/document mismatch)

The database enum contains dispatcher/finance/content roles and the admin page copy says booking permissions require `dispatcher`, `finance_operator` or `super_admin`, but `backend/src/types/domain.ts` restricts `UserRole` to `customer | super_admin`, `roleGuard.ts` sets `ADMIN_ROLES` and `DISPATCH_ROLES` to only `super_admin`, and `admin/src/lib/types.ts` defines `AdminRole = super_admin`. This does not drop booking data, but it means the documented dispatcher/finance lifecycle is not actually available through the current API. Align the role model and policies, or update admin documentation/UI copy to state the current super-admin-only behavior.

### No confirmed column-drop/mapping defect in these two tables

The PostgreSQL mapper reads/writes `booking_selection`, `selected_catalog_item_id`, all intent nullable lifecycle fields, and all booking fare/contact fields. The current canonical-selection and customer-auth tests prove local/package/outstation selection survives quote → intent → finalize → booking → payment capture → customer history. Current live joins show no missing FK targets. Nullable columns observed above are explained by workflow conditions rather than silent mapper loss.

## Intentional NULL/empty states

- Booking `user_id` NULL: guest-created booking before/without account ownership.
- Booking `origin_name`/`destination_name` NULL: canonical local/package selections whose route identity is in `booking_selection`; legacy rows may also use compatibility projection.
- Booking `drop_address`, `return_datetime`, `flight_train_number`, `customer_email`, `promo_code`, and `special_notes` NULL: optional trip/contact/promo/note inputs; no blank-string defect was identified in code paths.
- Booking `package_id` and `selected_catalog_item_id` NULL: the selection may be curated or outstation; canonical identity is stored in JSONB. `selected_catalog_item_id` is only populated for a validated published catalog item.
- Intent `consumed_at`, `claimed_user_id`, and `resulting_booking_id` NULL: unclaimed/unfinalized intent. The read-only consistency check found zero partial-link mismatches.
- Intent expired rows: expected because TTL is 15 minutes and no cleanup job is required for correctness; recover/finalize rejects expired rows. All 12 being expired is an operational-retention observation, not proof that expiry enforcement failed.
- Intent `fare_reconfirmation_pending=false`: normal path; true is only a temporary state after quote drift.

## Bounded lifecycle validation

The audit ran only disposable in-memory tests; no Supabase row was created or changed. Command:

```text
npm test -- --run tests/integration/booking-canonical-selection.test.ts tests/integration/customer-booking-auth.test.ts tests/integration/booking-flow-f3.test.ts
```

Result: **3 test files passed, 13 tests passed**.

Covered behavior: idempotency-key retry with one-time secret rotation; secret-protected recovery; anonymous-finalize denial; wrong-user denial; successful finalize and replay; owner-only booking history/detail; canonical outstation/local/package selection persistence; server-authoritative distance/fare; draft creation; checkout; signed capture; `paid_confirmed` projection. A production end-to-end test must remain read-only because finalization, payment capture, status transitions, and webhook replay are real writes/financial actions and were explicitly prohibited.

## Recommended fixes, ordered and bounded

1. **Resolve DEF-BOOKING-01:** reconcile live and repository `booking_status_enum` around `driver_assigned`; update domain/Zod/state machine/admin UI/tests or retire the live enum label through a separately approved migration. First query for any live `driver_assigned` rows and dependent indexes/policies.
2. **Resolve DEF-BOOKING-02:** choose whether dispatcher/finance roles are to be enabled. If yes, extend domain role types, auth provisioning, role guard constants, admin roles, and policy tests; if no, correct stale docs/UI copy.
3. Add a database/application contract test that compares live enum labels with `BOOKING_STATUSES` and fails CI on drift.
4. Add an intent invariant test: `consumed_at IS NULL` iff `resulting_booking_id IS NULL`, and claimed user must be the authenticated finalizer; retain the existing transaction/row-lock tests.
5. Add read-only operational monitoring for expired unconsumed intents and define retention/cleanup separately; do not delete current rows as part of this audit.
6. Keep canonical `booking_selection` as the immutable customer-facing source and treat `selected_catalog_item_id` as an optional FK; do not make nullable fields NOT NULL without a migration and backfill plan.
