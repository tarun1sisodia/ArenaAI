# Backend Implementation Plan — SK Baghel Tour & Travels

**Document status:** Execution plan  
**Primary dependency:** [PHASE.md](PHASE.md)

## Objective

Deliver a secure Node.js and TypeScript backend for cab bookings, tours, airport transfers, driver dispatch, admin-managed driver assignment and contact details, and Razorpay payments. The implementation must preserve Supabase PostgreSQL as the financial and operational system of record.

## Workstreams

| Workstream | Scope | Main output |
|---|---|---|
| W1 Foundation | Runtime, repository, configuration, CI, logging | Buildable service with validated configuration |
| W2 Fare and locations | Fare rules, distance inputs, LocationIQ proxy and cache | Server-authoritative fare endpoint |
| W3 Bookings | Validation, ticket IDs, lifecycle, vouchers | Draft and verified booking flow |
| W4 Payments | Razorpay orders, signatures, idempotency, refunds | Money-safe payment integration |
| W5 Operations | Drivers, vehicles, assignment, trip status | Dispatcher and driver workflows |
| W6 Content and trust | Catalog, gallery, reviews, moderation, and audit | Admin-controlled public content | High-throughput document services |
| W7 Notifications | WhatsApp, email, voucher delivery, retries | Customer and driver communications |
| W8 Delivery | Tests, Docker, CI/CD, deployment, monitoring | Production-ready release |

## Ordered Execution

### 1. Scaffold and Configuration

Create the `backend/` service with strict TypeScript, Zod environment validation, structured logging, centralized errors, and health endpoints. Define separate development, staging, and production configuration without duplicating secrets.

### 2. Database Baseline

Apply Supabase migrations for profiles, vehicles, drivers, bookings, payments, and refunds. Add foreign keys, enum constraints, unique indexes, timestamps, and Row-Level Security policies. Create seed data only for non-sensitive development environments.

### 3. Fare and Location Services

Port the fare engine into a pure service that accepts typed input and returns a complete fare breakdown. Enforce outstation minimum-distance rules, night allowance, driver allowance, vehicle constraints, discounts, and the 28% advance formula. Proxy LocationIQ calls through the backend so provider credentials never reach the client.

### 4. Booking Service

Validate guest and authenticated booking input. Generate unique ticket IDs. Persist the complete fare snapshot with the booking so later pricing changes cannot rewrite a historical transaction. Expose booking retrieval with token or phone verification.

### 5. Payment Service

Create Razorpay orders only from the server-persisted advance amount. Store order identifiers and idempotency keys. Verify webhook signatures using the raw request body, transition payment and booking state atomically, and dispatch side effects only once.

### 6. Operations Service

Implement role-protected admin, dispatcher, and driver routes. Validate driver availability, assignment windows, trip state transitions, toll records, completion, cancellation, and refund authorization.

### 7. Scale Services

Add MongoDB Atlas after transaction workflows are stable. Introduce telemetry, geospatial indexing, LocationIQ TTL cache, and webhook forensic retention. Add Redis and BullMQ only for work that benefits from asynchronous retries or scheduling.

### 8. Verification and Deployment

Run unit, integration, contract, security, and failure-path tests. Build a multi-stage Docker image. Deploy to the selected Mumbai-region host. Configure production Razorpay webhooks, CORS, rate limits, alerts, backups, and rollback procedures.

## Definition of Done

The backend is ready for launch when all public routes in [API.md](API.md) have contract tests, all relational entities in [MODELS.md](MODELS.md) have migrations and constraints, all critical items in [BUGS.md](BUGS.md) are closed or formally accepted, and the phase exit criteria in [PHASE.md](PHASE.md) have evidence.

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"
[2]: PHASE.md "Backend Delivery Phases — SK Baghel Tour & Travels"

This plan is derived from [1] and sequenced according to [2].
