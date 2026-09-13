# Production Backend Architecture Plan — SK Baghel Tour & Travels

**Document Version:** 1.0.0 (Master Final)  
**Status:** Canonical Backend Architecture & Implementation Plan  
**Target Services:** Customer Website Booking, Outstation Cabs, Tour Packages, Airport Transfers, Admin Dispatch, Catalog Management, Verified Reviews, Gallery Content, and Secure Payments.
**Stack Alignment:** Node.js (TypeScript) + Supabase (PostgreSQL) + MongoDB Atlas + Razorpay India Gateway.

---

## 1. Executive Summary & Architectural Overview

SK Baghel Tour & Travels requires a production-grade backend to power a customer website and an administrator panel. The backend supports high-intent phone/WhatsApp inquiries, the MakeMyTrip-style 5-step booking and payment flow, admin-controlled catalog and fares, verified reviews and gallery content, chauffeur assignment, and sharing of assigned-driver contact details. There is no driver application, GPS telemetry, live customer tracking, or driver-side trip update workflow in the current scope.

### 1.1 Dual-Database Strategy: Why PostgreSQL (Supabase) + MongoDB?

Rather than forcing relational and unstructured data into a single database paradigm, our architecture leverages a **complementary dual-database model**:

```
                                  +---------------------------------------+
                                  |         Client Applications           |
                                  |  (React Web App, PWA, Mobile Shell)   |
                                  +---------------------------------------+
                                                      |
                                                      | HTTPS / REST
                                                      v
                                  +---------------------------------------+
                                  |         Node.js / TypeScript API      |
                                  |      (Fastify/Express + Zod Engine)   |
                                  +---------------------------------------+
                                         |                         |
               +-------------------------+                         +-------------------------+
               |                                                                             |
               v                                                                             v
+------------------------------------+                                     +------------------------------------+
|       Supabase (PostgreSQL)        |                                     |           MongoDB Atlas            |
|   ACID Relational Core Ledger      |                                     |    High-Throughput Document Store  |
+------------------------------------+                                     +------------------------------------+
| • Bookings & Ticket Numbers (AGR-) |                                     | • Optional provider-event logs       |
| • Payments, Advances & Refunds     |                                     | • LocationIQ Cache (30-day TTL)    |
| • Vehicle Fleet & Drivers Directory|                                     | • Raw Webhook Payloads (Forensics) |
| • Static Fares & Promo Codes       |                                     | • Optional cache and analytics buffers |
| • Supabase Auth & Row-Level Security|                                    |                                   |
| • Supabase Storage (Docs/Photos)   |                                     | • User Analytics & Funnel Metrics  |
+------------------------------------+                                     +------------------------------------+
               |                                                                             |
               +-------------------------+                         +-------------------------+
                                         |                         |
                                         v                         v
                                  +---------------------------------------+
                                  |        External Cloud Providers       |
                                  | • Razorpay (Orders, Payments, Refunds)|
                                  | • LocationIQ (Geocoding & Autocomplete|
                                  | • WhatsApp Business Cloud API / Twilio|
                                  | • Transactional Email (Resend/SES)    |
                                  +---------------------------------------+
```

| Dimension | Supabase (PostgreSQL) | MongoDB Atlas |
|---|---|---|
| **Role** | **System of Record for business and content** | **Optional document store for cache and provider events** |
| **Data Characteristics** | Structured, strongly-typed, ACID transactional, strict FKs | Unstructured/semi-structured, time-series, TTL-expiring |
| **Entities** | Bookings, Transactions, Refunds, Fleet, Drivers, Catalog, Reviews, Auth | Raw Webhook Dumps, Location Caches, Optional Logs |
| **Consistency** | Immediate consistency (`SERIALIZABLE` / `READ COMMITTED`) | Eventual consistency, high write availability |
| **Special Capabilities**| Row-Level Security (RLS), Supabase Auth, Storage | TTL retention for optional cache and provider records |

---

## 2. Phased Rollout: Initial Phase (MVP) vs. Scale Phase

To achieve the fastest time-to-market without operational complexity, we divide the rollout into two clear, non-breaking stages:

### 2.1 Initial Phase (Phase 1 — Lean, Production-Ready, Zero Maintenance)

In the initial phase, **Supabase (PostgreSQL)** serves as the primary data store, with Node.js providing the server-authoritative logic.

