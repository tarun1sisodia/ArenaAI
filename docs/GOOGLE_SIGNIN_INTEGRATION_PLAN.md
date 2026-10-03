# ArenaAI Google sign-in integration plan — execution runbook

## Product behavior to implement

- Customers browse routes, packages, fleet, and fares without an account.
- After they complete the booking form and click **Authorize & Pay**, require Google authentication **before finalizing the booking and before starting any payment checkout/order**.
- Use one **Continue with Google** action for both first-time and returning identities. First successful sign-in creates an ArenaAI user in Supabase Auth; later sign-ins with the same Google identity use that same Supabase user. If an accepted Supabase session already exists, skip the OAuth redirect and continue.
- Preserve the entire route/package/fleet choice and booking form through the OAuth redirect. After a successful login, finalize the booking under the verified Supabase user ID, then continue to the existing payment hand-off without asking for the same form details again.
- Google cancellation/failure returns the customer to the preserved form and never starts payment. If Google completes but the app callback/network fails, Supabase may already have created the Auth user; retrying Google should recover that same identity. In either case, no payment starts until booking finalization succeeds and the payment step is explicitly reached.
- A dismissible home banner may invite customers to sign in early. It does not block browsing and does not start OAuth automatically. The mandatory gate remains at **Authorize & Pay**.
- An authenticated user sees their account in the navigation and can open **My Bookings**. Pending, prepaid, cancelled, and historical bookings are loaded from the ArenaAI API, not from browser storage.
- **Scope boundary:** this runbook implements identity, booking ownership, account history, and the authorization gate only. It does not redesign Razorpay orders, webhooks, refunds, or payment retry semantics; those remain a separate follow-up plan.

## Current implementation map

- Customer booking submit: `react/src/features/booking/BookingPage.tsx`; now creates a short-lived intent, gates finalization on Google auth, and hands off to `/payment/resume/` after owner-bound finalization.
- Customer app shell/path dispatch: `react/src/app/App.tsx`.
- Static/server render dispatcher: `react/src/app/ServerApp.tsx`.
- Static route generation: `react/scripts/prerender.ts` (`routesToRender`, SEO/noindex handling) and sitemap generation.
- Main browser mount: `react/src/main.tsx`.
- Navigation: `react/src/components/chrome/Header.tsx`, `react/src/components/chrome/MobileNavSheet.tsx`, composed through `react/src/layouts/SiteLayout.tsx`.
- Home banner placement: `react/src/pages/HomePage.tsx`.
- Customer API transport and API base URL: `react/src/services/api.ts`; `react/src/config.ts` is business/site configuration, not the API URL helper.
- Backend assembly and shared auth hook: `backend/src/app.ts`; it assigns `request.user` from `authenticateRequest()` and currently permits anonymous requests when no Authorization header is present.
- Backend Supabase JWT verification: `backend/src/middlewares/authGuard.ts` (validates signature/issuer and maps `sub` to `request.user.id`; it trusts `app_metadata.role`).
- Booking routes/controller/schema/service: `backend/src/modules/bookings/booking.routes.ts`, `booking.controller.ts`, `booking.schema.ts`, `booking.service.ts`.
- Booking persistence: `backend/src/types/domain.ts`, `backend/src/db/types.ts`, `backend/src/db/postgres.ts`, `backend/src/db/memory.ts`.
- Existing migrations: `backend/migrations/0003_create_profiles.sql` and `0005_create_bookings.sql`; current next migration number is 0022 (latest listed is `0021_create_rental_enquiries.sql`). Never edit a migration already applied to staging/production; add a forward migration.
- New customer auth and recovery routes: `react/src/auth/customerAuth.tsx`, `react/src/pages/AuthCallbackPage.tsx`, `MyBookingsPage.tsx`, and `PaymentResumePage.tsx`.
- Backend pre-auth intent module: `backend/src/modules/booking-intents/`; it has no payment-provider call. New account ownership and `/api/v1/me/bookings` are implemented but still require applying migration 0022 before staging deployment.
- `profiles.id` references `auth.users(id)`, but profile `phone` is `NOT NULL UNIQUE`. Google does not provide a booking phone. Upsert a profile only once the booking form supplies phone/name; decide whether customer profiles should permit shared family phone numbers before production.
- `backend/src/app.ts` CORS `allowedHeaders` includes `X-Booking-Intent-Secret`; the staging Cloudflare customer/admin origins were added to `backend/.env.example` and must be set in Render.
- Root scripts include `npm run customer:typecheck`, `npm run customer:build`, `npm run backend:typecheck`, `npm run backend:test`, and `npm run build:all`. Backend uses Vitest; customer React does not currently have a component-test runner.

