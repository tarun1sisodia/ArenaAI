# ArenaAI Agent Change Ledger

## 2026-09-27

### Catalog test-price allowance

The admin catalog starting-fare input now accepts values from ₹1. The backend already accepted positive values. This is for Razorpay Test Mode/catalog-flow testing only; it does not bypass server-authoritative fare calculation, payment verification, or production payment-provider safeguards.

### `0d6bd95` — SEO/AEO/GEO lifecycle governance

Merged into the root operating specification:

- Draft/published/paused/archived/retired lifecycle
- Stable URL preservation
- Archive without losing SEO value
- Sitemap and canonical rules
- AEO answer and structured-data rules
- GEO/entity consistency rules
- Lifecycle acceptance tests

### Phase 1 — Step 1.1: Production Payment Provider Enforcement & Client Checkout Modal

Implemented:

- Mandatory Razorpay credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) enforced in `backend/src/config/env.ts` when `NODE_ENV === "production"`.
- Test/dummy credentials (`rzp_test_local*`) strictly prohibited in production.
- `createRazorpayAdapter` in `backend/src/providers/adapters/razorpay.ts` throws immediately if HMAC fallback is attempted with `isProduction: true`.
- Created comprehensive unit test suite in `backend/tests/unit/payment-provider-production.test.ts` (5 tests passing).
- Created `react/src/features/booking/razorpay.ts` with dynamic script loader (`https://checkout.razorpay.com/v1/checkout.js`) and TypeScript definitions.
- Wired official Razorpay Standard Checkout modal in `react/src/features/booking/BookingPage.tsx` (`handleSubmitBooking`).
- Transition to Confirmed Voucher Step 4 is gated on verified modal `handler` callback or server verification.
- Verified with full `npm run verify` (typecheck x3, backend test suites, build x3).

### Phase 1 — Step 1.2: Public Media Visibility Enforcement (SEC-004)

Implemented:

- Enforced public visibility rule in `backend/src/modules/catalog/catalog.service.ts`: `getMediaContent` verifies that both the media record itself and its parent catalog item have `status === "published"` before serving bytes to anonymous callers.
- Updated `backend/src/modules/catalog/catalog.controller.ts`: Anonymous requests for unpublished/draft/archived media return HTTP 404 (`MEDIA_NOT_FOUND`). Authenticated staff/admin requests can preview draft media with `private, no-cache, no-store` headers. Published media receives `public, max-age=31536000, immutable`.
- Added migration `backend/migrations/0019_enforce_media_visibility_rls.sql` to restrict PostgREST anonymous SELECT to only published media of published items.
- Created test suite `backend/tests/unit/media-visibility.test.ts` (3 tests passing) and updated `backend/tests/integration/catalog-live.test.ts`.
- Full `npm run verify` passed with 15 test suites, 100 tests, and all builds green.

### Phase 1 — Step 1.3: Active DB Fare Engine Integration & Dynamic Catalog Sync

Implemented:

- Updated `backend/src/modules/fares/fare.types.ts`: Added `FareVehicleOverride`, `FareRuleOverrides`, and optional `ruleOverrides` in `FareEngineInput`.
- Updated `backend/src/modules/fares/fare.strategy.ts`: Added dynamic overrides support (`hasCustomRate`, `minKmPerDay`, `sameDayRoundMultiplier`, `driverAllowance`) to `PricingStrategyContext`, dynamically scaling one-way and round-trip fares when rates are updated by admin desk.
- Updated `backend/src/modules/fares/fare.engine.ts`: In `calculateFare`, verified vehicle availability against active DB overrides (`AppError("VEHICLE_UNAVAILABLE")` if deactivated), resolved dynamic package pricing and duration, and applied night allowance overrides.
- Updated `backend/src/modules/fares/fare.service.ts`: In `calculate(input)`, actively queried `db.fareRules.getActive()` and resolved package records from `db.catalog`, passing active overrides directly into the fare engine.
- Updated `backend/src/modules/bookings/booking.service.ts`: Accepted `fareService` in `deps` and delegated `createDraft` fare calculation directly to `deps.fareService.calculate(input)`.
- Updated `backend/src/app.ts`: Passed `fareService` into `createBookingService`.
- Created comprehensive test suite `backend/tests/unit/fare-db-sync.test.ts` (5 tests passing) verifying dynamic rates, vehicle deactivation, package starting prices, draft item blocking, and booking draft delegation.
- Verified with full `npm run verify` (typechecks x3, 16 test files / 105 tests passing, builds x3).

