# Backend Starting Approach — Engineer Workflow

**Project:** SK Baghel Tour & Travels  
**Related documents:** [BACKEND_ARCHITECTURE_PLAN.md](BACKEND_ARCHITECTURE_PLAN.md), [PLAN.md](PLAN.md), [TECHNICAL_REQUIREMENTS_DOCUMENT.md](TECHNICAL_REQUIREMENTS_DOCUMENT.md)

## 1. The Recommended Approach

Do not begin by implementing every table, controller, integration, and real-time feature at once. Engineers usually begin with a **thin vertical slice**: one complete business flow that crosses the API, validation, service, database, test, and client boundary.

For this project, the first vertical slice should be:

> **Calculate fare → create draft booking → persist booking → retrieve booking.**

After this flow works locally, add payments, then admin dispatch and driver contact sharing, then catalog and review moderation. This keeps the backend modifiable because each feature is completed through all layers before the next feature is added.

## 2. Start with a Clear Repository Structure

Create the backend as an independent service with its own package configuration and test command.

```text
backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── middlewares/
│   ├── modules/
│   │   ├── fares/
│   │   ├── bookings/
│   │   ├── payments/
│   │   ├── dispatch/
│   │   ├── catalog/
│   │   ├── admin/
│   │   └── notifications/
│   ├── db/
│   ├── providers/
│   ├── types/
│   └── shared/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── contract/
├── migrations/
├── scripts/
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile
```

Keep business features in modules. Avoid a large global `controllers/`, `services/`, or `utils/` directory where unrelated logic becomes difficult to find.

A feature module should normally contain:

```text
fares/
├── fare.schema.ts       # Zod request and response schemas
├── fare.types.ts        # TypeScript domain types
├── fare.engine.ts       # Pure business rules
├── fare.service.ts      # Use-case orchestration
├── fare.controller.ts   # HTTP adapter
├── fare.routes.ts       # Route registration
└── fare.test.ts         # Feature tests
```

## 3. Establish the Local Development Loop First

Before implementing business logic, make this loop reliable:

```text
Edit code
  → run formatter and type checker
  → run unit tests
  → run integration tests
  → start local API
  → call endpoint with curl or API client
  → inspect logs and database state
```

The minimum commands should be predictable:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:integration
```

The service should expose a health endpoint before any business endpoint:

```text
GET /health
GET /ready
```

`/health` confirms that the process is running. `/ready` confirms that required dependencies, such as PostgreSQL, are available.

## 4. Use Environment Templates, Not Shared Secrets

Create `.env.example` immediately and keep actual `.env` files out of Git.

```env
NODE_ENV=development
PORT=4000
API_BASE_URL=http://localhost:4000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
LOCATIONIQ_TOKEN=
MONGODB_URI=
```

Validate environment variables at startup with Zod. The application should fail fast with a clear message if a required variable is missing. Never make a missing secret silently become an empty string.

Use separate credentials for development, test, staging, and production. Start with Razorpay test credentials and a local or development database.

## 5. Build the First Vertical Slice

### Step 1: Define the contract

Write the request, response, error, and status behavior for `POST /api/v1/fares/calculate` and `POST /api/v1/bookings/draft` before writing controllers. Keep the contract in [API.md](API.md) and implement the Zod schemas beside the feature.

### Step 2: Implement pure fare rules

The fare engine should be a pure function. Given typed input, it returns a typed fare breakdown. It should not call HTTP providers, read the database, or know about Fastify or Express.

Pure logic is the easiest part to test and modify. Add table-driven tests for one-way, round-trip, airport transfer, night allowance, minimum distance, promotions, invalid vehicle combinations, and the 28% advance formula.

### Step 3: Add the booking service

The booking service should:

1. Validate or normalize the input.
2. Obtain the required distance or location data.
3. Call the fare engine.
4. Generate a unique ticket ID.
5. Persist the booking and fare snapshot in one transaction.
6. Return a domain result to the controller.

The service owns the use case. The controller should not contain these steps.

### Step 4: Add the controller and route

The controller should parse the request, call the service, map the result to JSON, and pass errors to centralized error handling. It should not directly calculate fares or write SQL.

### Step 5: Add integration tests

Run the real route against a test database. Verify that a request creates a row, the fare values are persisted, the ticket is unique, and invalid input returns the expected error.

## 6. Introduce the Database Through Migrations

Do not manually create production tables and then attempt to reconstruct them in code. Use versioned migrations from the beginning.

A migration sequence might look like:

```text
001_enable_extensions.sql
002_create_profiles.sql
003_create_vehicles_and_drivers.sql
004_create_bookings.sql
005_create_payments_and_refunds.sql
006_add_indexes_and_rls.sql
```

Every schema change should be committed with the code that uses it. A database migration should be reviewed like source code. Add constraints in the database for important invariants such as unique ticket IDs, unique payment order IDs, valid foreign keys, and non-negative monetary values.

## 7. Add Features in Business-Value Order

Use this order rather than building infrastructure first:

| Order | Feature | Why it comes next |
|---|---|---|
| 1 | Fare calculation | Establishes the core business rules |
| 2 | Draft booking | Creates the operational record |
| 3 | Booking retrieval | Makes the first slice observable and usable |
| 4 | Razorpay test flow | Adds revenue without dispatch complexity |
| 5 | Webhook idempotency | Makes payment state safe |
| 6 | Dispatcher booking list | Enables human operations |
| 7 | Driver assignment | Connects paid bookings to fulfillment |
| 8 | Driver contact sharing | Completes the admin assignment lifecycle |
| 9 | Notifications | Automates customer and admin communication |
| 10 | Catalog CRUD | Makes rides, tours, packages, and fares editable |
| 11 | Gallery and reviews | Adds moderated trust content to public pages | Improves live visibility after REST truth works |

Each feature should be delivered as a small pull request with tests and documentation updates.

## 8. Separate Domain Logic from Providers

External services should be hidden behind adapters. For example:

```text
PaymentService
    → PaymentProvider interface
        → RazorpayAdapter

