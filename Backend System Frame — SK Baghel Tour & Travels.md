# Backend System Frame — SK Baghel Tour & Travels

**Document status:** System interaction reference  
**Related documents:** [API.md](API.md), [MODELS.md](MODELS.md), [PHASE.md](PHASE.md)

## System Boundary

The backend is a server-authoritative Node.js and TypeScript API. Client applications include the customer website and the administrator panel. There is no driver application in the current scope. The API communicates with Supabase, MongoDB Atlas, Razorpay, LocationIQ, WhatsApp or Twilio, and transactional email providers.

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

1. The client submits trip details to the API.
2. The API validates the input and recalculates the fare using server rules.
3. The API creates a draft booking and immutable fare snapshot.
4. The API creates a Razorpay order for the 28% advance.
5. The client opens the Razorpay checkout experience.
6. Razorpay sends a signed webhook after payment processing.
7. The API verifies the signature and applies an idempotent payment transition.
8. The API marks the booking as `paid_confirmed` and dispatches notifications.
9. The client polls or retrieves the verified ticket and voucher details.

## Dispatch Frame

After payment confirmation, an authorized dispatcher selects an available driver and vehicle. The API validates overlap, status, and assignment constraints before persisting the assignment. The driver receives the trip and can move it through permitted states such as started, in transit, toll recorded, and completed.

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

If Razorpay is unavailable, the booking remains unpaid and the customer receives a retry-safe error. If a webhook is duplicated, the API acknowledges it without repeating side effects. If LocationIQ is unavailable, a valid cache entry may be returned; otherwise the fare flow must fail clearly rather than invent coordinates. If notification delivery fails after payment, the financial state remains confirmed while delivery is retried asynchronously.

## Observability Frame

Every request should have a request ID. Logs must include route, latency, status, provider event ID where relevant, and a safe entity identifier. Logs must not include secrets, full payment signatures, or unmasked customer contact details. Metrics should cover fare errors, booking conversion, payment success, webhook duplicates, notification failures, cache hit rate, content publication, review moderation, and database latency.

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"

The system boundaries, integrations, and payment sequence in this document are based on [1].