### Phase 1 — Step 1.4: Active-Version Transaction & Unique-Active Database Invariant

Implemented:

- Created database migration `backend/migrations/0020_unique_active_fare_rule.sql`:
  - Ranks existing active fare rules and cleans stale duplicates.
  - Adds partial unique index `idx_fare_rules_unique_active ON fare_rules (is_active) WHERE is_active = true`.
- Updated database repository contracts in `backend/src/db/types.ts`:
  - Added `getByVersion(version: string)`, `listAll()`, and `activate(version: string)` to `fareRules` repository interface.
- Updated `backend/src/db/postgres.ts`:
  - Enforced transactional deactivation of prior active rules before saving a new active version.
  - Added `activate(version)` transaction deactivating existing active rules and atomically activating target version with updated timestamps.
  - Added `getByVersion` and `listAll`.
- Updated `backend/src/db/memory.ts`:
  - Enforced the exact same unique-active invariant on `save` and `activate`.
- Updated admin endpoints in `backend/src/modules/admin/admin.routes.ts`, `admin.controller.ts`, `admin.service.ts`, and `admin.schema.ts`:
  - Added `POST /api/v1/ops/admin/fare-rules/activate` (with `AdminActivateFareRuleSchema`).
  - Added `GET /api/v1/ops/admin/fare-rules/versions`.
  - Added audit log logging when a fare rule version is activated.
- Created unit test suite `backend/tests/unit/fare-rules-versioning.test.ts` (3 tests passing) verifying unique-active invariant, inactive draft versions, version rollback/activation, and audit logging.
### Phase 1 — Step 1.5: End-to-End Booking & Payment State Lifecycle Tests

Implemented:

- Created comprehensive integration test suite `backend/tests/integration/booking-payment-lifecycle.test.ts`:
  - Verified payment failure webhook leaves booking unconfirmed, transitions payment status to `failed`, and prevents voucher generation.
  - Verified security boundaries: requests lacking `guestAccessToken` or supplying an invalid token cannot read booking or payment status (strictly prohibiting phone-only or ticketId-only access).
  - Verified refund webhook execution and state reflection on payment and booking models.
- Verified with full `npm run verify` (typechecks x3, 18 test files / 111 tests passing, builds x3).

## Current webhook route

```text
https://client-juj4.onrender.com/api/v1/payments/webhooks/razorpay
```

The Razorpay webhook secret must exactly matches Render's `RAZORPAY_WEBHOOK_SECRET`. Never store the secret here.

## Current verification baseline

- React typecheck/build passed after live-flow safety changes.
- Admin typecheck/build passed after auth hardening.
- Backend typecheck/build passed.
- Focused backend network-header and catalog-manifest tests passed.
- Dynamic DB fare rule and catalog sync tests passed.
- Unique-active fare rule invariant and version activation tests passed.
- Booking and payment end-to-end lifecycle and token security tests passed (18 test files / 111 tests).

## Known next work

- Step 1.6: Lock down device registration ownership.
- Step 1.7: Run migrations in Render release/predeploy phase.
- Step 1.8: Make `/ready` the deployment health check and verify its non-2xx behavior.


See `docs/agent/00_CONTEXT_HANDOFF.md` and section 8 of the root operating specification. The most important engineering task is making database fare rules and catalog routes the single production source used by public fare calculation and booking.
