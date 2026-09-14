# Admin Controller Specification & Behaviors — SK Baghel Tour & Travels

**System:** Operations & Backoffice Controllers  
**Document Version:** 1.0  
**Status:** Approved Engineering Standard  
**Related Documents:** [ADMIN_PRD.md](ADMIN_PRD.md), [ADMIN_TRD.md](ADMIN_TRD.md), [ADMIN_API_CONTRACT.md](ADMIN_API_CONTRACT.md), [ADMIN_MODELS.md](ADMIN_MODELS.md)

---

## 1. Controller Architecture & Standard Handler Lifecycle

Every Admin Panel controller handler follows a strict 5-stage pipeline:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. Role Guard   │ ──> │ 2. Zod Validate │ ──> │ 3. Service Call │ ──> │ 4. Audit Emitter│ ──> │ 5. Send Success │
│ requireRole(...)│     │ schema.parse(..)│     │ (Business Logic)│     │ (State Mutation)│     │ sendSuccess(..) │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Role Guard**: Verify caller identity and evaluate RBAC permissions. Throws `401 Unauthorized` if unauthenticated or `403 Forbidden` if role is insufficient.
2. **Zod Validation**: Parse and sanitize query parameters, path params, or request bodies. Throws `400 Bad Request` with field-level issues if invalid.
3. **Service Execution**: Delegate core business logic to the domain service inside a database transaction where applicable.
4. **Audit Emitter**: For any state change (refund, status change, publishing) or PII unmasking, emit a structured audit entry.
5. **Standardized Response**: Format response using `sendSuccess(reply, data, statusCode)`.

---

## 2. Booking Operations Handlers

### 2.1. `listBookings(request, reply)`
- **File:** `backend/src/modules/admin/admin.controller.ts`
- **Allowed Roles:** `dispatcher`, `finance_operator`, `super_admin`
- **Execution Steps:**
  1. `requireRole(request, ["dispatcher", "finance_operator", "super_admin"])`.
  2. Parse query parameters using `AdminBookingQuerySchema.parse(request.query)`.
  3. Query database `bookings.list(query)` with pagination (`limit`, `offset`) and filters (`status`, `ticketId`).
  4. Project results with masked phone and masked email (`maskPhone(item.customerPhone)`).
  5. Return `{ total, page, pageSize, items }`.

### 2.2. `getBookingDetails(request, reply)`
- **File:** `backend/src/modules/admin/admin.controller.ts`
- **Allowed Roles:** `dispatcher`, `super_admin`
- **Execution Steps:**
  1. `requireRole(request, ["dispatcher", "super_admin"])`.
  2. Validate `id` parameter as UUID.
  3. Fetch full booking record from database `bookings.getById(id)`. If missing, throw `Errors.notFound("BOOKING_NOT_FOUND")`.
  4. Fetch associated payment records `payments.listByBookingId(id)`.
  5. Fetch associated refund records `refunds.listByBookingId(id)`.
  6. Emit audit log entry: `action = "BOOKING_UNMASK_VIEWED"` with actor ID.
  7. Return complete booking details with raw (unmasked) customer phone, email, and immutable fare breakdown.

### 2.3. `updateBookingStatus(request, reply)`
- **File:** `backend/src/modules/admin/admin.controller.ts`
- **Allowed Roles:** `dispatcher`, `super_admin`
- **Execution Steps:**
  1. `requireRole(request, ["dispatcher", "super_admin"])`.
  2. Parse body with `UpdateBookingStatusSchema`: `{ status, expectedVersion, note }`.
  3. Inside database transaction:
     - Fetch current booking.
     - Verify optimistic lock: `if (booking.version !== expectedVersion) throw Errors.conflict("OPTIMISTIC_LOCK_CONFLICT")`.
     - Verify state machine transition: `assertTransition(booking.status, targetStatus)`.
     - Update booking: `status = targetStatus`, `version = booking.version + 1`, `updatedAt = now`.
     - Emit audit log: `action = "BOOKING_STATUS_TRANSITION"`, `details = { from: booking.status, to: targetStatus, note }`.
  4. Return updated booking record.

