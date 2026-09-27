# Master Backend Operating Rules & Architectural Standard — SK Baghel Tour & Travels

**Document Version:** 1.0.0 (Master Canonical Rule)  
**Authority:** Single Source of Truth for all Backend Engineering, API Contracts, Database Models, Payment Flows, and Integration.  
**Target Service:** `backend/` (Node.js LTS, TypeScript, Fastify/Express, Zod, Supabase PostgreSQL, MongoDB Atlas, Razorpay).  
**Applies To:** All AI Agents, Backend Developers, and Full-Stack Integrators across all sessions.

---

## 1. Executive Summary & Purpose

This document is the **single authoritative operational rule** for the SK Baghel Tour & Travels backend. When an AI agent or engineer is handed only this single file, it contains all core directives, architectural boundaries, exact API contracts, database schemas, security guardrails, failure-recovery procedures, and frontend-to-backend integration protocols required to build and maintain the backend without drift or wrong decisions.

### Core Philosophy
1. **Financial & Transactional Truth is Absolute:** The server is the sole financial authority. The client browser is never trusted for fares, discounts, or payment states.
2. **One Owner per Data Domain:** No split-brain data models. Transactional business data, catalog content, reviews, gallery metadata, and admin audit records live in Supabase PostgreSQL; Firebase provides optional client notifications and diagnostics; MongoDB is limited to explicitly approved cache or provider-event workloads and is not required for the initial product scope.
3. **Scope is Explicit:** The product consists of a customer website and an admin panel. There is no driver app, no driver login workflow, no driver GPS telemetry, no live customer tracking, and no WebSocket telemetry channel.
4. **One Step at a Time:** Deliver backend functionality in disciplined, test-covered vertical slices. Never build speculative infrastructure before the first core transaction flow works and passes automated tests.

---

## 2. Master Document Registry & Precedence Hierarchy

The project repository contains detailed specification documents. When these documents are read or referenced, the following canonical mapping and resolution hierarchy must be obeyed.

### 2.1 Document Mapping

| Canonical Short Name | Existing Specification File | Primary Responsibility |
|---|---|---|
| `BACKEND_RULES.md` | `BACKEND_RULES.md` / `.agents/rules/BACKEND_RULES.md` | **This file — supreme behavioral and engineering law** |
| `ARCH_PLAN.md` | `BACKEND_ARCHITECTURE_PLAN.md` | Master system architecture and technical vision |
| `API.md` | `Backend API Contract — SK Baghel Tour & Travels.md` | REST API routes, schemas, rate limits, error codes |
| `MODELS.md` | `Backend Data Models — SK Baghel Tour & Travels.md` | PostgreSQL relational DDL and MongoDB schemas |
| `PLAN.md` | `Backend Implementation Plan — SK Baghel Tour & Travels.md` | Phased implementation workstreams and milestones |
| `PROGRESS.md` | `Backend Progress — SK Baghel Tour & Travels.md` | Working task tracker and completed milestones |
| `WORKFLOW.md` | `Backend Starting Approach — Engineer Workflow.md` | Thin vertical slice discipline and engineer loop |
| `FRAME.md` | `Backend System Frame — SK Baghel Tour & Travels.md` | Trust boundaries, interaction frames, and data flows |
| `BUGS.md` | `Bugs, Risks, and Technical Debt — SK Baghel Tour & Travels.md` | Living risk register, severity rules, bug mitigation |
| `CONTROLLERS.md` | `Controller Functions and Behavior — SK Baghel Tour & Travels.md` | Controller boundaries, input validation, service adapters |
| `MIGRATIONS.md` | `Database Migration and Rollback Safety — Initial Phase.md` | Expand-and-contract migrations, rollback protocols |
| `PLATFORMS.md` | `Database and Platform Decision — MongoDB, Supabase, and Firebase.md` | Boundary definitions for PostgreSQL, Mongo, and Firebase |
| `REALTIME.md` | `Real-Time Operations and Failure Handling — SK Baghel Tour & Travels.md` | Real-time channels, idempotency, edge-case failure modes |
| `TRD.md` | `Technical Requirements Document — SK Baghel Tour & Travels Backend.md` | Functional/non-functional requirements & acceptance gates |
| `GALLERY_REVIEWS_ADMIN.md` | `Gallery, Verified Reviews, and Admin Management — Architecture Refinement.md` | Catalog content, gallery media, review moderation, verification, and admin CRUD |

