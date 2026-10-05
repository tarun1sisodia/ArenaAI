# ArenaAI schema, backend, and admin alignment report

## Scope

This review covers the live Supabase schema, the 32 applied repository migrations, backend domain/database mappers, and admin pages/API clients for payments, Catalog CMS, Local & Transfers, Tour Packages, Policies, Company Profile, and Signoffs.

The complete live inventory of all 28 tables, every column type, nullability, default, check/enum, primary key, foreign key, row count, and RLS status is in [live-schema-inventory.md](./live-schema-inventory.md).

## Confirmed database state

The live migration ledger contains all repository migrations through `0031_tour_packages_source_dest_inclusions.sql`. The live database contains 28 public tables and the expected payment/dossier tables. The live payment table has 9 records and the recent browser test payment is correctly persisted as `captured`, with a provider order ID, provider payment ID, netbanking method, matched reconciliation status, and verification timestamp.

### Razorpay fields

| Field | Live value | Correct meaning |
|---|---|---|
| `provider_order_id` | populated | Durable Razorpay order reference; required for reconciliation and refunds. |
| `checkout_session_id` | populated with the order ID | Checkout-session reference used by the browser checkout. |
| `checkout_url` | NULL for all 9 rows | Correct for the current Razorpay modal/in-page integration; no hosted redirect URL is created. |
| `provider_payment_id` | populated only after capture | Correct; pending payments do not have a payment ID. |
| `webhook_event_id` | NULL for all 9 rows | Correct until Razorpay accepts a webhook. It must never be fabricated from a browser callback. |
| `reconciliation_status` | `matched` for the successful browser test | Confirms the signed server-side Razorpay lookup matched the expected order, amount, and currency. |

Render logs show Razorpay webhook requests reaching the API and receiving **HTTP 401**. The remaining production configuration fix is to make the Razorpay Dashboard webhook secret exactly match the staging Render `RAZORPAY_WEBHOOK_SECRET`, then send/replay a real webhook. This is not a database schema defect.

## Genuine admin mismatch fixed in code

The finance API already returned canonical backend payment fields, but the admin client expected different aliases. As a result, the admin panel could show a booking UUID instead of its ticket, default every missing method to `card`, and show the creation time instead of the actual verification time. The fix now:

1. Resolves each payment’s `booking_id` to the public `AGR-YYYYMMDD-NNNN` ticket ID in the backend admin response.
2. Returns explicit `method` and `capturedAt` aliases while retaining the canonical fields.
3. Maps `paymentMethod`, `verifiedAt`, and `updatedAt` defensively in the admin client.
4. Exposes `providerOrderId`, `checkoutSessionId`, `checkoutUrl`, `webhookEventId`, and `reconciliationStatus` in the admin payment model.
5. Shows the gateway order reference and whether the capture was webhook-backed or browser-verified in the finance ledger.

## Form / table alignment results

| Area | Result | Notes |
|---|---|---|
| Payments / refunds | Aligned after patch | Backend writes all payment columns that can be known at each lifecycle stage. Nullable checkout URL and webhook ID are intentional. |
| Catalog CMS | Aligned at API boundary | Form payloads use camelCase and backend schemas translate/validate them before PostgreSQL snake_case persistence. Media limits and status transitions are enforced server-side. |
| Route Catalog | Mostly aligned | The admin form sends route extension fields (`usePerKm`, `perKmRateOverride`, `highway`, `allInclusiveNote`) and the backend route schema/repository must remain the source of truth for these extension columns. |
| Local & Transfers | Aligned | Form fields correspond to `local_sightseeing_packages` and `transfer_routes`; JSON pricing fields are intentionally stored as JSONB. |
| Tour Packages | Aligned after migrations 0025, 0030, and 0031 | Pricing removal, gallery, source/destination, inclusions, exclusions, and itinerary are represented in the live schema and domain mapping. |
| Policies / Company / Signoffs | Aligned | Admin forms use partial PATCH payloads and backend repositories update the matching dossier columns. |
| Frontend display | Payment display fixed | Finance previously dropped canonical gateway diagnostics; now it retains and displays them. |

## Critical security finding — not auto-applied

The live Supabase advisory reports RLS disabled on 12 tables: `schema_migrations`, `fare_rules`, `route_catalog`, `local_sightseeing_packages`, `transfer_routes`, `tour_packages`, `package_vehicle_upgrades`, `cancellation_policies`, `company_profile`, `dossier_signoffs`, `monuments`, and `pet_taxi_policy`.

These tables are exposed to Supabase `anon`/`authenticated` roles if a client can reach them through Supabase APIs. **Do not blindly enable RLS without policies**: the advisory explicitly warns that enabling RLS without reviewed policies will block access. The correct production remediation is to define read policies for only intended public content, deny direct client writes, and permit writes only through the authenticated backend/service role. This requires a separate reviewed migration and should not be applied automatically as part of the payment fix.

## Validation

- Backend TypeScript type-check: passed.
- Targeted backend payment tests: 12/12 passed.
- Admin TypeScript check and production Vite build: passed after installing the declared dependencies.