---

## 3. Finance & Refund Handlers

### 3.1. `refund(request, reply)`
- **File:** `backend/src/modules/admin/admin.controller.ts`
- **Allowed Roles:** `super_admin`
- **Execution Steps:**
  1. `requireRole(request, ["super_admin"])`.
  2. Extract authenticated user via `requireUser(request)`.
  3. Parse body using `CreateRefundSchema.parse(request.body)`: `{ bookingId, reason, idempotencyKey }`.
  4. Delegate to `paymentService.refund({ bookingId, reason, idempotencyKey, actorId: user.id })`:
     - Idempotency check: if refund exists with `idempotencyKey`, return it immediately.
     - Validate booking status is `paid_confirmed`.
     - Find captured payment with `providerPaymentId`.
     - Invoke payment provider adapter (`razorpay.refund()` / `paypal.refund()`).
     - Update payment record to `refunded`.
     - Update booking status to `refunded` and bump `version`.
     - Insert record into `refunds` table.
     - Emit audit log: `action = "REFUND_EXECUTED"`, `details = { bookingId, amountMinor, reason }`.
  5. Return `201 Created` with refund details.

---

## 4. Content & Catalog Handlers

### 4.1. `createCatalogItem(request, reply)`
- **File:** `backend/src/modules/catalog/catalog.controller.ts`
- **Allowed Roles:** `content_editor`, `super_admin`
- **Execution Steps:**
  1. `requireRole(request, ["content_editor", "super_admin"])`.
  2. Validate payload: `type`, `slug`, `title`, `description`, `durationText`, `startingPriceInr`.
  3. Verify unique slug: `if (existingSlug) throw Errors.conflict("SLUG_ALREADY_EXISTS")`.
  4. Create catalog item with `status: "draft"`.
  5. Return `201 Created`.

### 4.2. `publishCatalogItem(request, reply)`
- **File:** `backend/src/modules/catalog/catalog.controller.ts`
- **Allowed Roles:** `super_admin`
- **Execution Steps:**
  1. `requireRole(request, ["super_admin"])`.
  2. Fetch catalog item by ID. If not found, throw `404 Not Found`.
  3. Update status to `published` and set `publishedAt = now`.
  4. Emit audit log: `action = "CATALOG_PUBLISHED"`.
  5. Return updated catalog item.

---

## 5. Review Moderation Handlers

### 5.1. `approveReview(request, reply)`
- **File:** `backend/src/modules/reviews/review.controller.ts`
- **Allowed Roles:** `review_moderator`, `super_admin`
- **Execution Steps:**
  1. `requireRole(request, ["review_moderator", "super_admin"])`.
  2. Fetch review by ID.
  3. If review has a linked `ticketId`, verify ticket exists in `bookings` table and set `isVerifiedCustomer: true`.
  4. Update review status to `approved`.
  5. Return `200 OK`.

### 5.2. `publishReview(request, reply)`
- **File:** `backend/src/modules/reviews/review.controller.ts`
- **Allowed Roles:** `super_admin`
- **Execution Steps:**
  1. `requireRole(request, ["super_admin"])`.
  2. Update review status to `published`.
  3. Return `200 OK`. (Review is now visible on public catalog page).

---

## 6. Audit Log Handlers

### 6.1. `auditLogs(request, reply)`
- **File:** `backend/src/modules/admin/admin.controller.ts`
- **Allowed Roles:** `super_admin`
- **Execution Steps:**
  1. `requireRole(request, ["super_admin"])`.
  2. Parse optional `limit` query param (default 100, max 500).
  3. Query `audit_logs` table ordered by `created_at DESC`.
  4. Return array of audit log entries.
