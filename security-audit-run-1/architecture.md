# Architecture Summary — SK Baghel Tour & Travels (ArenaAI)

## Product, Principals, Authority, and Protected Resources

**Product**: A tour and cab booking platform for SK Baghel Tour & Travels. Customers browse routes/packages and submit booking requests with advance payment. Admins manage bookings, payments, and content.

**Principals**:
- **Customer (unauthenticated / guest)**: May browse catalog, submit inquiries, initiate bookings, and pay the advance. Identified solely by a 32-byte hex `guestAccessToken` returned at draft creation.
- **super_admin**: Authenticated via Supabase JWT (`app_metadata.role = "super_admin"`). May list/transition bookings, issue refunds, manage catalog, reviews, inquiries, and read audit logs.
- **Payment providers (Razorpay, PayPal, card)**: External webhook callers authenticated by HMAC-SHA256 signature over raw request body.

**Protected resources**: Booking PII (customerPhone, customerEmail), payment amounts, admin operations endpoints, webhook endpoints, promo code redemption counts.

## Tech Stack and Source-Visible Deployment

- **Backend**: Fastify (Node.js/TypeScript), deployed to Render.com. Auth via Supabase JWT + jose. Two DB modes: PostgreSQL (production) via `pg` pool, or in-memory Map-based repos (development/test).
- **Customer frontend**: React + Vite, SSG/prerendered, deployed to Vercel. Communicates to backend at `VITE_API_BASE_URL`.
- **Admin frontend**: React + Vite SPA, deployed to Vercel. Authenticates via Supabase GoTrue REST API directly.
- **Migrations**: 14 sequential SQL files in `backend/migrations/`.

## Entry Surfaces and Source-to-Sink Paths

| Surface | Entry | Key Sinks |
|---|---|---|
| HTTP REST (public) | `POST /api/v1/bookings/draft`, `GET /api/v1/bookings/:ticketId`, `POST /api/v1/payments/create-checkout`, `GET /api/v1/payments/:paymentId/status`, `POST /api/v1/fares/calculate`, `GET /api/v1/locations/autocomplete`, `POST /api/v1/inquiries`, catalog/review GET routes | DB writes (bookings, payments), external payment provider API calls, WhatsApp/email notifications |
| HTTP REST (admin) | `GET /api/v1/ops/admin/bookings`, `POST /api/v1/ops/admin/bookings/:id/transition`, `POST /api/v1/ops/admin/refunds`, `GET /api/v1/ops/admin/audit-logs` | DB reads/writes, payment provider refund API |
| Webhook | `POST /api/v1/payments/webhooks/:provider` | DB payment/booking status updates, notification queue |
| Browser forms | Booking funnel (react/), Contact form (react/), Admin login (admin/) | Backend API calls |

## Trust Boundaries and Strongest Source-Visible Control

| Boundary | Control |
|---|---|
| Customer → booking read | `guestAccessToken` (64-char random hex) OR phone exact-match, timing-safe compare |
| Customer → payment status | Same `guestAccessToken`, min 16-char enforced |
| Admin routes | `requireRole(request, ADMIN_ROLES)` — validates JWT + `app_metadata.role === "super_admin"` |
| Webhook authenticity | HMAC-SHA256 over raw body via `verifyHmacSha256Hex`, timing-safe |
| Payment amounts | Server always recalculates from persisted `booking.advanceAmount`; `assertNoClientAmount` strips client-supplied amount fields |
| Auth JWT | `jose jwtVerify` with `SUPABASE_JWT_SECRET` or JWKS; only `app_metadata.role` trusted (server-controlled) |

## Prior Coverage Gaps and Revalidation Targets

Prior audit (commit not specified, pre-047f8f6) found 27 findings (FIND-001 through FIND-027). FIND-001 (migration enum mismatch) is marked **RESOLVED**. FIND-002 (booking flow simulation), FIND-003 (admin mock), FIND-004 (LocationIQ token exposure) are marked **CONFIRMED** and now partially addressed: `react/src/services/api.ts` was added post-audit with real API calls. Source for dirty paths (`db/memory.ts`, `db/types.ts`, `domain.ts`) contains unreviewed changes.

## Companion Selection

- **WEB-PROTOCOL-AND-AUTH.md**: HTTP API, JWT auth, webhook signatures, CORS, session handling.
- **CLIENT-SIDE.md**: SPA frontends, localStorage auth tokens, CORS, XSS surfaces.
- **DATA-ISOLATION-AND-LIFECYCLE.md**: Multi-tenant booking/payment data, PII masking, promo code lifecycle.
- **PROTOCOLS-RPC-AND-MESSAGING.md**: Webhook protocol, raw body parsing, provider event handling.
- **RESOURCE-EXHAUSTION-AND-AVAILABILITY.md**: Rate limiting, body size limits, webhook allowlisting.
