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

### 2026-10-03 — Staging Fix Pass: Prompt 1 (Admin Overview Donut Legend Alignment)

- Fixed `admin/src/components/charts/Charts.tsx` (`DonutChart`):
  - Removed cramped `sm:grid-cols-2` breakpoint from the legend `<ul>`. Replaced with single-column layout (`flex flex-1 flex-col gap-2 min-w-[180px] w-full max-w-xs`).
  - Added `whitespace-nowrap` to status labels to prevent mid-phrase wrapping ("Pending payment", "Paid · confirmed").
  - Formatted status counts with `font-mono text-xs tabular-nums text-ink text-right` aligned on one row with color swatch and label.
  - Implemented `@container flex flex-col items-center justify-center gap-6 @[440px]:flex-row` on container. When card width is narrow (< 440px), donut chart cleanly stacks vertically above the legend; on wide cards (>= 440px), chart and legend align side-by-side.
  - Preserved dark mode variables and entrance motion animations.
  - Verified with `npm --prefix admin run typecheck` (tsc clean) and `npm --prefix admin run build`.

### 2026-10-03 — Staging Fix Pass: Prompt 2 (Admin Overview 375px Mobile Responsiveness)

- Optimized admin overview and shared components for 375px mobile viewports:
  - `admin/src/pages/DashboardPage.tsx`: KPI grid updated to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. Chart header wrapped responsively with `flex-col sm:flex-row items-start sm:items-center`.
  - `admin/src/components/admin/StatCard.tsx`: Added `truncate` and `font-display text-2xl sm:text-3xl` to prevent numerical KPI overflow.
  - `admin/src/components/admin/PageHeader.tsx`: Added `flex-wrap` and gap spacing to prevent action button clipping.
  - `admin/src/components/admin/Topbar.tsx` & `Sidebar.tsx`: Enforced `min-h-[44px]` accessible touch targets on mobile drawer links and buttons.
  - `admin/src/components/charts/Charts.tsx`: Adjusted `VerticalBars` spacing to `gap-1.5 sm:gap-3` with `min-w-0` and responsive fonts; enabled `flex-wrap` and word breaking on `RankedBars`.

### 2026-10-03 — Staging Fix Pass: Prompt 3 (Purge Obsolete Vehicle Tiers from Admin)

- Aligned admin vehicle types with canonical backend 5-fleet architecture:
  - Purged obsolete tiers `tempo-traveller-12`, `tempo-traveller-17`, and `coastal-coach-25` from `VehicleTier` union and `VEHICLE_LABELS` in `admin/src/lib/types.ts`.
  - Added safe fallback guards `(VEHICLE_LABELS as Record<string, string>)[b.vehicleTier] ?? b.vehicleTier` in `admin/src/pages/BookingsPage.tsx` for table and detail views to ensure older test records never crash the desk.

### 2026-10-03 — Staging Fix Pass: Prompt 4 (Remove Vehicle Tier Selector from Desk New Booking)

- Simplified desk booking creation:
  - Updated `backend/src/modules/bookings/booking.schema.ts` (`CreateDraftBookingSchema`): Added `.default("sedan")` to `vehicleTier`.
  - Updated `admin/src/lib/api.ts`: Made `vehicleTier` optional in `createAdminBooking`.
  - Updated `admin/src/pages/BookingsPage.tsx`: Removed the redundant vehicle tier dropdown from the "New Booking" modal; replaced with informative badge `"Vehicle: Sedan — standard desk rate (assigned by backend)"`. Cleaned up form state and submission payload.

### 2026-10-03 — Staging Fix Pass: Prompt 5 (New Booking Modal Mobile UX Pass)

- Redesigned "New Booking" dialog for mobile viewports:
  - Transformed into a full-screen sheet on mobile via `h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[88vh] rounded-none sm:rounded-md`.
  - Converted footer actions to a sticky bottom bar with `min-h-[44px]` full-width touch buttons.
  - Cleaned up alert banners with prominent icons and placed them above the fold for immediate feedback.

### 2026-10-03 — Staging Fix Pass: Prompt 6 (Fare Rules Save Failure Fix & Corrupt Rate Repair)

