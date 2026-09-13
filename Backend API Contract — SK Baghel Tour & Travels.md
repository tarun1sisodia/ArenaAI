# Backend API Contract — SK Baghel Tour & Travels

**Base path:** `/api/v1`  
**Transport:** HTTPS and REST JSON  
**Related documents:** [MODELS.md](MODELS.md), [FRAME.md](FRAME.md), [GALLERY_REVIEWS_ADMIN.md](GALLERY_REVIEWS_ADMIN.md)

## Contract Rules

All request and response bodies use JSON unless an endpoint explicitly accepts a webhook payload. Amounts are represented in INR rupees in booking fare fields and paise in payment ledger fields. The server recalculates fares and never trusts client monetary totals.

| Concern | Rule |
|---|---|
| Authentication | Supabase JWT for authenticated users; role checks for operations routes |
| Validation | Zod schemas at the request boundary |
| Errors | Stable machine-readable `code`, human-readable `message`, and optional `details` |
| Idempotency | Required for payment creation and webhook processing where repeated requests are possible |
| Rate limits | Public fare and booking routes: 60 requests/minute/IP; inquiries: 5 requests/minute/IP |
| Privacy | Mask customer phone and email in public responses |

## Public and Client Routes

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| `POST` | `/fares/calculate` | Calculate a server-authoritative fare breakdown | None |
| `GET` | `/locations/autocomplete` | Return LocationIQ suggestions through the server proxy | None |
| `POST` | `/bookings/draft` | Validate input, calculate fare, create a draft, and issue a ticket ID | None or guest token |
| `POST` | `/payments/create-order` | Create a Razorpay order for the persisted 28% advance | Booking token |
| `POST` | `/payments/webhook` | Process Razorpay payment and refund events | Razorpay signature |
| `GET` | `/bookings/:ticketId` | Return verified booking and voucher details | Token or phone verification |
| `POST` | `/inquiries` | Capture custom-tour and contact leads | None; rate limited |

## Operations Routes

| Method | Endpoint | Purpose | Required role |
|---|---|---|---|
| `GET` | `/ops/admin/bookings` | Filter bookings by status, date, driver, and ticket | Admin or dispatcher |
| `PATCH` | `/ops/admin/bookings/:id/assign` | Assign a driver and vehicle | Admin or dispatcher |
| `POST` | `/ops/admin/refunds` | Initiate an authorized Razorpay refund | Super admin |

## Public Catalog, Gallery, and Review Routes

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| `GET` | `/catalog/:slug` | Return a published ride, tour, or package with gallery media and reviews | None |
| `GET` | `/catalog/:id/reviews` | Return published reviews and safe verification badges | None |
| `POST` | `/reviews` | Submit a customer review for moderation | Guest token or authenticated customer |

Only catalog items, gallery assets, and reviews with public `published` status may be returned. Verification evidence and moderation notes are private.

## Admin Management Routes

| Method | Endpoint | Purpose | Required role |
|---|---|---|---|
| `GET` | `/ops/admin/catalog` | List rides, tours, and packages | Content editor or super admin |
| `POST` | `/ops/admin/catalog` | Create a catalog item | Content editor or super admin |
| `PATCH` | `/ops/admin/catalog/:id` | Update a draft or create a new content version | Content editor or super admin |
| `POST` | `/ops/admin/catalog/:id/publish` | Publish approved catalog content | Super admin |
| `POST` | `/ops/admin/catalog/:id/archive` | Archive a catalog item | Super admin |
| `POST` | `/ops/admin/catalog/:id/media` | Associate a validated storage asset | Content editor or super admin |
| `PATCH` | `/ops/admin/media/:id` | Update caption, order, or visibility | Content editor or super admin |
| `GET` | `/ops/admin/reviews` | Filter reviews by moderation and verification state | Review moderator or super admin |
| `POST` | `/ops/admin/reviews/:id/approve` | Approve a review | Review moderator or super admin |
| `POST` | `/ops/admin/reviews/:id/reject` | Reject a review with a reason | Review moderator or super admin |
| `POST` | `/ops/admin/reviews/:id/publish` | Publish an approved review | Super admin |
| `POST` | `/ops/admin/reviews/:id/archive` | Remove a review from public display | Review moderator or super admin |
| `GET` | `/ops/admin/audit-logs` | Inspect administrative changes | Super admin |

Admin CRUD must use role guards and audit every mutation. Captured payments, refunds, completed bookings, and historical fare snapshots are not freely editable records.

## Recommended Request Contracts

### Fare Calculation

```json
{
  "tripType": "round-trip",
  "vehicleTier": "sedan",
  "originName": "Agra",
  "destinationName": "Jaipur",
  "pickupDatetime": "2026-10-01T08:00:00+05:30",
  "returnDatetime": "2026-10-03T18:00:00+05:30",
  "distanceKm": 250,
  "promoCode": "WELCOME10"
}
```

### Fare Response

```json
{
  "baseFare": 5000,
  "nightAllowance": 0,
  "driverAllowance": 600,
  "discountAmount": 500,
  "totalFare": 5100,
  "advanceAmount": 1500,
  "balanceAmount": 3600,
  "currency": "INR",
  "fareVersion": "2026-09-13"
}
```

### Error Response

```json
{
  "code": "BOOKING_NOT_FOUND",
  "message": "The booking could not be found or verified.",
  "requestId": "req_01J..."
}
```

## State and Status Rules

A booking normally progresses through `draft`, `pending_payment`, `paid_confirmed`, `driver_assigned`, `in_transit`, and `completed`. Cancellation and refund transitions are authorized exceptions. A client redirect cannot create the `paid_confirmed` state; only a verified provider webhook can do so.

## Webhook Requirements

The webhook handler must read the raw request body, validate the `X-Razorpay-Signature` HMAC, persist the provider event ID, and apply an atomic state transition. Duplicate events must receive a successful response without repeating notifications or ledger effects.

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"

Route names, payment rules, and authentication boundaries are based on [1].
