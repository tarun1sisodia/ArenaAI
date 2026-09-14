# Backend System Frame — SK Baghel Tour & Travels

**Document status:** System interaction reference  
**Related documents:** [API.md](API.md), [MODELS.md](MODELS.md), [PHASE.md](PHASE.md)

## System Boundary

The backend is a server-authoritative Node.js and TypeScript API. Client applications include the customer website and the administrator panel. There is no driver application in the current scope. The API communicates with Supabase, optional MongoDB, Razorpay, PayPal, an approved international card processor, LocationIQ, WhatsApp or Twilio, and transactional email providers.

```text
Client applications
        |
        | HTTPS / REST
        v
Node.js TypeScript API
  |        |          |             |
  |        |          |             +--> WhatsApp / Email
  |        |          +----------------> LocationIQ
  |        +---------------------------> Razorpay
  +--> Supabase PostgreSQL / Auth / Storage
  +--> MongoDB Atlas optional cache and provider records
```

## Primary Booking Frame

1. The customer submits trip details to the API.
2. The API validates the input and recalculates the fare and booking advance.
3. The API creates a draft booking and immutable fare snapshot.
4. The customer chooses an allowed payment provider: Razorpay, PayPal, or international card checkout.
5. The backend creates the provider checkout from the persisted amount.
6. The provider verifies payment through signed webhook or server-side API confirmation.
7. The API atomically marks the payment and booking as confirmed.
8. The customer retrieves the verified ticket and voucher.
9. An admin later manually assigns the driver and sends approved details through WhatsApp.

## Dispatch Frame

After payment confirmation, an authorized admin manually selects a driver from the internal driver records and optionally associates a vehicle. The customer never sees driver options and never performs the assignment. The API records the admin, timestamp, note, and assignment state.

## Driver Contact Frame

The admin assigns a driver and the backend stores approved driver contact details with the booking. The verified customer receives those details through the booking response or notification. There is no GPS ingestion, driver app, live map, or passenger tracking link.

## Trust Boundaries

| Boundary | Control |
|---|---|
| Browser to API | TLS, schema validation, rate limiting, masked responses |
| API to payment provider | Server-held secret and provider signature verification |
| Webhook to application | Raw-body HMAC validation and event idempotency |
| API to databases | Least-privilege credentials and transaction boundaries |
| Admin panel to API | Supabase JWT, role checks, audit logging, and field-level permissions |
| External provider to notifications | Queued delivery, retries, and provider status tracking |

## Failure Frames

If a selected payment provider is unavailable, the booking remains unpaid and the customer receives a retry-safe error. If a provider event is duplicated or mismatched, the API rejects or acknowledges it without duplicate ledger effects. If notification delivery fails after payment or assignment, the financial and booking state remains unchanged while delivery is retried asynchronously.

## Observability Frame

Every request should have a request ID. Logs must include route, latency, status, provider event ID where relevant, and a safe entity identifier. Logs must not include secrets, full payment signatures, or unmasked customer contact details. Metrics should cover fare errors, booking conversion, payment success, webhook duplicates, notification failures, cache hit rate, content publication, review moderation, and database latency.

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"

The system boundaries, integrations, and payment sequence in this document are based on [1].
