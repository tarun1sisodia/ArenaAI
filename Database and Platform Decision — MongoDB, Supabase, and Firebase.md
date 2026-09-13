# Database and Platform Decision — MongoDB, Supabase, and Firebase

**Project:** SK Baghel Tour & Travels  
**Decision status:** Recommended architecture boundary  
**Related documents:** [BACKEND_ARCHITECTURE_PLAN.md](BACKEND_ARCHITECTURE_PLAN.md), [MODELS.md](MODELS.md), [REALTIME.md](REALTIME.md), [TECHNICAL_REQUIREMENTS_DOCUMENT.md](TECHNICAL_REQUIREMENTS_DOCUMENT.md), [GALLERY_REVIEWS_ADMIN.md](GALLERY_REVIEWS_ADMIN.md)

## 1. Decision Summary

The project may use **Supabase, MongoDB, and Firebase together**, but each platform must have a distinct responsibility.

| Platform | Primary responsibility | Must not become |
|---|---|---|
| Supabase | System of record for identity, bookings, payments, drivers, vehicles, refunds, RLS, and durable business data | A high-frequency GPS event store or duplicate notification platform |
| MongoDB Atlas | Optional LocationIQ cache, raw provider payloads, and explicitly approved high-volume documents | The source of truth for payments, booking status, catalog, reviews, or drivers |
| Firebase | Mobile-facing services such as Firebase Cloud Messaging, Crashlytics, Analytics, and optionally Remote Config | A second booking database or a second authentication authority without an explicit migration decision |

The most important rule is **one owner per type of truth**. A record should not be independently editable in two databases.

## 2. Recommended Ownership Model

### Supabase owns transactional business truth

Supabase PostgreSQL should own:

- Customer profiles and roles.
- Driver and vehicle records.
- Booking records and ticket IDs.
- Fare snapshots and promo references.
- Payment ledger records, Razorpay order IDs, and refunds.
- Booking lifecycle status.
- Driver assignment and trip state.
- Row-Level Security policies.
- Supabase Auth identities if Supabase remains the selected authentication authority.
- Durable invoices and protected documents through Supabase Storage.

If a dispute involves how much a customer paid, whether a booking is confirmed, who was assigned, or whether a refund was issued, the answer must come from Supabase PostgreSQL and the provider reconciliation records.

### MongoDB owns high-volume and retention-managed data

MongoDB Atlas should own:

- LocationIQ autocomplete cache with a 30-day TTL when needed.
- Raw Razorpay, WhatsApp, and Twilio webhook payloads with a 90-day retention policy.
- Optional analytics buffers when PostgreSQL would receive excessive write traffic.

MongoDB does not store driver GPS telemetry because there is no driver app or live tracking feature.

MongoDB documents should reference stable PostgreSQL identifiers such as `bookingId`, `driverId`, and `ticketId`. They should not create a second authoritative booking or payment status.

### Firebase owns mobile delivery and client diagnostics

Firebase should primarily support mobile and client-facing capabilities:

- **Firebase Cloud Messaging:** Push notifications to Android, iOS, and web clients.
- **Firebase Crashlytics:** Mobile crash reporting and release diagnostics.
- **Firebase Analytics:** Product funnel and mobile usage analytics.
- **Firebase Remote Config:** Controlled client feature flags and non-sensitive presentation settings.
- **Firebase App Check:** Additional abuse protection where applicable to Firebase-facing clients.

The backend should decide whether a notification is valid. Firebase should deliver the notification; it should not decide that a payment succeeded or that a trip is completed.

### Supabase also owns the trust and content layer

Catalog items, fares, reviews, moderation states, gallery metadata, device registrations, and admin audit logs belong in Supabase PostgreSQL. Gallery files belong in Supabase Storage. This keeps public content, approval state, permissions, and publication history transactional and queryable.

## 3. Authentication Decision

Do not operate Supabase Auth and Firebase Authentication as independent authorities for the same users during the initial phase. Two identity systems create duplicate user IDs, token verification paths, password-reset flows, role synchronization, and account-linking problems.

The recommended initial decision is:

> Use **Supabase Auth as the single application identity authority** and use Firebase for FCM, Crashlytics, Analytics, Remote Config, and App Check.

The backend validates Supabase JWTs for API access. Firebase Cloud Messaging tokens are stored as device registrations associated with the Supabase user or guest booking token.

Firebase Authentication should be introduced only if a documented product requirement specifically needs Firebase-native authentication. If that happens, define a deliberate identity bridge before enabling it for production users.

## 4. Real-Time Decision

Use different real-time mechanisms for different information types:

| Information | Recommended mechanism | Authority |
|---|---|---|
| Booking status and dispatch updates | REST reads and optional admin notifications | Supabase PostgreSQL |
| Assigned-driver contact details | REST booking response and approved notification | Supabase PostgreSQL |
| Customer/admin alerts | Email, WhatsApp, or optional web push | Backend event and notification service | Analytics pipeline, not booking ledger |

Do not broadcast a Firebase notification as proof of a state transition. Persist the state first, then publish a real-time update and optionally send FCM.