### 2.2 Conflict Resolution Hierarchy
If any specification file appears to conflict with another, resolve in this exact order:
1. `BACKEND_RULES.md` (This document overrides all others).
2. `docs/PAYMENT_SYSTEM.md` + `.agents/rules/PAYMENT_AGENT_RULES.md` (Zero-miss financial payment gateway rules).
3. `BACKEND_ARCHITECTURE_PLAN.md` (Canonical system architecture).
4. `TRD.md` (Formal technical and business requirements).
5. Feature-specific specs (`API.md`, `MODELS.md`, `CONTROLLERS.md`, `REALTIME.md`, `MIGRATIONS.md`).
6. Tracking & Planning (`PLAN.md`, `PROGRESS.md`, `BUGS.md`).

---

## 3. The 10 Golden Laws of the Backend

Every line of code written for the backend must comply with these ten non-negotiable laws:

### Law 1: Dual-Database Separation of Concerns (Zero Split Truth)
- **Supabase (PostgreSQL 16):** The **System of Record** for all financial, customer, fleet, and operational transactions: `profiles`, `vehicles`, `drivers`, `bookings`, `payments`, `refunds`. Payment records must support multiple providers, currencies, provider order IDs, provider payment IDs, webhook event IDs, and reconciliation status. All relational data must have strict foreign keys, check constraints, and Row-Level Security (RLS) enabled.
- **MongoDB Atlas:** Optional infrastructure for explicitly approved high-throughput or retention-managed documents such as LocationIQ cache entries and raw provider webhook payloads. MongoDB is not required for the initial customer website and admin panel, and it never holds the financial ledger, booking state, catalog truth, review moderation state, or driver records.
- **Firebase:** Optional client notification and diagnostics services such as web push, Analytics, and Crashlytics where needed. Firebase is never a secondary database and never a secondary authentication system.

### Law 2: Server-Authoritative Fares (Zero Client Trust)
- The frontend client may calculate a local estimate for UI display, but the server **completely ignores** client-submitted fare totals, advances, or discounts.
- The server recalculates every fare from scratch using pure deterministic domain rules (`fareEngine.ts`).
- **Outstation Rules:** Minimum 300 km/day charging rule enforced for multi-day and outstation journeys.
- **Night Allowance:** ₹400 (or vehicle-tier rate ₹300/₹500) strictly added if travel occurs between 22:00 and 05:00.
- **Advance Deposit Formula:**
  $$\text{advanceAmount} = \max\left(500, \text{round}\left(\frac{\text{totalFare} \times 0.28}{100}\right) \times 100\right)$$
- The payment amount sent to a provider is derived from the persisted server-calculated amount, never from client input.
- The initial payment collection is for the booking advance only. Driver selection is not offered to customers; an admin manually assigns a driver after payment and sends the driver details through WhatsApp.

### Law 3: Provider-Verified Payment Confirmation
- A client-side payment success callback or browser redirect **never** marks a booking as `paid_confirmed`. A return redirect only instructs the frontend to poll the backend.
- A booking is marked `paid_confirmed` only after a valid server-to-server provider event or provider API verification is received for the exact booking, amount, currency, and provider order/payment identifier.
- Each provider uses its own signature or verification mechanism: Razorpay webhook HMAC, PayPal webhook signature verification or server API capture verification, and the selected card processor's signed webhook or server-side payment-intent verification.

### Law 4: Strict Idempotency & Replay Defense
- Every webhook delivery, payment creation, refund initiation, and trip transition must carry or compute an idempotency key.
- Webhook deliveries must record `eventId` in `raw_webhooks` / `payments.idempotency_key`.
- If an event has already been processed, return `HTTP 200 OK` immediately without repeating side effects (no duplicate notifications, no duplicate driver dispatches, no ledger mutations).

### Law 5: Thin Controllers & Pure Domain Layer
- **Controllers** are strictly HTTP adapters: parse input with Zod, verify identity/role, pass typed DTO to Service, format output, and catch errors.
- Controllers **must not** contain SQL queries, fare arithmetic, payment secrets, or provider business logic.
- **Domain engines** (like `fareEngine`) must be **pure functions** without I/O, database access, or framework dependencies, making them 100% unit-testable.

