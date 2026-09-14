# Admin Panel API Contract — SK Baghel Tour & Travels

**Base URL:** `/api/v1/ops/admin`  
**Protocol:** HTTPS / REST JSON  
**Authentication:** Required for all routes (`Authorization: Bearer <token>`)  
**Envelope Standard:** All responses adhere to the standard project envelope.  
**Related Documents:** [ADMIN_PRD.md](ADMIN_PRD.md), [ADMIN_TRD.md](ADMIN_TRD.md), [ADMIN_MODELS.md](ADMIN_MODELS.md)

---

## 1. Response & Error Envelopes

### Success Envelope
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | OPTIMISTIC_LOCK_CONFLICT | INTERNAL_ERROR",
    "message": "Human readable explanation of error.",
    "requestId": "req-uuid-or-id",
    "details": { ... }
  }
}
```

---

## 2. Booking Operations Endpoints

### 2.1. List & Filter Bookings
- **Method:** `GET`
- **Path:** `/bookings`
- **Required Role:** `dispatcher`, `finance_operator`, or `super_admin`
- **Rate Limit:** 60 requests/minute
- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|:---:|---|
  | `status` | string | No | Filter by `pending_payment`, `paid_confirmed`, `in_transit`, `completed`, `cancelled`, `refunded` |
  | `ticketId` | string | No | Exact match or partial match on ticket ID (e.g. `AGR-20260914`) |
  | `page` | integer | No | 1-based page number (default: `1`) |
  | `pageSize` | integer | No | Page size limit, max 100 (default: `20`) |
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "total": 42,
      "page": 1,
      "pageSize": 20,
      "items": [
        {
          "id": "780998a1-5735-43a9-a681-30bc8f7c9e01",
          "ticketId": "AGR-20260914-0001",
          "status": "paid_confirmed",
          "tripType": "one-way",
          "vehicleTier": "sedan",
          "originName": "Agra",
          "destinationName": "Delhi",
          "pickupDatetime": "2026-10-01T08:00:00+05:30",
          "customerName": "Aman Sharma",
          "customerPhone": "+9198****3221",
          "customerEmail": "a***@gmail.com",
          "advanceAmount": 500,
          "totalFare": 2850,
          "version": 2
        }
      ]
    }
  }
  ```

---

