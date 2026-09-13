# Technical Requirements Document — SK Baghel Tour & Travels Backend

**Document version:** 1.0.0  
**Status:** Implementation baseline  
**Author:** Manus AI  
**Related documents:** [BACKEND_ARCHITECTURE_PLAN.md](BACKEND_ARCHITECTURE_PLAN.md), [API.md](API.md), [MODELS.md](MODELS.md), [REALTIME.md](REALTIME.md), [GALLERY_REVIEWS_ADMIN.md](GALLERY_REVIEWS_ADMIN.md)

## 1. Purpose

This Technical Requirements Document defines the functional, non-functional, integration, security, data, and operational requirements for the SK Baghel Tour & Travels backend. The backend supports a customer booking website, an admin panel, cab bookings, outstation trips, tour packages, airport transfers, admin dispatch, catalog management, gallery content, verified reviews, notifications, and secure advance payments. It does not include a driver app, driver login, GPS telemetry, WebSocket telemetry, or live customer tracking.

## 2. Scope

The system includes a Node.js and TypeScript API, Supabase PostgreSQL, Supabase Auth and Storage, MongoDB Atlas for scale-phase document workloads, Razorpay payments, LocationIQ geocoding, WhatsApp or Twilio messaging, transactional email, and deployment automation.

The system does not delegate fare authority to the browser. It does not use MongoDB as the financial ledger. It does not mark a booking paid solely because a browser return URL reports success.

## 3. Users and Roles

| Role | Required capabilities |
|---|---|
| Customer | Calculate fares, create bookings, pay an advance, view verified booking details |
| Dispatcher or admin | View operational bookings, assign drivers and vehicles, and manage driver contact details |
| Content editor or moderator | Manage catalog, gallery media, and review moderation |
| Super administrator | Manage configuration, issue authorized refunds, access sensitive operational functions |

## 4. Functional Requirements

### FR-001 Fare Calculation

The API shall calculate fares on the server using trip type, vehicle tier, distance, dates, allowances, and valid promotions. It shall enforce the outstation 300 km/day minimum, night allowances, driver allowances, vehicle constraints, and configured tour rules.

### FR-002 Advance Payment

The API shall calculate the advance as 28% of the server-calculated total, rounded according to the approved paise formula and subject to a minimum of ₹500. Razorpay amounts shall be sent in paise.

### FR-003 Draft Booking

The API shall validate booking input, generate a unique ticket in the `AGR-YYYYMMDD-XXXX` format, store an immutable fare snapshot, and create a pending-payment booking.

### FR-004 Payment Verification

The API shall create provider checkouts server-side for Razorpay, PayPal, and an approved international card processor. It shall mark a booking `paid_confirmed` only after signed webhook verification or server-side provider verification for the exact booking, amount, and currency. It shall persist provider IDs and prevent duplicate processing.

### FR-005 Booking Retrieval

The API shall return verified booking and voucher details through a ticket, token, or phone-verification flow. Public responses shall mask personal contact information.

### FR-006 Dispatch

Authorized admin or dispatcher users shall be able to filter paid bookings and manually assign a driver after payment. The customer shall not select a driver or vehicle. The system shall record the assignment actor, timestamp, note, optional vehicle, and WhatsApp notification status.

### FR-007 Driver Contact and Assignment

Authorized administrators shall be able to manually assign a driver after payment and optionally associate a vehicle. The system shall share only approved basic driver contact details with the verified customer through an admin-triggered WhatsApp message or verified booking response. There shall be no driver application, driver JWT, GPS telemetry, or live tracking.

### FR-008 Notifications

The system shall send payment confirmation and driver-assignment notifications through configured WhatsApp and email providers. Delivery shall be retryable and shall not alter financial truth.

### FR-009 Refunds

Super administrators shall be able to create authorized refunds with a reason. Refund operations shall be idempotent and shall record the provider refund ID and resulting booking state.

### FR-010 Catalog Management

Authorized administrators shall be able to create, update, preview, publish, and archive rides, tours, packages, vehicle options, fare rules, promo codes, itineraries, inclusions, exclusions, and FAQs. Published content shall use a controlled status transition and version identifier.

### FR-011 Gallery Management

Authorized content administrators shall be able to upload or associate validated gallery media with a ride, tour, or package, edit captions and alt text, reorder assets, publish approved assets, and archive obsolete assets. Media files shall be stored in Supabase Storage and metadata shall be stored in Supabase PostgreSQL.

### FR-012 Verified Reviews

Customers shall be able to submit ratings and reviews for moderation. Administrators shall be able to link a review to a completed booking, inspect a voluntarily submitted public social profile URL, record a private verification note, approve or reject the review, and publish or archive it. Public verification labels shall not claim endorsement by a social-media provider.

### FR-013 Administrative Auditability

Every administrative mutation shall record actor, role, resource, action, timestamp, request ID, and safe before-and-after values. Financial records, completed bookings, and historical fare snapshots shall not be freely overwritten through CRUD endpoints.

## 5. Data Requirements

Supabase PostgreSQL shall store profiles, vehicles, drivers, bookings, payments, and refunds. Supabase Auth shall own identity. Supabase Storage shall store driver documents, vehicle inspections, and invoices.

MongoDB Atlas is optional and may store LocationIQ cache entries, raw webhook payloads, or analytics buffers when the scale phase is activated. No driver telemetry, GPS, geospatial tracking, or live-location data is stored.