## Target request sequence

1. Customer fills the booking form and presses **Authorize & Pay**.
2. Customer app validates the form and calls `POST /api/v1/booking-intents` with an idempotency key and the form/selection (no fare or distance).
3. Backend stores a short-lived, non-payable intent and returns an opaque ID plus one-time resume secret. The secret is not a URL parameter.
4. If the customer has no valid Supabase session, call Supabase Google OAuth with fixed callback `/auth/callback`; if already signed in, skip this redirect.
5. Callback restores the intent secret from same-tab `sessionStorage`, validates the Supabase session, then calls `POST /api/v1/booking-intents/:intentId/finalize` with `Authorization: Bearer <Supabase access token>` and the resume secret in a header.
6. Backend verifies the token, derives the owner from JWT `sub`, upserts the profile from verified identity plus booking form details, recalculates fare, and creates one user-owned booking idempotently.
7. Customer app continues into the existing payment launch only after finalize succeeds and any changed fare is accepted. **No booking intent endpoint creates a Razorpay order.**
8. The user sees the booking in **My Bookings**. The existing payment recovery design governs later pending/paid/failed payment states.

## Phase 0 — preflight, decisions, and local baseline

**Goal:** establish what will be built and keep it isolated from payment redesign.

**Do:**

1. Create a feature branch, e.g. `feat/customer-google-signin`, from the current staging-ready revision.
2. Confirm and record (in deployment notes, not this public repository file) the Google Cloud project, Supabase staging project, production Supabase project, canonical customer domain, Cloudflare Pages project, Render API, local Vite port, and staging Worker origin.
3. Lock these behavior choices:
   - Sign-in mandatory only when continuing from completed form to **Authorize & Pay**.
   - Home prompt optional/dismissible; header sign-in remains available.
   - Supabase Auth UUID is the owner key; never use email/phone as the account primary key.
   - Pre-auth intent lifetime: 15 minutes in the current implementation; expired intents are rejected by the API.
   - An intent is not a booking hold, confirmed booking, or payment.
   - Existing guest bookings remain recoverable through valid legacy guest proof; new customer checkouts become account-owned.
4. Review consumers of `profiles.phone UNIQUE` in `admin/` and `backend/`. Recommended policy: phone is contact data, not identity. If family/shared numbers must work, add a forward migration that removes the profile-wide uniqueness rule (or introduces a separately verified-phone table); do not merge accounts on phone collision.
5. Verify the expected customer URLs. Repository site config lists `https://agraskbagheltourandtravels.com`; staging URL supplied by the user is `https://skbagheltravels-customer.coccoder999.workers.dev`. Confirm the actual canonical production origin before OAuth configuration.
6. Run baseline checks before editing:
   ```bash
   npm run customer:typecheck
   npm run backend:typecheck
   npm run backend:test
   ```

**Exit gate:** a baseline is recorded; test/live projects and allowed origins are unambiguous; no Razorpay implementation changes are included in this branch.

## Phase 1 — configure Google OAuth and Supabase redirects

### Google Cloud Console

1. Open Google Auth Platform → Clients → create a **Web application** OAuth client.
2. Under **Authorized JavaScript origins**, add exact origins:
   - Local Vite: `http://localhost:5173` (confirm actual port).
   - Staging customer: `https://skbagheltravels-customer.coccoder999.workers.dev`.
   - Production customer: the confirmed canonical production origin.
3. Under **Authorized redirect URIs**, add the exact Supabase Auth callback shown in the Supabase Google provider screen (hosted project pattern: `https://<project-ref>.supabase.co/auth/v1/callback`). Google’s redirect is to Supabase, not directly to the customer SPA.
4. If the OAuth consent screen is in Testing mode, add the intended Google tester accounts. Test with one new identity and one returning identity.

### Supabase Dashboard — do this once per Supabase environment

1. Authentication → Providers / Sign In → Google: enable Google, enter the Google OAuth Client ID and Client Secret.
2. Authentication → URL Configuration: set Site URL and an exact redirect allow-list for:
   - `http://localhost:5173/auth/callback/`
   - `https://skbagheltravels-customer.coccoder999.workers.dev/auth/callback/`
   - the confirmed production callback.
