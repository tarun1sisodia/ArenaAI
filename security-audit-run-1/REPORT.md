# Security Audit Report — SK Baghel Tour & Travels (ArenaAI)

**Run ID**: arenaai-run-1-20260916  
**Source**: commit `047f8f6` (branch `main`, worktree dirty: `db/memory.ts`, `db/types.ts`, `domain.ts`)  
**Profile**: standard  
**Skill**: cloudflare/security-audit-skill (installed via `npx skills add`)  
**Date**: 2026-09-16  
**Coverage**: Full audit (backend API, frontend clients, migrations, auth, payments, webhooks)

---

## Executive Summary

The codebase demonstrates strong security foundations: timing-safe token comparison, server-authoritative fare calculation with `assertNoClientAmount`, HMAC webhook verification, Zod input validation with strict schemas, role-based access control via `app_metadata.role`, and idempotent payment handling. A prior 27-finding audit (AUDIT_REPORT.md) was largely addressed. This audit focuses on **current source** and identifies **8 confirmed findings** and **2 needs-validation items** in the current code state.

**No critical findings** (unauthenticated code execution, full data-store access, or account takeover) were confirmed. The highest-severity confirmed findings are:

| ID | Severity | Title |
|---|---|---|
| SEC-003 | **High** | docker-compose.yml enables test auth backdoor |
| SEC-004 | **High** | Hardcoded fallback webhook secrets allow forged payment events |
| SEC-001 | **Medium** | Webhook endpoint is fully rate-limit-exempt |
| SEC-005 | **Medium** | Client-supplied `distanceKm` affects server fare calculation |
| SEC-006 | **Medium** | Admin fallback auth grants super_admin without Supabase credentials |
| SEC-002 | **Low** | `Timing-Allow-Origin: *` enables cross-origin timing oracle |
| SEC-007 | **Low** | Duplicate booking check scans only 20 recent records |
| SEC-008 | **Low** | `phoneLast4` in public booking response aids enumeration |

---

## Prior Audit State

A prior audit documented 27 findings (FIND-001 to FIND-027). Of these:
- **FIND-001** (migration enum mismatch): Marked RESOLVED. Verified: migration 0012 now uses `'in_transit'`.
- **FIND-002** (booking flow simulation): Partially addressed — `react/src/services/api.ts` added. Needs integration into `BookingPage.tsx`.
- **FIND-003** (admin mock data): Partially addressed — `admin/src/lib/auth.ts` now calls Supabase GoTrue. Admin pages still use mock data.
- **FIND-004** (LocationIQ key exposure): `useLocationIQ.ts` still exists with client-side token reading.

---

## Confirmed Findings

### SEC-001 · Medium · Webhook Rate Limiting Disabled