- Repaired backend fare rule persistence and audit logging:
  - Fixed `requireRole(request, ADMIN_ROLES)` returning `undefined` in `backend/src/modules/admin/admin.controller.ts` (`updateFareRules`); replaced with `requireUser(request)`.
  - Added `toUuid(id)` helper in `backend/src/modules/admin/admin.service.ts` to ensure `actor_id` in `admin_audit_logs` is always a valid UUID, eliminating PostgreSQL 22P02 invalid input syntax crashes.
  - Refined `backend/src/middlewares/errorHandler.ts` to return actual error messages for admin operations endpoints.
  - Added "Reset to standard rates" button and corrupt ₹1/km rate warning banner in `admin/src/pages/FaresPage.tsx` to allow 1-click restoration of canonical rates (₹10/14/18/25/34).

### 2026-10-03 — Staging Fix Pass: Prompt 7 (Customer Fleet Cards Backend Parity & Flash Elimination)

- Aligned customer booking page with canonical backend fleet specs:
  - Updated `VEHICLE_OPTIONS` fallback in `react/src/features/booking/BookingPage.tsx` to canonical fleet names and capacities: Sedan (4 seats, 2 bags), Ertiga (6 seats, 3 bags), Innova Crysta (6 seats, 4 bags), Tempo Traveller (12 seats, 8 bags), Force Urbania (16 seats, 10 bags).
  - Preserved vehicle model descriptions in `fleetOptions` memo to eliminate first-paint flash when live fleet data loads from `/api/v1/fleet`.
  - Extended URL query parameter parsing to accept both internal IDs and canonical tiers (e.g. `innova-crysta`, `tempo-traveller`).
  - Verified server-authoritative fare calculation and price ledger consistency.
### 2026-10-04 — Full-Stack Customer Booking Experience & Funnel Correction

- Homepage Hero Structural Stabilization:
  - Added `min-h-[580px] lg:min-h-[640px] flex items-center` to hero section and `w-full` on inner grid in `react/src/pages/HomePage.tsx`.
  - Added `min-h-[460px] flex flex-col justify-between` to `HomeBookingWidget.tsx`.
  - Eliminates hero collapse, Taj Mahal `<picture>` aspect ratio jump, background zooming/recropping, and trust ticker shifting when switching between One Way, Round Trip, and Local Taxi.
- Date Picker Unlock & Accessibility:
  - Stretched `::-webkit-calendar-picker-indicator` across `inset: 0` with `cursor: pointer` in `react/src/styles/global.css`.
  - Added `pickupInputRef` and `returnInputRef` with `openPickupPicker` / `openReturnPicker` (`showPicker()` with focus fallback) in `HomeBookingWidget.tsx` and `BookingPage.tsx`.
  - Added full mouse click, touch, and keyboard (Enter/Space) calendar trigger support.
  - Implemented round-trip date validation (`returnDate >= pickupDate`) auto-syncing return date if pickup date advances.
- Elimination of Duplicate "Choose Your Trip" Step:
  - Removed legacy 4-step fleet-first funnel and removed `<TripSelectionStep>` component invocation from `BookingPage.tsx`.
  - Transformed funnel into canonical 3-step architecture: Step 1 (Configure Trip & Vehicle), Step 2 (Guest Details & Review), Step 3 (Confirmed Voucher).
  - Homepage selections (One Way, Round Trip, Local Taxi) carry directly into canonical booking context without re-prompting.
  - Homepage Local Taxi now includes vehicle selection (`&vehicle=${selectedVehicle}`), persisting seamlessly into `/book`.
- Authoritative Review Summary & Data Cleanliness:
  - Fixed entity corruption on Step 2 where package place metadata leaked into origin and destination fields.
  - Replaced corrupted summary with canonical 4-column summary grid cleanly presenting Trip Mode, Route/Tour, Dates/Times, Vehicle, Total Fare, and 28% Advance Token.
  - Implemented user profile prefill from `useCustomerAuth()` for `fullName`, `email`, and `phone` without fabricating fake placeholders.
  - Verified "Edit Trip / Vehicle" smoothly navigates back to Step 1 while preserving active inputs.
- Verified with full `npm run verify` (typechecks x3, 23 backend vitest suites / 142 tests passing, SSG prerendering 52 pages, builds x3).

### 2026-10-04 — Dossier Database Template v2: Schema & Data Seeding (Migration 0024)