3. Prefer separate staging and production Supabase projects. If the project is shared, document how test identities and bookings are separated.
4. Keep the Google Client Secret in Supabase provider settings. Do not put it in Cloudflare variables or the repository.

### Deployment variables/CORS

- Customer React build (local `.env`, Cloudflare staging, Cloudflare production): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` or current publishable-key equivalent, and existing `VITE_API_BASE_URL`.
- Backend: existing `SUPABASE_URL` and JWT verification configuration; `SUPABASE_SERVICE_ROLE_KEY` remains server-only.
- Render `CORS_ORIGINS`: exact customer origins for local/staging/production; no wildcard.
- In `backend/src/app.ts`, append `X-Booking-Intent-Secret` to CORS `allowedHeaders` if the API uses this header.
- Never expose Google secret, Supabase service-role key, database password, or Razorpay secret with a `VITE_` prefix.

**How to verify:** before application work, confirm Google → Supabase → app callback works for the allowed local/staging origins and that an unlisted redirect is rejected. OAuth uses PKCE and exact redirects; Supabase documents the Google callback and app allow-list separately. [1] [3] [7]

**Exit gate:** configuration works in a non-production Supabase project, secrets are stored only in trusted environments, and unauthorized redirect URLs fail.

## Phase 2 — add the customer Supabase client and session provider

**Files/commands:**

1. Install the client from repo root:
   ```bash
   npm --prefix react install @supabase/supabase-js
   ```
   Commit `react/package.json` and the lockfile generated inside `react/`.
2. Create `react/src/lib/supabase.ts`:
   - Instantiate exactly one browser client from `VITE_SUPABASE_URL` and the public key.
   - Configure PKCE and URL code detection/exchange as required by the installed Supabase JS version.
   - Fail with a clear safe UI message if public configuration is absent; never substitute backend admin credentials.
3. Create `react/src/auth/AuthProvider.tsx` and `react/src/auth/useAuth.ts`:
   - Expose `session`, `user`, `accessToken`, `loading`, `signInWithGoogle`, and `signOut`.
   - Initialize session once and subscribe/unsubscribe to `onAuthStateChange`.
   - Treat session refresh as automatic when refresh credentials are still valid; if refresh/backend verification fails, preserve booking intent and send the customer through Google again.
   - Never use name/avatar/email to authorize API access.
4. In `react/src/main.tsx`, wrap the browser app with the provider. Check `react/src/app/ServerApp.tsx` and prerender first: the provider must not access `window` during static rendering. Use a safe signed-out/loading context for server rendering so shared `Header` code cannot crash or produce a hydration mismatch.
5. Implement `signInWithGoogle` with one Supabase call: provider `
google", options: { redirectTo: `${window.location.origin}/auth/callback` }`. Carry only an internal, allow-listed resume destination; never accept arbitrary external `next` URLs.
6. In the provider, render the same neutral loading state on the server and first browser render. Do not flash signed-out UI during session initialization.

**Exit gate:** the client can establish, refresh, observe, and sign out a Supabase session; the server-rendered app remains safe and does not depend on browser globals.

## Phase 3 — add auth/callback routes, static HTML, and account navigation

Because this site uses both a hand-written SPA path dispatcher and static pre-rendering, adding a React page alone is insufficient.

**Files to update:**

1. Add `react/src/pages/AuthCallbackPage.tsx` (or `react/src/auth/AuthCallbackPage.tsx`). It must show progress, exchange/observe the PKCE callback once, handle provider `error`/cancel states, resume a valid stored intent, and offer retry/edit actions. Never print OAuth code, bearer token, or resume secret.
2. Add `react/src/pages/MyBookingsPage.tsx`. It should require a verified session, load the account-scoped API list, show loading/empty/error states, and provide a sign-in retry if the session expired. It renders payment status from the backend only.
3. Update `react/src/app/App.tsx` to recognize `/auth/callback`, `/auth/callback/`, `/my-bookings`, and `/my-bookings/` before generic marketing/404 handling. Mark them noindex. Add a title/description that contains no private data.
4. Update `react/src/app/ServerApp.tsx` with the same paths. During pre-render it must render only a neutral callback/account shell; no session, email, booking data, or customer PII is available at build time.
5. Update `react/scripts/prerender.ts`:
   - Add `/auth/callback/` and `/my-bookings/` to `routesToRender`, so direct Cloudflare Pages requests resolve to generated `index.html` files.
   - Treat both as private/noindex routes in generated robots metadata and SEO guard logic.
   - Ensure `react/scripts/generate-sitemap.ts` never places either URL in the public sitemap.