### Law 6: Versioned Expand-and-Contract Migrations
- All PostgreSQL schema modifications must be committed as versioned SQL migration files (`migrations/0001_...sql`).
- Never perform destructive changes in a single deployment. Always follow:
  $$\text{Expand (add nullable/table)} \longrightarrow \text{Backfill} \longrightarrow \text{Switch Application} \longrightarrow \text{Contract (drop old)}$$
- Zero manual table edits in Supabase dashboard for staging or production.

### Law 7: Privacy by Design & Redaction (DPDP Act 2023)
- In public responses (e.g. `GET /api/v1/bookings/:ticketId`), customer phone numbers and emails must be masked:
  - Phone: `+91 98**** **21`
  - Email: `s****@gmail.com`
- Unmasked details are visible only to authorized dispatchers, administrators, or authenticated booking owners.
- Assigned-driver contact details must be visible only to the verified customer and authorized administrators, and must be redacted from public catalog responses.
- There is no passenger live-tracking link or GPS tracking feature in this product scope.
- Zero secrets, API tokens, full webhook signatures, or plain credentials in application logs.

### Law 8: Explicit Finite State Machines
- Booking status transitions must strictly adhere to the defined state machine:
  $$\text{draft} \longrightarrow \text{pending\_payment} \longrightarrow \text{paid\_confirmed} \longrightarrow \text{driver\_assigned} \longrightarrow \text{completed}$$
  *Exceptions:* `pending_payment` $\rightarrow$ `cancelled`; `paid_confirmed` / `driver_assigned` $\rightarrow$ `refunded`.
- `paid_confirmed` means the booking advance is verified; it does not mean a driver has already been selected.
- `driver_assigned` is an admin-only transition performed manually after payment. The customer never selects a driver, vehicle, or driver option during checkout.
- Disallowed transitions must be rejected with `INVALID_TRIP_TRANSITION` (HTTP 400).

### Law 9: REST and Notifications Are the Initial Interaction Model
- REST endpoints and PostgreSQL persistence represent authoritative truth.
- The customer website and admin panel use REST for commands and reads.
- Optional email, WhatsApp, or web push notifications are delivery hints only; users retrieve authoritative booking state from REST.
- No WebSocket, Supabase Realtime, driver telemetry, or live customer tracking feature is in scope.

### Law 10: Disciplined Vertical Slice Implementation
- Build features in end-to-end vertical slices:
  $$\text{Contract (Zod)} \longrightarrow \text{Pure Rules} \longrightarrow \text{Service} \longrightarrow \text{Persistence (Migration)} \longrightarrow \text{Controller} \longrightarrow \text{Tests}$$
- Verify happy path, invalid inputs, unauthorized calls, duplicate submissions, and provider outages for each slice before proceeding to the next.

---

## 4. Repository & Directory Architecture

The backend lives in a dedicated, isolated service root: `/home/bot/Internship/ArenaAI/backend/`.

