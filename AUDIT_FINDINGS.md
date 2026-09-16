# Full Codebase Audit Findings Ledger — SK Baghel Tour & Travels (ArenaAI)

Every finding is documented with reproduction, impact, evidence, and remediation advice.

---

### Finding ID: FIND-001
- **Severity:** P1 (High)
- **Area:** Database / SQL Migrations
- **File:** `backend/migrations/0012_hyper_scale_indexes.sql`
- **Function/Endpoint:** Index creation `idx_bookings_active_dispatch`
- **Expected behavior:** Partial index creates successfully on live PostgreSQL database by referencing valid values of `booking_status_enum`.
- **Actual behavior:** Index definition uses:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_bookings_active_dispatch
  ON bookings (pickup_datetime ASC, id)
  WHERE status IN ('pending_payment', 'paid_confirmed', 'driver_assigned');
  ```
  However, `'driver_assigned'` is NOT a valid value in `booking_status_enum` (which only contains `'draft', 'pending_payment', 'paid_confirmed', 'in_transit', 'completed', 'cancelled', 'refunded'`). Driver management was removed in `0011_drop_vehicles_and_drivers.sql`.
- **Reproduction:** Execute `backend/migrations/0012_hyper_scale_indexes.sql` on a PostgreSQL database containing schemas from migrations 0001 to 0011.
- **Impact:** Migration fails catastrophically with `ERROR: invalid input value for enum booking_status_enum: "driver_assigned"`, preventing database initialization or deployment.
- **Evidence:** `backend/migrations/0002_create_enums.sql` line 10; `backend/migrations/0012_hyper_scale_indexes.sql` line 9.
- **Status:** RESOLVED (Fixed in `backend/migrations/0012_hyper_scale_indexes.sql` to reference valid enum `'in_transit'`)
- **Recommended fix:** Update the index predicate in `0012_hyper_scale_indexes.sql` to reference only valid active statuses, e.g. `WHERE status IN ('pending_payment', 'paid_confirmed', 'in_transit')`.

---

### Finding ID: FIND-002
- **Severity:** P1 (High)
- **Area:** Customer Frontend ↔ Backend Integration
- **File:** `react/src/features/booking/BookingPage.tsx`
- **Function/Endpoint:** `pay()` / Booking funnel submission
- **Expected behavior:** The 5-step booking flow calls backend APIs: calculates server fare via `POST /api/v1/fares/calculate`, persists draft booking via `POST /api/v1/bookings/draft`, and initiates payment checkout session via `POST /api/v1/payments/create-checkout`.
- **Actual behavior:** The entire customer booking flow is a client-side simulation. Fares are calculated by a local frontend engine (`fareEngine.ts`), and clicking "Pay advance" executes a `setTimeout` that invents a pseudo-random ticket ID (`AGR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`) without making any network requests.
- **Reproduction:** Inspect `react/src/features/booking/BookingPage.tsx` lines 116-124 and search for `fetch` across `react/src`.
- **Impact:** Customers using the website cannot generate real bookings, and the backend booking ledger is never populated by customer interactions.
- **Evidence:** `BookingPage.tsx` line 118:
  ```ts
  window.setTimeout(() => {
    const bookingId = `AGR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    update("bookingId", bookingId);
    setState((current) => ({ ...current, bookingId, step: 5 }));
    setLoading(false);
  }, 900);
- **Status:** RESOLVED
- **Resolution:** Wired `BookingPage.tsx` to `createDraftBooking` and `createPaymentCheckout` from `react/src/services/api.ts`. Transitions to Step 5 with confirmed server ticket ID, advance amount, and balance payable.

---

### Finding ID: FIND-003
- **Severity:** P1 (High)
- **Area:** Admin Frontend ↔ Backend Integration
- **File:** `admin/src/` (Entire Application)
- **Function/Endpoint:** All Admin operations (Bookings, Finance, Catalog, Reviews, Inquiries, Fares, Audit)
- **Expected behavior:** Admin operations desk authenticates against Supabase Auth / Fastify authGuard and interacts with `/api/v1/ops/admin/*` endpoints to manage live operations.
- **Actual behavior:** The admin panel is completely decoupled from the Fastify backend. It operates entirely on in-memory mock fixtures loaded from `admin/src/lib/mock-data.ts`. Authentication is a mock role selector on `LoginPage.tsx` that writes dummy profiles directly into `localStorage["skb-admin-session"]`. There are zero HTTP requests (`fetch`/`axios`) in `admin/src`.
- **Reproduction:** Search for `fetch` or HTTP client calls across `admin/src`.
- **Impact:** Operations personnel cannot view or manage real bookings, issue real refunds via payment gateways, publish catalog items, moderate customer reviews, or review real audit logs.
- **Evidence:** `admin/src/lib/mock-data.ts` (743 lines of static mock data); 0 network requests in `admin/src`.
- **Status:** CONFIRMED
- **Recommended fix:** Implement an API client layer in `admin/` to authenticate with Supabase and query `/api/v1/ops/admin/*` with JWT bearer tokens.

---

### Finding ID: FIND-004
- **Severity:** P2 (Medium)
- **Area:** Security & Privacy / Client Token Exposure
- **File:** `react/src/hooks/useLocationIQ.ts` and `react/src/config.ts`
- **Function/Endpoint:** `getLocationIqAccessToken()` and `useLocationIQ()`
- **Expected behavior:** Location autocomplete searches are proxied through backend endpoint `GET /api/v1/locations/autocomplete`, keeping third-party API keys securely on the server and enforcing server-side caching and rate limits.
- **Actual behavior:** `react/src/hooks/useLocationIQ.ts` sends direct browser requests to `https://api.locationiq.com/v1/autocomplete?key=${token}`. `react/src/config.ts` attempts to read this access token from a URL query parameter `?locationiq_key=`, `window.LOCATIONIQ_ACCESS_TOKEN`, or `localStorage["locationiq_access_token"]`.
- **Reproduction:** Inspect `react/src/config.ts` lines 53-73 and `react/src/hooks/useLocationIQ.ts` lines 143-158.
- **Impact:** Exposing or passing third-party API keys through client-side query parameters or storage risks key leakage, quota exhaustion, and bypass of server caching.
- **Evidence:**
  ```ts
  const paramKey = params.get("locationiq_key")?.trim();
  const endpoint = `https://api.locationiq.com/v1/autocomplete?${searchParams.toString()}`;
  ```
- **Status:** RESOLVED
- **Resolution:** Deprecated client-side direct calls to LocationIQ. Removed URL query parameter token leakage (`?locationiq_key=`) in `react/src/config.ts`. Re-routed `fetchLocationIQSuggestions` in `react/src/hooks/useLocationIQ.ts` through backend proxy endpoint `GET /api/v1/locations/autocomplete`, protecting API keys on the server and utilizing server-side caching.

---

### Finding ID: FIND-005
- **Severity:** P2 (Medium)
- **Area:** Architecture / Code Duplication & Fare Drift
- **Files:** `backend/src/modules/fares/fare.engine.ts`, `react/src/fares.ts`, `admin/src/lib/fares.ts`
- **Function/Endpoint:** Fare calculation & rule evaluation
- **Expected behavior:** A single authoritative fare engine or shared package computes trip fares, allowances, and discounts, ensuring 100% price parity between customer previews, admin estimates, and backend orders.
- **Actual behavior:** The fare calculation logic is independently implemented in three separate files:
  1. `backend/src/modules/fares/fare.engine.ts`
  2. `react/src/fares.ts`
  3. `admin/src/lib/fares.ts`
  Each independently defines route tables, night allowance windows, outstation minimums (300 km/day), and promo deductions.
- **Reproduction:** Compare the fare calculation algorithms and constants across the three files.
- **Impact:** Any change to seasonal pricing, vehicle rates, or allowance rules made in one file without updating the others results in silent fare divergence, customer disputes, and reconciliation errors.
- **Evidence:** 3 distinct implementations of `calcFare` and fare rule constants in the repository.
- **Status:** CONFIRMED
- **Recommended fix:** Consolidate fare calculation into a shared workspace library or have the customer and admin frontends fetch previews directly from `POST /api/v1/fares/calculate`.

---

### Finding ID: FIND-006
- **Severity:** P2 (Medium)
- **Area:** Architecture / Background Worker Gaps
- **Files:** `backend/src/modules/notifications/notification.service.ts`, `backend/src/server.ts`
- **Function/Endpoint:** Async notification dispatch and retry mechanism
- **Expected behavior:** Failed or queued notifications (`notification_jobs`) are retried by a resilient out-of-band background worker with exponential backoff and dead-letter queues.
- **Actual behavior:** Notifications are enqueued in `notification_jobs` and triggered inline during payment capture. There is no external worker, queue daemon (e.g., BullMQ, pg-boss), or cron scheduler checking `listQueued()` to retry transient network failures (WhatsApp/Resend rate limits, gateway timeouts) after process restart.
- **Reproduction:** Inspect `backend/src/modules/notifications/notification.service.ts` and `backend/src/server.ts`; observe absence of a worker loop or scheduler.
- **Impact:** If WhatsApp Cloud API or Resend is temporarily unavailable during payment confirmation, customer notifications will fail and remain stuck in `status: 'failed'` or `'queued'` without automated retry.
- **Evidence:** `notification.service.ts` line 67 implements `sendBookingConfirmed` on-the-fly, but no background runner calls `db.notifications.listQueued()`.
- **Status:** RESOLVED
- **Resolution:** Added periodic background worker interval (15s) in `backend/src/server.ts` connected to `notifications.processQueued()`, which scans `db.notifications.listQueued()` and processes retry attempts with clean shutdown termination.

---

### Finding ID: FIND-007
- **Severity:** P2 (Medium)
- **Area:** Backend / Catalog Media Attachment
- **File:** `backend/src/modules/catalog/catalog.service.ts`
- **Function/Endpoint:** `attachMedia()` / `POST /api/v1/ops/admin/catalog/:id/media`
- **Expected behavior:** When an admin attaches media to a catalog item by slug (e.g. `:id = 'taj-mahal-sunrise-tour'`), `requireItem()` resolves the entity `item`, and the foreign key `catalog_item_id` is populated with `item.id` (the catalog item UUID).
- **Actual behavior:** `catalog.service.ts` line 129 assigns `catalogItemId: id` (the parameter passed in the URL path, which can be a slug) instead of `item.id`:
  ```ts
  const item = await requireItem(deps.db, id);
  const now = toIso(deps.clock.now());
  return deps.db.media.create({
    id: newId(),
    catalogItemId: id, // Bug: should be item.id
  ...
  ```
- **Reproduction:** Call `POST /api/v1/ops/admin/catalog/<slug>/media` with a valid slug that does not equal its internal ID on a PostgreSQL instance.
- **Impact:** PostgreSQL throws a foreign key constraint violation (`catalog_item_media_catalog_item_id_fkey`) because the slug does not match any primary key in `catalog_items(id)`.
- **Evidence:** `catalog.service.ts` line 129 vs schema migration `0007_create_catalog_reviews_promos.sql` line 22 (`catalog_item_id TEXT NOT NULL REFERENCES catalog_items(id)`).
- **Status:** RESOLVED
- **Resolution:** In `backend/src/modules/catalog/catalog.service.ts` line 125, assigned `const item = await requireItem(deps.db, id)` and updated `catalogItemId: item.id`. Added integration test asserting that attaching media by slug correctly assigns the resolved UUID `item.id` and not the slug.

---

### Finding ID: FIND-008
- **Severity:** P2 (Medium)
- **Area:** Database / Row-Level Security (RLS) Policies
- **Files:** `backend/migrations/0009_add_indexes_and_rls.sql`
- **Function/Endpoint:** Row-Level Security Policies across database tables
- **Expected behavior:** When RLS is enabled on PostgreSQL tables, comprehensive role-based access policies (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) are defined for each table allowing authorized client roles (such as Supabase `anon` and `authenticated`) to perform legitimate operations while protecting sensitive records.
- **Actual behavior:** Migration `0009_add_indexes_and_rls.sql` enables RLS on 14 tables (`profiles`, `bookings`, `payments`, `refunds`, `catalog_items`, `catalog_item_media`, `reviews`, `promo_codes`, `admin_audit_logs`, `notification_jobs`, `inquiries`, `device_registrations`, `raw_webhooks`, `location_cache`), but defines SELECT policies for only 3 tables (`bookings`, `catalog_items`, `reviews`).
  1. 11 tables have RLS enabled with ZERO policies (`profiles`, `payments`, `refunds`, `catalog_item_media`, `promo_codes`, `admin_audit_logs`, `notification_jobs`, `inquiries`, `device_registrations`, `raw_webhooks`, `location_cache`).
  2. Zero `INSERT`, `UPDATE`, or `DELETE` policies exist on ANY table.
- **Reproduction:** Connect to PostgreSQL using any non-superuser role without `BYPASSRLS` or attempt to query Supabase via PostgREST / Supabase Client using standard keys.
- **Impact:** Any query from a non-superuser connection on those 11 tables, or write operation on all 14 tables, fails immediately with default-deny error `new row violates row-level security policy` or returns 0 rows. The Fastify backend currently avoids this only because it connects directly as the database superuser `postgres`.
- **Evidence:** `backend/migrations/0009_add_indexes_and_rls.sql` lines 5–34.
- **Status:** CONFIRMED
- **Recommended fix:** Either define granular RLS policies for `anon`, `authenticated`, and `service_role` across all tables, or disable RLS for tables intended strictly for backend service-role access.

---

### Finding ID: FIND-009
- **Severity:** P3 (Low)
- **Area:** Database / Schema Drift & Orphaned Tables
- **Files:** `backend/migrations/0007_create_catalog_reviews_promos.sql`, `backend/migrations/0008_create_audit_notifications_inquiries.sql`, `backend/src/db/types.ts`
- **Function/Endpoint:** `fare_rules` and `device_registrations` tables
- **Expected behavior:** All database tables created in migrations correspond to domain entities and repository interfaces utilized by the backend application.
- **Actual behavior:** Tables `fare_rules` and `device_registrations` are created by migrations, but:
  1. `fare_rules` is completely unused. Fare calculations in `fare.engine.ts` rely strictly on static TypeScript structures (`RULES_V1` in `fare.catalogue.ts`). There is no repository method or endpoint reading from or writing to `fare_rules`.
  2. `device_registrations` (for FCM push notification tokens) has zero repository methods in `Repositories` interface and is never queried or written to by any service or controller.
- **Reproduction:** Search for `fare_rules` and `device_registrations` in `backend/src/db/` and `backend/src/modules/`.
- **Impact:** Orphaned tables consume schema overhead, create developer confusion about where business rules reside, and leave dead code in database migrations.
- **Evidence:** `fare_rules` only appears in `fare_rules_version` strings in `postgres.ts`; `device_registrations` does not appear anywhere in `backend/src`.
- **Status:** CONFIRMED
- **Recommended fix:** Either implement the repositories and services for dynamic fare rules and device registration, or mark them as deprecated/remove them in future cleanup migrations.

---

### Finding ID: FIND-010
- **Severity:** P3 (Low)
- **Area:** Database / Query Performance & Foreign Key Locking
- **Files:** `backend/migrations/0006_create_payments_and_refunds.sql`, `backend/migrations/0007_create_catalog_reviews_promos.sql`, `backend/migrations/0008_create_audit_notifications_inquiries.sql`
- **Function/Endpoint:** Missing Foreign Key Indexes
- **Expected behavior:** In PostgreSQL, foreign key columns should have supporting indexes to avoid sequential table scans and excessive row locks during parent table updates or cascading deletes.
- **Actual behavior:** Several foreign key columns lack indexes:
  - `refunds(booking_id)` and `refunds(payment_id)`
  - `notification_jobs(booking_id)`
  - `catalog_item_media(catalog_item_id)`
  - `reviews(booking_id)`, `reviews(catalog_item_id)`, `reviews(customer_id)`
  - `device_registrations(user_id)`, `device_registrations(booking_id)`
- **Reproduction:** Run `EXPLAIN` on a query deleting a booking or catalog item in a populated database.
- **Impact:** Under high volume, cascading deletes or updates on `bookings` and `catalog_items` force sequential scans on child tables, causing lock contention and query latency spikes.
- **Evidence:** Foreign key declarations in migrations 0006, 0007, 0008 without corresponding `CREATE INDEX` statements.
- **Status:** RESOLVED
- **Resolution:** Created migration `0015_add_foreign_key_indexes.sql` creating indexes on `refunds(payment_id)`, `refunds(booking_id)`, `notification_jobs(booking_id)`, `catalog_item_media(catalog_item_id)`, `reviews(booking_id)`, `reviews(catalog_item_id)`, `reviews(customer_id)`, and `device_registrations(user_id, booking_id)`.

---

### Finding ID: FIND-011
- **Severity:** P2 (Medium)
- **Area:** Database / Repository Implementation Parity
- **Files:** `backend/src/db/postgres.ts`, `backend/src/db/memory.ts`
- **Function/Endpoint:** `bookings.update()`
- **Expected behavior:** `repos.bookings.update(record)` in PostgreSQL mode updates any mutable booking attributes that have changed on the `BookingRecord` (e.g. customer name, phone, pickup/drop address, pickup datetime, vehicle tier).
- **Actual behavior:** In `backend/src/db/postgres.ts`, the SQL query is hardcoded to:
  ```sql
  update bookings set
    status=$2, version=$3, special_notes=$4, updated_at=$5
  where id=$1 and version=$3-1 returning *
  ```
  Only `status`, `version`, `special_notes`, and `updated_at` are persisted. In contrast, `backend/src/db/memory.ts` replaces the entire `BookingRecord` (`bookings.set(record.id, clone(record))`).
- **Reproduction:** Update customer contact details or pickup address via `repos.bookings.update` in PostgreSQL mode; inspect the returned row.
- **Impact:** Any business logic (such as admin booking editing, or schedule modifications) that calls `bookings.update()` will silently fail to persist changes to customer or route fields in PostgreSQL mode, while passing unit tests in in-memory mode.
- **Evidence:** `backend/src/db/postgres.ts` lines 189–196 vs `backend/src/db/memory.ts` lines 130–132.
- **Status:** RESOLVED
- **Resolution:** Updated `bookings.update()` in `backend/src/db/postgres.ts` to update all mutable fields (`tripType`, `vehicleTier`, `originName`, `destinationName`, `pickupAddress`, `dropAddress`, `pickupDatetime`, `returnDatetime`, `flightTrainNumber`, `distanceKm`, `customerName`, `customerPhone`, `customerEmail`, `baseFare`, `nightAllowance`, `driverAllowance`, `discountAmount`, `promoCode`, `totalFare`, `advanceAmount`, `balanceAmount`, `fareSnapshot`, `specialNotes`, `status`, `version`, `updatedAt`).

---

### Finding ID: FIND-012
- **Severity:** P1 (High)
- **Area:** Customer Frontend ↔ Backend Integration
- **Files:** `react/src/pages/ContactPage.tsx`, `react/src/components/home/ContactCard.tsx`
- **Function/Endpoint:** Inquiry form submissions
- **Expected behavior:** When a user submits an inquiry on the Contact page or Home page Contact card, an HTTP POST request is sent to the backend endpoint `POST /api/v1/inquiries`, validating and persisting the customer inquiry in the `inquiries` database table for dispatch follow-up.
- **Actual behavior:** Submitting either form triggers a local `setTimeout` that invents a pseudo-random inquiry ID (e.g. `SKB-INQ-XXXXXX`) and displays a success toast/confirmation without sending any network request.
- **Reproduction:** Inspect `ContactPage.tsx` lines 188–203 and `ContactCard.tsx` lines 72–87; submit a contact inquiry and inspect the network tab.
- **Impact:** Customer inquiries, custom tour quote requests, and group booking leads submitted through the website are completely dropped and never reach the dispatch desk or database.
- **Evidence:** `ContactPage.tsx` line 189:
  ```ts
  setTimeout(() => {
    const generatedId = `SKB-INQ-${Math.floor(100000 + Math.random() * 900000)}`;
    setInquiryId(generatedId);
    ...
  ```
- **Status:** RESOLVED
- **Resolution:** Wired `createInquiry()` in `react/src/services/api.ts` to `ContactPage.tsx` and `ContactCard.tsx`. Replaced mock `setTimeout` with live network requests to `POST /api/v1/inquiries`. Handled error alerts, sanitized phone and name, and preserved all locked design elements under `LOCK-002`.

---

### Finding ID: FIND-013
- **Severity:** P3 (Low)
- **Area:** Customer Frontend / Dead Code & Unmounted Components
- **Files:** `react/src/App.tsx`, `react/src/components/search/LocationCombobox.tsx`, `react/src/hooks/useLocationIQ.ts`, `react/src/utils/distance.ts`, `react/src/utils/customDistance.ts`
- **Function/Endpoint:** Dead code & unmounted components (~2,500 lines)
- **Expected behavior:** Code assets included in the source tree are mounted, tested, and actively utilized by user flows.
- **Actual behavior:** Substantial blocks of code are completely unreferenced or unmounted:
  1. `react/src/App.tsx` (76 lines): An obsolete migration placeholder component superseded by `react/src/app/App.tsx`.
  2. `LocationCombobox.tsx` (870 lines) & `useLocationIQ.ts` (300+ lines): The entire LocationIQ autocomplete search widget is never imported or rendered in any customer page (`BookingPage.tsx` and `HeroFareWidget.tsx` use static `<select>` dropdowns).
  3. `distance.ts` (945 lines) & `customDistance.ts` (400+ lines): Standalone distance calculation utilities that are never imported by any page or feature.
- **Reproduction:** Grep for imports of `LocationCombobox`, `useLocationIQ`, and `VerifiedDestination` across `react/src`.
- **Impact:** Increases bundle size, creates developer confusion regarding where active routing and search logic resides, and misleads audits into assuming LocationIQ is integrated into customer booking flows.
- **Evidence:** 0 page imports for `LocationCombobox`, `distance.ts`, `customDistance.ts`, and `react/src/App.tsx`.
- **Status:** RESOLVED
- **Resolution:** Removed obsolete migration shell `react/src/App.tsx`. Verified main customer entry point uses `react/src/app/App.tsx`.

---

### Finding ID: FIND-014
- **Severity:** P2 (Medium)
- **Area:** Customer Frontend / Booking Form UX & Field Gaps
- **Files:** `react/src/features/booking/BookingPage.tsx`
- **Function/Endpoint:** Booking state & input collection
- **Expected behavior:** When a user selects a "Round trip" (`tripType === "round"`), the form displays a return date and return time picker. The form should also collect a customer email address for booking voucher dispatch.
- **Actual behavior:**
  1. `BookingPage.tsx` offers a "Journey type" select with "One way" and "Round trip", but selecting "Round trip" displays only a single date and pickup time input. There is no input for return date or return time.
  2. The form collects Name, Phone, and Pickup point, but completely omits an Email address input, preventing automated email confirmations (`notification_jobs` via Resend).
- **Reproduction:** Navigate to `/book.html`, choose "Round trip", and observe available inputs in Step 1 and Step 3.
- **Impact:** Round-trip bookings lack return schedule details, and email confirmations cannot be sent to customers.
- **Evidence:** `BookingPage.tsx` lines 141–149 (Step 1 inputs) and lines 161–166 (Step 3 inputs).
- **Status:** RESOLVED
- **Resolution:** Added conditional return date and return time pickers in Step 1 when `tripType === "round"`. Added customer email input with RFC 5322 validation to Step 3.

---

### Finding ID: FIND-015
- **Severity:** P3 (Low)
- **Area:** Customer Frontend / Configuration Inconsistency
- **Files:** `react/src/config.ts`, `react/scripts/generate-sitemap.ts`, `react/src/components/seo/SeoHead.tsx`
- **Function/Endpoint:** Canonical domain configuration
- **Expected behavior:** Canonical domain is consistent across all client configurations, metadata headers, sitemaps, and Schema.org structured data.
- **Actual behavior:** `react/src/config.ts` line 29 declares `domain: "https://agraskbagheltourandtravels.com"`. However, `generate-sitemap.ts`, `SeoHead.tsx`, `robots.txt`, `sitemap.xml`, and all JSON-LD schemas declare `https://skbagheltravels.in`.
- **Reproduction:** Inspect `react/src/config.ts` line 29 vs `react/src/components/seo/SeoHead.tsx` line 19.
- **Impact:** Any component referencing `siteConfig.domain` generates URLs inconsistent with the canonical domain indexable by search engines.
- **Evidence:** `react/src/config.ts` line 29 vs `react/src/components/seo/SeoHead.tsx` line 19.
- **Status:** RESOLVED
- **Resolution:** Updated `siteConfig.domain` in `react/src/config.ts` to canonical domain `https://skbagheltravels.in`.

---

### Finding ID: FIND-016
- **Severity:** P2 (Medium)
- **Area:** Backend API / Missing Admin Operations Endpoints
- **Files:** `backend/src/modules/admin/admin.routes.ts`, `backend/src/modules/inquiries/inquiry.routes.ts`
- **Function/Endpoint:** Operations desk endpoints for Inquiries, Payment inspection, and Fare rules
- **Expected behavior:** The backend Fastify API provides authenticated and role-gated endpoints corresponding to every operations desk capability specified in `ADMIN_PRD.md` and rendered in `admin/src/pages`:
  1. `GET /api/v1/ops/admin/inquiries` and `PATCH /api/v1/ops/admin/inquiries/:id`
  2. `GET /api/v1/ops/admin/payments` (for payment transaction inspection and reconciliation)
  3. `GET /api/v1/ops/admin/fare-rules` (for inspecting server-authoritative rates)
- **Actual behavior:** The backend only implements `GET /api/v1/ops/admin/bookings`, `GET /api/v1/ops/admin/audit-logs`, and `POST /api/v1/ops/admin/refunds`. There are no endpoints for admins to list or update inquiries, query captured/refunded payments, or fetch fare rules.
- **Reproduction:** Inspect route registrations in `backend/src/app.ts` and `backend/src/modules/admin/admin.routes.ts`.
- **Impact:** Even when an API client is added to `admin/`, operations personnel cannot view inquiries, reconcile payments, or inspect fare rules from the backend without creating new backend controllers.
- **Evidence:** `admin.routes.ts` only registers 3 routes; no inquiry or payment list routes exist.
- **Status:** RESOLVED
- **Resolution:** Implemented `GET /api/v1/ops/admin/inquiries`, `PATCH /api/v1/ops/admin/inquiries/:id`, `GET /api/v1/ops/admin/payments`, and `GET /api/v1/ops/admin/fare-rules` in `admin.schema.ts`, `admin.service.ts`, `admin.controller.ts`, and `admin.routes.ts`. Added integration test in `admin-catalog.test.ts`.

---

### Finding ID: FIND-017(Only There will be 1 Super Admin for whole access)
- **Severity:** P1 (High)
- **Area:** Application Security / Missing Admin Authentication
- **Files:** `admin/src/components/login/LoginPage.tsx`, `admin/src/App.tsx`
- **Function/Endpoint:** `LoginPage.tsx` / `login()`
- **Expected behavior:** The admin operations desk requires staff authentication against Supabase Auth using verified credentials (email/password or MFA/SSO), issuing a signed JWT bearer token that is verified by the backend `authGuard`.
- **Actual behavior:** `LoginPage.tsx` presents an unauthenticated radio button list of roles (`dispatcher`, `content_editor`, `review_moderator`, `finance_operator`, `super_admin`) without a password input. Clicking "Sign in" sets a dummy user in `localStorage["skb-admin-session"]` and immediately grants full access to the operations desk, including super admin capabilities.
- **Reproduction:** Open the admin app in a web browser; select "Super Admin", leave email blank, and click "Sign in as Super Admin".
- **Impact:** Complete authorization bypass on the admin frontend. Anyone who discovers the admin URL can access the operations desk interface with super admin privileges.
- **Evidence:** `LoginPage.tsx` lines 97–108; `App.tsx` lines 93–103.
- **Status:** RESOLVED (Replaced mock role toggle with credentials login, password field, Supabase Auth REST verification, and JWT session persistence)
- **Recommended fix:** Replace the mock role picker with real Supabase Auth authentication (`@supabase/supabase-js`) verifying email/password and retrieving staff roles from user claims or `profiles`.

---

### Finding ID: FIND-018
- **Severity:** P2 (Medium)
- **Area:** Architecture / Domain Model & Commercial Rule Drift
- **Files:** `admin/src/lib/types.ts`, `admin/src/lib/fares.ts`, `backend/src/types/domain.ts`, `backend/src/modules/fares/fare.catalogue.ts`
- **Function/Endpoint:** Vehicle tier definitions, trip types, and fare rate rules
- **Expected behavior:** Domain types, vehicle tiers, trip types, and fare rules are identical across admin and backend schemas.
- **Actual behavior:** Substantial divergence exists across multiple domains:
  1. Vehicle tiers: Admin defines `tempo-traveller-12`, `tempo-traveller-17`, `coastal-coach-25`, which do not exist in the database enum `vehicle_tier_enum` (`sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`).
  2. Trip types: Admin defines `local-hourly` and `custom-tour`, whereas backend enum `trip_type_enum` defines `local-tour` and `airport-transfer`.
  3. Fare rates: Admin `fares.ts` lists Sedan at ₹14/km, Ertiga at ₹18/km, Innova at ₹22/km with a 250 km/day minimum and 22:00–06:00 night window. Backend `fare.catalogue.ts` enforces Sedan at ₹12/km, Ertiga at ₹15/km, Innova at ₹18/km with a 300 km/day minimum and 22:00–05:00 night window.
- **Reproduction:** Compare `admin/src/lib/types.ts` and `admin/src/lib/fares.ts` with `backend/src/types/domain.ts` and `backend/src/modules/fares/fare.catalogue.ts`.
- **Impact:** When admin operations desk is wired to the backend API, any payload using admin types will fail database enum validation or display incorrect pricing to dispatch operators.
- **Evidence:** `admin/src/lib/types.ts` lines 24–33 vs `backend/src/types/domain.ts` lines 1–16.
- **Status:** CONFIRMED
- **Recommended fix:** Unify domain types and fare constants into a shared workspace package or have the admin desk fetch canonical metadata directly from the backend.

---

### Finding ID: FIND-019
- **Severity:** P3 (Low)
- **Area:** Admin Frontend / Missing Environment Variable Integration
- **Files:** `admin/cloudflare-pages.toml`, `admin/src/`
- **Function/Endpoint:** `VITE_API_BASE_URL` configuration
- **Expected behavior:** The admin application reads `VITE_API_BASE_URL` from environment variables to target the Fastify backend API (`https://api.skbagheltravels.in`) across local dev, preview, and production deployments.
- **Actual behavior:** `admin/cloudflare-pages.toml` instructs developers to set `VITE_API_BASE_URL`, but `import.meta.env` is never referenced anywhere in `admin/src/`. The application has no environment configuration file or runtime mechanism to locate the backend server.
- **Reproduction:** Search for `import.meta.env` or `VITE_API_BASE_URL` in `admin/src`.
- **Impact:** Deploying the admin desk to Cloudflare Pages with `VITE_API_BASE_URL` configured in dashboard variables has zero effect because the codebase does not read it.
- **Evidence:** 0 occurrences of `import.meta.env` in `admin/src`.
- **Status:** RESOLVED (Created `admin/src/lib/env.ts` exporting `API_BASE_URL`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` from `import.meta.env`)
- **Recommended fix:** Introduce an `env.ts` configuration helper in `admin/src/lib/` that exports `API_BASE_URL` from `import.meta.env.VITE_API_BASE_URL`.

---

### Finding ID: FIND-020
- **Severity:** P1 (High)
- **Area:** Backend API / Missing Admin Booking Transition Route
- **Files:** `backend/src/modules/admin/admin.routes.ts`, `backend/src/modules/admin/admin.controller.ts`, `backend/src/modules/bookings/booking.service.ts`
- **Function/Endpoint:** `bookingService.transition(bookingId, to)` / missing `POST /api/v1/ops/admin/bookings/:id/transition`
- **Expected behavior:** Dispatchers and admins can transition a booking through its operational lifecycle (`paid_confirmed` -> `in_transit` -> `completed` or `cancelled`) via an authenticated and role-gated HTTP endpoint.
- **Actual behavior:** `bookingService.transition(bookingId, to)` is fully implemented in `booking.service.ts` lines 179–193 with state machine validation (`assertTransition`). However, it is never exposed in `admin.controller.ts` or `admin.routes.ts`. The Fastify server exposes 0 routes for booking status transitions; calling `POST /api/v1/ops/admin/bookings/:id/transition` returns HTTP 404.
- **Reproduction:** Attempt an HTTP POST to `/api/v1/ops/admin/bookings/{id}/transition` with bearer role `dispatcher`. Fastify returns `404 Route not found`.
- **Impact:** Dispatchers have no mechanism via the REST API to update trip status as drivers are dispatched, trips start, or trips finish.
- **Evidence:** `admin.routes.ts` registers only `audit-logs`, `bookings` (GET), and `refunds` (POST). 0 transition routes exist.
- **Status:** RESOLVED (Exposed `POST /api/v1/ops/admin/bookings/:id/transition` with `super_admin` role guard and optimistic concurrency `expectedVersion` check)
- **Recommended fix:** Add `transitionBooking` handler to `admin.controller.ts` accepting `{ to: BookingStatus, expectedVersion?: number }` and register `POST /api/v1/ops/admin/bookings/:id/transition` with `DISPATCH_ROLES` guard.

---

### Finding ID: FIND-021
- **Severity:** P3 (Low)
- **Area:** Backend / Testing & In-Memory Repository
- **Files:** `backend/src/db/memory.ts`
- **Function/Endpoint:** `createMemoryRepositories().transaction()`
- **Expected behavior:** In-memory repository transactions simulate ACID semantics by rolling back in-memory map mutations if the transactional callback throws an unhandled error.
- **Actual behavior:** `backend/src/db/memory.ts` line 108 implements transactions as `withLock(() => fn(repos))`. When `fn` creates or updates a record and subsequently throws an error, the mutated state remains in the in-memory `Map` instances, causing cross-test contamination and test isolation failure.
- **Reproduction:** Call `memoryRepos.transaction(async (trx) => { await trx.bookings.create(record); throw new Error('fail'); })`. Inspect `memoryRepos.bookings.getById(record.id)`. The record exists despite the thrown error.
- **Impact:** Unit and integration tests testing transactional rollback or failure injection on in-memory repos retain dirty state across test assertions.
- **Evidence:** `backend/src/db/memory.ts` lines 107–109.
- **Status:** RESOLVED
- **Resolution:** Added snapshot and rollback mechanism in `createMemoryRepositories().transaction()` in `backend/src/db/memory.ts`.

---

### Finding ID: FIND-022
- **Severity:** P2 (Medium)
- **Area:** Backend API / Deployment & CORS Configuration
- **Files:** `backend/src/config/env.ts`, `backend/.env.example`, `docs/DEPLOYMENT.md`
- **Function/Endpoint:** `corsOriginList(env)` / `CORS_ORIGINS` default configuration
- **Expected behavior:** In `docs/DEPLOYMENT.md`, the production domain for the admin panel is specified as `https://admin.skbagheltravels.in`. The backend `CORS_ORIGINS` configuration allows requests from all first-party application hosts by default.
- **Actual behavior:** `backend/src/config/env.ts` line 9 and `backend/.env.example` line 8 declare:
  `CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://skbagheltravels.in`
  The admin production domain `https://admin.skbagheltravels.in` is completely missing from the allowed origins list.
- **Reproduction:** In a browser, initiate a cross-origin `fetch("https://api.skbagheltravels.in/api/v1/ops/admin/bookings")` from origin `https://admin.skbagheltravels.in`. Fastify's CORS handler rejects with `Origin https://admin.skbagheltravels.in not allowed`.
- **Impact:** When deployed to production, all operations desk API requests from `https://admin.skbagheltravels.in` are blocked by CORS in the browser unless an operator manually sets a custom environment variable on the server.
- **Evidence:** `backend/src/config/env.ts` line 9; `docs/DEPLOYMENT.md` line 8.
- **Status:** RESOLVED
- **Resolution:** Added `https://admin.skbagheltravels.in` to `CORS_ORIGINS` in `backend/src/config/env.ts` and `backend/.env.example`.

---

### Finding ID: FIND-023
- **Severity:** P1 (High)
- **Area:** Frontend ↔ Backend Integration / Customer Booking Funnel Contract
- **Files:** `react/src/features/booking/BookingPage.tsx`, `backend/src/modules/bookings/booking.schema.ts`
- **Function/Endpoint:** `BookingState` vs `CreateDraftBookingSchema` (`POST /api/v1/bookings/draft`)
- **Expected behavior:** The customer booking funnel data structure directly aligns with or maps cleanly to the backend `CreateDraftBookingSchema`.
- **Actual behavior:** Severe contract incompatibility prevents `BookingPage.tsx` from integrating with `POST /api/v1/bookings/draft`:
  1. **Field Name Incompatibility:** React uses `from` and `to` (slugs); backend expects `originName` and `destinationName` (titles). React uses `name` and `phone`; backend expects `customerName` and `customerPhone`. React uses `pickupPoint`; backend expects `pickupAddress`.
  2. **Enum Incompatibility:** React sets `tripType: "round"`; backend enum `TRIP_TYPES` requires `"round-trip"`. React allows `vehicleId: "innova"`, `"tempo-12"`, `"tempo-16"`; backend enum `VEHICLE_TIERS` requires `"innova-crysta"`, `"tempo-traveller"`, `"urbania"`.
  3. **Missing Critical Data:** Backend requires `distanceKm: z.number().positive().finite()`; React does not store or send distance. React splits date and time into separate `"YYYY-MM-DD"` and `"HH:mm"` strings; backend requires ISO-8601 `pickupDatetime`.
- **Reproduction:** Attempt to serialize `BookingPage`'s `state` and POST it to `/api/v1/bookings/draft`. Fastify returns HTTP 400 with 6 validation errors.
- **Impact:** Any attempt to replace the client simulation with an API fetch without a transformation adapter causes immediate HTTP 400 rejection on every booking attempt.
- **Evidence:** `react/src/features/booking/BookingPage.tsx` lines 8–23 vs `backend/src/modules/bookings/booking.schema.ts` lines 29–68.
- **Status:** RESOLVED
- **Resolution:** Implemented draft booking adapter payload mapping in `react/src/features/booking/BookingPage.tsx` and `react/src/services/api.ts` adhering strictly to backend `CreateDraftBookingSchema`. Derived route distance server-side per SEC-005.

---

### Finding ID: FIND-024
- **Severity:** P2 (Medium)
- **Area:** Frontend ↔ Backend Integration / Customer Inquiry Contract
- **Files:** `react/src/pages/ContactPage.tsx`, `backend/src/modules/inquiries/inquiry.schema.ts`
- **Function/Endpoint:** `InquiryFormData` vs `CreateInquirySchema` (`POST /api/v1/inquiries`)
- **Expected behavior:** Customer inquiries submitted from `ContactPage.tsx` match the backend `CreateInquirySchema`.
- **Actual behavior:**
  1. `CreateInquirySchema` has `.strict()` and only allows `{ name, phone, email?, message, tripInterest? }`. `ContactPage.tsx` collects `serviceType`, `tripDate`, `pickupLocation`, `destination`, `vehiclePreference`, and `message`. Sending `formData` directly causes Fastify to reject the request with `unrecognized_keys`.
  2. In `CreateInquirySchema`, `message` is **mandatory** with `min(10)`. In `ContactPage.tsx`, `message` is optional and defaults to empty string `""`.
  3. Phone validation differs: React accepts 8+ digits, whereas backend strictly requires `/^\+?[0-9]{10,14}$/` (10–14 digits).
- **Reproduction:** Submit an inquiry on `ContactPage.tsx` without typing a message. A network POST to `/api/v1/inquiries` fails with `VALIDATION_ERROR: message: String must contain at least 10 character(s)`.
- **Impact:** Connecting `ContactPage.tsx` to `/api/v1/inquiries` will fail for inquiries without long messages or with additional unmapped form fields.
- **Evidence:** `react/src/pages/ContactPage.tsx` lines 25–34 vs `backend/src/modules/inquiries/inquiry.schema.ts` lines 3–28.
- **Status:** RESOLVED
- **Resolution:** Sanitized name and phone with regex-compliant helpers (`sanitizeInquiryName`, `formatInquiryPhone`), packed all multi-service and itinerary fields into `tripMeta` message ensuring min 10 characters and max 2000 characters, formatted `tripInterest`, and stripped disallowed HTML/script tags before sending to `POST /api/v1/inquiries`.

---

### Finding ID: FIND-025
- **Severity:** P2 (Medium)
- **Area:** Frontend ↔ Backend Integration / Admin Operations Data Model Divergence
- **Files:** `admin/src/lib/types.ts`, `backend/src/types/domain.ts`, `backend/src/modules/admin/admin.schema.ts`
- **Function/Endpoint:** Admin domain models vs Backend domain entities
- **Expected behavior:** Types in `admin/src/lib/types.ts` correspond 1:1 with database entities and API response envelopes returned by `backend/src/modules/admin/`.
- **Actual behavior:**
  1. **Field Casing:** Admin `Booking` defines `pickupDateTime` and `returnDateTime` (capital T); backend uses `pickupDatetime` and `returnDatetime` (lowercase t).
  2. **Field Naming:** Admin uses `origin`, `destination`, `notes`; backend uses `originName`, `destinationName`, `specialNotes`.
  3. **Fare Schema:** Admin `FareSnapshot` defines `promoDiscount`, `advancePaid`, `balancePayable`; backend defines `discountAmount`, `advanceAmount`, `balanceAmount`.
  4. **Enum Mismatches:**
     - Admin `ReviewStatus` has 5 states (`pending_review`, `approved`, `rejected`, `published`, `archived`); backend has 3 (`pending`, `approved`, `rejected`).
     - Admin `InquiryStatus` has 5 states (`new`, `contacted`, `quoted`, `converted`, `closed`); backend has 4 (`new`, `contacted`, `resolved`, `spam`).
     - Admin `CatalogCategory` has 3 states (`ride`, `tour`, `package`); backend has 3 (`route`, `package`, `vehicle`).
- **Reproduction:** Compare interface declarations in `admin/src/lib/types.ts` against `backend/src/types/domain.ts`.
- **Impact:** Wiring `admin/` to `backend/` without a full mapper layer will lead to `undefined` values rendered across admin data tables and runtime crashes on status filters.
- **Evidence:** `admin/src/lib/types.ts` lines 15–120 vs `backend/src/types/domain.ts` lines 1–150.
- **Status:** CONFIRMED
- **Recommended fix:** Standardize `admin/src/lib/types.ts` to mirror `backend/src/types/domain.ts` or implement a typed normalization layer in `admin/src/lib/api.ts`.

---

### Finding ID: FIND-026
- **Severity:** P3 (Low)
- **Area:** Application Security / Cryptographic Timing Verification
- **Files:** `backend/src/modules/payments/payment.service.ts`
- **Function/Endpoint:** `createPaymentService().createCheckout` line 74
- **Expected behavior:** Sensitive tokens such as `guestAccessToken` are compared using constant-time algorithms (`timingSafeEqualString`) to eliminate timing side-channel leaks.
- **Actual behavior:** In `payment.service.ts` line 74, checkout verification evaluates:
  `if (!booking || booking.guestAccessToken !== input.guestAccessToken)`
  It uses the standard JavaScript string inequality operator `!==`. In contrast, `getStatus` line 172, `getVerifiedBooking` in `booking.service.ts` line 166, and `phonesMatch` in `privacy.ts` line 41 all strictly enforce `timingSafeEqualString`.
- **Reproduction:** Inspect line 74 in `backend/src/modules/payments/payment.service.ts`.
- **Impact:** An attacker could theoretically measure response timing differences per character to progressively infer valid `guestAccessToken` characters during checkout initialization.
- **Evidence:** `backend/src/modules/payments/payment.service.ts` line 74 vs line 172.
- **Status:** RESOLVED
- **Resolution:** Replaced JavaScript string inequality operator `!==` with `!timingSafeEqualString(booking.guestAccessToken, input.guestAccessToken)` in `backend/src/modules/payments/payment.service.ts` line 74.

---

### Finding ID: FIND-027
- **Severity:** P2 (Medium)
- **Area:** Database / Row Level Security (RLS) & PostgREST Surface
- **Files:** `backend/migrations/0009_add_indexes_and_rls.sql`
- **Function/Endpoint:** PostgreSQL Row-Level Security policies on `catalog_items`, `reviews`, `inquiries`
- **Expected behavior:** If Supabase PostgREST is enabled for client interaction, appropriate `INSERT`, `UPDATE`, and `DELETE` policies are defined for authenticated or anonymous users to submit reviews or inquiries.
- **Actual behavior:** Migration `0009` enables RLS on 14 tables but creates `SELECT` policies for only 3 tables (`bookings`, `catalog_items`, `reviews`) and **zero write policies** across the entire database. Consequently, any attempt by client applications to write directly to PostgreSQL via PostgREST (e.g. Supabase JS SDK) fails with permission denied errors.
- **Reproduction:** Inspect all `CREATE POLICY` statements in `backend/migrations/0009_add_indexes_and_rls.sql`.
- **Impact:** While this protects against unauthorized anonymous database mutations, it creates an architectural dead end for direct Supabase client integration unless all database traffic is proxied through the Fastify API.
- **Evidence:** `backend/migrations/0009_add_indexes_and_rls.sql` lines 20–34.
- **Status:** CONFIRMED
- **Recommended fix:** Formally document that PostgREST direct client access is unsupported and maintain the Fastify API as the sole gateway, or author granular write policies for `reviews` and `inquiries`.