- Created and executed PostgreSQL migration `backend/migrations/0024_dossier_content.sql`:
  - Extended `route_catalog` with universal pricing and editorial columns: `use_per_km` (boolean default true), `per_km_rate_override` (numeric), `highway` (text), and `all_inclusive_note` (text).
  - Created dedicated table `local_sightseeing_packages` (id, package_code unique, name, duration_hours, included_km, covers, parking_note, fleet_prices jsonb, use_per_km default false, extra_rates jsonb, night_charge_inr, status, is_active, timestamps).
  - Created dedicated table `transfer_routes` (id, route_code unique, name, distance_text, direction_note, fleet_prices jsonb, use_per_km default false, night_charge_inr, status, is_active, timestamps). Split AGC and AF station transfers.
  - Created dedicated table `tour_packages` (id, package_code unique, name, duration_text, days, nights, base_tier_code, starting_price_inr, fleet_prices jsonb, use_per_km default false, night_charge_inr, flat_charge_inr, inclusions_highlight, inclusions_note, status, is_active, timestamps).
  - Created relational table `package_vehicle_upgrades` (id, package_id nullable FK, tier_code, passenger_note, surcharge_inr, unique indexes for global vs package overrides).
  - Created dedicated table `cancellation_policies` (id, policy_type in 'cab'/'tour_package', notice_period_text, sort_order, fee_retained_percent, refund_percent, rule_text, refund_timeline_note).
  - Created single-row table `company_profile` (brand_name, office_address, primary_phone, whatsapp_number, email, gstin, operating_hours, maps_location, dossier_version, dossier_status).
  - Created dedicated table `dossier_signoffs` (id, section_key unique, section_title, status in 'pending'/'approved'/'modification_requested', client_notes, approved_by FK, approved_at).
  - Created dedicated table `monuments` (id, name unique, visiting_hours, closed_note, historical_context, sort_order).
  - Created single-row table `pet_taxi_policy` (id, is_offered, seat_protection_note, breed_restriction_note, comfort_stop_note, booking_instruction).
- Seeded baseline rows:
  - 9 Intercity one-way corridors into `route_catalog` as `status='draft', needs_review=true` (Agra to Delhi, Noida, Gurgaon, Jaipur, Mathura/Vrindavan, Gwalior, Lucknow, Ayodhya, and Delhi to Jaipur).
  - 9 Cancellation policy slabs (3 cab tiers + 6 tour package slabs).
  - 10 Monuments from Dossier §10.2 (with Friday closure notes for Taj Mahal).
  - 1 Pet taxi policy benchmark row.
  - 1 Company profile row with live verified phone (`+91 97628 17598`) and `[TBD — confirm with client]` for unconfirmed legal/tax fields.
  - 10 Dossier sign-off sections as `status='pending'`.
  - 4 Global package vehicle upgrade rows (`package_id IS NULL`).
  - 2 Local sightseeing package draft rows (`agra-standard-sightseeing`, `agra-extended-city-tour`).
  - 4 Transfer route draft rows (`agc-station-drop`, `af-station-drop`, `kheria-airport`, `delhi-igi-oneway`).
  - 6 Signature tour packages draft rows.
- Verified database schema and seed integrity via automated PostgreSQL query script; all 10 tables and all 9 corridors verified.
### 2026-10-04 — Dossier Content: Backend Modules & Public Manifest Endpoints (Step 2)

- Built and registered all 8 discrete modules adhering to the 4-file contract (`schema`, `service`, `controller`, `routes`):
  - `tour-packages`: CRUD, slug junk-refine (`!/^\d+-btn-/.test(slug) && !/command/i.test(slug) && !/--/.test(slug)`), `listUpgrades`, `saveUpgrade`, `deleteUpgrade`, `triggerFrontendRebuild()` on publish/archive/price edits to published items. Manifest serves published packages with attached vehicle upgrades.
  - `transfer-routes`: CRUD, slug junk-refine, `triggerFrontendRebuild()`, public manifest filtering drafts.
  - `local-packages`: CRUD, slug junk-refine, `triggerFrontendRebuild()`, public manifest filtering drafts.
  - `cancellation-policies`: admin list/get/update, public list, `triggerFrontendRebuild()`.
  - `monuments`: admin list/get/update, public list, `triggerFrontendRebuild()`.
  - `pet-policy`: admin get/update, public get, `triggerFrontendRebuild()`.
  - `company-profile`: admin get/update, public get, `triggerFrontendRebuild()`.
  - `dossier-signoffs`: admin list/get/update, public list. Automatically synchronizes `company_profile.dossier_status` to `'signed_off'` when all 10 sections are approved, `'modifications_needed'` if any section requests modification, or `'pending_review'`, calling `triggerFrontendRebuild()`.