```text
backend/
├── src/
│   ├── app.ts                  # Fastify / Express app factory & middleware wiring
│   ├── server.ts               # Process startup, graceful shutdown, port binding
│   ├── config/                 # Environment & external client singletons
│   │   ├── env.ts              # Zod validation of process.env (fails fast at startup)
│   │   ├── supabase.ts         # Supabase client (service role for admin/worker)
│   │   ├── mongo.ts            # Mongoose client & connection pooling
│   │   ├── razorpay.ts         # Razorpay SDK singleton
│   │   └── logger.ts           # Structured Pino/Winston logger with secret redaction
│   ├── middlewares/            # Cross-cutting HTTP handlers
│   │   ├── requestId.ts        # Injects unique req_UUID into context & headers
│   │   ├── rawBodySaver.ts     # Preserves raw Buffer for Razorpay HMAC verification
│   │   ├── authGuard.ts        # Validates Supabase JWT & populates req.user
│   │   ├── roleGuard.ts        # Enforces RBAC (customer, content_editor, moderator, dispatcher, finance, super_admin)
│   │   ├── rateLimiter.ts      # IP / User rate limiting
│   │   └── errorHandler.ts     # Formats all errors into canonical API error schema
│   ├── modules/                # Feature domain modules
│   │   ├── fares/              # Server-authoritative fare calculator
│   │   │   ├── fare.schema.ts
│   │   │   ├── fare.types.ts
│   │   │   ├── fare.engine.ts  # Pure deterministic calculation function
│   │   │   ├── fare.service.ts
│   │   │   ├── fare.controller.ts
│   │   │   └── fare.routes.ts
│   │   ├── locations/          # LocationIQ proxy & MongoDB cache
│   │   │   ├── location.schema.ts
│   │   │   ├── location.service.ts
│   │   │   ├── location.controller.ts
│   │   │   └── location.routes.ts
│   │   ├── bookings/           # Booking draft, persistence & voucher retrieval
│   │   │   ├── booking.schema.ts
│   │   │   ├── booking.types.ts
│   │   │   ├── booking.service.ts
│   │   │   ├── booking.controller.ts
│   │   │   └── booking.routes.ts
│   │   ├── payments/           # Provider-neutral checkout and webhook reconciliation
│   │   │   ├── payment.schema.ts
│   │   │   ├── payment.service.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── payment.webhook.ts
│   │   │   └── payment.routes.ts
│   │   ├── dispatch/           # Manual admin driver assignment and WhatsApp contact delivery
│   │   │   ├── dispatch.schema.ts
│   │   │   ├── dispatch.service.ts
│   │   │   ├── dispatch.controller.ts
│   │   │   └── dispatch.routes.ts
│   │   ├── catalog/              # Rides, tours, packages, gallery, and reviews
│   │   ├── catalog.schema.ts
│   │   ├── catalog.service.ts
│   │   ├── catalog.controller.ts
│   │   └── catalog.routes.ts
│   ├── admin/                # CRUD, moderation, roles, and audit logs
│   │   ├── admin.service.ts
│   │   ├── admin.controller.ts
│   │   └── admin.routes.ts
│   └── notifications/      # WhatsApp Cloud API & transactional email
│   │       ├── notification.types.ts
│   │       ├── whatsapp.service.ts
│   │       └── email.service.ts
│   ├── providers/              # Abstract external interfaces & concrete adapters
│   │   ├── PaymentProvider.ts
│   │   ├── GeocodingProvider.ts
│   │   └── MessagingProvider.ts
│   └── types/                  # Shared domain types & express/fastify augments
├── tests/
│   ├── unit/                   # Pure business logic tests (zero I/O)
│   ├── integration/            # Supertest + test database tests
│   └── contract/               # Route schema & response shape assertions
├── migrations/                 # Versioned PostgreSQL DDL files
├── scripts/                    # Non-production seed & utility scripts
├── .env.example                # Canonical environment template
├── Dockerfile                  # Multi-stage production container build
├── package.json
└── tsconfig.json
```

---

## 5. Complete Database Schemas (DDL & Mongoose)

### 5.1 Supabase PostgreSQL DDL (`migrations/0001_initial_schema.sql`)

