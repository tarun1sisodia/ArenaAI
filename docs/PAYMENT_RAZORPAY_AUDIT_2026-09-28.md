# Razorpay, Backend, Admin and Customer Payment Audit

**Project:** SK Baghel Tour & Travels (`tarun1sisodia/ArenaAI`)
**Audit date:** 2026-09-28
**Scope:** Customer booking/payment flow, Razorpay adapter and webhook, PostgreSQL persistence, admin payment/refund controls, deployment startup, and SEO/AEO/GEO safeguards.

## Executive result

The payment flow was **not fully safe before this audit**. Two release-blocking issues were found and fixed:

1. **Production could accept an `rzp_test_*` key** because only the local dummy prefix was rejected. Production now requires an `rzp_live_*` key.
2. **The customer showed a confirmed voucher from Razorpay's browser callback** before backend webhook confirmation. The customer now polls the protected payment-status endpoint and only shows a confirmed voucher when the backend reports both `captured` and `paid_confirmed`.

A third correctness issue was fixed: the UI offered a 100% payment option even though the backend always charged the persisted advance amount. The UI now displays only the server-authoritative advance payment until full-payment support is implemented end-to-end.

The backend now also validates the Razorpay order currency, ignores `order.paid` as a captured/refundable event when it lacks a payment ID, and runs compiled migrations before the production API starts.

## Verification performed

| Area | Result |
|---|---|
| Backend TypeScript | Passed |
| Customer TypeScript | Passed |
| Backend production build | Passed |
| Customer production build + prerender | Passed |
| Razorpay production-provider tests | 8 passed |
| Booking/payment integration tests | 3 passed |
| Live `/health` | HTTP 200 |
| Live `/ready` | HTTP 200, `store: postgres` |
| Live customer-origin CORS | `Access-Control-Allow-Origin` present |
| Generated customer sitemap | 995 URLs in local build |
| Static prerender | 37 pages + 10 redirects |

Commands used:

```bash
cd backend
npm run typecheck
npm test -- --run tests/unit/payment-provider-production.test.ts tests/integration/booking-payment.test.ts
npm run build

cd ../react
npm run typecheck
npm run build
```

## Current payment architecture

1. Customer requests a fare quote from the backend. Price and distance are not trusted from the browser.
2. Customer submits booking details. Backend creates a draft and persists a fare snapshot.
3. Customer asks backend to create a checkout. Backend reads the persisted booking advance amount and creates a Razorpay order in paise.
4. Razorpay Checkout opens in the browser using the public key and provider order ID.
5. Razorpay calls `POST /api/v1/payments/webhooks/razorpay`.
6. Backend verifies the raw-body HMAC signature, deduplicates the provider event, validates order amount and currency, updates payment state, and transitions the booking to `paid_confirmed`.
7. Customer polls `GET /api/v1/payments/:paymentId/status` with the booking token. A voucher is shown only after backend confirmation.
8. Admin refunds are initiated through the protected admin refund endpoint and persisted with idempotency protection.

## Finding register

### Fixed in this audit

| ID | Severity | Finding | Resolution |
|---|---:|---|---|
| PAY-001 | Critical | `rzp_test_*` credentials could pass production checks. | Production environment and adapter now require a valid `rzp_live_*` key. |
| PAY-002 | Critical | Browser success callback immediately showed a paid voucher. | Customer now waits for backend payment status `captured` + booking status `paid_confirmed`. |
| PAY-003 | High | UI advertised full payment while backend charged only the advance. | Removed the misleading full-payment option; UI shows the authoritative advance amount. |
| PAY-004 | High | Razorpay order response amount was checked but currency was not. | Backend now requires both amount and currency to match the command. |
| PAY-005 | High | `order.paid` could be treated as captured without a payment ID, making refunds impossible. | `order.paid` remains pending unless a payment-captured event/entity supplies a payment ID. |
| PAY-006 | High | Production Docker image did not run migrations automatically. | Render already uses `scripts/docker-entrypoint.sh` to run compiled `dist/db/migrate.js` before `dist/server.js`; this audit verified that migration path is present. |
| PAY-007 | Medium | Refund auth used untrimmed environment values while checkout used normalized values. | Refund now uses the same normalized key ID and secret. |

