# Technical Requirements Document (TRD) — Admin Panel

**System:** SK Baghel Tour & Travels — Operations & Administration Backend  
**Document Version:** 1.0  
**Status:** Approved Technical Architecture  
**Related Documents:** [ADMIN_PRD.md](ADMIN_PRD.md), [ADMIN_SCOPE_BOUNDARY.md](ADMIN_SCOPE_BOUNDARY.md), [ADMIN_API_CONTRACT.md](ADMIN_API_CONTRACT.md), [ADMIN_MODELS.md](ADMIN_MODELS.md), [BACKEND_RULES.md](BACKEND_RULES.md)

---

## 1. System Architecture Overview

The Admin Panel integrates directly with the Fastify 5 + TypeScript backend service. It relies on Supabase PostgreSQL as its single source of truth for financial, operational, and content records.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ADMIN CLIENT BROWSER                          │
│          (Operations Desk / CMS / Finance / Super Admin Roles)          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / Bearer JWT
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          FASTIFY BACKEND SERVICE                        │
│                                                                         │
│   ┌───────────────────────────┐       ┌─────────────────────────────┐   │
│   │    authenticateRequest    │ ----> │         requireRole         │   │
│   │  (Supabase JWT Verification)│     │ (dispatcher, super_admin..) │   │
│   └───────────────────────────┘       └─────────────────────────────┘   │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      ADMIN CONTROLLER LAYER                     │   │
│   │  • listBookings()  • refund()  • auditLogs()                    │   │
│   │  • catalogCrud()   • reviewModeration()  • inquiryTracking()    │   │
│   └────────────────────────────────┬────────────────────────────────┘   │
│                                    │                                    │
│   ┌────────────────────────────────▼────────────────────────────────┐   │
│   │                       ADMIN SERVICE LAYER                       │   │
│   │  • PII Masking/Unmasking Logic                                  │   │
│   │  • Booking State Machine Assertion                              │   │
│   │  • Optimistic Concurrency Control (Version Verification)        │   │
│   │  • Payment Gateway Refund Invocation (Razorpay/PayPal)          │   │
│   │  • Audit Trail Log Emitter                                      │   │
│   └────────────────────────────────┬────────────────────────────────┘   │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
   ┌───────────────────────────┐           ┌───────────────────────────┐
   │    SUPABASE POSTGRESQL    │           │    PAYMENT GATEWAYS       │
   │  (System of Record)       │           │  • Razorpay Refund API    │
   │  • bookings (no drivers!) │           │  • PayPal Payout API      │
   │  • payments & refunds     │           └───────────────────────────┘
   │  • catalog_items          │
   │  • reviews & inquiries    │
   │  • audit_logs             │
   └───────────────────────────┘
```

---

## 2. Authentication & Authorization Architecture

### 2.1. JWT Verification (`authGuard.ts`)
1. **Extraction**: Request `Authorization` header must contain `Bearer <token>`.
2. **Verification**:
   - In production: Validated against `SUPABASE_JWT_SECRET` (HMAC SHA-256) or Supabase JWKS endpoint (`SUPABASE_URL/auth/v1/.well-known/jwks.json`).
   - In development/testing: If `ALLOW_TEST_AUTH=true`, tokens prefixed with `Bearer test-<role>` (e.g. `test-dispatcher`, `test-super_admin`) generate deterministic principal contexts.
3. **Payload Structure**:
   ```typescript
   export type AuthUser = {
     id: string;        // UUID of the authenticated admin user
     role: UserRole;    // One of: dispatcher, content_editor, review_moderator, finance_operator, super_admin
     email: string | null;
     phone: string | null;
   };
   ```

### 2.2. Role Guard (`roleGuard.ts`)
- Role validation is executed at the route boundary before any controller logic runs.
- If user is missing: throws `401 Unauthorized`.
- If user role is `super_admin`: immediately bypasses (full administrative privileges).
- If user role is not within the authorized roles array: throws `403 Forbidden` (`FORBIDDEN`).

```typescript
export const DISPATCH_ROLES = ["dispatcher", "super_admin"] as const;
export const CONTENT_ROLES = ["content_editor", "super_admin"] as const;
export const REVIEW_ROLES = ["review_moderator", "super_admin"] as const;
export const FINANCE_ROLES = ["finance_operator", "super_admin"] as const;
export const SUPER_ADMIN_ROLES = ["super_admin"] as const;
```

---

## 3. Data Privacy & Customer PII Handling

1. **Public vs. Administrative Views**:
   - Public voucher lookups (`GET /api/v1/bookings/:ticketId`) always mask customer phone (`98****3221`) and email (`s****@gmail.com`).
   - Admin listing (`GET /api/v1/ops/admin/bookings`) by default displays masked phone/email.
   - Admin detail queries executed by authorized `dispatcher` or `super_admin` return unmasked PII.
2. **Audit on Access**:
   - Any query returning unmasked customer phone or email automatically logs an audit event:
     - `action: "BOOKING_UNMASK_VIEWED"`
     - `actorId: req.user.id`
     - `resourceId: booking.id`

---

## 4. State Transitions & Concurrency Control

### 4.1. Booking Lifecycle State Machine
```
 [ draft ] ──> [ pending_payment ] ──> [ paid_confirmed ] ──> [ in_transit ] ──> [ completed ]
     │                  │                     │
     └──> [ cancelled ] │                     ├──> [ refunded ]
                        └──> [ cancelled ]    └──> [ cancelled ]