- Built combined content manifest endpoint:
  - `GET /api/v1/content/manifest` (rate-limited 120/min mirroring `route-catalog`) aggregating `cancellationPolicies`, `monuments`, `petPolicy`, `companyProfile`, and `dossierSignoffs` in a single unauthenticated roundtrip.
- Rate limits strictly configured: 120/min for public manifests/lookups, 60/min for admin reads, 30/min for admin writes, 20/min for lifecycle transitions.
- Fully wired in `backend/src/app.ts` alongside existing route catalog.
- Added comprehensive integration tests (`backend/tests/integration/dossier-manifest-modules.test.ts`) validating public manifests, draft filtering, publishing flow, vehicle upgrade bundling, junk slug rejection, and signoff synchronization.
- Zero changes made to `fare.engine.ts` (strictly deferred per scope pin).
- Fully validated via `npm run verify`: 3x typechecks, 26 vitest test suites / 150 tests passed, customer SEO lifecycle passed, 3x builds succeeded.

### 2026-10-04 — Dossier Content: Admin UI & Operations Desk (Step 3)

- Implemented §4 of the build spec across `admin/`:
  - **Sidebar & Navigation (`admin/src/components/admin/Sidebar.tsx`)**: Added navigation links for `/tour-packages`, `/local-transfers`, `/policies`, and `/sign-off` with appropriate Lucide icons.
  - **Route Catalog Extension (`admin/src/components/admin/RouteCatalogPanel.tsx`)**: Added `use_per_km` toggle, `per_km_rate_override` input, `highway` descriptor, and `all_inclusive_note`.
  - **Types & API Client (`admin/src/lib/types.ts`, `admin/src/lib/api.ts`)**: Added comprehensive TypeScript interfaces and typed CRUD API functions for all 8 dossier modules (tour packages, vehicle upgrades, local sightseeing packages, transfer routes, cancellation policies, monuments, pet taxi policy, company NAP profile, and client dossier signoffs).
  - **Tour Packages Page (`admin/src/pages/TourPackagesPage.tsx`)**: Full lifecycle management table and modal editor supporting 5 canonical fleet tiers (`sedan`, `ertiga`, `innova`, `tempo`, `urbania`), starting price, `use_per_km` toggle, night charge, flat charge, duration, and inclusions notes.
  - **Local & Transfers Page (`admin/src/pages/LocalTransfersPage.tsx`)**: Tabbed operational workspace supporting Local Sightseeing Packages (duration, included km, 5 fleet prices, extra km/hr rates editor) and Point-to-Point Transfers (doorstep station/airport transfers, distance notes, 5 fleet prices).
  - **Policies & Content Page (`admin/src/pages/PoliciesPage.tsx`)**: 4-tab interface managing:
    1. Cancellation & refund slabs for cabs and tour packages (notice window, fee retained %, refund %, rule description, refund timeline note).
    2. Pet taxi policy (offering toggle, seat protection note, breed restrictions, comfort stop rules, customer booking instruction).
    3. Company NAP Profile (official brand, registered entity, office address, phone, WhatsApp, email, GSTIN with pending `[TBD]` client confirmation banner, operating hours, Google Maps location, and dossier review status).
    4. Monuments knowledge base (10 monuments per Dossier §10.2 with visiting hours, closure notes, and historical context).
  - **Client Sign-off Page (`admin/src/pages/SignoffPage.tsx`)**: 10-row client verification checklist per Dossier §12 with status select (`pending`, `approved`, `modification_requested`), approver name, client notes, completion progress bar (`x/10 Approved`), and automatic / manual sign-off synchronization to `company_profile.dossier_status`.
  - **UI Component Utilities (`admin/src/components/ui/Input.tsx`)**: Exported accessible and theme-consistent `Textarea` component.
  - **Application Routing (`admin/src/App.tsx`)**: Lazy-loaded and mounted all 4 new pages inside `<AdminLayout />`.
