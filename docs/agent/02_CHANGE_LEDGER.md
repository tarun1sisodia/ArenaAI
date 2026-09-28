# ArenaAI Agent Change Ledger

## 2026-09-27

### 2026-09-28 — Razorpay audit and production hardening

- Added `docs/PAYMENT_RAZORPAY_AUDIT_2026-09-28.md` covering payment, database, admin, customer, deployment, and SEO/AEO/GEO controls.
- Production now requires an `rzp_live_*` key; configured `rzp_test_*` keys use the real test API only outside production.
- Customer voucher display now waits for backend webhook-backed `captured` and `paid_confirmed` status.
- Production container startup now applies compiled migrations before starting the API.

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
- Transition to Confirmed Voucher Step 4 is gated on backend payment status after the modal callback; the browser callback alone is not trusted.
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

### Phase 1 — Step 1.6: Lock Down Device Registration Ownership (SEC-005)

Implemented:

- Updated `POST /api/v1/devices/register` in `backend/src/app.ts`:
  - Strictly enforce ownership verification before linking a device token to a user account (`userId`) or booking (`bookingId` / `ticketId`).
  - Anonymous device registration is preserved for device-only push tokens (`userId: null, bookingId: null`).
  - If `userId` is provided, requests must be authenticated and the caller's ID must match the `userId` (unless caller has staff/admin role).
  - If `bookingId` or `ticketId` is provided, caller must either provide a valid `guestAccessToken` matching the booking or be the authenticated owner/admin of the booking.
- Fixed test auth role UUID padding in `backend/src/middlewares/authGuard.ts` to ensure 36-character standard UUID generation for test credentials.
- Created unit test suite `backend/tests/unit/device-registration-auth.test.ts` (9 tests passing) validating anonymous registration, user ownership enforcement, booking ownership enforcement with guestAccessToken, and privileged role override.
- Verified with full `npm run verify` (typechecks x3, 19 test files / 120 tests passing, builds x3).

### Phase 1 — Step 1.7: Run Migrations in Render Release Phase & Docker Entrypoint

Implemented:

- Created compiled migration runner in `backend/src/db/migrate.ts` (`dist/db/migrate.js`), executable directly with pure Node 22 without requiring development dependencies (`tsx`).
- Updated `backend/scripts/migrate.ts` to delegate to `runMigrations`.
- Created `backend/scripts/docker-entrypoint.sh`:
  - When `DATABASE_URL` is set, runs `node dist/db/migrate.js` idempotently prior to booting the Fastify server.
  - Aborts container boot immediately with code 1 if migrations fail, preventing the API from starting against an incompatible schema.
- Updated `backend/Dockerfile`:
  - Included `scripts/docker-entrypoint.sh` with executable permissions as the container `ENTRYPOINT`.
  - Updated `HEALTHCHECK` to probe `/ready`.
- Updated `render.yaml`:
  - Configured `preDeployCommand: node dist/db/migrate.js` for zero-downtime database migrations during Render release/predeploy phase.

### Phase 1 — Step 1.8: Deployment Readiness Health Check (/ready) & Failure Hardening

Implemented:

- Updated `render.yaml` to set `healthCheckPath: /ready` (replacing shallow `/health`).
- Updated `backend/Dockerfile` to set `HEALTHCHECK ... /ready`.
- Updated `backend/src/db/postgres.ts`:
  - Wrapped `pool.query("select 1 as ok")` in `try / catch` in `healthCheck()` to return `false` gracefully without unhandled exceptions when PostgreSQL connection pool fails.
- Hardened `readyHandler` in `backend/src/app.ts`:
  - Returns HTTP 503 `DB_NOT_READY` if `db.healthCheck()` returns `false` or throws.
  - Returns HTTP 503 `DB_NOT_CONFIGURED` if running in production mode (`NODE_ENV === "production"`) without `DATABASE_URL`.
  - Returns HTTP 200 `{ success: true, data: { status: "ready", store: ... } }` only when the database is fully reachable.