```sql
-- PostgreSQL 16 extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE trip_type_enum AS ENUM ('one-way', 'round-trip', 'local-tour', 'airport-transfer');
CREATE TYPE vehicle_tier_enum AS ENUM ('sedan', 'ertiga', 'innova-crysta', 'tempo-traveller', 'urbania');
CREATE TYPE booking_status_enum AS ENUM (
    'draft', 
    'pending_payment', 
    'paid_confirmed', 
    'driver_assigned', 
    'in_transit', 
    'completed', 
    'cancelled', 
    'refunded'
);
CREATE TYPE payment_status_enum AS ENUM ('pending', 'captured', 'failed', 'refunded');
CREATE TYPE user_role_enum AS ENUM ('customer', 'driver', 'dispatcher', 'super_admin');

-- 1. Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    role user_role_enum NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Vehicles Fleet Table
CREATE TABLE vehicles (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'sedan-dzire-01'
    tier vehicle_tier_enum NOT NULL,
    name TEXT NOT NULL,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    seating_capacity INT NOT NULL CHECK (seating_capacity > 0),
    luggage_capacity INT NOT NULL CHECK (luggage_capacity >= 0),
    per_km_rate NUMERIC(6, 2) NOT NULL CHECK (per_km_rate > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Drivers Table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    police_verified BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_vehicle_id VARCHAR(50) REFERENCES vehicles(id) ON DELETE SET NULL,
    current_status VARCHAR(20) NOT NULL DEFAULT 'available', -- 'available', 'on_trip', 'off_duty'
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 1.0 AND rating <= 5.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Bookings Master Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(30) NOT NULL UNIQUE, -- 'AGR-YYYYMMDD-XXXX'
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    guest_access_token VARCHAR(64) NOT NULL, -- Secure token for guest booking access
    
    -- Trip definition
    trip_type trip_type_enum NOT NULL,
    vehicle_tier vehicle_tier_enum NOT NULL,
    origin_name TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    pickup_address TEXT NOT NULL,
    drop_address TEXT,
    pickup_datetime TIMESTAMPTZ NOT NULL,
    return_datetime TIMESTAMPTZ,
    flight_train_number VARCHAR(50),
    distance_km NUMERIC(8, 2) NOT NULL CHECK (distance_km > 0),
    
    -- Customer contact snapshot
    customer_name TEXT NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    
    -- Immutable financial snapshot (All amounts in INR)
    base_fare NUMERIC(10, 2) NOT NULL CHECK (base_fare >= 0),
    night_allowance NUMERIC(8, 2) NOT NULL DEFAULT 0.00 CHECK (night_allowance >= 0),
    driver_allowance NUMERIC(8, 2) NOT NULL DEFAULT 0.00 CHECK (driver_allowance >= 0),
    discount_amount NUMERIC(8, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    promo_code VARCHAR(30),
    total_fare NUMERIC(10, 2) NOT NULL CHECK (total_fare > 0),
    advance_amount NUMERIC(10, 2) NOT NULL CHECK (advance_amount >= 500),
    balance_amount NUMERIC(10, 2) NOT NULL CHECK (balance_amount >= 0),
    fare_rules_version VARCHAR(20) NOT NULL DEFAULT 'v1',
    
    -- Operational state
    status booking_status_enum NOT NULL DEFAULT 'pending_payment',
    version INT NOT NULL DEFAULT 1, -- Optimistic locking counter
    assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    assigned_vehicle_id VARCHAR(50) REFERENCES vehicles(id) ON DELETE SET NULL,
    special_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_ticket_id ON bookings(ticket_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_customer_phone ON bookings(customer_phone);
CREATE INDEX idx_bookings_pickup_datetime ON bookings(pickup_datetime);

-- 5. Payments Master Table (Money Movement Ledger)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_signature VARCHAR(255),
    
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    currency VARCHAR(5) NOT NULL DEFAULT 'INR',
    status payment_status_enum NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    vpa VARCHAR(100),
    bank VARCHAR(100),
    fee_paise BIGINT DEFAULT 0,
    tax_paise BIGINT DEFAULT 0,
    
    idempotency_key VARCHAR(100) UNIQUE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(razorpay_order_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);

-- 6. Refunds Table
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    razorpay_refund_id VARCHAR(100) UNIQUE,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'processed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Device Registrations (FCM Push Delivery)
CREATE TABLE device_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    device_id VARCHAR(100) NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
    fcm_token TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);
```

### 5.2 Optional MongoDB Schemas

MongoDB is optional in the current customer-website and admin-panel scope. If enabled later, it may store LocationIQ cache entries, raw provider webhook payloads, or analytics buffers. It must not store driver GPS telemetry, live-tracking data, catalog truth, review moderation state, or payment state.

---

## 6. Detailed API Specifications & Boundary Contracts