**File**: [`backend/src/app.ts:117`](file:///home/bot/Internship/ArenaAI/backend/src/app.ts#L117)

```typescript
allowList: (request) => request.url.startsWith('/api/v1/payments/webhooks/')
```

The global rate limiter (120 req/min) completely exempts all webhook endpoints. Every request triggers HMAC verification (CPU), DB dedup lookup, and potentially notification queue writes. A sustained flood can exhaust the DB connection pool.

**Fix**: Apply a per-source-IP rate limit (e.g., 300/min per IP) using `keyGenerator` instead of exempting the endpoint entirely.

---

### SEC-002 · Low · `Timing-Allow-Origin: *` Cross-Origin Timing Oracle

**File**: [`backend/src/middlewares/networkHeaders.ts:17`](file:///home/bot/Internship/ArenaAI/backend/src/middlewares/networkHeaders.ts#L17)

```typescript
reply.header('Timing-Allow-Origin', '*');
```

Set on **all** API responses. This overrides the browser's same-origin policy for the Resource Timing API, allowing any page to measure API response times cross-origin. Enables: existence timing for booking ticket IDs, admin session probe timing.

**Fix**: Remove the header or restrict to specific trusted origins.

---

### SEC-003 · High · Test Auth Backdoor in docker-compose.yml

**File**: [`backend/docker-compose.yml:10`](file:///home/bot/Internship/ArenaAI/backend/docker-compose.yml#L10)

```yaml
ALLOW_TEST_AUTH: "true"
```

Combined with the missing `NODE_ENV=production` in the compose file, any caller can authenticate as `super_admin` by sending `Authorization: Bearer test-super_admin`. This fully bypasses all auth controls for admin routes including refunds and booking transitions.

**Fix**: Remove `ALLOW_TEST_AUTH` from docker-compose.yml. Add a CI check.

---

### SEC-004 · High · Hardcoded Fallback Webhook Secrets

**File**: [`backend/src/app.ts:221-228`](file:///home/bot/Internship/ArenaAI/backend/src/app.ts#L221)

```typescript
webhookSecret: env.PAYPAL_WEBHOOK_SECRET || 'whsec_paypal_test',
webhookSecret: env.CARD_WEBHOOK_SECRET || 'whsec_card_test',
```

These literal strings are in the public repository. Any server running without these env vars configured will accept webhooks signed with the known fallback secrets. An attacker can forge a `payment.captured` event and force any booking to `paid_confirmed` without actual payment.

**Fix**: Remove the `|| 'whsec_*'` fallbacks. Throw `new Error('PAYPAL_WEBHOOK_SECRET is required')`. Add to production env validation.

---

### SEC-005 · Medium · Client-Supplied `distanceKm` Affects Fare Calculation

**File**: [`backend/src/modules/bookings/booking.schema.ts:54`](file:///home/bot/Internship/ArenaAI/backend/src/modules/bookings/booking.schema.ts#L54)

```typescript
distanceKm: z.number().positive().max(5000).finite(),
```

The customer provides `distanceKm` in the booking draft request and it flows directly into fare calculation. While `Math.max(input.distanceKm, route.km)` protects known routes, unknown routes and package bookings use the client value directly. Sending `distanceKm: 1` for an unlisted 500km route yields a minimum fare.

**Fix**: Remove `distanceKm` from the customer-facing schema. Compute distance server-side from `originName`/`destinationName`.

---

### SEC-006 · Medium · Admin Dev Fallback Grants super_admin Without Supabase

**File**: [`admin/src/lib/auth.ts:81`](file:///home/bot/Internship/ArenaAI/admin/src/lib/auth.ts#L81)

```typescript
const adminUser: AdminUser = { ...token: 'test-super_admin' };
```

When `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is absent, any valid-format email + 6-char password logs in as super_admin. Combined with SEC-003, this creates a complete unauthenticated admin access chain.

**Fix**: Remove the development fallback. Require Supabase configuration for all environments.

---

### SEC-007 · Low · Duplicate Booking Check Reads Only Last 20 Records

**File**: [`backend/src/modules/bookings/booking.service.ts:71`](file:///home/bot/Internship/ArenaAI/backend/src/modules/bookings/booking.service.ts#L71)

```typescript
const recent = await deps.db.bookings.list({ page: 1, pageSize: 20 });
```

Under concurrent or rapid submissions, the 21st identical request bypasses the duplicate check.

**Fix**: Query by phone + time window at DB level.

---

### SEC-008 · Low · `phoneLast4` in Public Booking Response Aids Enumeration

**File**: [`backend/src/modules/bookings/booking.service.ts:229`](file:///home/bot/Internship/ArenaAI/backend/src/modules/bookings/booking.service.ts#L229)

```typescript
phoneLast4: last4(booking.customerPhone),
```

The `AGR-YYYYMMDD-NNNN` ticket ID has only 10,000 permutations per day. An enumerator who guesses a ticket ID and provides the last 4 phone digits receives customer name, masked phone, and masked email.

**Fix**: Remove `phoneLast4` from the public booking projection.

---

## Needs-Validation Items

### SEC-009 · CORS No-Origin Behavior

`app.ts:95-103` passes `cb(null, true)` for requests without an Origin header in production. CORS is not a server-side auth control — authentication uses JWT/HMAC. Validation needed: confirm no middleware uses Origin as a trust signal.

### SEC-010 · Razorpay Amount Echo

`razorpay.ts:74` stores the amount echoed by Razorpay API (`body.amount`) rather than the server-computed amount. Low risk since Razorpay should echo exactly what was ordered. Validation needed: add an assertion `body.amount === command.amountMinor`.

---

## Security Strengths (Confirmed)

1. **Timing-safe comparisons** — `timingSafeEqualString` used for all tokens and phone matching
2. **Server-authoritative amounts** — `assertNoClientAmount()` strips monetary fields from checkout requests
3. **JWT role trust** — only `app_metadata.role` trusted (server-controlled, not user-writable)
4. **Webhook HMAC verification** — raw body signed, timing-safe compare before any DB interaction
5. **Idempotent payments** — checkout and webhook both check dedup keys in transactions
6. **Amount/currency mismatch detection** — flags mismatches as `needs_review` before confirming
7. **Transaction locking** — `db.transaction()` with `version` field prevents double-confirmation races
8. **Zod strict schemas** — `.strip()` mode prevents prototype pollution and unknown field injection
9. **PII masking** — phone/email masked by default; unmasked only for `super_admin`
10. **Production env validation** — `loadEnv()` throws for missing required secrets in production

---

## Remediation Priority

| Priority | Finding | Effort |
|---|---|---|
| P0 | SEC-004: Remove hardcoded webhook secret fallbacks | 30 min |
| P0 | SEC-003: Remove ALLOW_TEST_AUTH from docker-compose | 5 min |
| P1 | SEC-006: Remove admin auth development fallback | 2 hrs |
| P1 | SEC-005: Remove client distanceKm from booking schema | 1 hr |
| P2 | SEC-001: Add per-IP rate limit for webhook endpoints | 1 hr |
| P2 | SEC-002: Remove Timing-Allow-Origin header | 15 min |
| P3 | SEC-007: DB-level duplicate booking query | 2 hrs |
| P3 | SEC-008: Remove phoneLast4 from public response | 30 min |
