# ArenaAI live schema audit findings — 2026-10-05

## Sources
- Live Supabase project: `trcmufqbpcymipqpemoq` (`ClientServer2`)
- Live schema inspection: Supabase `list_tables` verbose output, saved under `/home/ubuntu/.mcp/tool-results/2026-10-05_15-24-10.256481768_supabase_list_tables_832f3db2.json`
- Live migration ledger: `public.schema_migrations`, 32 applied migrations through `0031_tour_packages_source_dest_inclusions.sql`
- Live payment query for ticket `AGR-20261005-1489`
- Render staging logs for `skb-baghel-api-staging`

## Payment facts
- Booking `AGR-20261005-1489` payment row:
  - provider: `razorpay`
  - provider_order_id: populated (`order_TkGfnxkGlEisfI`)
  - provider_payment_id: populated (`pay_TkGkLs1HqQyLTV`)
  - checkout_session_id: populated with Razorpay order ID
  - checkout_url: `NULL`
  - status: `captured`
  - payment_method: `netbanking`
  - webhook_event_id: `NULL`
  - reconciliation_status: `matched`
  - verified_at: populated
- Across all 9 payment rows:
  - `checkout_url` is NULL for 9/9
  - `webhook_event_id` is NULL for 9/9
  - provider payment ID is NULL for 7/9 (expected for pending/unpaid rows)
  - captured payments: 2/9
- Render logs show Razorpay webhook requests reaching the backend but returning HTTP 401. Browser callback verification returns HTTP 200 and correctly updates the payment and booking.

## Interpretation
- `checkout_url` is not a database write failure. The Razorpay adapter intentionally returns `checkoutUrl: null`; Razorpay Checkout is an in-page/modal checkout, not a hosted redirect URL. The durable checkout reference is `checkout_session_id` / `provider_order_id`.
- `webhook_event_id` remains NULL because no webhook is accepted. The webhook signature secret configured in Render does not match the secret configured in Razorpay Dashboard, or the webhook endpoint is configured with a different secret. Do not populate this column with a fabricated browser callback ID; browser callbacks have no Razorpay webhook event ID.
- The correct fix for `webhook_event_id` is to align the Razorpay webhook secret and then replay/send a real webhook. The correct admin/UI fix is to display provider order ID and checkout session ID, and treat checkout URL as nullable for Razorpay.

## Security finding
Supabase reports RLS disabled on 12 tables: `schema_migrations`, `fare_rules`, `route_catalog`, `local_sightseeing_packages`, `transfer_routes`, `tour_packages`, `package_vehicle_upgrades`, `cancellation_policies`, `company_profile`, `dossier_signoffs`, `monuments`, `pet_taxi_policy`. The advisory explicitly warns that enabling RLS without policies will block access; this must be remediated with reviewed policies, not blindly enabled.
