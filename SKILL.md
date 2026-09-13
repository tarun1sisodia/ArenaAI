# Backend Engineering Skill — SK Baghel Tour & Travels

**Scope:** Implementation skill for the customer website and admin panel backend.

## Non-Negotiable Product Scope

The product has a customer website and an admin panel. Customers do not select drivers or vehicles. There is no driver application, driver login, GPS telemetry, live tracking, WebSocket telemetry, or passenger tracking link. After payment is verified, an admin manually assigns a driver and sends approved driver details to the customer through WhatsApp.

## Payment Implementation

Use one provider-neutral payment service with separate adapters for Razorpay, PayPal, and an approved international card processor. Create checkouts only from the persisted server-calculated booking advance. Store provider, order or session ID, payment ID, currency, amount in minor units, event ID, status, and reconciliation data. A redirect or browser callback never proves payment. Only a signed provider webhook or server-side provider verification can set `paid_confirmed`.

## Engineering Flow

Implement each feature vertically: Zod contract, pure business rules, service, migration, repository, controller, route, tests, and documentation. Keep Supabase PostgreSQL as the source of truth for bookings, payments, drivers, assignments, catalog, gallery, reviews, moderation, and audit records. Use MongoDB only for explicitly approved cache or provider-event workloads. Use Firebase only for optional web notifications and diagnostics.

## Manual Assignment Flow

The admin filters paid bookings, manually selects a driver from internal records, optionally associates a vehicle, records an audit event, and sends an approved WhatsApp message. The assignment route is never exposed to customers. Drivers are managed records, not authenticated application users.

## Required Verification

Before declaring a slice complete, test valid input, invalid input, authorization, duplicate requests, provider outages, signed webhook verification, amount and currency mismatch, refund behavior, notification retries, and audit logging. Keep the API, models, requirements, diagrams, and implementation plan synchronized.

## Source Documents

Use `BACKEND_RULES.md` as the supreme rule set. Then consult `BACKEND_ARCHITECTURE_PLAN.md`, `TECHNICAL_REQUIREMENTS_DOCUMENT.md`, `API.md`, `MODELS.md`, `CONTROLLERS.md`, `DATABASE_PLATFORM_DECISION.md`, `PHASE.md`, `PLAN.md`, `REALTIME.md`, and `GALLERY_REVIEWS_ADMIN.md`.
