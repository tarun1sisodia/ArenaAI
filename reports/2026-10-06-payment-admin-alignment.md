# ArenaAI payment and admin alignment — 2026-10-06

## Scope completed

- Verified the live Supabase project used by `skb-baghel-api-staging`.
- Read the live `payments` and `raw_webhooks` tables.
- Verified the deployed Render API health and public catalog endpoint.
- Audited the payment provider, webhook, database repository, admin API client, and finance/dashboard display paths.
- Corrected admin-side fallbacks that were hiding legitimate database `NULL` values.

## Live database findings

The live database currently contains payment rows with this behavior:

- Razorpay order IDs are populated.
- Razorpay checkout session IDs are populated with the order ID.
- `checkout_url` is `NULL` for the current Razorpay integration.
- `provider_payment_id` is populated only after capture.
- `webhook_event_id` is `NULL` because the live `raw_webhooks` table currently has no rows.
- Captured rows have `status = captured`, `payment_method = netbanking`, `reconciliation_status = matched`, and a `verified_at` timestamp.
- Pending rows correctly have no provider payment ID, payment method, webhook event ID, or verification timestamp.

### Why `checkout_url` is NULL

The Razorpay adapter creates an order for the in-page/modal Razorpay Checkout flow. It intentionally returns:

- `provider_order_id` = Razorpay order reference
- `checkout_session_id` = same order reference
- `checkout_url` = `NULL`

This is not a failed database write. There is no hosted redirect URL in this checkout mode. The admin UI should use the order/session ID as the durable gateway reference.

### Why `webhook_event_id` is NULL

The backend writes `webhook_event_id` only after a valid, signed Razorpay webhook is accepted and matched to an existing provider order. The live `raw_webhooks` query returned no rows, so there is no valid event ID to persist. A browser checkout callback must not be copied into this column because it is not a Razorpay webhook event.

The remaining operational action is to make the Razorpay Dashboard webhook secret exactly match the staging Render variable `RAZORPAY_WEBHOOK_SECRET`, then send/replay a real `payment.captured` webhook to:

```text
POST https://skb-baghel-api-staging.onrender.com/api/v1/payments/webhooks/razorpay
```

Do not put the secret in source control or send it in chat.

## Code changes made

### Admin payment mapping

Updated `admin/src/lib/api.ts` so it no longer fabricates database values:

- Missing `providerPaymentId` remains `null` instead of falling back to the internal payment row ID.
- Missing `method` remains `null` instead of displaying `card`.
- Missing `capturedAt` remains `null` instead of using `updatedAt`, `createdAt`, or the current time.
- Missing booking ticket references display `—` instead of exposing a booking UUID as a ticket.
- Missing status defaults to `pending`, not `captured`.

### Backend admin response

Updated `backend/src/modules/admin/admin.service.ts` so `capturedAt` is based only on `verifiedAt`. Unverified/pending payments therefore remain uncaptured in the finance response.

### Finance and dashboard rendering

Updated:

- `admin/src/lib/types.ts` to model `method`, `providerPaymentId`, and `capturedAt` as nullable.
- `admin/src/pages/FinancePage.tsx` to display `—` for missing method/capture time and exclude null methods from method totals.
- `admin/src/pages/DashboardPage.tsx` to exclude payments without a verified capture timestamp from monthly revenue calculations.

## Admin form/schema alignment result

The existing repository audit and current source review confirm that the following admin forms use the backend contracts and database repositories:

- Catalog CMS and media
- Route Catalog
- Local Sightseeing Packages
- Transfer Routes
- Tour Packages, gallery, inclusions, exclusions, itinerary, and vehicle upgrades
- Cancellation Policies
- Monuments
- Pet Taxi Policy
- Company Profile
- Dossier Signoffs

The Local/Transfer/Tour forms send the snake_case payloads expected by their strict backend Zod schemas. The backend services then map those inputs to camelCase domain records and the PostgreSQL repository writes the corresponding snake_case columns and JSONB fields.

## Validation

- Backend typecheck: passed.
- Backend CI test suite: **28 test files, 188 tests passed**.
- Admin TypeScript check: passed.
- Admin production Vite build: passed.
- Live Render `/ready`: HTTP 200, store `postgres`.
- Live public catalog endpoint: HTTP 200.
- No database mutation or migration was applied during this pass.

## Files changed

- `backend/src/modules/admin/admin.service.ts`
- `admin/src/lib/api.ts`
- `admin/src/lib/types.ts`
- `admin/src/pages/FinancePage.tsx`
- `admin/src/pages/DashboardPage.tsx`
