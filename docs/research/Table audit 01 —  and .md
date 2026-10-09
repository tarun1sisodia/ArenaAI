# Table audit 01 — `profiles` and `device_registrations`

**Audit date:** 2026-10-06  
**Scope:** Exactly `public.profiles` and `public.device_registrations`, including their direct foreign-key lifecycle connections.  
**Repository:** `/home/ubuntu/ArenaAI`  
**Safety boundary:** No production writes, migrations, webhook replays, deletes, or external submissions were performed.

## 1. Evidence and live snapshot

Reviewed first:

- `reports/live-schema-inventory.md` (generated from Supabase `list_tables` on 2026-10-05)
- `reports/schema-model-alignment.md`
- `reports/schema-audit-findings.md`
- `reports/phase1-table-scan-findings.md`
- `reports/2026-10-06-16-table-alignment-execution-plan.md`

Implementation evidence reviewed:

- `backend/migrations/0003_create_profiles.sql`
- `backend/migrations/0008_create_audit_notifications_inquiries.sql`
- `backend/migrations/0009_add_indexes_and_rls.sql`
- `backend/migrations/0010_add_updated_at_triggers.sql`
- `backend/migrations/0015_add_foreign_key_indexes.sql`
- `backend/migrations/0016_comprehensive_rls_policies.sql`
- `backend/src/db/types.ts`, `backend/src/types/domain.ts`
- `backend/src/db/postgres.ts`, `backend/src/db/memory.ts`, `backend/src/db/seedData.ts`, `backend/scripts/seed.ts`
- `backend/src/app.ts`
- `backend/src/modules/bookings/{booking.service,booking.controller,booking.routes}.ts`
- `backend/src/modules/booking-intents/booking-intent.service.ts`
- `react/src/services/customerAuthApi.ts` and `react/src/features/booking/BookingPage.tsx`
- `backend/tests/unit/device-registration-auth.test.ts` and the device test in `backend/tests/integration/admin-catalog.test.ts`

### Current Supabase counts and aggregate checks

A read-only Supabase `execute_sql` check was available and used against project `trcmufqbpcymipqpemoq`:

| Table/check | Current result | Evidence/interpretation |
|---|---:|---|
| `public.profiles` row count | **2** | Matches the live inventory. |
| Profile `full_name` NULL / empty | **0 / 0** | No current required-name null/empty rows. |
| Profile `phone` NULL / empty | **0 / 0** | No current required-phone null/empty rows. |
| Profile `email` NULL | **0** | `email` is schema-nullable, but both current rows have email. |
| Profile roles | **1 customer, 1 super_admin** | Current role distribution. |
| `public.device_registrations` row count | **0** | Matches the live inventory; table is currently empty. |
| Device `user_id` NULL, `booking_id` NULL, `device_id` empty, `fcm_token` empty, inactive, `last_seen_at` NULL | **0 for each** | Vacuous because there are no device rows. The schema still permits nullable `user_id`/`booking_id`. |
| Device rows with missing profile target | **0** | No device rows currently exist; FK also prevents an invalid non-NULL profile reference. |
| Device rows with missing booking target | **0** | No device rows currently exist; FK also prevents an invalid non-NULL booking reference. |

The inventory gives the current RLS status: **RLS enabled on both tables**. The aggregate SQL was intentionally limited to counts/null checks and did not select personal names, phone numbers, emails, tokens, or other row contents.

## 2. Database contract and column population matrix

### `public.profiles`

Migration: `backend/migrations/0003_create_profiles.sql` (lines 1–10). The live inventory records the same contract.

