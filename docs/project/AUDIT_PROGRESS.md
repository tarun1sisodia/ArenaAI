# Full Codebase Audit Progress Ledger — SK Baghel Tour & Travels (ArenaAI)

**Audit Status:** **COMPLETED** (All 11 Phases Executed)  
**Current Phase:** Phase 11 Completed (Final Audit Synthesis, Answers & Action Plan)  
**Last Updated:** 2026-09-16  
**Auditor:** Senior Software Engineer, Software Architect, QA, Backend, Frontend & AppSec Engineer

> **Historical snapshot:** This ledger records the repository audit completed on 2026-09-16. Findings describing mocked customer/admin flows are not a statement of the current implementation; see [`02_PROJECT_CONTEXT.md`](02_PROJECT_CONTEXT.md) and [`04_PROGRESS_TRACKER.md`](04_PROGRESS_TRACKER.md).

---

## High-Level Phase Roadmap

| Phase | Description | Status | Findings Logged |
|---|---|---|---|
| **Phase 1** | **Repository Discovery & Initial Baseline** | **COMPLETED** | 4 initial findings |
| **Phase 2** | **Architecture Map & System Topology** | **COMPLETED** | 2 architectural findings (FIND-005, FIND-006) |
| **Phase 3** | **Backend Inventory (Modules, Services, Middleware, Utilities)** | **COMPLETED** | 1 bug finding (FIND-007) |
| **Phase 4** | **API Endpoint Inventory & Contract Discovery** | **COMPLETED** | 0 new bugs; 30/30 endpoints verified |
| **Phase 5** | **Database & Model Inventory (Postgres, RLS, Schemas, Migrations)** | **COMPLETED** | 4 database findings (FIND-008, FIND-009, FIND-010, FIND-011) |
| **Phase 6** | **Customer Frontend Inventory (`react/`)** | **COMPLETED** | 4 frontend findings (FIND-012, FIND-013, FIND-014, FIND-015) |
| **Phase 7** | **Admin Frontend Inventory (`admin/`)** | **COMPLETED** | 4 admin findings (FIND-016, FIND-017, FIND-018, FIND-019) |
| **Phase 8** | **Deep Runtime Testing & Edge-Case Verification** | **COMPLETED** | 2 findings (FIND-020, FIND-021); 16 edge-case tests verified |
| **Phase 9** | **Frontend ↔ Backend Integration Audit** | **COMPLETED** | 4 integration findings (FIND-022, FIND-023, FIND-024, FIND-025) |
| **Phase 10** | **Security & Threat Surface Analysis (Defensive AppSec)** | **COMPLETED** | 2 security findings (FIND-026, FIND-027) |
| **Phase 11** | **Final Audit Synthesis, Answers & Action Plan** | **COMPLETED** | Master Audit Report published in `AUDIT_REPORT.md` (27 total findings) |

---

## Detailed Progress by Area

### 1. Build, Typecheck & Test Baseline
- [x] Monorepo structure mapped (`react/`, `admin/`, `backend/`, `scripts/`, `docs/`, `testsprite/`)
- [x] Lockfiles and package manifests inspected
- [x] Customer typecheck (`npm run customer:typecheck`): **PASS** (0 errors)
- [x] Admin typecheck (`npm run admin:typecheck`): **PASS** (0 errors)
- [x] Backend typecheck (`npm run backend:typecheck`): **PASS** (0 errors)
- [x] CSS Token integrity audit (`npm run customer:audit:css`): **PASS**
- [x] CI Unit & Contract test suite (`npm test`): **PASS** (52/52 tests pass, 2 DB-dependent tests skipped)
- [x] Production builds (`npm run build:all`): Customer SSG prerender (75 pages + 10 redirects)