```

- **Valid Transitions**:
  - `draft` ➔ `pending_payment`, `cancelled`
  - `pending_payment` ➔ `paid_confirmed`, `cancelled`
  - `paid_confirmed` ➔ `in_transit`, `completed`, `refunded`, `cancelled`
  - `in_transit` ➔ `completed`, `refunded`
  - `completed`, `cancelled`, `refunded` are terminal states (no further transitions permitted).
- **Illegal Transitions**:
  - No skipping from `pending_payment` directly to `in_transit` or `completed`.
  - No transitioning to or from the purged `driver_assigned` state.

### 4.2. Optimistic Concurrency Control (OCC)
- Every mutation to a booking record checks `WHERE id = :id AND version = :expectedVersion`.
- Upon successful update, `version` is incremented by 1.
- If `expectedVersion` does not match the database state, the API throws `409 Conflict` (`OPTIMISTIC_LOCK_CONFLICT`).

---

## 5. Refund Architecture & Financial Idempotency

### 5.1. Refund Request Pipeline
1. **Eligibility Check**:
   - Booking status must be `paid_confirmed` (or `in_transit` in exceptional partial refund scenarios).
   - Associated payment must exist with `status = "captured"` and a valid `providerPaymentId`.
2. **Idempotency Check**:
   - Check `refunds` table by `idempotency_key`. If already processed, return existing record immediately without re-calling the payment gateway.
3. **Gateway Refund Call**:
   - Invoke `deps.providers[captured.provider].refund(...)` with timeout limits (max 8 seconds).
4. **Transactional Write**:
   - Insert record into `refunds` table.
   - Update `payments` record status to `refunded`.
   - Update `bookings` status to `refunded` and bump `version`.
   - Insert audit record into `audit_logs`.

---

## 6. Rate Limiting & Denial of Service Protection

Admin routes enforce strict per-IP rate limits using `@fastify/rate-limit`:
- `GET /api/v1/ops/admin/bookings`: 60 requests / minute.
- `POST /api/v1/ops/admin/refunds`: 10 requests / minute (stringent financial throttling).
- `GET /api/v1/ops/admin/audit-logs`: 30 requests / minute.
- Catalog & Review admin mutations: 30 requests / minute.

---

## 7. Database Performance & Indexing Strategy

To guarantee sub-100ms response times on high-volume admin queries, the following PostgreSQL indexes are maintained on live Supabase:

```sql
-- Fast lookup by standardized ticket ID
CREATE INDEX IF NOT EXISTS idx_bookings_ticket_id ON bookings(ticket_id);

-- Operational queues (status filtering + pickup sorting)
CREATE INDEX IF NOT EXISTS idx_bookings_status_pickup ON bookings(status, pickup_datetime DESC);

-- Customer search
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);

-- Audit log inspection
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);

-- Review moderation queue
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status, created_at DESC);
```