- **Single Primary Database:** Supabase PostgreSQL handles bookings, payments, drivers, and fleet. Unstructured payloads (raw Razorpay webhooks, LocationIQ cache entries) are temporarily stored inside PostgreSQL using `JSONB` columns with GIN indexing.
- **Node.js API Layer:** A lightweight TypeScript service handling:
  1. Server-side fare recalculation (enforcing the 300 km/day outstation rule, night allowances, and promo discounts).
  2. Provider-neutral checkout creation for the booking advance through Razorpay, PayPal, or an approved international card processor.
  3. Provider webhook signature verification and server-side reconciliation for each payment provider.
  4. WhatsApp confirmation dispatch and Email voucher delivery; driver assignment remains a later manual admin action.
  5. LocationIQ token protection (server-side proxy to protect the API token).
- **Hosting:** Node.js API hosted on **Render / Railway / Fly.io** (Mumbai region for lowest Indian latency).
- **Result:** Fully functional, secure, money-safe backend running in less than 2 weeks with near-zero infrastructure overhead.

### 2.2 Scale Phase (Phase 2 — Content, Operations, and Optional Document Workloads)

Once live transactions and catalog administration are stable:

- **Catalog and Trust Layer:** Expand admin CRUD for rides, tours, packages, fares, gallery media, verified reviews, moderation, and audit history.
- **Optional MongoDB Atlas Integration:** Activate only for measured needs such as LocationIQ caching, raw provider webhook retention, or analytics buffers. Do not introduce GPS telemetry or live tracking.
- **Message Queues (Redis + BullMQ):** Use only for asynchronous tasks such as invoice rendering, notification retries, review moderation notifications, and scheduled content publication.

---

## 3. Technology Stack & Framework Choices

### 3.1 Runtime & Framework
- **Runtime:** **Node.js v22+ LTS** (Native fetch, strict ESM, high-performance V8 engine).
- **Language:** **TypeScript 5.5+** (Strict mode enabled, zero `any` policy).
- **HTTP Framework:** **Fastify** (Recommended for 4x throughput over Express, built-in schema compilation via TypeBox/Zod, native JSON serialization) OR **Express 4.21+ with Zod**.
- **Data Validation:** **Zod** (Shared request/response contracts with frontend).
- **Database Clients:**
  - PostgreSQL: `@supabase/supabase-js` (for Auth and Storage) + `drizzle-orm` or `prisma` (for typed SQL queries and migrations).
  - MongoDB: `mongoose` or native `mongodb` driver.

### 3.2 Cloud Infrastructure & Providers
- **Relational DB & Auth:** **Supabase Cloud** (PostgreSQL 16, hosted in AWS ap-south-1 Mumbai).
- **Document DB:** **MongoDB Atlas** (M0 Free Tier initially -> M10 Dedicated cluster in AWS Mumbai).
- **Payment Providers:** Razorpay for Indian payment methods, PayPal for customers who prefer PayPal, and an approved international card processor for foreign cards. The backend uses one provider-neutral payment service and separate adapters.
- **Geocoding & Maps:** **LocationIQ Autocomplete API** (Server-side proxied).
- **Communications:** **WhatsApp Business Cloud API** (Direct Meta Graph API or Twilio) + **Resend / AWS SES** (Transactional email).
- **Object Storage:** **Supabase Storage** (Buckets: `driver-documents`, `vehicle-inspections`, `booking-invoices`).

---

## 4. Database Schema Specifications

### 4.1 PostgreSQL Schema (Supabase DDL)

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE trip_type_enum AS ENUM ('one-way', 'round-trip', 'local-tour', 'airport-transfer');
CREATE TYPE vehicle_tier_enum AS ENUM ('sedan', 'ertiga', 'innova-crysta', 'tempo-traveller', 'urbania');
CREATE TYPE booking_status_enum AS ENUM ('draft', 'pending_payment', 'paid_confirmed', 'driver_assigned', 'in_transit', 'completed', 'cancelled', 'refunded');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'captured', 'failed', 'refunded');
CREATE TYPE user_role_enum AS ENUM ('customer', 'driver', 'dispatcher', 'super_admin');