Base URL: `/api/v1`  
All response formats conform strictly to:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    requestId: string;
    details?: any[];
  };
}
```

### 6.1 Route Inventory

| Method | Path | Auth Required | Rate Limit | Description |
|---|---|---|---|---|
| `GET` | `/health` | None | None | Liveness check (process up) |
| `GET` | `/ready` | None | None | Readiness check (DB connected) |
| `POST` | `/fares/calculate` | None | 60/min | Server fare recomputation |
| `GET` | `/locations/autocomplete` | None | 60/min | Proxied LocationIQ with cache |
| `POST` | `/bookings/draft` | None | 30/min | Validates & creates draft booking |
| `POST` | `/payments/create-checkout` | Booking Token | 20/min | Generates provider checkout for the booking advance |
| `POST` | `/payments/webhooks/:provider` | Provider signature | None | Authoritative provider event receiver |
| `GET` | `/bookings/:ticketId` | Guest Token / Phone | 60/min | Fetches masked booking voucher |
| `POST` | `/inquiries` | None | 5/min | Lead capture for custom tours |
| `GET` | `/ops/admin/bookings` | Admin/Dispatcher JWT | 60/min | Paginated dispatch operations view |
| `PATCH` | `/ops/admin/bookings/:id/assign` | Admin/Dispatcher JWT | 30/min | Manually assigns driver after payment |
| `POST` | `/ops/admin/refunds` | Super Admin JWT | 10/min | Processes provider-specific cancellation refund |
| `GET` | `/catalog/:slug` | None | 60/min | Published ride, tour, or package with gallery and reviews |
| `POST` | `/reviews` | Guest Token / Customer JWT | 10/min | Submit review for moderation |
| `GET` | `/ops/admin/catalog` | Content Admin JWT | 60/min | List catalog items |
| `POST` | `/ops/admin/catalog` | Content Admin JWT | 30/min | Create ride, tour, or package |
| `PATCH` | `/ops/admin/catalog/:id` | Content Admin JWT | 30/min | Update catalog draft or version |
| `POST` | `/ops/admin/catalog/:id/publish` | Super Admin JWT | 20/min | Publish approved catalog content |
| `POST` | `/ops/admin/catalog/:id/media` | Content Admin JWT | 30/min | Attach gallery media metadata |
| `GET` | `/ops/admin/reviews` | Review Moderator JWT | 60/min | List reviews for moderation |
| `POST` | `/ops/admin/reviews/:id/approve` | Review Moderator JWT | 30/min | Approve a review |
| `POST` | `/ops/admin/reviews/:id/reject` | Review Moderator JWT | 30/min | Reject a review with reason |
| `POST` | `/ops/admin/reviews/:id/publish` | Super Admin JWT | 20/min | Publish an approved review |
| `GET` | `/ops/admin/audit-logs` | Super Admin JWT | 30/min | Inspect admin changes |

### 6.2 Key Request & Response Zod Schemas

#### 1. Fare Calculation (`POST /api/v1/fares/calculate`)
```typescript
export const CalculateFareSchema = z.object({
  tripType: z.enum(['one-way', 'round-trip', 'local-tour', 'airport-transfer']),
  vehicleTier: z.enum(['sedan', 'ertiga', 'innova-crysta', 'tempo-traveller', 'urbania']),
  originName: z.string().min(2),
  destinationName: z.string().min(2),
  pickupDatetime: z.string().datetime(),
  returnDatetime: z.string().datetime().optional(),
  distanceKm: z.number().positive(),
  promoCode: z.string().optional(),
});
```

#### 2. Booking Draft (`POST /api/v1/bookings/draft`)
```typescript
export const CreateDraftBookingSchema = z.object({
  tripType: z.enum(['one-way', 'round-trip', 'local-tour', 'airport-transfer']),
  vehicleTier: z.enum(['sedan', 'ertiga', 'innova-crysta', 'tempo-traveller', 'urbania']),
  originName: z.string().min(2),
  destinationName: z.string().min(2),
  pickupAddress: z.string().min(5),
  dropAddress: z.string().optional(),
  pickupDatetime: z.string().datetime(),
  returnDatetime: z.string().datetime().optional(),
  distanceKm: z.number().positive(),
  customerName: z.string().min(2),
  customerPhone: z.string().regex(/^\+?[0-9]{10,14}$/, "Valid phone number required"),
  customerEmail: z.string().email().optional(),
  flightTrainNumber: z.string().optional(),
  specialNotes: z.string().max(500).optional(),
  promoCode: z.string().optional(),
});
```

#### 3. Payment Checkout Creation (`POST /api/v1/payments/create-checkout`)
```typescript
export const CreatePaymentCheckoutSchema = z.object({
  ticketId: z.string().regex(/^AGR-[0-9]{8}-[0-9]{4}$/),
  guestAccessToken: z.string().min(16),
  idempotencyKey: z.string().uuid(),
});
```

---

## 7. Payment Verification & Webhook Invariant (Razorpay)

### 7.1 Webhook Verification Routine
```typescript
import crypto from "crypto";

