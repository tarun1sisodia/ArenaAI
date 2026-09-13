# Backend Delivery Phases — SK Baghel Tour & Travels

**Document status:** Working delivery baseline  
**Source of truth:** [Backend Architecture Plan](BACKEND_ARCHITECTURE_PLAN.md)

## Purpose

This document divides the backend implementation into controlled phases. Each phase has a clear outcome, dependencies, exit criteria, and operational risk boundary.

## Phase Summary

| Phase | Name | Primary outcome | Database posture | Exit condition |
|---|---|---|---|---|
| 0 | Foundation | Repository, environments, standards, and access controls are ready | Supabase project provisioned | CI can lint, test, and build the service |
| 1 | MVP transaction core | Customers can calculate fares, create bookings, and pay a 28% advance | Supabase PostgreSQL is the primary store | A payment can be verified end to end in test mode |
| 2 | Operations | Admins can assign drivers and share approved contact details | PostgreSQL remains the operational ledger | A booking can move from payment to completion | PostgreSQL remains the operational ledger | A booking can move from payment to completion |
| 3 | Content and trust | Catalog CRUD, gallery, verified reviews, and moderation are live | Supabase PostgreSQL and Storage remain primary | Public pages show only approved content |
| 4 | Production hardening | Monitoring, recovery, security, and deployment controls are complete | Dual-database production topology | Launch checklist passes with rollback evidence |

## Phase 0 — Foundation

The team establishes the TypeScript service, environment validation, coding standards, database migration workflow, and deployment pipeline. Secrets must be supplied through environment variables and must never be committed to source control.

### Deliverables

- Node.js 22+ and TypeScript strict-mode project.
- Fastify or Express application shell with centralized error handling.
- Zod request, response, and environment contracts.
- Supabase project, Auth configuration, storage buckets, and initial migrations.
- CI checks for formatting, linting, type checking, and tests.

### Exit criteria

The service starts with a validated configuration, connects to Supabase, and produces a repeatable build artifact.

## Phase 1 — MVP Transaction Core

Phase 1 prioritizes secure revenue flow over advanced real-time operations. Supabase PostgreSQL stores bookings, payments, drivers, fleet records, and JSONB payloads that will later move to MongoDB.

### Deliverables

- Server-authoritative fare calculation.
- LocationIQ server-side proxy.
- Draft booking and ticket generation using `AGR-YYYYMMDD-XXXX`.
- Razorpay order creation for a 28% advance, subject to the ₹500 minimum.
- HMAC SHA-256 webhook verification and idempotency handling.
- WhatsApp and email payment confirmation.

### Exit criteria

A test customer can submit booking details, receive a server-calculated order, complete payment, and retrieve a verified booking voucher. The client cannot alter the payable amount.

## Phase 2 — Dispatch Operations

Phase 2 adds the operational workflows required after payment confirmation. Admins can inspect bookings, assign drivers and vehicles, and share approved driver contact details with verified customers. There is no driver-side status application.

### Deliverables

- Admin and dispatcher authorization.
- Booking assignment workflow.
- Approved driver contact sharing.
- Cancellation and refund workflow for authorized staff.
- Driver and vehicle availability validation.
- Audit logging for assignment, status, and refund actions.

### Exit criteria

A paid booking can be assigned, started, completed, cancelled, or refunded according to permitted state transitions.

## Phase 3 — Catalog and Trust

Phase 3 introduces the public trust and content experience. PostgreSQL and Supabase Storage remain the primary systems for catalog, gallery, reviews, and moderation.

### Deliverables

- Admin CRUD for rides, tours, packages, fares, promo codes, drivers, and site settings.
- Supabase Storage gallery media with publication and consent controls.
- Review submission, booking verification, moderation, publication, and audit logs.

### Exit criteria

Public pages show only approved catalog content, gallery media, and reviews. Every moderation and publication decision is audited.

## Phase 4 — Production Hardening

The final phase validates the system against failure, security, and recovery scenarios before live traffic is expanded.

### Exit criteria

Production deployment, webhook configuration, backup and restore procedures, alerting, rate limits, CORS, secret rotation, and rollback procedures have all been tested and documented.

## Phase Governance

A phase may not be considered complete because code exists. It is complete only when its exit criteria are demonstrated in a repeatable environment and the relevant risks are recorded in [BUGS.md](BUGS.md).

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"

The phase boundaries and technical decisions in this document are derived from [1].