### 2. Backend Discovery (`backend/`)
- [x] Fastify application configuration (`src/app.ts`, `src/server.ts`, `src/config/env.ts`)
- [x] Middleware pipeline discovered (`authGuard`, `roleGuard`, `errorHandler`, `networkHeaders`, `rawBody`, `requestId`)
- [x] Core repositories discovered (`src/db/types.ts` with 12 repositories: postgres & memory implementations)
- [x] Modules discovered (8 feature modules: `admin`, `bookings`, `catalog`, `fares`, `inquiries`, `locations`, `notifications`, `payments`, `reviews`)
- [x] HTTP endpoints discovered (30 routes registered)
- [x] Providers identified (Razorpay adapter, PayPal adapter, Card adapter, LocationIQ provider, WhatsApp provider, Resend provider)
- [ ] Static analysis of all functions in backend modules
- [ ] Runtime execution & failure injection testing of backend APIs

### 3. Customer Frontend Discovery (`react/`)
- [x] Routing & navigation mapping (`src/app/routes.tsx`, `src/app/App.tsx`, `src/app/ServerApp.tsx`)
- [x] Page catalog (15 pages: Home, Fleet, Route, Package, Services, About, Contact, Faq, Terms, Privacy, Booking, 404, etc.)
- [x] Booking funnel analyzed (`src/features/booking/BookingPage.tsx` - 5-step client-only simulation)
- [x] Autocomplete & Geocoding analyzed (`src/hooks/useLocationIQ.ts`, `src/config.ts`)
- [x] Discovered decoupled mock booking flow (client-side simulation, zero backend API integration - FIND-002)
- [x] Discovered client-side LocationIQ token read from query parameter / localStorage (FIND-004)
- [x] Discovered mock inquiry form submission dropping customer leads in `ContactPage.tsx` & `ContactCard.tsx` (FIND-012)
- [x] Discovered ~2,500 lines of dead code & unmounted components (`LocationCombobox`, `distance.ts`, `customDistance.ts`, `react/src/App.tsx` - FIND-013)
- [x] Discovered booking UX gaps (missing round-trip return date/time pickers and customer email field - FIND-014)
- [x] Discovered canonical domain discrepancy in `config.ts` vs `generate-sitemap.ts` (FIND-015)
- [x] Component hierarchy, tokens, design lock compliance, and prerender/SSG pipeline verified

### 4. Admin Frontend Discovery (`admin/`)
- [x] Application structure & router analyzed (`src/App.tsx`, `src/components/admin/AdminLayout.tsx`)
- [x] Pages discovered (8 pages: Dashboard, Bookings, Finance, Catalog, Reviews, Inquiries, Fares, Audit)
- [x] Auth & Session model analyzed (unprotected role toggle selector in `LoginPage.tsx` with zero password or Supabase Auth verification - FIND-017)
- [x] Discovered complete decoupling from backend Fastify API (100% in-memory mock data in `src/lib/mock-data.ts`, zero HTTP calls - FIND-003)
- [x] Discovered missing backend API endpoints for Inquiries, Payment Inspection, and Fares (FIND-016)
- [x] Discovered domain model and commercial rule drift (vehicle tiers, trip types, per-km rates, minDailyKm - FIND-018)
- [x] Discovered dead deployment variable `VITE_API_BASE_URL` with zero usage in `admin/src` (FIND-019)
- [x] RBAC permission model analyzed (`src/lib/types.ts` `PERMISSIONS` matrix)

### 5. Database & Migrations Discovery
- [x] 12 SQL migrations reviewed (`backend/migrations/0001` - `0012`)
- [x] Table schemas and extensions identified (17 tables, 10 enums, RLS policies, triggers)
- [x] Migration runner analyzed (`backend/scripts/migrate.ts` with transactional DDL)
- [x] Discovered fatal enum mismatch in migration `0012_hyper_scale_indexes.sql` (`driver_assigned` on `booking_status_enum` - FIND-001)
- [x] Discovered asymmetric/incomplete RLS policies blocking non-superuser/PostgREST access across 11 tables (FIND-008)
- [x] Discovered orphaned tables `fare_rules` and `device_registrations` without repository methods or callers (FIND-009)
- [x] Discovered missing foreign key supporting indexes causing cascading table scans (FIND-010)
- [x] Discovered mutation parity gap in `bookings.update()` between PostgreSQL and memory implementations (FIND-011)