6. Update `react/src/components/chrome/Header.tsx` and `MobileNavSheet.tsx`: signed-out **Sign in**; signed-in account chip/menu, **My Bookings**, and **Sign out**. Preserve keyboard access, focus behavior, and the existing mobile drawer flow. Since `SiteLayout.tsx` composes the header, no separate shell is needed unless the provider placement requires it.
7. Add a compact optional prompt such as `react/src/components/auth/SignInPrompt.tsx` to `react/src/pages/HomePage.tsx`. Let the customer dismiss it; persist only a non-sensitive dismissal timestamp (recommended 30 days) in local storage. Do not hide the persistent header Sign in action.
8. Search for consumers of `appRoutes` in `react/src/app/routes.tsx`; update it only if the route registry is used by prerender/navigation tools. The required direct-page support is the `App.tsx` + `ServerApp.tsx` + prerender route manifest.

**Exit gate:** direct navigation and refresh work on local Vite and Cloudflare-style static output; private pages are noindex and absent from sitemap; no private data is present in generated HTML.

## Phase 4 — create the pre-auth booking-intent API and persistence

The intent preserves the form but is not a booking. It must never cause an order, payment, or reservation.

### Migration and repository

1. Add `backend/migrations/0022_create_customer_booking_intents.sql` (or the next unused number if the branch has a newer migration). Do not rewrite migrations already applied to a shared DB.
2. Create `booking_intents` with, at minimum:
   - `id uuid primary key`;
   - `resume_secret_hash` (store only a hash of a high-entropy random secret);
   - `idempotency_key` unique;
   - sanitized booking-form `payload jsonb` (PII, backend-only);
   - `created_at`, `expires_at`, `consumed_at`;
   - nullable `claimed_user_id` referencing the app profile after claim;
   - nullable `booking_id` referencing `bookings` after finalization.
3. Add indexes for `expires_at`, unique `idempotency_key`, and any lookup needed by finalization. Add an index on `bookings(user_id, created_at desc)` in this or the ownership migration.
4. Add `BookingIntentRecord` in `backend/src/types/domain.ts`; repository methods in `backend/src/db/types.ts`, `backend/src/db/postgres.ts`, and `backend/src/db/memory.ts` (create/get/claim/expire). Memory and PostgreSQL implementations must share tests and semantics.
5. Add a cleanup mechanism for expired, unconsumed intents. A periodic cleanup is operationally useful but not a prerequisite for correctness: every API request must reject an expired intent even if cleanup has not run. Current API TTL is 15 minutes; no cleanup job is installed yet.

### New backend module and exact API contract

Create `backend/src/modules/booking-intents/booking-intent.schema.ts`, `booking-intent.service.ts`, `booking-intent.controller.ts`, and `booking-intent.routes.ts`; register routes in `backend/src/app.ts`.

**Create intent:**

```http
POST /api/v1/booking-intents
Content-Type: application/json
```

Request carries the same validated trip/package/fleet/pickup/customer fields needed by the existing draft schema plus an idempotency key. Reject client-supplied total price, advance, distance, fare breakdown, `userId`, or role. Rate-limit this public endpoint. Return only:

```json
{ "data": { "intentId": "…", "resumeSecret": "…", "expiresAt": "…" } }
```

The resume secret is returned once; frontend stores it only in same-tab `sessionStorage`, never in a URL, analytics, logs, or local storage. Backend stores a cryptographic hash, not the raw secret.

**Finalize intent:**

```http
POST /api/v1/booking-intents/:intentId/finalize
Authorization: Bearer <Supabase access token>
X-Booking-Intent-Secret: <one-time secret>
Content-Type: application/json
```

1. Require `request.user` from verified Supabase JWT; validate issuer, signature, expiry and expected audience (`authenticated`) in `backend/src/middlewares/authGuard.ts`.
2. Compare secret hash safely; verify not expired, not consumed, and the intent has not been claimed by a different user.
3. In a single transaction, upsert a customer profile using the verified Auth UUID plus form-supplied name/phone; recalculate fare with the backend fare engine; create one booking with `user_id=request.user.id`; mark the intent consumed and attach the booking ID.
4. Return the same booking for a repeated finalize with the same intent/user. A different user/secret receives a generic authorization error.
5. If server-side fare changed from the displayed quote, return a structured `FARE_RECONFIRMATION_REQUIRED` response with the new server fare, create no payable checkout yet, and require explicit customer acceptance before finalization proceeds.
6. Add `X-Booking-Intent-Secret` to `backend/src/app.ts` CORS `allowedHeaders` and to Render preflight verification. Do not put the secret in query strings.