-- 1. Profiles (extending supabase auth.users)
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
    id VARCHAR(50) PRIMARY KEY, -- 'sedan', 'ertiga', etc.
    tier vehicle_tier_enum NOT NULL,
    name TEXT NOT NULL,
    plate_number VARCHAR(20) UNIQUE,
    seating_capacity INT NOT NULL,
    luggage_capacity INT NOT NULL,
    per_km_rate NUMERIC(6, 2) NOT NULL,
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
    assigned_vehicle_id VARCHAR(50) REFERENCES vehicles(id),
    current_status VARCHAR(20) NOT NULL DEFAULT 'available', -- 'available', 'on_trip', 'off_duty'
    rating NUMERIC(3, 2) DEFAULT 5.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Bookings Master Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(30) NOT NULL UNIQUE, -- 'AGR-YYYYMMDD-XXXX'
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Trip details
    trip_type trip_type_enum NOT NULL,
    vehicle_tier vehicle_tier_enum NOT NULL,
    origin_name TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    pickup_address TEXT NOT NULL,
    drop_address TEXT,
    pickup_datetime TIMESTAMPTZ NOT NULL,
    return_datetime TIMESTAMPTZ,
    flight_train_number VARCHAR(50),
    distance_km NUMERIC(8, 2) NOT NULL,
    
    -- Customer info (if guest booking)
    customer_name TEXT NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    
    -- Financial ledger (stored in INR currency)
    base_fare NUMERIC(10, 2) NOT NULL,
    night_allowance NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    driver_allowance NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    promo_code VARCHAR(30),
    total_fare NUMERIC(10, 2) NOT NULL,
    advance_amount NUMERIC(10, 2) NOT NULL, -- 28% advance paid online
    balance_amount NUMERIC(10, 2) NOT NULL, -- 72% balance paid to driver
    
    -- Operations
    status booking_status_enum NOT NULL DEFAULT 'pending_payment',
    assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    special_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for high-performance lookups
CREATE INDEX idx_bookings_ticket_id ON bookings(ticket_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_customer_phone ON bookings(customer_phone);
CREATE INDEX idx_bookings_pickup_datetime ON bookings(pickup_datetime);

-- 5. Payments Table (Ledger of money movement)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_signature VARCHAR(255),
    
    amount_paise BIGINT NOT NULL, -- Always in smallest currency unit (paise)
    currency VARCHAR(5) NOT NULL DEFAULT 'INR',
    status payment_status_enum NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50), -- 'upi', 'card', 'netbanking'
    vpa VARCHAR(100),
    bank VARCHAR(100),
    fee_paise BIGINT DEFAULT 0,
    tax_paise BIGINT DEFAULT 0,
    
    idempotency_key VARCHAR(100) UNIQUE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_provider_order ON payments(provider, provider_order_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);

-- 6. Refunds Table
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    razorpay_refund_id VARCHAR(100) UNIQUE,
    amount_paise BIGINT NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'processed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.2 Optional MongoDB Schemas

MongoDB is not required for the initial customer website and admin panel. If enabled later, use it only for explicitly approved cache, raw provider payload, or analytics-buffer collections. Do not create driver telemetry, GPS, geospatial, or live-tracking collections.

---

## 5. End-to-End Payment & Webhook Architecture (Razorpay)