### 2.2. Get Booking Details (Unmasked)
- **Method:** `GET`
- **Path:** `/bookings/:id`
- **Required Role:** `dispatcher` or `super_admin`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": "780998a1-5735-43a9-a681-30bc8f7c9e01",
      "ticketId": "AGR-20260914-0001",
      "status": "paid_confirmed",
      "tripType": "one-way",
      "vehicleTier": "sedan",
      "originName": "Agra",
      "destinationName": "Delhi",
      "pickupAddress": "Taj East Gate Road, Taj Ganj, Agra",
      "dropAddress": "Terminal 3, IGI Airport, New Delhi",
      "pickupDatetime": "2026-10-01T08:00:00+05:30",
      "returnDatetime": null,
      "distanceKm": 230,
      "customerName": "Aman Sharma",
      "customerPhone": "+919876543221",
      "customerEmail": "aman.sharma@example.com",
      "specialNotes": "Child seat needed if possible. Two large suitcases.",
      "fare": {
        "baseFare": 2500,
        "nightAllowance": 0,
        "driverAllowance": 0,
        "tollTaxEstimated": 350,
        "discountAmount": 0,
        "totalFare": 2850,
        "advanceAmount": 500,
        "balanceAmount": 2350,
        "currency": "INR",
        "fareVersion": "2026-09-13"
      },
      "payments": [
        {
          "id": "pay-uuid-001",
          "provider": "razorpay",
          "providerPaymentId": "pay_O78a1bcD498",
          "amountMinor": 50000,
          "currency": "INR",
          "status": "captured",
          "createdAt": "2026-09-14T10:15:00+05:30"
        }
      ],
      "version": 2,
      "createdAt": "2026-09-14T10:12:00+05:30",
      "updatedAt": "2026-09-14T10:15:01+05:30"
    }
  }
  ```

---

### 2.3. Update Trip Status
- **Method:** `PATCH`
- **Path:** `/bookings/:id/status`
- **Required Role:** `dispatcher` or `super_admin`
- **Request Body:**
  ```json
  {
    "status": "in_transit",
    "expectedVersion": 2
  }
  ```
- **Response `200 OK`:** Returns updated booking with bumped `version: 3`.
- **Response `409 Conflict`:** If `expectedVersion` does not match database version (`OPTIMISTIC_LOCK_CONFLICT`).

---

## 3. Financial & Refund Endpoints

### 3.1. Process Refund
- **Method:** `POST`
- **Path:** `/refunds`
- **Required Role:** `super_admin`
- **Rate Limit:** 10 requests/minute
- **Request Body:**
  ```json
  {
    "bookingId": "780998a1-5735-43a9-a681-30bc8f7c9e01",
    "reason": "Customer flight cancelled; requested full advance refund.",
    "idempotencyKey": "a918f4a1-bc34-4b51-9231-102948192803"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "id": "ref-uuid-001",
      "bookingId": "780998a1-5735-43a9-a681-30bc8f7c9e01",
      "paymentId": "pay-uuid-001",
      "amountMinor": 50000,
      "currency": "INR",
      "reason": "Customer flight cancelled; requested full advance refund.",
      "status": "processed",
      "providerRefundId": "rfnd_O819xbcD918",
      "idempotencyKey": "a918f4a1-bc34-4b51-9231-102948192803",
      "createdAt": "2026-09-14T12:00:00+05:30"
    }
  }
  ```
- **Response `409 Conflict`:** If booking is not in an eligible state (`REFUND_NOT_ELIGIBLE`).

---

## 4. Catalog CMS Endpoints

### 4.1. List Catalog Items
- **Method:** `GET`
- **Path:** `/catalog`
- **Required Role:** `content_editor` or `super_admin`
- **Query Parameters:** `type` (`ride`, `tour`, `package`), `status` (`draft`, `published`, `archived`)
- **Response `200 OK`:** Returns array of all items matching filter (including drafts).

### 4.2. Create Catalog Draft
- **Method:** `POST`
- **Path:** `/catalog`
- **Required Role:** `content_editor` or `super_admin`
- **Request Body:**
  ```json
  {
    "type": "tour",
    "slug": "same-day-agra-taj-sunrise-tour",
    "title": "Same Day Agra Sunrise Taj Mahal Tour",
    "shortDescription": "Experience the Taj Mahal bathed in early morning golden light with a private chauffeur.",
    "description": "# Detailed Itinerary...",
    "durationText": "12 Hours",
    "routeSummary": "Delhi -> Yamuna Expressway -> Agra -> Delhi",
    "startingPriceInr": 4500,
    "featuredImageAssetId": "asset-taj-sunrise-01"
  }
  ```
- **Response `201 Created`:** Returns created catalog item with `status: "draft"`.

### 4.3. Publish / Archive Catalog Item
- **Method:** `POST`
- **Path:** `/catalog/:id/publish` (or `/catalog/:id/archive`)
- **Required Role:** `super_admin`
- **Response `200 OK`:** Returns updated catalog item.

---

## 5. Review Moderation Endpoints

### 5.1. List Pending Reviews
- **Method:** `GET`
- **Path:** `/reviews?status=pending_review`
- **Required Role:** `review_moderator` or `super_admin`
- **Response `200 OK`:** List of customer reviews awaiting moderation.

### 5.2. Approve / Reject Review
- **Method:** `POST`
- **Path:** `/reviews/:id/approve` (or `/reviews/:id/reject`)
- **Required Role:** `review_moderator` or `super_admin`
- **Response `200 OK`:** Review status changed to `approved` or `rejected`.

### 5.3. Publish Review
- **Method:** `POST`
- **Path:** `/reviews/:id/publish`
- **Required Role:** `super_admin`
- **Response `200 OK`:** Review status set to `published` (now live on public site).

---

## 6. Audit Log Endpoints

### 6.1. List Audit Logs
- **Method:** `GET`
- **Path:** `/audit-logs`
- **Required Role:** `super_admin`
- **Rate Limit:** 30 requests/minute
- **Query Parameters:** `limit` (default: 100, max: 500)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "audit-uuid-001",
        "actorId": "00000000-0000-4000-a000-000000000005",
        "actorRole": "super_admin",
        "action": "REFUND_PROCESSED",
        "resourceType": "booking",
        "resourceId": "780998a1-5735-43a9-a681-30bc8f7c9e01",
        "details": {
          "refundId": "ref-uuid-001",
          "amountMinor": 50000,
          "reason": "Customer flight cancelled"
        },
        "ipAddress": "103.21.244.2",
        "createdAt": "2026-09-14T12:00:00+05:30"
      }
    ]
  }
  ```