### Confirmed as correctly implemented

- Client monetary fields are removed/rejected at checkout; backend derives the payment amount from the persisted booking.
- Checkout uses paise and INR.
- Booking guest-token verification uses timing-safe comparison.
- Return/cancel URLs are allowlisted and HTTPS-only outside localhost.
- Webhook HMAC uses the exact preserved raw request body.
- Webhook event IDs are unique in the database and duplicate delivery is idempotent.
- Captured webhook amount and currency are compared to the persisted payment.
- Amount/currency mismatch moves the payment to `needs_review` rather than confirming the booking.
- Failed/refunded events do not confirm a booking.
- Admin refund, booking transition, payment list, and audit-log operations require an admin role server-side.
- Refund requests have database/service idempotency keys and prevent a second processed refund.
- Payment and webhook tables have provider-order, booking, event, and timestamp indexes.
- Production requires database, Supabase service role/JWT verification, Razorpay credentials, secure CORS, and disabled test auth.
- The production readiness endpoint reports database readiness and returns 503 when the database is unavailable.

## Database and deployment audit

### Tables checked

- `payments`: provider order/payment IDs, amount in minor units, status, reconciliation state, idempotency key, expiry, verification timestamp.
- `refunds`: payment/booking foreign keys, provider refund ID, amount, status, idempotency key.
- `raw_webhooks`: unique provider event ID, raw payload, payload hash, processed flag, received timestamp.
- `bookings`: persisted fare snapshot and payment-relevant status transitions.
- `schema_migrations`: migration history.

### Required production checks