- Updated `docs/DEPLOYMENT.md` to document `/ready` health check and `preDeployCommand`.
- Created unit test suite `backend/tests/unit/ready-healthcheck.test.ts` (3 tests passing) verifying 200 on healthy DB and 503 on degraded / failed DB.
- Verified with full `npm run verify` (typechecks x3, 20 test files / 123 tests passing, builds x3).

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
- Booking and payment end-to-end lifecycle and token security tests passed.
- Device registration ownership lockdown and test auth UUID validation tests passed.
- Pre-deploy migrations and deployment readiness (/ready) non-2xx tests passed (20 test files / 123 tests).
- Phase 1 release blockers complete.

### Phase 2: Source-of-Truth Convergence & Dynamic Catalog Manifest

Implemented:

- **Step 2.1 & 2.3:** Canonical route filtering and DB override in `backend/src/modules/catalog/catalog.service.ts`:
  - Strictly excludes unpublished/draft or archived catalog routes from `/api/v1/catalog/manifest`.
  - Published database routes override static baseline corridors with live DB starting price (`fs`), calculated vehicle tier fares, and stops (`routeSummary`).
- **Step 2.4:** Dynamic package media cover resolution:
  - Packages resolve published media cover images (`sortOrder: 0` or first published entry from `db.media.listByCatalogItem`) instead of generic static placeholder art.
  - Manifest revision auto-increments upon media addition, modification, or deletion.
- **Step 2.5 & 2.6:** Client bounded cache and ETag conditional validation in `react/src/services/catalogManifest.ts`:
  - Implemented `CachedManifestEnvelope` with bounded 10-minute TTL (`CACHE_TTL_MS`).
  - Sends `If-None-Match: etag` for conditional validation.
  - Handles HTTP 304 Not Modified to refresh timestamp without body transmission.
  - Marks cache with `isStale: true` when TTL expires and backend is offline.
- **Step 2.2 & 2.7:** Prioritize live manifest route over static fallback in `react/src/app/App.tsx` (`activeRoute = manifestRoute || matchedRoute`), hydrating route pages and details dynamically.
- **Tests & Verification:** Updated integration suite `backend/tests/integration/catalog-manifest-f4.test.ts` (6 passing tests). Verified full monorepo with `npm run verify` (typechecks x3, 20 test files / 125 tests, SEO tests, and builds x3 green).

### Phase 3 — Step 3.1: Secure LocationIQ Backend Proxy, Caching & Client Convergence

Implemented:

- **Backend Location Proxy (`backend/src/modules/locations/`):**
  - Verified server-held token architecture: client never directly requires `LOCATIONIQ_TOKEN`; requests are routed via `GET /api/v1/locations/autocomplete`.
  - Rate limiting enforced at 60 req/min per IP via `@fastify/rate-limit`.
  - Query sanitization: bounded length (2–80 chars), rejection of XSS/script payloads.
  - Suggestion output sanitization: HTML tags stripped, `displayName` bounded to 200 characters, maximum 8 items returned.
  - Dual storage caching in `locationCache` (PostgreSQL `location_cache` JSONB table and in-memory Map) with 30-day bounded TTL.
  - Graceful static catalog fallback (`createStaticGeocodingProvider(CURATED_PLACES)`) when LocationIQ token is unset or upstream network times out.
- **Frontend Hook Convergence (`react/src/hooks/useLocationIQ.ts`):**
  - Enhanced backend proxy response parsing to seamlessly handle both standard backend `{ source, suggestions }` envelopes and raw array formats.
  - Correctly maps `displayName`, `subtitle`, `placeId`, and coordinate pairs (`latitude`/`lat`, `longitude`/`lon`).
- **Test Coverage & Verification:**
  - Created unit test suite `backend/tests/unit/location-proxy.test.ts` (5 tests passing) covering input rejection, static fallback, 30-day cache hits, output sanitization & bounds, and upstream failure handling.
  - Ran `react/scripts/test-locationiq.ts` (24 assertions green).
  - Verified full monorepo with `npm run verify` (typechecks x3, 21 test files / 130 tests passing, SEO tests, and builds x3 green).

## Known next work (Phase 3 — secure integrations)

- Step 3.2: High-entropy token or OTP recovery for booking status retrieval (`/api/v1/bookings/status`).
- Step 3.3: Magic-byte and MIME validation for media file uploads.
- Step 3.4: Compensating object-store cleanup.
- Step 3.5: Split staff roles into content, pricing, dispatch, finance, review, audit, and security.

See `docs/agent/00_CONTEXT_HANDOFF.md` and section 8 of the root operating specification.