LocationService
    → GeocodingProvider interface
        → LocationIQAdapter

NotificationService
    → MessageProvider interface
        → WhatsAppAdapter / EmailAdapter
```

This allows engineers to use fakes in tests and change providers without rewriting booking logic. A provider adapter translates external errors into internal application errors.

## 9. Use PostgreSQL as the First Source of Truth

Start Phase 1 with Supabase PostgreSQL for bookings, payments, drivers, and vehicles. Do not add MongoDB, Redis, BullMQ, or real-time infrastructure before the first transaction flow is stable.

Introduce MongoDB only when cache or webhook retention has a measured need. Introduce Redis and workers when a job is slow, retryable, scheduled, or independent of the HTTP response.

This staged approach reduces the number of systems engineers must debug during the most important part of the project.

## 10. Implement State Machines Explicitly

Do not update booking status with arbitrary strings from controllers. Define allowed transitions in one place.

```text
draft → pending_payment
pending_payment → paid_confirmed
paid_confirmed → driver_assigned
 driver_assigned → in_transit
in_transit → completed
pending_payment → cancelled
paid_confirmed → refunded
```

The service must reject invalid transitions. Payment confirmation, driver assignment, trip start, completion, cancellation, and refund should each have a domain event or audit record.

## 11. Treat Real-Time Features as an Enhancement to REST

First make REST endpoints correct and authoritative. Then broadcast events after the database transaction commits. A WebSocket message should tell clients that something may have changed; it should not be the only record of the change.

The client flow should be:

```text
Receive WebSocket event
  → update display optimistically if safe
  → fetch authoritative resource from REST
  → reconcile local state
```

For driver contact data, restrict access to verified customers and authorized administrators, and record admin changes in the audit log.

## 12. Engineering Workflow for Every Feature

For each feature, follow this sequence:

1. Write or update the API contract.
2. Define or update the data model and migration.
3. Write acceptance criteria.
4. Write unit tests for business rules.
5. Implement the service.
6. Implement the controller and route.
7. Add integration and contract tests.
8. Add logs and metrics for important outcomes.
9. Update the relevant Markdown document.
10. Run the full validation suite.
11. Open a small pull request.

A feature is not complete when the endpoint responds successfully once. It is complete when the happy path, invalid input, unauthorized access, duplicate request, provider failure, and retry behavior are understood and tested.

## 13. Suggested First Two Weeks

| Period | Focus | Deliverable |
|---|---|---|
| Days 1–2 | Repository, configuration, health endpoints, CI | Service starts and validates configuration |
| Days 3–4 | Supabase migrations and database client | Schema applies repeatably |
| Days 5–7 | Fare engine and fare endpoint | Rules covered by unit and contract tests |
| Days 8–10 | Draft booking and booking retrieval | First complete vertical slice works locally |
| Days 11–12 | Razorpay test order and webhook | Payment state is verified and idempotent |
| Days 13–14 | Hardening and documentation | Tests, error handling, logs, and review complete |

Do not interpret this as a promise that the entire production system is complete in two weeks. It is a practical target for establishing the first safe, modifiable flow.

## 14. What to Avoid

Avoid starting with a large microservices architecture. Avoid putting SQL queries in controllers. Avoid storing calculated totals only in the browser. Avoid adding real-time infrastructure before a reliable REST workflow exists. Avoid changing schemas manually in production. Avoid integrating live payment credentials before test-mode webhook behavior is proven. Avoid implementing every possible vehicle, tour, and notification rule before the core booking flow is observable.

## 15. First Definition of Done

The backend has been started correctly when an engineer can clone the repository, configure `.env`, run migrations, start the API, execute tests, call the fare endpoint, create a draft booking, inspect the persisted record, and modify one fare rule without searching through unrelated modules.

That is the foundation for the remaining payment, admin dispatch, driver-contact, notification, catalog, gallery, review, and moderation flows.

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"
[2]: PLAN.md "Backend Implementation Plan — SK Baghel Tour & Travels"
[3]: TECHNICAL_REQUIREMENTS_DOCUMENT.md "Technical Requirements Document — SK Baghel Tour & Travels"

This approach follows the architecture in [1], the execution order in [2], and the requirements in [3].