1. Render must contain **live** values for `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
2. `RAZORPAY_KEY_ID` must begin with `rzp_live_`.
3. Razorpay webhook URL must be:

   ```text
   https://client-juj4.onrender.com/api/v1/payments/webhooks/razorpay
   ```

4. The Razorpay webhook secret in the dashboard must exactly equal Render's `RAZORPAY_WEBHOOK_SECRET`.
5. Enable at minimum:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
   - `refund.failed` if available in the Razorpay account event list
6. Confirm the deployed image runs migrations before the API process.
7. Confirm Render logs contain successful migration lines and `SK Baghel API listening`.
8. Never put the Razorpay secret, webhook secret, service-role key, or guest access token in customer JavaScript, URLs, logs, or Git.

## Manual end-to-end test plan

### Razorpay Test Mode

Use a Razorpay **test** key only in a non-production environment. The backend must use the real Razorpay test API when configured with a real `rzp_test_*` key; the local HMAC adapter is only for explicit local/test fixtures.

1. Set non-production `RAZORPAY_KEY_ID=rzp_test_...`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
2. Set the same webhook secret in Razorpay Test Mode.
3. Create a customer booking and confirm the draft response contains a ticket and guest token.
4. Create checkout and verify the Razorpay order amount equals the persisted advance in paise.
5. Complete a test payment.
6. Confirm Razorpay delivers `payment.captured`.
7. Confirm backend logs show the webhook request and the booking transitions to `paid_confirmed`.
8. Refresh/replay the same webhook and confirm the result is duplicate/idempotent.
9. Try an invalid signature; it must return 401 and leave the booking unpaid.
10. Try an amount mismatch; it must become `needs_review` and never become paid.
11. Close the checkout modal; the customer must not see a confirmed voucher.
12. Test an admin refund and verify payment/booking/refund state in PostgreSQL.

### Production smoke test

Use a low-value real transaction only when the merchant is ready. Do not use a customer-visible fake success path. Verify:

- checkout order created;
- Razorpay dashboard payment captured;
- signed webhook received;
- payment row has provider payment ID and `matched` reconciliation;
- booking status is `paid_confirmed`;
- customer voucher appears only after verification;
- refund record and provider refund ID are persisted if refunded.

## Admin panel acceptance criteria

- Admin cannot see dashboard data without a valid backend-verified JWT.
- Admin role is checked server-side for every admin endpoint.
- Admin payment list shows pending, captured, failed, needs-review, refunded, and reconciliation states.
- Admin must not manually mark a booking paid without provider verification.
- Refund action requires a reason and idempotency key.
- Refund action is disabled for non-paid bookings and already-refunded bookings.
- Admin audit log records actor, operation, target, request IP, and result.
- Admin UI displays provider failures and `needs_review` as actionable errors, not success.

## Customer acceptance criteria

- Customer never submits amount, total fare, distance, or payment status as authority.
- Customer never sees “confirmed” after only a browser callback or redirect.
- Customer can safely refresh while verification is pending.
- Customer sees a clear “payment received, awaiting server verification” message and is told not to pay again.
- Customer booking remains recoverable by ticket plus guest token.
- Customer cannot access admin endpoints or admin data.
- Failed and refunded payments do not show as paid bookings.

## SEO, AEO and GEO protection

Google's [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide?authuser=2) remains the content and crawlability baseline. Payment changes must not remove indexable trip, route, package, fleet, or landmark pages.

The required lifecycle is:

```text
draft → published → paused → archived → retired
```

Rules:

- **Do not delete indexable URLs** just because a trip or package is unavailable.
- Use `paused` for temporarily unavailable inventory and `archived` for historical/non-bookable inventory.
- Preserve the stable canonical URL and provide a useful replacement link or availability explanation.
- Exclude only draft and retired content from public APIs unless an intentional 301 redirect exists.
- Keep unique titles, descriptions, visible text, internal links, alt text, and structured data for published pages.
- Keep sitemap entries limited to canonical, indexable, published URLs; never put payment/session URLs in the sitemap.
- Keep `robots.txt`, canonical tags, Open Graph, JSON-LD, and hreflang consistent with the public route.
- For AEO, expose concise answers, FAQs, pricing context, route facts, booking prerequisites, and trust information in visible HTML.
- For GEO, include location names, service areas, landmarks, route context, business identity, contact information, and locally relevant structured data.
- Never expose guest tokens, payment IDs, webhook data, or admin metadata in prerendered HTML.

The local customer build currently generated **995 sitemap URLs**, **37 prerendered pages**, and **10 redirects**. This is compatible with the archive strategy, provided unavailable content follows the lifecycle rules rather than being deleted.

## Remaining work before declaring payment production-ready

1. Run one Razorpay Test Mode transaction against the deployed backend and capture Render webhook logs.
2. Confirm Render's actual secret values and webhook secret match the Razorpay dashboard; repository configuration only declares that they are supplied out-of-band.
3. Add a provider-event reconciliation job for unknown-order webhooks and stale pending payments.
4. Mark `raw_webhooks.processed=true` after successful event handling, and retain an error/retry state for events that need review.
5. Add a dedicated customer “check payment status” page for a ticket and guest token so a customer never needs to retry payment after a delayed webhook.
6. Add automated refund integration coverage against Razorpay Test Mode or a provider sandbox.
7. Add strict upload magic-byte/decoder/dimension/decompression checks before publishing catalog media.
8. Ensure active admin fare rules, catalog identity, manifest revision, and production fare calculation share one database source of truth.

## Files changed by this audit

- `backend/src/providers/adapters/razorpay.ts`
- `backend/src/config/env.ts`
- `backend/src/migrate.ts`
- `backend/Dockerfile`
- `backend/tests/unit/payment-provider-production.test.ts`
- `react/src/features/booking/BookingPage.tsx`
- `react/src/services/api.ts`

