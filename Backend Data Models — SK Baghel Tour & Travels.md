# Backend Data Models — SK Baghel Tour & Travels

**Document status:** Canonical model reference  
**Related plan:** [BACKEND_ARCHITECTURE_PLAN.md](BACKEND_ARCHITECTURE_PLAN.md)  
**Feature extension:** [GALLERY_REVIEWS_ADMIN.md](GALLERY_REVIEWS_ADMIN.md)

## Persistence Strategy

Supabase PostgreSQL is the system of record for identity, bookings, money, fleet, driver contact details, catalog content, fares, reviews, gallery metadata, admin roles, and audit records. MongoDB Atlas is optional and reserved for explicitly approved cache, provider-event, or retention-managed documents.

| Store | Owns | Consistency and retention |
|---|---|---|
| Supabase PostgreSQL | Profiles, vehicles, drivers, bookings, payments, refunds | ACID transactions and durable financial history |
| Supabase Auth | User identity and sessions | Managed authentication lifecycle |
| Supabase Storage | Driver documents, inspections, and invoices | Object retention governed by bucket policy |
| MongoDB Atlas | GPS telemetry, LocationIQ cache, raw webhook payloads, event logs | TTL and geospatial indexes where applicable |

## PostgreSQL Entities

| Entity | Primary identifier | Key constraints |
|---|---|---|
| `profiles` | `id` from `auth.users` | Unique phone and email; role enum |
| `vehicles` | Vehicle ID | Unique plate; vehicle tier and capacity required |
| `drivers` | UUID | Unique phone and license; optional assigned vehicle |
| `bookings` | UUID plus unique `ticket_id` | Fare snapshot, trip type, status, timestamps |
| `payments` | UUID | Unique Razorpay order ID and idempotency key; amount in paise |
| `refunds` | UUID | Provider refund ID, payment reference, amount, reason |
| `catalog_items` | UUID | Ride, tour, or package content with draft/published/archive state |
| `catalog_item_media` | UUID | Supabase Storage asset metadata, order, caption, and moderation state |
| `reviews` | UUID | Customer review, booking link, verification state, and moderation decision |
| `fare_rules` | UUID | Versioned fare configuration with effective dates |
| `promo_codes` | UUID | Bounded discount rules, validity, and usage limits |
| `device_registrations` | UUID | Firebase push-token relationship to a customer or driver |
| `admin_audit_logs` | UUID | Append-only record of administrative mutations |

## Booking Model

A booking stores the customer and trip snapshot required to fulfill and audit the journey. It includes origin, destination, addresses, pickup and return times, distance, vehicle tier, customer contact fields, fare components, advance and balance amounts, status, driver assignment, and notes.

The booking must preserve the calculated fare at creation time. It must not recompute a historical total when pricing configuration changes.

## Payment Model

Payment amounts are stored in paise as integers. A payment references one booking and may contain Razorpay order and payment identifiers, signature, method, VPA, bank, fees, taxes, verification time, and status. The payment record must support safe replay and reconciliation.

## MongoDB Collections

| Collection | Purpose | Index or TTL |
|---|---|---|
| `location_cache` | Normalized LocationIQ autocomplete responses | Unique cache key; created-at TTL of 30 days |
| `raw_webhooks` | Provider payloads for forensics and idempotency | Unique event ID; received-at TTL of 90 days |
| `trip_events` | Real-time operational events | Booking and timestamp indexes |
| `analytics_events` | Funnel and usage metrics | Time-based retention policy |

## Catalog and Review Entities

`catalog_items` provides the common content model for rides, tours, and packages. It should store typed searchable fields such as title, slug, description, route, duration, status, version, and publication timestamps. It may reference a versioned fare rule but must not rewrite an existing booking fare snapshot.

`catalog_item_media` describes images or videos stored in Supabase Storage. It stores alt text, caption, display order, source type, rights or consent state, moderator, and publication state. Pending or rejected assets are not visible through public catalog routes.

`reviews` stores rating, text, optional booking association, customer display information, submitted social profile URL, verification status, moderation status, moderator identity, and private moderation notes. A social profile is supporting evidence only; the public site should display a limited verification label such as `Verified booking` or `Identity link reviewed`.

`fare_rules` must be versioned and effective-dated. A new active fare rule applies to future calculations and bookings only. `admin_audit_logs` records who created, edited, published, rejected, archived, assigned, or changed a sensitive setting.

`device_registrations` may store optional web-push device associations. The notification provider delivers alerts but does not own booking or payment state.

## Relationships

`profiles` can represent a customer, dispatcher, content editor, review moderator, finance operator, or super administrator. Drivers are managed records used for assignment and customer contact; they do not authenticate to a driver app. A `driver` may reference a profile and a vehicle. A booking may reference a customer profile and an assigned driver. A payment and refund always reference a booking. MongoDB documents use stable booking and driver identifiers but do not replace relational foreign keys.

## Data Protection Rules

Personal contact information must be masked in public responses. Service-role credentials must be restricted to backend execution. Assigned-driver contact details must be visible only to verified customers and authorized administrators. There is no passenger live-tracking link. Raw webhook data should be access-controlled because it may contain provider metadata and personal information.

## Migration Rules

Schema changes must be versioned, reversible where practical, reviewed with API contract changes, and tested against a representative dataset. Financial columns and payment statuses require backward-compatible rollout planning.

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"

The model definitions and storage boundaries in this document are derived from [1].
