# ArenaAI — Agent Handoff Package

## Purpose

This package contains the complete research and execution instructions for aligning the ArenaAI **database schema, backend models/repositories, admin panel, customer frontend, payment lifecycle, deployment configuration, and security policies**.

It is designed to be handed to a fresh agent/account that does not have the original conversation context.

Repository: `tarun1sisodia/ArenaAI`

## Safety rules

1. Work only in the ArenaAI repository.
2. Start with read-only inspection.
3. Never expose secrets, tokens, payment credentials, service-role keys, or personal customer data in reports.
4. Mask emails, phone numbers, guest tokens, auth IDs, and payment identifiers when creating artifacts.
5. Never mark a payment captured based only on frontend input.
6. Never create a fake Razorpay webhook event ID from a browser callback.
7. Do not apply destructive SQL, delete data, or run a broad data backfill without a before/after count and rollback plan.
8. Do not enable RLS without explicit tested policies.
9. Use the existing repository branch/PR workflow. Run tests before committing.
10. Do not use production customer data for controlled tests; use test-mode or disposable records.

## Current repository state

The prior work is already pushed to `main`:

- `ee2952d` — admin payment reconciliation mapping and schema audit
- `963428b` — Route Catalog field persistence alignment
- `efae9b7` — end-to-end alignment plan

The Route Catalog fix is complete and validated. Do not reimplement it unless the remote branch differs.

## Already-completed fixes

### Razorpay payment verification

The payment flow now has a secure server-side verification fallback for Razorpay browser callbacks:

- Razorpay callback signature is checked server-side.
- The backend retrieves the payment from Razorpay and validates order ID, amount, and currency.
- The client cannot directly mark a booking paid.
- Payment and booking transitions are idempotent.
- Browser verification does not fabricate `webhook_event_id`.

### Admin finance mapping

The admin finance API now correctly maps:

- `paymentMethod` → `method`
- `verifiedAt`/`updatedAt` → `capturedAt`
- booking UUID → public booking ticket ID

The finance ledger displays:

- gateway order ID
- checkout session ID
- checkout URL
- webhook event ID
- reconciliation status

### Route Catalog

The following database-backed fields are now aligned across schema, model, service, mapper, PostgreSQL SQL, admin payload, and tests:

- `use_per_km`
- `per_km_rate_override`
- `highway`
- `all_inclusive_note`

No migration was needed because the live columns already existed.

## Current live baseline

The live public schema contains 28 tables and 32 applied migrations.

Current important counts observed during the audit:

- `bookings`: 4 `paid_confirmed`, 4 `pending_payment`
- `payments`: 4 `captured`, 7 `pending`
- `route_catalog`: 1 `published`, 9 `draft`
- `local_sightseeing_packages`: 2 `published`, 1 `archived`
- `transfer_routes`: 3 `published`, 2 `draft`, 1 `archived`
- `tour_packages`: 1 `published`, 2 `draft`, 8 `archived`
- `dossier_signoffs`: 9 `approved`, 1 `pending`
- `cancellation_policies`: 9
- `company_profile`: 1
- `monuments`: 10
- `pet_taxi_policy`: 1

Current empty/event-driven tables observed earlier:

- `refunds` — fills only after an admin executes a refund.
- `raw_webhooks` — fills only after a valid provider webhook is accepted.
- `catalog_items` — separate catalog source that must be compared against dossier content source.
- `catalog_item_media` — fills after catalog media upload.
- `reviews` — fills after customer review submission.
- `inquiries` — fills after customer inquiry submission.
- `device_registrations` — fills after device push registration.

## Confirmed unresolved items

### 1. Razorpay webhook secret/configuration

Successful browser-verified payments are captured and reconciled. `webhook_event_id` remains NULL by design until a real Razorpay webhook is accepted.

Render logs previously showed Razorpay webhook requests returning HTTP 401. Verify that the Razorpay Dashboard webhook secret exactly matches the staging Render `RAZORPAY_WEBHOOK_SECRET`. Then send or replay a real test webhook and verify:

1. `raw_webhooks` receives one event.
2. Duplicate delivery is idempotent.
3. `payments.webhook_event_id` is filled.
4. Payment status does not regress.
5. Booking remains `paid_confirmed`.

### 2. Catalog source-of-truth decision

There are two related content systems:

- legacy/live catalog tables: `catalog_items`, `catalog_item_media`
- dossier content tables: `route_catalog`, `local_sightseeing_packages`, `transfer_routes`, `tour_packages`, `package_vehicle_upgrades`, policies, company profile, monuments, and pet policy

The agent must document which system owns each customer-facing route/package/content surface. Do not silently maintain duplicate sources.

### 3. RLS policy hardening

RLS is disabled on:

- `fare_rules`
- `route_catalog`
- `local_sightseeing_packages`
- `transfer_routes`
- `tour_packages`
- `package_vehicle_upgrades`
- `cancellation_policies`
- `company_profile`
- `dossier_signoffs`
- `monuments`
- `pet_taxi_policy`
- `schema_migrations`

Do not run bare `ENABLE ROW LEVEL SECURITY` statements. First define and test explicit policies for public read-only content, backend service-role access, admin access, customer-private data, and migration/control tables.

## Required agent workflow

1. Clone `tarun1sisodia/ArenaAI`.
2. Read this README and every file in this handoff package.
3. Confirm current `main` contains the listed commits.
4. Re-run the live schema inventory with masked/safe output.
5. Complete the 16 stages below.
6. Create a column-level matrix before changing code.
7. Make fixes in dependency order.
8. Add regression tests for every fix.
9. Run backend type-check, backend tests, admin build, and customer build.
10. Verify deployment logs and live read/write paths.
11. Commit in small logical commits and push through the agreed repository workflow.

## Deliverables expected from the new agent

- `reports/column-population-matrix.md`
- `reports/table-relationship-map.md`
- `reports/empty-table-trigger-matrix.md`
- `reports/admin-backend-customer-contract-audit.md`
- `reports/controlled-lifecycle-test-results.md`
- `reports/rls-policy-review.md`
- migration files only where justified
- regression tests for every corrected contract
- final deployment verification report

See `01_16_STAGE_WORK_ORDER.md` for the complete staged procedure.