export function verifyRazorpayWebhook(
  rawBody: Buffer,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret || !rawBody) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(signature, "utf8")
  );
}
```

### 7.2 Webhook Handling Sequence
1. **Raw Body Preserved:** Express/Fastify must preserve the raw `Buffer` before JSON parsing.
2. **Signature Check:** Verify `X-Razorpay-Signature`. If invalid, log warning with `req_id` and return `401 Unauthorized`.
3. **Idempotency Guard:** Extract `event.payload.payment.entity.id` and `event.id`. Check if already recorded in `payments` or `raw_webhooks`. If yes, return `HTTP 200 OK` immediately.
4. **Database Transaction:**
   - Verify that `payment.entity.amount` matches `bookings.advance_amount * 100`.
   - Update `payments` row: set `status = 'captured'`, `razorpay_payment_id`, `verified_at = NOW()`.
   - Update `bookings` row: set `status = 'paid_confirmed'`, `updated_at = NOW()`.
5. **Asynchronous Dispatch:** Emit non-blocking domain events for WhatsApp voucher dispatch and customer email confirmation.

---

## 8. Frontend-to-Backend Integration Guide

### 8.1 Environment Alignment
- **React Frontend (`react/`):**
  - Uses `VITE_API_BASE_URL` (defaults to `http://localhost:4000/api/v1` in dev, or `/api/v1` in production).
  - In development, `react/vite.config.ts` proxies `/api` requests to `http://localhost:4000`.
- **Backend API (`backend/`):**
  - Runs on `PORT=4000` (configurable via `.env`).
  - CORS configured to allow `http://localhost:5173`, `http://localhost:3000`, and `https://agraskbagheltourandtravels.com`.

### 8.2 Frontend End-to-End Flow Mapping

```text
Customer Website                         Backend API / Providers
================                         ======================
1. Customer enters trip details --------> POST /api/v1/bookings/draft
                                          Server recalculates fare and advance
                                          <-------- ticket, token, advance amount

2. Customer chooses an allowed payment --> POST /api/v1/payments/create-checkout
   method: Razorpay, PayPal, or card      Backend creates provider checkout
                                          <-------- checkout URL or public token

3. Customer completes provider checkout
4. Browser returns and polls -----------> GET /api/v1/bookings/:ticketId
                                          Provider webhook/server verification arrives
                                          <-------- pending or paid_confirmed

5. After payment, customer waits for admin assignment.
6. Admin manually assigns driver --------> PATCH /api/v1/ops/admin/bookings/:id/assign
7. Admin sends approved driver details --> POST /api/v1/ops/admin/bookings/:id/notify-driver
8. Customer receives WhatsApp message and can view verified booking details.
```

---

## 9. Operating Protocol for AI Agents & Developers

When implementing backend steps:
1. **Implement exactly one vertical slice** from `PLAN.md` / `PROGRESS.md`.
2. **Never commit mock code** for payment verification or fare engines.
3. **Execute test verification** before declaring any step complete:
   - `npm run test:unit`
   - `npm run test:contract`
   - `npm run typecheck`
4. **Update `PROGRESS.md`** after every step: mark checkbox `[x]`, record timestamp, and append session notes.
5. **Preserve Frontend Design Locks:** Do not modify locked frontend components in `react/` unless required for the API contract handshake. Always observe `DESIGN_LOCKS.md`.

---

## References

- [`BACKEND_ARCHITECTURE_PLAN.md`](BACKEND_ARCHITECTURE_PLAN.md) — Master Architecture Document
- [`API.md`](API.md) — Canonical API Contract Specification
- [`MODELS.md`](MODELS.md) — Canonical Data Models Specification
- [`PLAN.md`](PLAN.md) — Phased Implementation Plan
- [`PROGRESS.md`](PROGRESS.md) — Living Implementation Tracker
- [`BUGS.md`](BUGS.md) — Risk and Defect Register
- [`docs/PAYMENT_SYSTEM.md`](docs/PAYMENT_SYSTEM.md) — Razorpay Zero-Miss Payment Gateway Specification
- [`.agents/rules/PAYMENT_AGENT_RULES.md`](.agents/rules/PAYMENT_AGENT_RULES.md) — Financial Security Rules