All financial amounts shall use explicit currency fields. Payment ledger amounts shall be integers in paise. Database constraints shall enforce unique provider IDs, ticket IDs, phone numbers where required, and idempotency keys.

## 6. API Requirements

The API shall expose the routes defined in [API.md](API.md). It shall use versioned paths under `/api/v1`, JSON contracts, Zod boundary validation, stable error codes, request IDs, authentication middleware, role guards, rate limiting, and centralized error handling.

Public catalog endpoints shall return only published catalog content, gallery media, and reviews. Moderation notes, verification URLs when restricted by policy, private customer data, and rejected content shall not appear in public responses.

The public booking and fare routes shall be limited to 60 requests per minute per IP. Inquiry capture shall be limited to 5 requests per minute per IP. The payment webhook shall require strict signature verification and may additionally use provider network controls.

## 7. Interaction and Notification Requirements

The initial product shall use REST for customer website and admin-panel commands and reads. Optional WhatsApp, email, or web push notifications may inform customers about booking confirmation and driver assignment, but notifications are not authoritative. Customers retrieve authoritative booking state and approved driver contact details from the API.

There shall be no WebSocket telemetry, driver GPS ingestion, live location map, driver app, or passenger tracking link. Payment, booking, assignment, and refund events shall use strong consistency and idempotent processing. Detailed behavior is specified in [REALTIME.md](REALTIME.md).

## 8. Security Requirements

Secrets shall exist only in managed environment variables. The service shall protect the Supabase service-role key, Razorpay secret, MongoDB URI, LocationIQ token, and messaging credentials. Logs shall redact secrets, signatures, tokens, and unmasked personal data.

The API shall enforce TLS in deployed environments, restrictive CORS, JWT verification, role-based authorization, request validation, rate limiting, payload limits, and safe error responses. Assigned-driver contact details shall be restricted to verified customers and authorized administrators. Access to raw provider payloads shall be restricted.

## 9. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Availability | Design for 99.5% monthly API availability during the initial production phase |
| API latency | p95 under 500 ms for ordinary database-backed reads, excluding provider outages |
| Fare response | p95 under 800 ms when the location provider is cached or not required |
| Webhook response | Acknowledge valid duplicate or accepted events within 2 seconds |
| Notification delivery | Queue and retry customer and admin notifications without blocking transaction commits |
| Durability | Payment and booking transitions must be transactional and recoverable |
| Observability | Request IDs, structured logs, metrics, health checks, and actionable alerts |
| Recovery | Documented backup, restore, replay, and rollback procedures |
| Maintainability | Strict TypeScript, zero intentional `any` in domain code, typed contracts, and migration review |

## 10. Testing Requirements

The implementation shall include unit tests for fare rules and state transitions, integration tests for Supabase repositories, contract tests for all API routes, payment tests for Razorpay, PayPal, and the selected card processor in sandbox mode, webhook signature and replay tests, amount/currency mismatch tests, authorization tests, catalog and review moderation tests, media publication tests, notification retry tests, and admin audit-log tests.

Release verification shall include altered fare requests, duplicate booking attempts, duplicate webhooks, invalid signatures, payment-provider downtime, LocationIQ timeout, concurrent assignment, unauthorized admin actions, unpublished-content leakage, review moderation errors, and refund replay.

## 11. Deployment Requirements

The API shall run as a reproducible Node.js service using a multi-stage Docker build. CI shall execute formatting, linting, type checking, tests, and image build checks. Production deployment should use a Mumbai-region host such as Render, Railway, or Fly.io, with production environment variables, health checks, logs, alerts, and rollback support.

Razorpay live webhooks shall point to the production HTTPS endpoint only after test-mode verification and launch approval. MongoDB Atlas shall be enabled only when the scale-phase acceptance criteria are met.

## 12. Acceptance Criteria

The backend is acceptable for initial production use when a customer can calculate a fare, create a draft booking, pay the booking advance using Razorpay, PayPal, or an approved international card checkout, receive a provider-verified payment state, and retrieve a verified voucher. An admin can later manually assign a driver and send the approved driver details through WhatsApp. An authorized admin must be able to manage catalog content, fares, gallery assets, reviews, drivers, and operational bookings. Invalid, duplicate, unauthorized, unpublished-content, and provider-failure scenarios must produce safe, test-covered outcomes.

## 13. Traceability

| Requirement area | Primary implementation reference |
|---|---|
| Controller behavior | [CONTROLLERS.md](CONTROLLERS.md) |
| API routes | [API.md](API.md) |
| Data structures | [MODELS.md](MODELS.md) |
| Real-time and failures | [REALTIME.md](REALTIME.md) |
| Gallery, reviews, and admin CRUD | [GALLERY_REVIEWS_ADMIN.md](GALLERY_REVIEWS_ADMIN.md) |
| Delivery phases | [PHASE.md](PHASE.md) |
| Implementation tasks | [PLAN.md](PLAN.md) |
| Known risks | [BUGS.md](BUGS.md) |

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"
[2]: API.md "Backend API Contract — SK Baghel Tour & Travels"
[3]: MODELS.md "Backend Data Models — SK Baghel Tour & Travels"
[4]: REALTIME.md "Real-Time Operations and Failure Handling — SK Baghel Tour & Travels"
[5]: GALLERY_REVIEWS_ADMIN.md "Gallery, Verified Reviews, and Admin Management — Architecture Refinement"

This requirements document consolidates the architecture, API, model, real-time, and content-management requirements defined in [1], [2], [3], [4], and [5].