| Column | DB contract | What fills it / condition / writer | NULL or empty meaning |
|---|---|---|---|
| `id` | `uuid`, PK, NOT NULL, no default; FK to `auth.users(id)` with `ON DELETE CASCADE` | Supabase auth subject ID. Backend profile sync copies `request.user.id`/`actor.id` into this field when an authenticated customer completes a booking-intent finalize or creates a draft and no profile exists. Seed script also supplies IDs for non-production fixtures. | Never intentionally NULL or empty. It is the identity join key. |
| `full_name` | `text`, NOT NULL, no default | Customer booking input (`customerName`) during first profile sync; seed data/admin fixture can supply it. | NULL is prevented by DB; empty/whitespace is not explicitly prevented by this migration. Current live count has no empty value. |
| `phone` | `varchar(20)`, NOT NULL, UNIQUE, no default | Customer booking input (`customerPhone`) during first profile sync; seed data supplies it. A uniqueness violation is converted to `PROFILE_CONTACT_CONFLICT` by the service. | NULL is a defect and blocked by DB. Empty/whitespace is not explicitly prevented by the migration; current live count has no empty value. |
| `email` | `varchar(255)`, NULLABLE, UNIQUE, no default | Customer booking input when present, otherwise auth actor email during first profile sync; seed script supplies it. `GET /api/v1/me/profile` falls back to the authenticated token email if the profile email is NULL. | NULL is intentional for auth accounts without email or when a booking does not provide one. It must not be converted to an empty string. Current live rows are non-NULL. |
| `role` | `user_role_enum`, NOT NULL, default `customer`; live enum includes `customer`, `content_editor`, `review_moderator`, `dispatcher`, `finance_operator`, `super_admin` | First profile sync writes `customer`; controlled seed/admin provisioning may write a privileged role. Auth middleware derives the request role from server-controlled `app_metadata.role`; it does not automatically update the profile role. | NULL is a defect. `customer` is the intended default; privileged roles are explicit. |
| `created_at` | `timestamptz`, NOT NULL, default `now()` | Backend profile record supplies the first-sync timestamp; DB default applies to direct inserts. | NULL is a defect. It is creation provenance. |
| `updated_at` | `timestamptz`, NOT NULL, default `now()` | Backend upsert supplies it; migration `0010` installs `profiles_set_updated_at` using `set_updated_at()` for SQL updates. | NULL is a defect. It should advance on updates. |

**Profile mapper/contract:** `ProfileRecord` is the camelCase domain record in `backend/src/db/types.ts`/`backend/src/types/domain.ts`. `mapProfile()` in `backend/src/db/postgres.ts` maps `full_name → fullName`, `phone`, nullable `email`, `role`, and timestamps. The PostgreSQL repository reads by ID/role and upserts all profile columns (`postgres.ts` around lines 695–714). The memory repository mirrors `getById`, `getByRole`, and `upsert` but, unlike PostgreSQL, does not enforce SQL uniqueness or FK behavior.

### `public.device_registrations`

Migration: `backend/migrations/0008_create_audit_notifications_inquiries.sql` (lines 40–51); supporting indexes in `0015` (user and booking indexes). The live inventory records the same columns and checks.

| Column | DB contract | What fills it / condition / writer | NULL or empty meaning |
|---|---|---|---|
| `id` | `uuid`, PK, default `gen_random_uuid()` | API route generates `newId()` for each registration attempt; seed script supplies a fixture ID. | Never intentionally NULL/empty. On a PostgreSQL conflict, the existing DB ID remains even though the repository returns the newly submitted record; see finding F-01. |
| `user_id` | `uuid`, NULLABLE; FK to `profiles(id)` with `ON DELETE CASCADE` | `POST /api/v1/devices/register` copies optional `body.userId`. It is NULL for anonymous/device-only push registration. | NULL is intentional for guest/device-only registration. Non-NULL must point to an existing profile; current orphan count is 0. |
| `booking_id` | `uuid`, NULLABLE; FK to `bookings(id)` with `ON DELETE CASCADE` | Route resolves optional `bookingId` or `ticketId` to a booking only after authenticated-owner, privileged-staff, or matching `guestAccessToken` verification. It stores the verified booking UUID. | NULL is intentional for a device not tied to a booking. Non-NULL is a booking-scoped registration and is cascade-deleted with the booking. |
| `device_id` | `varchar(100)`, NOT NULL, no default | Required API payload identity for the client device; Zod requires length 1–100. | NULL is a defect. Empty is not allowed by the route in ordinary use, but whitespace-only strings pass `.min(1)` and the DB has no non-blank check (low-severity hardening gap). |
| `platform` | `varchar(20)`, NOT NULL, no default; check is exactly `android`, `ios`, or `web` | Required API payload; inline Zod enum and DB check are aligned. | NULL/empty/other values are defects and rejected by the normal route/DB. |
| `fcm_token` | `text`, NOT NULL, no default | Required API payload; route accepts 1–500 characters and stores the token. | NULL is a defect. Empty is not allowed by ordinary route validation, but whitespace-only strings pass `.min(1)`; there is no DB non-blank check. No current rows exist. |
| `is_active` | `boolean`, NOT NULL, default `true` | Registration route always writes `true`; PostgreSQL upsert also restores `true` on re-registration. There is no application deactivation endpoint or repository method. | `false` would intentionally mean opt-out/stale token and is filtered out by PostgreSQL `getByDeviceId`/`listByUserId`, but no current runtime path writes it. |
| `last_seen_at` | `timestamptz`, NOT NULL, default `now()` | Registration route writes the current server clock every time; PostgreSQL conflict update refreshes it. | NULL is a defect. It is the last registration/heartbeat observation, not a provider delivery timestamp. |
| `created_at` | `timestamptz`, NOT NULL, default `now()` | API record creation time or seed fixture. Conflict path intentionally retains the original DB creation time because it does not update `created_at`. | NULL is a defect; retaining the original timestamp on re-registration is intentional. |

