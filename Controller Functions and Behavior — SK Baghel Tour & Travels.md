# Controller Functions and Behavior — SK Baghel Tour & Travels

**Document status:** Backend implementation reference  
**Related documents:** [API.md](API.md), [MODELS.md](MODELS.md), [BACKEND_ARCHITECTURE_PLAN.md](BACKEND_ARCHITECTURE_PLAN.md)

## Controller Design Rule

Controllers are thin HTTP adapters. A controller should authenticate the request, validate input, call one application service, map the result to an HTTP response, and delegate unexpected failures to the centralized error handler. Controllers must not contain fare formulas, database queries, payment secrets, or provider-specific business rules.

```text
HTTP request
    -> route middleware
    -> controller: parse and authorize
    -> service: execute business operation
    -> repository/provider: persist or call external system
    -> controller: map result to response
```

## Common Controller Contract

Every controller receives a typed request context containing the request ID, authenticated principal when available, parsed parameters, and validated body. Every success response should use a stable response shape. Every failure should use the shared error format from [API.md](API.md).

| Controller responsibility | Required behavior |
|---|---|
| Input boundary | Validate body, query, and route parameters with Zod |
| Authorization | Confirm authentication and role before invoking the service |
| Idempotency | Pass the idempotency key to the service for retry-safe operations |
| Response mapping | Return only fields allowed for the caller's role |
| Error handling | Throw typed application errors; do not expose stack traces |
| Observability | Include request ID and safe entity identifiers in structured logs |

## Fare Controller

### `calculateFareController`

**Route:** `POST /api/v1/fares/calculate`

The controller validates trip type, vehicle tier, locations, date-time fields, distance, and optional promo code. It calls the pure fare engine through `fareService.calculate`. It returns the complete fare breakdown, advance amount, balance amount, currency, and fare-rule version.

The controller must ignore any client-provided total, advance, or balance. It must reject malformed dates, negative distances, unsupported vehicle tiers, and invalid trip combinations. It may be public but remains rate limited.

## Location Controller

### `autocompleteLocationController`

**Route:** `GET /api/v1/locations/autocomplete`

The controller normalizes the query string, enforces a minimum query length, and passes the normalized value to `locationService.autocomplete`. The service first checks the cache and then calls LocationIQ through a server-held credential when necessary.

The controller must return a bounded result set and must not expose the LocationIQ token. Provider timeouts should become a stable `LOCATION_PROVIDER_UNAVAILABLE` error unless a valid cached response exists.

## Booking Controller

### `createDraftBookingController`

**Route:** `POST /api/v1/bookings/draft`

The controller validates customer, trip, vehicle, and contact details. It passes the request to `bookingService.createDraft`, which recalculates the fare, generates a unique `AGR-YYYYMMDD-XXXX` ticket, stores the fare snapshot, and creates the pending-payment record.

The controller returns the ticket ID, booking ID, fare breakdown, advance amount, balance amount, and the safe payment-next-step metadata. It must not create a paid state.

### `getBookingController`

**Route:** `GET /api/v1/bookings/:ticketId`

The controller validates the ticket format and verifies the supplied token or phone challenge. It calls `bookingService.getVerifiedBooking` and applies a response projection that masks personal information. Assigned-driver contact details must be returned only to the verified customer and authorized administrators. No passenger tracking link exists in this scope.

## Payment Controllers

### `createPaymentOrderController`

**Route:** `POST /api/v1/payments/create-order`

The controller authenticates the booking token, validates the booking state, accepts an idempotency key, and validates an allowed provider/currency combination. It calls `paymentService.createCheckout`, which reads the persisted advance from PostgreSQL and delegates to the selected Razorpay, PayPal, or card-provider adapter.

The controller returns only a provider checkout URL or public client token, amount, currency, provider name, ticket ID, and expiry metadata. It must never return provider secrets or accept a client-calculated amount.

### `processPaymentWebhookController`

**Route:** `POST /api/v1/payments/webhooks/:provider`

This controller receives the raw body before JSON transformation and routes the request to the provider adapter. The adapter verifies the provider signature or performs server-side capture verification, normalizes the event, and passes it to `paymentService.reconcile`. The service compares booking ID, provider order, amount, currency, and event status before atomically updating the payment and booking.

A valid duplicate event should return HTTP 200 without repeating side effects. An invalid signature, amount mismatch, currency mismatch, or unknown checkout must not mutate paid state.

## Operations and Admin Controllers

### `listAdminBookingsController`

**Route:** `GET /api/v1/ops/admin/bookings`

The controller requires an admin or dispatcher role. It validates filters and pagination, calls `operationsService.listBookings`, and returns a paginated dispatch view with masked customer data.

### `assignBookingController`

**Route:** `PATCH /api/v1/ops/admin/bookings/:id/assign`

The controller requires an admin or dispatcher role. It accepts a driver ID, optional vehicle ID, an admin note, and an optional expected version. It does not expose this action to customers. The service verifies that payment is confirmed, applies the manual assignment inside a transaction, records the admin audit event, and prepares the approved WhatsApp notification.

A stale version must produce `ASSIGNMENT_CONFLICT` rather than silently overwriting another dispatcher’s work.

### `createRefundController`

**Route:** `POST /api/v1/ops/admin/refunds`

The controller requires the super-admin role and an explicit reason. The service verifies refund eligibility, calls Razorpay, records the provider refund ID, and updates booking status only after a valid provider response.

Refund requests must be idempotent and must preserve the original payment ledger.

## Controller Anti-Patterns

Controllers must not calculate fares, directly call Supabase tables from route handlers, log payment signatures, trust redirect URLs, send untracked notifications, or return raw provider errors. These responsibilities belong to domain services, repositories, or provider adapters.

## Testing Requirements

Each controller requires request validation tests, authorization tests, service-mocking tests, response-shape tests, and failure-path tests. Payment and webhook controllers additionally require signature, duplicate-event, malformed-payload, and transaction-rollback tests.

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"
[2]: API.md "Backend API Contract — SK Baghel Tour & Travels"
[3]: MODELS.md "Backend Data Models — SK Baghel Tour & Travels"

Controller boundaries in this document are based on [1], route contracts in [2], and persistence rules in [3].
