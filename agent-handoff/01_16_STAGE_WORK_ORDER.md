# ArenaAI 16-stage scan and implementation work order

## How to use this file

Each stage must produce evidence. Do not mark a stage complete because a file exists. A stage is complete only when the agent can explain:

- what populates the table;
- which fields are intentionally empty or nullable;
- which backend route/service/repository writes it;
- which admin/customer/public surface reads it;
- which foreign keys connect it;
- whether the current implementation matches the live schema;
- which test proves the path.

Use a shared row format in all reports:

| Table | Column/field | Type | Nullable | Current population | Writer | Write condition | Reader | Empty/null reason | Risk | Action |
|---|---|---|---|---|---|---|---|---|---|---|

## Stage 0 — Baseline and controls

- Confirm repository, branch, deployment target, and current commit.
- Read `.agents/rules/PAYMENT_AGENT_RULES.md` before touching payment/webhook logic.
- Load connector configuration before using Supabase, Render, Gmail, or browser access.
- Confirm no secrets are printed or committed.
- Capture a clean git status.
- Record backend, admin, and customer build commands.

## Stage 1 — `profiles` and `device_registrations`

Trace authentication/profile creation, profile role updates, device registration, FCM tokens, booking links, user ownership, and RLS. Explain why device registrations may be empty. Confirm role enum values match backend authorization and admin role checks.

Test: customer auth/profile read and device-registration endpoint, without exposing tokens.

## Stage 2 — `bookings` and `customer_booking_intents`

Trace quote → intent → claim/resume → booking creation → booking history → admin booking list. Audit `payload`, `quote`, reconfirmation fields, consumed/claimed/resulting IDs, guest access token, fare snapshot, booking selection, selected catalog item, and status transitions.

Test: create one disposable test intent and confirm resulting booking FK, idempotency, expiry, and status.

## Stage 3 — `payments`, `refunds`, and `raw_webhooks`

Trace checkout creation, pending payment insert, Razorpay callback verification, webhook verification, payment capture, booking confirmation, refund creation, and raw event idempotency.

Audit every payment field:

- provider/order/payment/session identifiers
- checkout URL and public token
- amount/currency/fee/tax
- method/status
- idempotency key
- webhook event ID
- reconciliation status
- failure reason
- verified/expires/created/updated timestamps

Test browser success, browser failure, invalid signature, amount mismatch, duplicate callback, real webhook, duplicate webhook, expired pending payment, and refund safety.

## Stage 4 — `catalog_items` and `catalog_item_media`

Trace admin catalog create/update/publish/archive/media upload to public catalog manifest and customer display. Explain whether this is canonical or legacy relative to dossier tables. Audit media visibility, content-base64 handling, size/mime constraints, approval/publish metadata, and selected catalog item FK from bookings.

Test: draft hidden, published visible, archived hidden, media visibility and manifest invalidation.

## Stage 5 — `reviews`

Trace customer review submission, booking verification, social/manual verification, moderation, publication, and public display. Explain empty state. Audit booking/catalog/customer FKs and review status transitions.

Test: invalid rating, unverified review, admin approve/reject/publish, and public visibility.

## Stage 6 — `fare_rules`

Trace admin fare update/version/activation to quote and booking fare snapshot. Audit JSONB shape, active rule uniqueness, effective dates, fallback constants, and version persistence.

Test: active rule read, update, activation, quote, and booking snapshot consistency.

## Stage 7 — `promo_codes`

Trace admin CRUD to customer validation and booking redemption. Audit active dates, minimum total, max redemptions, redemption count, group-vehicle and broadcast flags, concurrency/idempotency, and booking promo snapshot.

Test: valid, expired, minimum-total failure, max-redemption boundary, concurrent redemption, and inactive code.

## Stage 8 — `admin_audit_logs` and `notification_jobs`