**Device mapper/contract:** `DeviceRegistrationRecord` is in `backend/src/db/types.ts` (lines 277–287). PostgreSQL `devices.register()` inserts all nine columns and uses `ON CONFLICT (user_id, device_id)`; `getByDeviceId()` and `listByUserId()` map snake_case fields to camelCase and return only active rows (`postgres.ts` around lines 1415–1457). The memory repository stores by generated `id` and provides device-ID/user readers, but does not emulate PostgreSQL's unique constraint or conflict update semantics.

## 3. Writers and readers

### Profile writers

1. **Authenticated booking-intent finalization:** `backend/src/modules/booking-intents/booking-intent.service.ts` checks `trx.profiles.getById(actor.id)` and, only when absent, constructs a customer `ProfileRecord` from the intent payload plus actor email and calls `trx.profiles.upsert()` (around lines 148–160).
2. **Authenticated booking draft:** `backend/src/modules/bookings/booking.service.ts` checks `database.profiles.getById(owner.id)` and, only when absent, upserts a customer profile from booking name/phone/email (around lines 307–320). Existing profiles are not overwritten by later booking contact fields.
3. **Seed/migration support:** `backend/scripts/seed.ts` writes seed profiles with an upsert. `SEED_PROFILES` in `backend/src/db/seedData.ts` contains fixture admin/customer profiles; these are not evidence of current live rows beyond the live count query.
4. **Supabase direct owner policy:** `0016_comprehensive_rls_policies.sql` defines `profiles_owner_access` for the profile owner or service role. The application’s normal customer UI uses the backend API, not direct Supabase writes.

There is **no customer profile update form or dedicated profile PATCH route** in the inspected customer/admin source. Profile retrieval is the available customer-facing operation.

### Profile readers

- `GET /api/v1/me/profile` is registered by `backend/src/modules/bookings/booking.routes.ts`. Its controller requires authentication, reads `service.getOwnProfile(request.user.id)`, and returns `{fullName, phone, email}`; email falls back to `request.user.email` if the profile email is NULL (`booking.controller.ts` around lines 50–57).
- `react/src/services/customerAuthApi.ts` exposes `getMyProfile(accessToken)`. `react/src/features/booking/BookingPage.tsx` calls it after login to prefill name, email, and phone; on failure it falls back to auth metadata and asks the customer to enter details manually.
- Bookings, reviews, booking intents, and other tables reference profile IDs, but those are cross-domain consumers rather than additional profile writers.

### Device writers

- The sole application writer is `POST /api/v1/devices/register` in `backend/src/app.ts` (lines 308–370). Inline Zod validates `deviceId`, `platform`, `fcmToken`, optional `userId`, optional `bookingId`/`ticketId`, and optional `guestAccessToken`.
- For `userId`, the route requires authentication and matching user ID unless the caller is privileged (`super_admin`, `admin`, or `staff`).
- For `bookingId`/`ticketId`, it requires a real booking and proof of ownership (authenticated booking owner, privileged staff, or matching guest token), then stores the resolved booking UUID.
- The integration test in `backend/tests/integration/admin-catalog.test.ts` exercises an anonymous unscoped registration. The unit suite exercises anonymous, user ownership, booking ownership, guest token, and privileged-admin paths.
- `backend/scripts/seed.ts` can write a fixture device. `SEED_DEVICES` contains one fixture, but the live device table is empty; seed data is not assumed to have been run in production.

A repository-wide search found **no React customer, admin, native-device, notification, or push-client call site** invoking `/api/v1/devices/register`; the only non-source references are the backend route/tests/docs. Thus the endpoint is implemented, but the deployed web surfaces do not currently populate this table.