- Zero changes to `fare.engine.ts` (strictly deferred to Step 4: Engine Wiring per scope pins).
- Fully validated via `npm run verify`: 3x typechecks (`customer`, `admin`, `backend`), 25 vitest test suites (150 tests passed), customer SEO tests passed, 3x production builds succeeded.

### 2026-10-04 — Dossier Content: Engine Wiring & Server Pricing Math (Step 4)

- Implemented Phase 4 (Engine Wiring) from `arenaai-dossier-admin-frontend-seo-build-spec.md` (§6, Phase 4):
  - **`backend/src/modules/fares/fare.types.ts`**: Extended `FareRuleOverrides` with `fleetPrices`, `usePerKm`, `perKmRateOverride`, `nightChargeInr`, `nights`, `upgradeSurcharges`, `nightHaltInr`, `nightStartHour`, and `nightEndHour`.
  - **`backend/src/modules/fares/cancellation.engine.ts`**: Implemented pure `calculateCancellationRefund` engine supporting all 9 Confirmation Dossier §6 & §8 slabs (3 cab slabs: >= 24h 100% refund, < 24h 0% refund, no-show 0% refund; 6 tour package slabs: > 60d 100%, 46-60d 90%, 31-45d 80%, 16-30d 70%, 6-15d 45%, 0-5d 0%).
  - **`backend/src/modules/fares/fare.engine.ts`**:
    - `isNightPickup`: Updated default night window to 20:00–06:00 IST (Dossier §5) while preferring configurable override hours (`nightStartHour` and `nightEndHour`).
    - `evaluateDossierTierBaseFare`: Implemented strict tier precedence per dossier spec:
      1. Priority 1: Admin `fleetPrices[tier]` (when `usePerKm` is false)
      2. Priority 2: `startingPrice + upgrade surcharge` (package-specific override else global matrix)
      3. Priority 3: `per-km (perKmRateOverride ?? tier base rate) × km`
    - Preserved quote-vs-charge parity: admin-set fleet price exactly matches engine output for all 5 canonical fleet tiers (`sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`).
    - Multi-night math: Multiplies `nightChargeInr` / `nightHaltInr` by `nights` on night pickups (default 1 night on 1-day trips with night pickup).
    - Preserved backward compatibility: published dossier rows take precedence over legacy constants; constants serve as seamless fallback.
  - **`backend/src/modules/fares/fare.service.ts`**:
    - In `calculate()`: Resolves published dossier rows from `tour_packages` (including package upgrades matrix), `transfer_routes`, `local_packages`, and `route_catalog`. Populates `ruleOverrides` and passes outstation `nightStartHour` / `nightEndHour`.
    - In `calculateSync()`: Properly maps `ruleOverrides.catalogDistanceKm`.
  - **`backend/src/modules/bookings/booking.service.ts`**:
    - In `transition()`: On booking cancellation (`to === "cancelled"`), evaluates cancellation policies against the booking's trip/package type and notice hours, and writes an authoritative `RefundRecord` into the `refunds` table.
  - **Comprehensive Unit & Integration Test Suites**:
    - `backend/tests/unit/fare.engine.test.ts`: Added 23 new unit test cases covering night boundaries (`19:59` no charge, `20:00` charge, `05:59` charge, `06:00` no charge), strict tier precedence, multi-night math, quote-vs-charge parity for all 5 tiers, and all 9 cancellation policy slabs. (47 passing tests total).
    - `backend/tests/integration/booking-cancellation-refund.test.ts`: Created integration test suite verifying that cancelling a paid booking generates the correct refund record according to the cancellation slab.
- Strictly maintained Phase 4 scope boundary: pricing math and engine wiring only (no admin UI edits, no frontend edits, no new database tables).
- Verified with full monorepo `npm run verify`: 3× typechecks (`customer`, `admin`, `backend`), 26 vitest test suites (175 tests passed), customer SEO checks passed, 3× production builds succeeded.

## Known next work (Phase 3 — secure integrations)

- Step 3.2: High-entropy token or OTP recovery for booking status retrieval (`/api/v1/bookings/status`).
- Step 3.3: Magic-byte and MIME validation for media file uploads.
- Step 3.4: Compensating object-store cleanup.
- Step 3.5: Split staff roles into content, pricing, dispatch, finance, review, audit, and security.

See `docs/agent/00_CONTEXT_HANDOFF.md` and section 8 of the root operating specification.