Trace every admin mutation and booking/payment event to audit record and notification job. Audit actor identity/role, before/after JSONB, reason/request ID, dedupe key, payload, retry state, provider message ID, and errors.

Test: one admin update and one booking/payment notification path; verify duplicate dedupe behavior.

## Stage 9 — `inquiries` and `rental_enquiries`

Trace customer forms to inserts and admin list/status/note updates. Audit required fields, status enum/checks, notes arrays, timestamps, and privacy masking.

Test: submit each form, update status/note, reload admin, verify persistence.

## Stage 10 — `location_cache`

Trace customer location lookup to provider call, cache hit, cache write, expiry, and stale-cache behavior. Audit cache key normalization, JSONB shape, stored timestamp, and error fallback.

Test: first lookup, repeated lookup, expired/stale lookup, provider failure.

## Stage 11 — `route_catalog`

Trace admin route create/update/publish/archive and public manifest/fare reads. Audit route pricing JSONB, fleet arrays, stops, status, review flag, and extension fields:

- `use_per_km`
- `per_km_rate_override`
- `highway`
- `all_inclusive_note`

The extension-field defect was fixed in commit `963428b`; verify it remains present and test round-trip persistence.

## Stage 12 — `local_sightseeing_packages`

Trace admin local-package form to strict schema, service, PostgreSQL repository, published content, and fare calculation. Audit fleet prices JSONB, use-per-km, extra rates, night charges, status, active flag, and code uniqueness.

Test create/update/publish/archive and fare read.

## Stage 13 — `transfer_routes`

Trace admin transfer form to strict schema, service, repository, public transfer read, and fare calculation. Audit fleet prices, use-per-km, night charge, status, active flag, route code, and public visibility.

Test create/update/publish/archive and fare read.

## Stage 14 — `tour_packages` and `package_vehicle_upgrades`

Trace admin package form, gallery upload, inclusions/exclusions/itinerary, publish/archive/delete, upgrade CRUD, customer package display, and fare calculation. Confirm snake_case admin payload exactly matches strict backend schema. Audit package FK and nullable upgrade package ID behavior.

Test complete package round trip, gallery persistence, upgrade persistence, publication, and customer display.

## Stage 15 — Policies, company profile, signoffs, monuments, pet policy

Trace admin forms to:

- `cancellation_policies`
- `company_profile`
- `dossier_signoffs`
- `monuments`
- `pet_taxi_policy`

Trace public content endpoint and customer pages. Audit dossier status synchronization, approved-by/approved-at conditions, default/TBD values, policy use in cancellation calculation, and content publication behavior.

Test each admin PATCH, reload, public content read, and signoff-to-company-status transition.

## Stage 16 — Migrations, relationships, RLS, and final security

Audit all 32 migrations against live schema. Check duplicate/renamed/deprecated columns, indexes, triggers, policies, and migration ordering.

Build the FK graph and identify tables that are populated but not consumed, consumed but never populated, or duplicated by another source.

For RLS-disabled tables, define explicit policy classes before enabling RLS:

- public read-only published content;
- backend service-role all operations;
- admin authenticated mutation/read;
- customer-private ownership access;
- no direct client access to migration/control tables.

Test anonymous, authenticated customer, admin, backend service role, and unauthorized role access.

## Fix order after all scans

1. Backend schemas and repository mappings.
2. Domain models and serialization aliases.
3. Database migrations/constraints only when proven necessary.
4. Admin form/API payloads.
5. Customer/public reads and generated manifests.
6. Payment webhook configuration and deployment variables.
7. RLS policies and access tests.

## Required validation before completion

- backend type-check;
- targeted tests per changed domain;
- full backend CI-equivalent tests;
- admin TypeScript/build;
- customer TypeScript/build;
- diff check;
- migration dry-run or safe apply plan;
- live endpoint smoke tests;
- deployment logs;
- no uncommitted secrets or generated sensitive data;
- final report with before/after counts and exact commit IDs.