### Device readers

- PostgreSQL repository methods `getByDeviceId()` and `listByUserId()` exist, but no inspected runtime notification/controller/service call consumes them. They filter on `is_active=true`.
- The registration endpoint returns only `{success, deviceId}` and has no GET endpoint for device records.
- No token is sent to the customer UI or admin UI; this is appropriate for a secret push token but means the notification lifecycle is not proven end-to-end.

## 4. Foreign keys and cross-table lifecycle

- `profiles.id → auth.users.id`, `ON DELETE CASCADE`: deleting an auth identity deletes its profile. This is the identity root.
- `bookings.user_id → profiles.id`, `ON DELETE SET NULL` (from `0005_create_bookings.sql`): a booking can survive profile deletion as a historical/guest booking.
- `device_registrations.user_id → profiles.id`, `ON DELETE CASCADE`: account deletion removes account-scoped device registrations. The route permits `NULL` for anonymous devices.
- `device_registrations.booking_id → bookings.id`, `ON DELETE CASCADE`: deleting a booking removes booking-scoped registrations. A booking can be referenced without a user profile if a guest token was used.
- `customer_booking_intents.claimed_user_id → profiles.id`, `ON DELETE SET NULL`: intent claims can lose their profile reference while the intent remains.
- `reviews.customer_id → profiles.id`, `ON DELETE` behavior is the database-defined FK behavior captured in the live inventory; it is a downstream consumer of profile identity.

The direct device lifecycle is therefore:

1. Auth user exists (or a guest has a valid booking token).
2. Optional profile is created/synchronized only during authenticated booking flow.
3. Client calls device registration with a token and optional user/booking linkage.
4. Backend verifies linkage, writes active registration and `last_seen_at`.
5. Notification code would read active tokens, but no runtime consumer was found.
6. Auth or booking deletion cascades device rows for the associated FK.

## 5. Exact mismatches and findings

### F-01 — **Medium: PostgreSQL conflict path drops `booking_id` and `platform` updates** (confirmed defect)

**Evidence:** `backend/src/db/postgres.ts` lines 1419–1425 use:

```sql
ON CONFLICT (user_id, device_id)
DO UPDATE SET
  fcm_token = excluded.fcm_token,
  is_active = excluded.is_active,
  last_seen_at = excluded.last_seen_at
```

The route accepts and supplies `bookingId` and `platform` on every registration (`backend/src/app.ts` lines 356–366), but neither column is updated on conflict. If the same authenticated user/device registers for a new booking, or the platform value changes, the stored row retains the old booking/platform. The repository returns the newly submitted record rather than `RETURNING *`, so its returned `bookingId`/`platform` can disagree with the persisted row. The endpoint currently returns only `deviceId`, limiting immediate exposure, but a future reader or notification job would observe stale linkage.

**Fix:** define explicit conflict semantics. At minimum update `booking_id`, `platform`, and (if intended) `user_id` through a separate reassignment policy; use `RETURNING *` and map the persisted row. Add a regression test that registers the same `(user_id, device_id)` twice with a changed booking/platform and asserts the database result.

### F-02 — **Medium: anonymous registrations are not idempotent** (confirmed schema/repository defect)

**Evidence:** migration `0008` defines only `UNIQUE(user_id, device_id)`, while `user_id` is nullable. PostgreSQL permits multiple rows with `user_id IS NULL` under a normal unique constraint. The route explicitly allows an unscoped anonymous request (the passing test in `admin-catalog.test.ts`), and the PostgreSQL reader `getByDeviceId()` selects the first active row by `device_id` without an ordering or uniqueness guarantee.

Therefore repeated anonymous registrations for one physical device can create multiple active rows. This is especially likely because the frontend has no caller today, but any future caller retrying registration will hit it. The memory repository also stores every generated ID and does not model SQL conflict behavior, so memory tests cannot expose this production-only duplication.

**Fix:** decide the identity rule. If `device_id` is globally unique for anonymous registrations, add a partial unique index such as `UNIQUE(device_id) WHERE user_id IS NULL` and update the conflict/upsert logic accordingly. If a device may intentionally be shared, replace `getByDeviceId()` with an explicit deterministic selection and document the multi-token behavior; do not imply one active row.

### F-03 — **Medium: no deployed customer/admin writer or notification reader was found** (confirmed integration gap)

