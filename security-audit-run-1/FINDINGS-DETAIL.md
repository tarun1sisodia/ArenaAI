# Security Findings Detail — ArenaAI (Run 1, 2026-09-16)

This document provides the full technical detail for each finding. See [REPORT.md](REPORT.md) for the executive summary and remediation priorities.

---

## Confirmed Findings (8)

### SEC-001 · Medium
**Webhook Rate Limiting Disabled**  
File: `backend/src/app.ts:117-119`

The global rate limiter (120 req/min) is completely bypassed for all `/api/v1/payments/webhooks/*` URLs. The per-route config `{ rateLimit: false }` on the webhook route provides no fallback. Every unauthenticated request triggers HMAC computation, DB dedup lookup, and potentially notification queue writes.

**Trace**: `payment.routes.ts:16` → `app.ts:119 (allowList bypass)` → `payment.service.ts:197 (HMAC + DB write)`

**Remediation**: Replace `allowList` with per-IP rate limiting on the webhook route (300-500/min per IP using `keyGenerator`).

---

### SEC-002 · Low
**Timing-Allow-Origin: * Cross-Origin Timing Oracle**  
File: `backend/src/middlewares/networkHeaders.ts:17`

The `Timing-Allow-Origin: *` header is set on every API response via the `onSend` hook. The W3C Resource Timing API cross-origin restriction is overridden, enabling any web page to measure precise API response times. Enables existence timing for booking ticket IDs.

**Remediation**: Remove the header or restrict to own domain. RUM does not require `*`.

---

### SEC-003 · High
**Test Auth Backdoor in docker-compose.yml**  
File: `backend/docker-compose.yml:10`

`ALLOW_TEST_AUTH: true` without `NODE_ENV: production` means the production guard in `env.ts:82` never fires. Any caller can authenticate as `super_admin` with `Authorization: Bearer test-super_admin`.

**Trace**: `docker-compose.yml:10 (ALLOW_TEST_AUTH=true)` → `authGuard.ts:23 (token.startsWith('test-'))` → `admin.controller.ts:37 (refund + any admin route)`

**Remediation**: Remove `ALLOW_TEST_AUTH` from docker-compose.yml. Add CI check to prevent reintroduction.

---

### SEC-004 · High
**Hardcoded Fallback Webhook Secrets**  
File: `backend/src/app.ts:221, 228`

PayPal adapter: `env.PAYPAL_WEBHOOK_SECRET || 'whsec_paypal_test'`  
Card adapter: `env.CARD_WEBHOOK_SECRET || 'whsec_card_test'`

These literals are in the public repository. A misconfigured server (missing env vars) accepts webhooks signed with known secrets. An attacker can force any booking to `paid_confirmed` without payment.

**Trace**: `payment.routes.ts:16` → `app.ts:221 (known HMAC key)` → `payment.service.ts:197 (verifyWebhook passes)` → `payment.service.ts:304 (booking paid_confirmed)`

**Remediation**: Throw `new Error()` instead of using `||` fallback. Add webhook secrets to production required-env validation.

---

### SEC-005 · Medium
**Client-Supplied distanceKm Affects Server Fare Calculation**  
File: `backend/src/modules/bookings/booking.schema.ts:54`

Customer supplies `distanceKm` in the booking request. The fare engine uses `Math.max(input.distanceKm, route.km)` only for catalogue routes. Unknown routes use an estimated distance that may be overridden by a small client value.

**Trace**: `booking.schema.ts:54 (distanceKm field)` → `booking.service.ts:47 (calculateFare)` → `fare.engine.ts:269 (Math.max — only for catalogue routes)`

**Remediation**: Remove `distanceKm` from customer schema. Compute distance server-side from `originName`/`destinationName`.

---

### SEC-006 · Medium
**Admin Dev Fallback Grants super_admin Without Supabase**  
File: `admin/src/lib/auth.ts:27, 81`

When `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is absent, any `email@domain.com` + 6-char password logs in as `super_admin` with `token: 'test-super_admin'`. Combined with SEC-003, creates a complete unauthenticated admin access chain.

**Trace**: `LoginPage.tsx (form submit)` → `auth.ts:27 (Supabase check skipped)` → `auth.ts:81 (test-super_admin token issued)` → `localStorage['skb-admin-session']`

**Remediation**: Remove development fallback. Require Supabase configuration at build time.

---

### SEC-007 · Low
**Duplicate Booking Guard Fetches Only 20 Records**  
File: `backend/src/modules/bookings/booking.service.ts:71`

The dedup check fetches the 20 most-recent bookings globally. Under high load or coordinated multi-IP submission, the 21st booking bypasses duplicate detection.

**Remediation**: Query by phone + time window at DB level.

---

### SEC-008 · Low
**phoneLast4 in Public Booking Response Aids Enumeration**  
File: `backend/src/modules/bookings/booking.service.ts:229`

`phoneLast4` is returned to any caller who accesses the booking. The `AGR-YYYYMMDD-NNNN` format gives 10,000 ticket IDs per day. Discovering a valid ticket + phoneLast4 reduces phone brute-force from 10^10 to 10^4.

**Remediation**: Remove `phoneLast4` from public projection.

---

## Needs-Validation Items (2)

### SEC-009 · CORS No-Origin (Needs Validation)
`app.ts:96` accepts requests with no Origin header in production. CORS is a browser primitive — non-browser callers are not bound by CORS. Authentication uses JWT and HMAC, not Origin. Validation: confirm no middleware uses Origin as a trust signal.

### SEC-010 · Razorpay Amount Echo (Needs Validation)
`razorpay.ts:74` stores `body.amount` (provider-echoed) rather than asserting equality with `command.amountMinor`. Low theoretical risk since Razorpay should echo exactly what was sent. Validation: add `body.amount === command.amountMinor` assertion.

---

## Rejected Candidates

No candidates were rejected in this run. All 10 source-grounded candidates passed the confirmation/validation gate.