In accordance with [`docs/PAYMENT_SYSTEM.md`](file:///home/bot/Internship/ArenaAI/docs/PAYMENT_SYSTEM.md) and strict financial audit rules, the client browser is **never trusted** for monetary values.

```
+---------------+              +--------------------+              +--------------------+              +--------------------+
| Client Browser|              |  Node.js API Server|              |   Supabase Postgres|              |  Razorpay Gateway  |
+---------------+              +--------------------+              +--------------------+              +--------------------+
        |                                |                                   |                                   |
        | 1. Submit Booking Details      |                                   |                                   |
        |------------------------------->|                                   |                                   |
        |                                | 2. Recompute Fare & 28% Advance   |                                   |
        |                                |    (calcFare server-side engine)  |                                   |
        |                                | 3. Create Draft Booking           |                                   |
        |                                |---------------------------------->|                                   |
        |                                |    Ticket: AGR-20260912-8821      |                                   |
        |                                |                                   | 4. Call Razorpay Orders API       |
        |                                |---------------------------------------------------------------------->|
        |                                |                                   |    amount: 140000 paise (Rs 1400) |
        |                                |                                   |    receipt: AGR-20260912-8821     |
        |                                | 5. Return order_id + public key   |<----------------------------------|
        |<-------------------------------|                                   |                                   |
        |                                |                                   |                                   |
        | 6. Open Razorpay Checkout Modal|                                   |                                   |
        |    (Customer pays via UPI/Card)|                                   |                                   |
        |                                |                                   | 7. Webhook: payment.captured      |
        |                                |<----------------------------------------------------------------------|
        |                                |    (HMAC SHA256 Signature Header) |                                   |
        |                                | 8. Verify HMAC Signature          |                                   |
        |                                | 9. Atomic Status Transition:      |                                   |
        |                                |    status -> PAID_CONFIRMED       |                                   |
        |                                |---------------------------------->|                                   |
        |                                | 10. Emit WhatsApp & Email Voucher |                                   |
        |                                |----------------------------------> (Driver/Customer Dispatch)         |
        | 11. Modal redirects to Success |                                   |                                   |
        |------------------------------->|                                   |                                   |
        | 12. Display Verified Ticket    |                                   |                                   |
        |<-------------------------------|                                   |                                   |
```

### 5.1 Key Payment Invariants
1. **Server Fare Engine Wins:** The server executes the exact TypeScript fare rules (outstation 300km/day minimums, night allowances, return Tempo Traveller mandates).
2. **Advance Formula:** `Math.round(totalFare * 0.28 / 100) * 100` (min ₹500), converted to paise (`* 100`).
3. **Webhook Over Return URL:** A booking is **only** marked `paid_confirmed` upon receiving and verifying a valid Razorpay webhook with `X-Razorpay-Signature`. The frontend return handler merely triggers a polling verification check.
4. **Idempotent Webhooks:** Every incoming webhook is checked against `raw_webhooks` / `payments.idempotency_key`. Duplicate webhook deliveries are acknowledged with HTTP 200 without executing secondary effects.

---

## 6. API Route Specification (RESTful)

### Public / Client Routes (`/api/v1`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/fares/calculate` | Server-authoritative fare estimation | No |
| `GET` | `/locations/autocomplete` | LocationIQ autocomplete with cache check | No (Server token) |
| `POST` | `/bookings/draft` | Create draft booking & calculate exact advance | No |
| `POST` | `/payments/create-checkout` | Booking Token | 20/min | Generates provider checkout for the booking advance |
| `POST` | `/payments/webhooks/:provider` | Provider signature | None | Processes signed provider event |
| `GET` | `/bookings/:ticketId` | Fetch verified booking status & voucher details | Token / Phone verify |
| `POST` | `/inquiries` | Contact and custom tour lead submission | Rate Limited |

### Driver & Dispatch Operations (`/api/v1/ops`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/admin/bookings` | Filterable dispatch master table | Admin/Dispatcher |
| `PATCH` | `/admin/bookings/:id/assign` | Assign chauffeur and vehicle to booking | Admin/Dispatcher |
| `PATCH` | `/driver/trips/:id/status` | Trip start, toll recorded, trip completed | Driver JWT |
| `POST` | `/admin/refunds` | Process cancellation refund via Razorpay | Super Admin |

---

## 7. Folder Structure for `backend/`

```
backend/
├── src/
│   ├── config/              # Environment, Supabase, Mongo, Razorpay clients
│   │   ├── env.ts           # Zod-validated process.env schema
│   │   ├── supabase.ts      # Supabase admin client
│   │   ├── mongo.ts         # Mongoose connection manager
│   │   └── razorpay.ts      # Razorpay SDK instance
│   ├── modules/             # Domain feature modules
│   │   ├── fares/           # Pure typed fare engine & distance calculator
│   │   │   ├── fareEngine.ts
│   │   │   ├── fareController.ts
│   │   │   └── fareRoutes.ts
│   │   ├── bookings/        # Booking lifecycle & ticket generation
│   │   │   ├── bookingModel.ts
│   │   │   ├── bookingService.ts
│   │   │   ├── bookingController.ts
│   │   │   └── bookingRoutes.ts
│   │   ├── payments/        # Razorpay Orders & Webhook Processor
│   │   │   ├── paymentService.ts
│   │   │   ├── webhookHandler.ts
│   │   │   └── paymentRoutes.ts
│   │   ├── locations/       # LocationIQ proxy & MongoDB caching
│   │   │   ├── locationService.ts
│   │   │   └── locationRoutes.ts
│   │   ├── catalog/              # Rides, tours, packages, gallery, and reviews
│   │   │   ├── catalogModel.ts
│   │   │   ├── catalogService.ts
│   │   │   ├── catalogController.ts
│   │   │   └── catalogRoutes.ts
│   │   ├── admin/                # Admin CRUD, moderation, roles, and audit logs
│   │   │   ├── adminService.ts
│   │   │   ├── adminController.ts
│   │   │   └── adminRoutes.ts
│   │   └── notifications/   # WhatsApp & Transactional Email
│   │       ├── whatsappService.ts
│   │       └── emailService.ts
│   ├── middlewares/         # Security, Auth, Rate Limiting, Logging
│   │   ├── authGuard.ts     # Supabase JWT validator
│   │   ├── rateLimiter.ts   # IP-based rate limiting
│   │   └── errorHandler.ts  # Centralized error handler
│   ├── types/               # Global TypeScript contracts
│   └── app.ts               # Fastify/Express app initialization
├── tests/                   # Automated unit & integration tests
├── scripts/                 # Database seed & migration utilities
├── Dockerfile               # Multi-stage optimized production build
├── package.json
└── tsconfig.json
```

---

## 8. Security, Compliance & Production Hardening

1. **Secrets Management:** Zero secrets in code. `RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and `MONGODB_URI` stored exclusively in cloud environment variables.
2. **Rate Limiting:**
   - Public Booking & Fare endpoints: 60 requests / minute / IP.
   - Lead Capture (`/inquiries`): 5 requests / minute / IP.
   - Webhook Endpoint: Whitelisted Razorpay IP ranges or strict HMAC verification.
3. **CORS Configuration:** Restricted to `https://skbagheltravels.in`, local dev previews, and designated admin staging origins.
4. **Data Protection (DPDP India 2023):** Customer phone numbers and emails masked in public responses; assigned-driver contact details shown only to verified customers and authorized administrators; no live tracking exists.

---

## 9. Implementation Execution Plan (Step-by-Step)

When implementation begins, execute in this precise order:

- [ ] **Step B1: Project Scaffold & Supabase Baseline**
  - Initialize `backend/` with Node.js, TypeScript, Fastify/Express, ESLint, Prettier.
  - Apply PostgreSQL schema migrations to Supabase.
  - Set up Supabase Auth and Row Level Security policies.

- [ ] **Step B2: Server-Authoritative Fare & Location Engine**
  - Port `fareEngine.ts` to backend services.
  - Implement `/api/v1/fares/calculate`.
  - Implement `/api/v1/locations/autocomplete` with LocationIQ proxy.

- [ ] **Step B3: Booking Creation & Ticket ID Generator**
  - Implement `/api/v1/bookings/draft` with ticket format `AGR-YYYYMMDD-XXXX`.
  - Wire booking validation and transactional insertion into Supabase.

- [ ] **Step B4: Razorpay Orders & Secure Webhook Gateway**
  - Configure Razorpay SDK with test credentials.
  - Implement `/api/v1/payments/create-order` (28% advance calculation).
  - Implement `/api/v1/payments/webhook` with HMAC SHA256 signature verification and idempotency.

- [ ] **Step B5: Catalog, Gallery & Review Administration**
  - Implement admin CRUD for rides, tours, packages, fare rules, promo codes, and drivers.
  - Implement Supabase Storage media uploads and publication metadata.
  - Implement review submission, booking verification, moderation, publication, and audit logs.

- [ ] **Step B6:** Automated WhatsApp & Email Dispatch**
  - Integrate WhatsApp Business API template notifications for payment confirmation and driver assignment.
  - Show assigned driver's approved basic contact details to the verified customer; do not expose live tracking.
  - Integrate PDF voucher generation and email delivery via Resend/SES.

- [ ] **Step B7: CI/CD Pipeline & Production Cloud Deployment**
  - Set up GitHub Actions workflow (lint -> test -> docker build).
  - Deploy Node.js API to Render/Railway in Mumbai region.
  - Configure Razorpay Live Webhooks pointing to production domain.