**Evidence:** the backend route and tests exist, but repository search found no React/admin/native call to `/api/v1/devices/register`, and no runtime consumer of `listByUserId()` or `getByDeviceId()`. Live Supabase reports zero device rows. This is not a live data corruption finding: the zero count is consistent with an uncalled endpoint. It is a product lifecycle gap if push notifications are expected to work.

**Fix:** either explicitly de-scope device push registration for the current web product, or add a bounded client integration (token permission acquisition, secure API call after auth/booking, token refresh/deactivation handling) and a notification service reader. Keep token values out of UI responses/logs. Add observability for registration success/failure without logging token contents.

### F-04 — **Low: blank-token/device validation is weaker than the intended non-empty contract** (confirmed hardening gap; no current-row impact)

**Evidence:** the route uses `z.string().min(1)` for `deviceId` and `fcmToken`, which accepts whitespace-only strings. The database has `NOT NULL` but no `CHECK (btrim(...) <> '')`. The current device table is empty, so no bad live row was observed.

**Fix:** trim before validation or use a non-blank refinement; add database checks if direct/service-role writers must be protected. Keep the length and platform checks aligned.

### Profile alignment conclusion — no current profile data defect confirmed

The profile schema, mapper, upsert SQL, service models, customer API response, and customer prefill reader are aligned for the inspected fields. Current live counts show two profiles with no NULL/empty required fields and no NULL email. One lifecycle limitation remains an explicit product decision rather than a proven schema defect: existing profiles are only read during booking creation and are not updated from later booking contact changes because there is no profile update workflow. If profile data is intended to be editable/source-of-truth, add a separate authenticated update contract and test uniqueness/conflict handling; otherwise document profile creation as a first-booking snapshot.

## 6. Bounded lifecycle test and read-only boundary

The audit did not run any test against live Supabase. The bounded test used only the in-memory repository through `createTestApp()` and ran:

```text
npm test -- --run tests/unit/device-registration-auth.test.ts
```

Result: **1 test file, 9 tests passed**. Covered behaviors include:

- anonymous unscoped device registration;
- unauthenticated user-link rejection;
- cross-user rejection;
- own-user and admin user-link acceptance;
- missing-booking rejection;
- booking-link rejection without proof;
- valid guest-token registration by booking ID or ticket ID;
- privileged-admin booking registration.

This is safe because `backend/tests/helpers.ts` sets `NODE_ENV=test`, `ALLOW_TEST_AUTH=true`, and constructs `createMemoryRepositories()`. It does not open a production database connection. The existing tests are not sufficient for F-01/F-02: they should be extended in memory for route-level semantics and separately run against an ephemeral disposable PostgreSQL/Supabase branch if exact SQL conflict/null-unique behavior must be verified. No production mutation is justified for this audit.

A safe future test sequence is:

1. Create an isolated in-memory/ephemeral booking and authenticated test actor.
2. Register a device with user + booking; assert active record and verified booking ID.
3. Re-register the same user/device with a changed booking/platform; assert the chosen conflict semantics and persisted return value.
4. Register the same anonymous device twice; assert the chosen idempotency policy (one row or explicitly documented multi-row behavior).
5. Verify invalid user/booking/token combinations remain 401/403/404.
6. Exercise `getByDeviceId()`/`listByUserId()` only in the isolated repository.
7. Dispose of the test fixture; do not replay a webhook, run a migration, delete production rows, or send a real push notification.

## 7. Recommended fix order

1. **Resolve F-01 first:** make the device conflict update contract explicit, update all intended mutable linkage columns, and return the persisted row.
2. **Resolve F-02:** add anonymous-device uniqueness or explicitly redesign the reader for multi-row anonymous devices; add a migration only after the rule is approved and duplicate cleanup is planned for a disposable/live-reviewed operation.
3. **Close or document F-03:** implement the missing client writer and token-consuming notification reader, or state that device registrations are reserved for a future/native client and should remain empty on the current web deployment.
4. **Harden F-04:** reject blank/whitespace identifiers and tokens at both API and database boundaries where direct writers exist.
5. **Decide profile freshness:** either document first-booking snapshot semantics or add a dedicated authenticated profile update route/form, including uniqueness-conflict and auth.users synchronization rules.
6. Keep existing RLS posture: both tables are enabled for RLS; service-role-all and profile-owner policies are in `0016`. Do not change RLS or apply a migration as part of this audit.