**Phone policy task:** current profile phone is `NOT NULL UNIQUE`. Review admin and backend uses. If shared family numbers are supported, drop profile-wide phone uniqueness using a forward migration or put uniqueness only on a verified phone identity table. On conflict, never link an account by phone; return a clear retry/contact-support result. Preserve the owner UUID as the only account key.

**Exit gate:** intent creation is non-payable; no auth means finalize fails; a valid token+secret creates one owner-bound booking; retry is idempotent; wrong user, wrong secret, expiry, tampering, and fare-change cases all fail safely.

## Phase 5 — enforce account ownership and implement My Bookings APIs

### Ownership plumbing

1. `backend/src/app.ts`: keep public fare/catalog endpoints anonymous; new finalize and `/me` routes explicitly require a user. The global hook may still assign `request.user` optionally as it does today.
2. `backend/src/modules/bookings/booking.controller.ts` and `booking.service.ts`: ensure new finalized bookings set `userId` to the verified `request.user.id`, not a request-body value. The current hard-coded `null` must not remain for authenticated bookings.
3. Extend `BookingListFilter` in `backend/src/db/types.ts` with `userId?: string`; add parameterized `user_id=$n` to both count and item queries in `backend/src/db/postgres.ts`; add the same in-memory filter in `backend/src/db/memory.ts`.
4. Add owner-only routes:
   - `GET /api/v1/me/bookings?page=1&pageSize=20` (bounded page size; owner derived only from JWT).
   - `GET /api/v1/me/bookings/:bookingId` (owner-only).
   Implement in the current booking module or a clearly named `customer` submodule. Never accept `userId` from URL/body/query.
5. Return minimum customer-safe data: ticket/booking ID, trip summary, pickup date, fleet, fare snapshot, booking status, payment status/updated timestamp, and permitted action flags. Do not return guest secret, provider keys, webhook data, or other users’ PII.
6. Update payment status authorization so an authenticated owner can read their payment state. This is an access-control change, not a Razorpay redesign.
7. At the production cutover, protect new booking/checkouts server-side. Do not rely only on a hidden/disabled frontend button. Add an explicit backend rollout flag if needed (for example `CUSTOMER_AUTH_REQUIRED_FOR_NEW_BOOKINGS`) and turn it on only when the new customer bundle is deployed. Existing guest records remain accessible through their existing valid guest proof; do not let a guest token create new accountless payable bookings after cutover.
8. Review the existing phone/time duplicate-booking heuristic in `backend/src/modules/bookings/booking.service.ts`. Intent idempotency is the primary duplicate control. Phone matching may warn/review a likely duplicate but must not establish ownership or silently merge separate Google accounts.

### Customer API

In `react/src/services/api.ts` or a new `react/src/services/customer-auth-api.ts`, add typed functions:

- `createBookingIntent(payload, idempotencyKey)`;
- `finalizeBookingIntent(intentId, resumeSecret, accessToken)`;
- `listMyBookings(accessToken, page, pageSize)`;
- `getMyBooking(accessToken, bookingId)`.

Use `Authorization: Bearer ...` and `X-Booking-Intent-Secret`; use the existing `getApiBaseUrl()` and shared error-envelope handling. Never cache the bearer token in app-specific storage.

**Exit gate:** user A cannot list/get user B’s booking or payment state, body/query owner spoofing is rejected, legacy guest proof remains scoped, and backend refuses a newly created anonymous checkout after the rollout gate is enabled.

## Phase 6 — change `BookingPage` to pause for OAuth, then resume once

**Exact file:** `react/src/features/booking/BookingPage.tsx`, `handleSubmitBooking` around lines 681–821. Keep existing fare calculation and form validation; replace the current direct draft→checkout sequence.

Implement this ordered state machine:

1. `editing` → validate required form fields and wait for server fare calculation to be ready.
2. On first **Authorize & Pay**, create one intent using a stable idempotency key. While request is pending, disable the button and show progress.
3. Save `{ intentId, resumeSecret, createdAt }` in namespaced `sessionStorage`, scoped to the active tab. Never save access/refresh token, card/payment data, or the raw secret in a URL.
4. If session is absent/expired, invoke Supabase Google OAuth and return immediately. Do not call draft finalization, `createPaymentCheckout`, or Razorpay adapter before the redirect.
5. `/auth/callback` checks state/error, restores the intent, verifies session, and calls finalize. If OAuth was cancelled, return to booking with fields intact; show **Continue with Google**, **Edit booking**, and a clear no-payment message.
6. If already authenticated, skip OAuth and finalize directly after the backend verifies session/ownership.
7. On successful finalize, clear the resume secret from session storage, retain only safe booking navigation state, and continue into the **existing** payment flow. Use only the backend-returned booking/fare values.
8. If finalize times out, retry with the same intent/idempotency key; backend returns the same booking. If the intent expired or tab storage is missing, ask the user to review/submit the still-visible form again; never guess which booking to attach.
9. If the signed-in account differs from an already claimed intent, stop and offer “Continue with the original account” or discard/restart. Never transfer the intent between users automatically.
10. If token refresh fails on a later visit, reauthenticate and reload My Bookings from the backend. If a user opens a copied `/my-bookings` URL in a new browser without a session, show Google sign-in; do not expose booking details until auth passes.

Suggested UI status labels: **Preparing your booking**, **Continue with Google**, **Returning to your booking**, **Booking saved — opening payment**, **Sign-in cancelled — no payment was started**, **This form expired — please review and submit again**.

**Exit gate:** no checkout method is called before valid auth and successful server-side finalize; a network retry creates exactly one booking; returning to same tab restores the form/intent safely.

## Phase 7 — test locally before touching staging or Razorpay

### Backend automated tests

- Add `backend/tests/unit/booking-intent.service.test.ts` for hashing, expiry, secret mismatch, claim once, duplicate finalize/idempotency, changed fare, and cleanup.
- Add `backend/tests/integration/customer-booking-auth.test.ts` or extend `backend/tests/integration/booking-flow-f3.test.ts` using `createTestApp` and `backend/tests/helpers.ts`.
- Verify anonymous create-intent succeeds but anonymous finalize fails; a valid customer JWT can finalize; customer A cannot read customer B; request-body `userId` is ignored/rejected; expired/invalid JWT fails; legacy guest lookup works only with the existing token; a mocked payment-provider create-order method is not called before auth+finalize.
- Keep test-only JWT bypass configuration confined to test harness/local test env; never set it in Render.

### Customer UI tests

Add a frontend runner compatible with the current React/Vite setup, recommended:

```bash
npm --prefix react install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Configure a customer-only Vitest environment in `react/vite.config.ts` or a separate test config and add `test` script in `react/package.json`. Create `react/src/auth/__tests__/auth-flow.test.tsx` and tests for: signed-in bypass; first/returning Google; callback success; OAuth cancel; initial session loading; revoked/expired session; page refresh; lost intent; duplicate click; wrong account; and **assert payment helper has not been called before finalize succeeds**. Add header/mobile menu and dismissible banner tests.

### Local commands and manual path

From repository root run:

```bash
npm run backend:typecheck
npm run backend:test
npm run customer:typecheck
npm run customer:build
npm run build:all
```

For a manual local OAuth run, use separate terminals:

```bash
npm run backend:dev
npm run customer:dev
```

Confirm Vite’s actual URL/port; check backend health/readiness; use a non-production Supabase project and Google test identity. Test sign-in, return, cancel, reload, sign-out, session refresh, intent expiry, and My Bookings. Stop before any live Razorpay transaction. Use mocked payment handoff or verify that the payment helper was never invoked.

**Exit gate:** all commands pass; no secrets in the frontend build output; all auth/recovery state tests pass; no real payment was made.

## Phase 8 — deploy and verify staging

1. Deploy the backend migration and additive API routes to staging Render first. Run the repository’s migration command against the staging database; verify `booking_intents`, indexes, and `bookings(user_id, created_at)` exist. Check `/health` and `/ready`.
2. Set staging Render `CORS_ORIGINS` to the exact customer Worker and required admin/local origins. Confirm OPTIONS permits `Authorization`, `Content-Type`, and `X-Booking-Intent-Secret`.
3. Set staging customer Cloudflare build variables: staging Supabase URL/public key and staging API base URL. Build/deploy the customer bundle; inspect generated JS for absence of service role, Google client secret, DB, and Razorpay secret values.
4. Confirm `/auth/callback/` and `/my-bookings/` serve the generated static pages on direct navigation and refresh. Confirm both are noindex and absent from sitemap.
5. Exercise Google → Supabase → Cloudflare callback in one browser tab for new account, returning account, existing session, cancelled consent, wrong account, callback refresh, and expired intent.
6. Submit a representative route/package/fleet form. Confirm the values return after OAuth, exactly one account-owned booking appears under My Bookings, and no payment checkout/order is started until finalize returns success.
7. Verify owner isolation with two separate test identities; inspect logs for callback errors, issuer/audience errors, CORS failures, duplicate finalization, intent expiry, and phone conflicts. Do not log PII, tokens, OAuth codes, or intent secrets.
8. Verify logout clears the local session view and that a direct My Bookings visit asks for Google again without showing data.

**Exit gate:** staging passes the automated suite and manual checklist; the new auth path works end-to-end through hosting; payment stays untouched.

## Phase 9 — production cutover, rollback, and monitoring

1. Configure only the confirmed production origin in production Supabase/Google allow-lists unless local/staging access is deliberately needed. Use the production Supabase project and production Cloudflare variables; do not reuse staging project keys.
2. Deploy additive backend schema/API support first. Confirm backups/migration rollback procedure and Render `/ready` before customer cutover.
3. Deploy the new Cloudflare customer bundle. Then enable backend enforcement for new customer bookings/checkouts. Existing pre-cutover guest bookings remain retrievable with valid guest proof; anonymous clients cannot create new payable bookings after the gate is on.
4. Perform auth-only production smoke tests with a controlled account and do not create a live payment as part of this auth release. Razorpay production testing starts only under its own approved plan.
5. Monitor auth completion/cancel, callback error, JWT rejection, intent expiry, repeated finalize, profile conflict, owner-query denial, API CORS, and account support contacts. Rollback can disable the banner/gate or restore the prior static bundle, but **must not** reopen unauthenticated payment if that would bypass server ownership enforcement.
6. Update the privacy notice and sign-in copy before broad release: Google is used for identity; ArenaAI requests no Gmail/Drive permissions; first successful Google sign-in creates an ArenaAI account; creating an account is not a payment.

**Exit gate before starting the Razorpay workstream:** account ownership, pending-booking history, OAuth recovery, server-side authentication gate, and production/staging redirect isolation are verified. Then implement the separate Razorpay test/live plan.

## Acceptance checklist

- [ ] New Google identity creates one Supabase user; returning identity signs into that same user.
- [ ] Existing session skips the redirect; session refresh works or cleanly returns the user to Google.
- [ ] Route/package/fleet and form details survive Google and callback navigation.
- [ ] Cancelled/failed OAuth never finalizes a new booking or launches payment.
- [ ] Successful auth but lost callback can be retried; it may leave an Auth user, but never an unintended payment.
- [ ] Booking `user_id` equals verified Supabase `sub`; client-supplied owner IDs are not trusted.
- [ ] Intent secret is one-time, hashed server-side, not in URL/storage/logs beyond same-tab session storage; intent expiry is enforced.
- [ ] Duplicate callback/network retry returns the same booking, not a duplicate.
- [ ] My Bookings/payment state is owner-scoped; a second account cannot view or claim it.
- [ ] Legacy guest records remain accessible only through valid legacy proof; email/phone alone is not proof of ownership.
- [ ] Phone uniqueness/shared-number behavior is explicitly tested and cannot merge accounts.
- [ ] New checkout is rejected server-side without account ownership after cutover.
- [ ] `/auth/callback/` and `/my-bookings/` direct-load and refresh on Cloudflare; noindex; omitted from sitemap.
- [ ] Local, staging, and production Google/Supabase callback allow-lists and CORS are exact.
- [ ] No service-role key, OAuth secret, bearer token, intent secret, database credential, or Razorpay secret is included in client bundle/logs.
- [ ] Payment creation occurs only after auth and server-side booking finalization; Razorpay verification remains a separate workstream.

## Official references

[1]: https://supabase.com/docs/guides/auth/social-login/auth-google "Supabase: Sign in with Google"
[2]: https://supabase.com/docs/reference/javascript/auth-signinwithoauth "Supabase JavaScript: signInWithOAuth"
[3]: https://supabase.com/docs/guides/auth/sessions/pkce-flow "Supabase: PKCE flow"
[4]: https://supabase.com/docs/guides/auth/jwts "Supabase: JSON Web Tokens"
[5]: https://supabase.com/docs/guides/auth/auth-identity-linking "Supabase: Identity Linking"
[6]: https://developers.google.com/identity/openid-connect/openid-connect "Google: OpenID Connect"
[7]: https://www.rfc-editor.org/rfc/rfc9700.html "RFC 9700: Best Current Practice for OAuth 2.0 Security"


## Execution status — 2026-10-03

### Implemented in the local feature branch

- Customer Supabase Auth client uses Google OAuth + PKCE, automatic session refresh, same-identity first-time/returning sign-in, safe internal return paths, and a shared customer auth context.
- The optional home sign-in prompt is dismissible; the mandatory sign-in gate remains after the booking form and before a booking is finalized or payment checkout starts.
- Booking form data is held in a short-lived backend intent; the browser stores only the opaque intent ID and one-time continuation secret in same-tab `sessionStorage`. The backend stores only the secret hash, expires intents after 15 minutes, rate-limits the public intent endpoints, recalculates the fare, and creates the owner-bound booking only after verified sign-in.
- Fare changes persist a `fare_reconfirmation_pending` flag. A callback or network retry cannot silently accept an updated fare; the UI presents both the updated total and advance and requires explicit acceptance.
- Customer callback, account header/mobile entry points, **My Bookings**, owner-only booking list/detail/payment status, and a payment-resume route are implemented. Existing Razorpay order/webhook semantics were not redesigned.
- Migration `0022_create_customer_booking_intents.sql` creates the durable intent store and owner-history index. It has **not** been applied to any remote database.
- The backend rollout switch is `CUSTOMER_AUTH_REQUIRED_FOR_NEW_BOOKINGS`. It is `false` by default in `backend/.env.example`; enable it in staging only after the new customer bundle is deployed and verified.

### Checks run

- `npm test`: **23 test files, 142 tests passed** (the CI target excludes the two external database-connection/index tests).
- `npm run backend:typecheck`: passed.
- `npm run customer:typecheck`: passed.
- `npm run customer:build`: passed; 52 static pages and 14 redirects generated. The local build emitted a non-fatal warning because `CATALOG_API_URL` / `VITE_API_BASE_URL` were not set in that build environment.
- Targeted ESLint for changed backend files: passed.
- Local browser inspection reached the guest-details/review step and showed the Google-before-payment disclosure and server fare. No booking form was submitted, no real Google OAuth session was created, and no Razorpay order/payment was opened.

### Still pending — do not skip these gates

1. This work is local to `feat/customer-google-signin`; it has **not** been deployed to staging. Do not turn on the staging auth-required flag until the matching customer bundle and backend are both deployed.
2. Before deploying, confirm the staging Render service is targeting the staging `DATABASE_URL`. `render.yaml` configures `preDeployCommand: node dist/db/migrate.js`; confirm the staging service uses this migration command and the staging database, not production, before its first deploy of migration 0022.
3. Set only the customer-safe Cloudflare build values: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or the supported `VITE_SUPABASE_ANON_KEY` alias), and the staging `VITE_API_BASE_URL`. Keep Google Client Secret, Supabase service-role key, database credentials, and Razorpay secrets out of the frontend.
4. In staging Supabase URL Configuration, allow the exact `/auth/callback/` URLs for localhost and the staging customer Worker; keep Google’s authorized redirect URI pointed at the Supabase Auth callback. Confirm the Google provider is enabled on the staging Supabase project.
5. Deploy backend/API and migration to staging first while the rollout switch remains false; deploy the customer bundle; complete new-user, returning-user, cancel, reload, expiry, owner-isolation, and booking-history checks. Then set `CUSTOMER_AUTH_REQUIRED_FOR_NEW_BOOKINGS=true` on staging and re-test the legacy direct-draft rejection plus the new intent flow.
6. Use only Razorpay **Test Mode** credentials for any staging checkout exercise. Production Supabase, Render variables, live Razorpay keys, and production booking/payment tests remain out of scope until the staging auth and recovery gates pass.
7. Pre-existing guest bookings are not automatically attached to a Google account. A separate verified legacy-booking claim flow is required if those records must appear in **My Bookings**; matching email or phone alone must not link them. Existing `profiles.phone UNIQUE` can also block a new Google user whose booking phone is already used; handle that explicitly before broad production rollout.

No staging secrets were inspected or changed by this local implementation, and no migration, deployment, or live payment action has been performed.