## 5. Request and Event Flow

```text
Customer / Driver / Dispatcher client
              |
              v
       Node.js TypeScript API
          |        |        |
          |        |        +--> Firebase FCM / Analytics / Crashlytics integration
          |        +-----------> MongoDB Atlas telemetry, cache, raw events
          +--------------------> Supabase PostgreSQL, Auth, Storage, Realtime

External providers
  Razorpay / LocationIQ / WhatsApp / Email
              |
              v
       Node.js API and worker layer
```

The Node.js backend remains the integration boundary. Clients should not receive database credentials or call MongoDB, Supabase service-role APIs, Razorpay secrets, or LocationIQ secrets directly.

## 6. Notification Flow

1. A booking or payment state is committed in Supabase.
2. The backend creates an idempotent notification job.
3. The notification worker selects the channel: WhatsApp, email, or Firebase Cloud Messaging.
4. Firebase delivers a push notification to registered devices.
5. The worker records provider response, delivery status, attempt count, and error.
6. The client opens the application and fetches authoritative booking state from the API.

A notification failure must not reverse payment or booking state. A notification retry must use a deterministic notification key to prevent duplicate messages.

## 7. Device Registration Model

Store device registrations in Supabase because they are application-owned relationships:

```text
user_id
booking_id when relevant
device_id
platform: android | ios | web
fcm_token_hash or protected token
app_version
last_seen_at
is_active
created_at
updated_at
```

The FCM token itself must be protected from unnecessary exposure. Tokens should be rotated when Firebase invalidates them or when a user signs out. One user may have multiple active devices.

## 8. Data Synchronization Rules

Do not implement unrestricted bidirectional synchronization among all three platforms. Use explicit, directional flows:

| From | To | Purpose |
|---|---|---|
| Supabase booking event | MongoDB | Add operational event or audit projection |
| Supabase booking/payment event | Firebase FCM | Send a client notification |
| Supabase booking/assignment event | Email, WhatsApp, or optional Firebase FCM | Notify customer of confirmed booking or assigned driver |
| Firebase Analytics | Analytics store | Product and funnel reporting |
| Razorpay webhook | Supabase and MongoDB | Update ledger and retain raw forensic payload |

Every synchronization event should include an event ID, source, aggregate ID, schema version, and processed status.

## 9. Security Boundaries

- Keep Supabase service-role keys, MongoDB credentials, Firebase Admin SDK credentials, Razorpay secrets, and LocationIQ tokens on the backend only.
- Use Firebase Admin SDK only from trusted backend workers.
- Use Supabase RLS for client-accessible Supabase resources.
- Use MongoDB network controls, least-privilege users, and collection-level access boundaries.
- Never use Firebase Analytics or Crashlytics to store payment secrets, full phone numbers, payment signatures, or unnecessary personal data.
- Mask personal data in logs and public booking responses.
- Treat FCM payloads as non-authoritative hints and avoid placing sensitive booking details in notification text.

## 10. Phased Adoption

### Initial phase

Use Supabase for all transactional data, MongoDB only if telemetry or cache volume requires it, and Firebase for mobile push, crash reporting, and analytics. Keep the first release operationally simple.

### Scale phase

Activate MongoDB telemetry and cache workloads when measured PostgreSQL write volume, retention, or geospatial requirements justify it. Add queue workers for notification retries and invoice generation.

### Avoided duplication

Do not store bookings independently in Firebase Realtime Database or Firestore unless the team deliberately changes the source-of-truth decision. Do not introduce Firebase Auth alongside Supabase Auth without an identity architecture and migration plan.

## 11. Acceptance Criteria

This three-platform architecture is correctly implemented when:

- A booking, payment, assignment, driver contact record, and refund have one authoritative record in Supabase.
- Optional cache and provider-event documents are stored in MongoDB only when justified.
- Firebase can deliver push notifications without determining business state.
- A client can lose connectivity and recover by fetching state from the Node.js API.
- Duplicate events do not duplicate payment records or customer notifications.
- No client bundle contains database service-role credentials or provider secrets.
- Engineers can replace or disable one secondary integration without corrupting the booking ledger.

## 12. Final Recommendation

Use **Supabase as the primary platform**, MongoDB only for optional cache/provider-event workloads, and Firebase only for optional notifications and diagnostics. Do not build a driver app, live tracking, GPS telemetry, or a second operational database. Keep the Node.js backend as the single orchestration and security boundary.

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"
[2]: MODELS.md "Backend Data Models — SK Baghel Tour & Travels"
[3]: REALTIME.md "Real-Time Operations and Failure Handling — SK Baghel Tour & Travels"
[4]: TECHNICAL_REQUIREMENTS_DOCUMENT.md "Technical Requirements Document — SK Baghel Tour & Travels"

This platform boundary extends the architecture in [1], the models in [2], the real-time rules in [3], the requirements in [4], and the content and moderation design in [5].

[5]: GALLERY_REVIEWS_ADMIN.md "Gallery, Verified Reviews, and Admin Management — Architecture Refinement"
