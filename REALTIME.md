# Booking Status, Notifications, and Failure Handling — SK Baghel Tour & Travels

**Document status:** Operational design reference  
**Related documents:** [FRAME.md](FRAME.md), [CONTROLLERS.md](CONTROLLERS.md), [MODELS.md](MODELS.md)

## Objective

The system must remain safe and understandable when payments, drivers, networks, databases, external providers, and user devices behave unpredictably. Real-time behavior is implemented as a combination of REST commands, event records, short-lived status updates, and asynchronous retries.

## Interaction Channels

| Channel | Use | Source of truth | Delivery behavior |
|---|---|---|---|
| REST | Commands and authoritative reads | PostgreSQL or service result | Request/response with explicit error |
| REST | Customer and admin commands and authoritative reads | Supabase PostgreSQL | Request/response with explicit error |
| Provider webhook | Payment and refund confirmation | Razorpay event plus PostgreSQL ledger | Signature verified and idempotent |
| Job queue | Notifications, retries, invoice generation | PostgreSQL event or outbox record | Retry with backoff and dead-letter state |

## Event Handling Rules

Every important event should contain an event ID, aggregate ID, event type, occurrence time, ingestion time, source, and schema version. Event processing must be idempotent. Consumers must be able to receive the same event more than once without producing duplicate money movement, notifications, or status transitions.

The system should persist the authoritative state before broadcasting an update. A client must never treat a received real-time message as proof that a transaction succeeded; it should retrieve the current state from the API when correctness matters.

## Payment Situations

### Customer pays but the browser closes

Razorpay remains the provider of payment truth. The webhook updates PostgreSQL even if the customer never returns to the browser. The customer can later retrieve the booking by ticket and verification token.

### Webhook arrives more than once

The provider event ID and payment idempotency key are checked before processing. The first valid event performs the transition. Later copies return success without sending another voucher or changing the ledger.

### Webhook arrives before the client receives the order response

The payment service must persist the order before returning it to the client. If a webhook references a known order, it can safely advance the booking. If it references an unknown order, the event is retained for reconciliation and does not create an untrusted booking.

### Provider is temporarily unavailable

Order creation returns a retry-safe error and leaves the booking pending. The client may retry with the same idempotency key. Refund and notification jobs use bounded exponential backoff and a dead-letter state after the configured retry limit.

## Driver and Dispatch Situations

### Two dispatchers assign the same booking

The assignment service uses a transaction, current-state predicate, and optimistic version or row lock. Only one assignment succeeds. The other receives `ASSIGNMENT_CONFLICT` and must refresh the booking.

### Admin assigns a driver

The assignment service uses a transaction, current-state predicate, and optimistic version or row lock. Only one assignment succeeds. The other receives `ASSIGNMENT_CONFLICT`. After assignment, the customer sees only approved driver contact details.

### Customer cannot reach the assigned driver

The customer can refresh the verified booking page or contact the business. Admins can correct contact details or reassign the driver. There is no live location fallback and no driver-app synchronization to recover.

### Driver contact details change

An admin updates the driver record and the system records an audit event. The customer-facing booking response uses the current approved contact projection while preserving booking and payment history.

## Location Provider Situations

LocationIQ requests use a timeout and bounded retry policy. A normalized cache key is checked before the provider call. A cached response can be returned with a freshness indicator. If no cache exists, the API returns a clear provider-unavailable response instead of fabricating coordinates or silently using stale data.

## Notification Situations

Payment confirmation and manual driver assignment are persisted as domain events before notification delivery. WhatsApp and email workers consume those events. Driver assignment is never automatic and never customer-selected. Each delivery has a provider message ID, attempt count, last error, and next retry time. Repeated jobs use a deterministic notification key to prevent duplicate customer messages.

A notification failure must not reverse a confirmed payment or booking. Operations must be able to resend a message manually through an authorized action.

## Client Reconnection

The customer website and admin panel use REST as the authoritative interaction model. If a request times out, the client retries only safe or idempotent operations and then refreshes the booking from REST. Notifications are hints; users must retrieve current state from the API.

## Consistency Model

| Data | Required consistency |
|---|---|
| Payment amount and status | Strong, transactional |
| Booking lifecycle | Strong, transactional |
| Driver assignment | Strong, conflict-detected |
| Location autocomplete | Eventually consistent cache |
| Notifications | At-least-once delivery with deduplication |
| Analytics | Eventual consistency |

## Observability and Alerts

Alert on payment webhook signature failures, repeated webhook duplicates, payment-to-booking mismatch, notification failure rate, database latency, cache miss spikes, provider timeout rate, unpublished-content leakage, and review moderation failures. Each alert should include a request ID, event ID, booking or driver identifier, and a safe remediation hint.

## Recovery Principles

The system must prefer a visible pending state over an incorrect success state. Financial state is recovered from the provider and payment ledger. Booking, assignment, driver contact, catalog, and moderation state are recovered from PostgreSQL. Optional cache and raw provider records may be rebuilt or expired.

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"
[2]: FRAME.md "Backend System Frame — SK Baghel Tour & Travels"
[3]: MODELS.md "Backend Data Models — SK Baghel Tour & Travels"

The real-time channels and failure controls in this document extend [1], using the system boundaries in [2] and persistence rules in [3].