### 6. Deep Runtime Testing & Edge-Case Verification
- [x] Concurrency test: Conflicting terminal transitions on bookings verified (`completed` vs `refunded` rejection)
- [x] Concurrency test: 10x webhook replay attack verified; 1st call captures, subsequent 9 return idempotent `already_processed`
- [x] Concurrency test: Unknown order webhook race handling verified (HTTP 200 `unknown_order` preventing retry storms)
- [x] Concurrency test: Concurrent checkout creation with shared UUID `idempotencyKey` returns identical payment session
- [x] Concurrency test: Webhook amount/currency tampering flagged as `needs_review` and halts booking confirmation
- [x] Failure injection: WhatsApp/email notification queuing decoupled from payment transaction (failures don't block capture)
- [x] Failure injection: Webhook HMAC signature tampering rejected with 401 and zero secret/key leakage
- [x] Failure injection: Geocoding fallback on curated places verified when LocationIQ is unavailable
- [x] Boundary testing: Negative/zero distances rejected with HTTP 400
- [x] Boundary testing: Client custom totalFare/advanceAmount tampering stripped and overridden by server fare engine
- [x] Boundary testing: Past pickup datetimes rejected with HTTP 400
- [x] Boundary testing: SQL injection probes in admin filters handled safely without database error
- [x] Boundary testing: XSS script tags in special notes rejected with HTTP 400
- [x] Boundary testing: Admin auth tampering (missing Bearer, fake role, malformed token, customer role on admin) strictly blocked (401/403)
- [x] Boundary testing: Rapid double-click / duplicate booking within 5-minute window caught by 409 conflict guard
- [x] Architecture gap: Discovered unexposed `bookingService.transition()` with zero HTTP routes in admin API (FIND-020)
- [x] Testing gap: Discovered in-memory repository transaction lacks rollback on failure (FIND-021)

### 7. Frontend ↔ Backend Integration Audit
- [x] Trace customer booking funnel contract: `BookingState` vs `CreateDraftBookingSchema` (FIND-023)
- [x] Trace customer payment lifecycle: Zero Razorpay SDK / polling integration on customer frontend
- [x] Trace customer inquiry funnel: `InquiryFormData` vs `CreateInquirySchema` (FIND-024)
- [x] Trace admin CORS configuration: Discovered `https://admin.agraskbagheltourandtravels.com` missing from backend default `CORS_ORIGINS` (FIND-022)
- [x] Trace admin authentication & session lifecycle: Mock localStorage session with zero Bearer token headers
- [x] Trace admin data model alignment: Discovered field casing, naming, fare schemas, and enum mismatches across 5 entity domains (FIND-025)
- [x] Trace admin operations routes: Confirmed missing endpoints for booking transitions, inquiry management, payment ledger, and fares

### 8. Security & Threat Surface Analysis (Defensive AppSec)
- [x] Authentication & JWT verification: Audited `authGuard.ts` (strict jose validation, `app_metadata.role` server claims, production test-token lock)
- [x] Role-Based Access Control: Audited `roleGuard.ts` across all operations endpoints (`DISPATCH_ROLES`, `SUPER_ADMIN_ROLES`, `FINANCE_ROLES`)
- [x] Injection defenses: Verified 100% parameterized SQL query usage with pg `$1, $2` placeholders in `postgres.ts` (0 string interpolations)
- [x] XSS & input sanitization: Verified `SafeNameSchema`, `SafeAddressSchema`, `SafeNotesSchema`, and HTML stripping across free-text fields
- [x] Cryptographic timing checks: Discovered timing-leak in `createCheckout` using `!==` instead of `timingSafeEqualString` (FIND-026)
- [x] PostgreSQL RLS analysis: Discovered complete lack of write policies blocking direct PostgREST client integrations (FIND-027)
- [x] Rate limiting & DoS defense: Verified global rate-limit (120 req/min) and per-route limits (10–60 req/min) with 1MB body limit
- [x] Open redirect & SSRF defense: Verified `isAllowedReturnUrl` HTTPS and CORS origin domain allowlist enforcement
- [x] Secret hygiene: Verified zero server secrets leaked into customer or admin production bundles

### 9. Final Audit Synthesis & Action Plan
- [x] Synthesized findings across all 11 phases into master artifact: [`AUDIT_REPORT.md`](file:///home/bot/Internship/ArenaAI/AUDIT_REPORT.md)
- [x] Formulated detailed, evidence-based answers to the 8 core operational questions (What exists → What is supposed to happen → What actually happens → What is broken → What is missing → What is insecure → What is unused → What is inconsistent)
- [x] Generated Actual vs Specified System Architecture diagrams in ASCII and Mermaid formats
- [x] Created categorized master findings catalog encompassing all 27 confirmed defects (`FIND-001` through `FIND-027`)
- [x] Delivered a prioritized 4-phase chronological engineering action plan:
  - **Phase A (Immediate P0/P1):** Migration 0012 crasher, Admin booking transition route, Admin Supabase Auth, Customer booking funnel API integration, Inquiry lead capture.
  - **Phase B (High-Priority P2):** Admin CORS production fix, Catalog media FK bug, Missing admin operations endpoints, Notification worker loop, PostgreSQL update mutation parity.
  - **Phase C (Model & Domain P2):** Commercial fare engine deduplication, Admin domain model reconciliation, Customer round-trip & email UX inputs, RLS documentation.
  - **Phase D (Polish & Hygiene P3):** Supporting FK indexes, Constant-time token comparison fix, Dead code elimination (~2,500 lines), Canonical domain fix, Orphaned tables removal, In-memory test transaction rollback.

---

## Master Audit Deliverables
1. **Full Findings Ledger:** [`AUDIT_FINDINGS.md`](file:///home/bot/Internship/ArenaAI/AUDIT_FINDINGS.md) (27 detailed findings with reproduction, impact, evidence, and code fixes)
2. **Master Audit Report & Action Plan:** [`AUDIT_REPORT.md`](file:///home/bot/Internship/ArenaAI/AUDIT_REPORT.md) (The 8 Answers, System Topology, Architecture Diagrams, and Prioritized Roadmap)
3. **Audit Execution Tracker:** [`AUDIT_PROGRESS.md`](file:///home/bot/Internship/ArenaAI/AUDIT_PROGRESS.md) (Phase-by-phase execution ledger across all 11 audit phases)

---

## Implementation Phase Tracking

### Phase A: Core Architecture & Flow Restoration
- [x] **Step 1: Fix Database Migration 0012 Index Enum (`FIND-001`)**
  - File: `backend/migrations/0012_hyper_scale_indexes.sql` line 9
  - Fixed invalid enum `'driver_assigned'` -> `'in_transit'`
- [x] **Step 2: Role Consolidation & Expose Admin Booking Transition Route (`FIND-020`)**
  - Directive: System consolidated to **two roles only**: `customer` and `super_admin`.
  - Roles unified across `backend/src/types/domain.ts`, `backend/src/middlewares/roleGuard.ts`, `admin/src/lib/types.ts`, `admin/src/App.tsx`, and `admin/src/components/login/LoginPage.tsx`.
  - Created migration `backend/migrations/0013_consolidate_user_roles.sql`.
  - Implemented `TransitionBookingSchema` in `backend/src/modules/admin/admin.schema.ts`.
  - Added `transitionBooking` handler to `backend/src/modules/admin/admin.controller.ts` with optimistic concurrency `expectedVersion` check.
  - Registered `POST /api/v1/ops/admin/bookings/:id/transition` in `backend/src/modules/admin/admin.routes.ts`.
  - Wired in `backend/src/app.ts` and added comprehensive contract tests in `backend/tests/contract/routes.test.ts`.
  - Verification: `npm run verify` passed (3x typecheck, backend tests, 3x build).
- [x] **Step 3: Secure Admin Desk Authentication (`FIND-017` & `FIND-019`)**
  - Created `admin/src/lib/env.ts` exporting `API_BASE_URL`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` from `import.meta.env` (`FIND-019`).
  - Added `token: string` to `AdminUser` in `admin/src/lib/types.ts`.
  - Created `admin/src/lib/auth.ts` providing credentials authentication against Supabase Auth GoTrue REST endpoint `/auth/v1/token?grant_type=password`, role validation (`super_admin` only), dev/demo token fallback (`test-super_admin`), and session persistence (`saveSession`, `getStoredSession`, `getAuthHeaders`, `clearSession`).
  - Revamped `admin/src/components/login/LoginPage.tsx` with email and password inputs, show/hide password toggle, Super Admin desk role badge, error states, and submission to `onLogin`.
  - Updated `admin/src/App.tsx` session management to store real `AdminUser` with JWT bearer token and handle logout.
  - Verification: `npm run admin:typecheck`, `npm run admin:build`, and `npm run verify` all passed cleanly.
- [x] **Step 4: Connect Customer Booking Funnel (`FIND-002`, `FIND-023`)**
  - Created typed API client in `react/src/services/api.ts` mapping `BookingState` into `CreateDraftBookingPayload` (translating vehicle tiers, trip types, normalizing phone, formatting ISO datetimes, resolving distance).
  - Wired `pay()` in `react/src/features/booking/BookingPage.tsx` to `createDraftBooking()` and `createPaymentCheckout()`.
  - Added return date/time pickers for round-trip journeys and customer email input (`FIND-014`).
  - Redesigned Step 5 confirmation panel with confirmed ticket ID (`AGR-YYYYMMDD-XXX`), fare details, and WhatsApp/phone CTAs.
  - Verification: `npm run customer:typecheck` and `npm run customer:build` passed (75 SSG pages prerendered).
- [x] **Step 5: Connect Customer Inquiries Form (`FIND-012`, `FIND-024`)**
  - Created `createInquiry()`, `formatInquiryPhone()`, and `sanitizeInquiryName()` helpers in `react/src/services/api.ts`.
  - Replaced mock `setTimeout` in `react/src/pages/ContactPage.tsx` with live `createInquiry()` call, packaging multi-service travel details into validated message payloads and displaying returned inquiry IDs.
  - Connected `react/src/components/home/ContactCard.tsx` to `createInquiry()` with explicit user design lock approval, preserving 100% of all locked visual tokens, corner plus crosses, NAP tiles, and feedback toasts (`LOCK-002`).
  - Verification: `npm run customer:typecheck` and `npm run customer:build` passed.

---

### Phase B: High-Priority Operations & Integrity
- [x] **Step 1: Fix Catalog Media Foreign Key Insertion Bug (`FIND-007`)**
  - File: `backend/src/modules/catalog/catalog.service.ts` line 125
  - Fixed inserting `item.id` instead of URL slug in media table.
  - Added integration test in `backend/tests/integration/admin-catalog.test.ts` verifying that attaching media by slug correctly assigns the resolved UUID `item.id`.
  - Verification: `npm --prefix backend run test:ci` and `npm run verify` passed (53/53 tests pass).
- [ ] **Step 2: Implement Missing Admin Operations Endpoints (`FIND-016`)**
  - Files: `backend/src/modules/admin/`, `backend/src/modules/inquiries/`, `backend/src/modules/payments/`
  - Expose admin inquiries list/update, payment inspection ledger, and fares metadata.
- [ ] **Step 3: Align PostgreSQL Update Mutation Parity (`FIND-011`)**
  - File: `backend/src/db/postgres.ts`
  - Align `bookings.update()` in PostgreSQL implementation to match in-memory mutation parity.







