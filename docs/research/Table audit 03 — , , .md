# Table audit 03 — `payments`, `refunds`, `raw_webhooks`

**Audit date:** 2026-10-06  
**Scope:** ArenaAI database domain only: `public.payments`, `public.refunds`, `public.raw_webhooks`, plus their booking/payment-provider lifecycle edges.  
**Safety:** Read-only audit. No production writes, migrations, webhook replays, deletes, or external submissions were performed.

## 1. Evidence and current live state

### Sources inspected

- Existing audit artifacts, read first: `reports/live-schema-inventory.md`, `reports/schema-model-alignment.md`, `reports/schema-audit-findings.md`, `reports/phase1-table-scan-findings.md`, and `reports/2026-10-06-16-table-alignment-execution-plan.md`.
- Schema/migrations: `backend/migrations/0002_create_enums.sql`, `0006_create_payments_and_refunds.sql`, `0009_add_indexes_and_rls.sql`, `0016_comprehensive_rls_policies.sql`.
- Backend domain/schema/repository: `backend/src/types/domain.ts`, `backend/src/db/types.ts`, `backend/src/db/postgres.ts`, `backend/src/db/memory.ts`, `backend/src/modules/payments/payment.schema.ts`, `payment.service.ts`, `payment.controller.ts`, `payment.routes.ts`, `backend/src/providers/PaymentProvider.ts`, `backend/src/providers/adapters/razorpay.ts`, `hmacCheckout.ts`, `backend/src/modules/bookings/booking.service.ts`, and `cancellation.engine.ts`.
- Admin: `backend/src/modules/admin/admin.schema.ts`, `admin.controller.ts`, `admin.service.ts`, `admin.routes.ts`, `admin/src/lib/api.ts`, `admin/src/lib/types.ts`, `admin/src/pages/FinancePage.tsx`.
- Customer/public: `react/src/services/api.ts`, `react/src/services/customerAuthApi.ts`, and `react/src/pages/PaymentResumePage.tsx`.
- Tests: `booking-payment.test.ts`, `booking-payment-lifecycle.test.ts`, `booking-cancellation-refund.test.ts`, `payment-provider-production.test.ts`.
- Existing Render/staging evidence in the earlier reports: Razorpay webhook requests reached the API but returned HTTP 401.

### Current Supabase MCP read-only result

A read-only `execute_sql` aggregate was run against project `trcmufqbpcymipqpemoq`.

| Table / slice | Current rows | Current status/null evidence |
|---|---:|---|
| `payments` | **11** | 7 `pending`, 4 `captured`, 0 `failed`, 0 `refunded`, 0 `needs_review` |
| `refunds` | **0** | Empty; no admin/provider refund row has been persisted |
| `raw_webhooks` | **0** | Empty; no signed webhook has been accepted/persisted |

Current payment null counts: `provider_payment_id` 7, `payment_method` 7, `verified_at` 7, `checkout_url` 11, `webhook_event_id` 11, `failure_reason` 11; `checkout_session_id`, `public_client_token`, `fee_minor`, and `tax_minor` are non-null in all 11 current rows. The 4 captured rows have provider order/payment IDs, `payment_method=netbanking`, `reconciliation_status=matched`, and `verified_at` populated. The 7 pending rows have no provider payment ID, method, or verification timestamp.

The prior inventory artifact recorded 9 payments; the live MCP query now returns 11. The prior artifact is therefore stale on row count, while its schema/interpretation remains useful. The live query is authoritative for this audit.

A second read-only query found 2 captured/pending mixes on already-paid bookings:

- `AGR-20261005-6980`: 2 payment rows (1 captured, 1 pending).
- `AGR-20261005-7826`: 3 payment rows (1 captured, 2 pending).

The pending rows have expired checkout intents. This is consistent with the code retaining abandoned attempts while selecting a new order after expiration; it is not evidence of a captured payment whose completion columns were dropped. It does indicate there is no cleanup/expiry-state job.

## 2. Database contract and foreign keys

Migration `0006_create_payments_and_refunds.sql` is the source definition.

### `payments`

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`; service supplies `newId()` explicitly.
- `booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE`; indexed.
- `provider payment_provider_enum NOT NULL`; enum currently allows `razorpay`, `paypal`, `card`, while the domain registry currently implements Razorpay only.
- `provider_order_id VARCHAR(120) NOT NULL UNIQUE`; indexed together with provider.
- `provider_payment_id VARCHAR(120) UNIQUE`; nullable so a checkout intent can exist before a provider payment is captured.
- `checkout_session_id VARCHAR(120)`, `checkout_url TEXT`, `public_client_token TEXT`; nullable provider-specific checkout metadata.
- `amount_minor BIGINT NOT NULL CHECK (amount_minor > 0)` and `inr_amount_paise BIGINT NOT NULL CHECK (inr_amount_paise > 0)`.
- `currency VARCHAR(5) NOT NULL DEFAULT 'INR'`.
- `status payment_status_enum NOT NULL DEFAULT 'pending'`; enum is `pending`, `captured`, `failed`, `refunded`, `needs_review`.
- `payment_method VARCHAR(50)`, `webhook_event_id VARCHAR(120)`, `failure_reason TEXT`, `verified_at TIMESTAMPTZ` are nullable lifecycle fields.
- `fee_minor BIGINT DEFAULT 0`, `tax_minor BIGINT DEFAULT 0`; backend explicitly writes zero at checkout and provider values at capture.
- `idempotency_key VARCHAR(100) NOT NULL UNIQUE`, `reconciliation_status VARCHAR(30) NOT NULL DEFAULT 'pending'`.
- `expires_at TIMESTAMPTZ NOT NULL`, `created_at`/`updated_at` non-null timestamps.

### `refunds`

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`; service supplies `newId()` explicitly.
- `payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE`.
- `booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE`.
- `provider_refund_id VARCHAR(120) UNIQUE` nullable because cancellation-policy records are created before/without a provider call.
- `amount_minor BIGINT NOT NULL CHECK (amount_minor > 0)`.
- `currency VARCHAR(5) NOT NULL DEFAULT 'INR'`, `reason TEXT NOT NULL`.
- `status VARCHAR(30) NOT NULL DEFAULT 'processed'`; database has no enum/check even though backend uses `pending | processed | failed`.
- `idempotency_key VARCHAR(100) NOT NULL UNIQUE`, `created_at` non-null.

There is no database constraint that `refunds.booking_id` equals `payments.booking_id`; the application supplies both from the same booking/payment but a composite relationship constraint is absent.

### `raw_webhooks`

- `id UUID PRIMARY KEY`; no database default; service supplies `newId()`.
- `provider TEXT NOT NULL`, `event_id VARCHAR(160) NOT NULL UNIQUE`, `event_type TEXT NOT NULL`.
- `payload JSONB NOT NULL`, `payload_hash VARCHAR(64) NOT NULL`.
- `processed BOOLEAN NOT NULL DEFAULT FALSE`, `received_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- No FK to `payments` and no direct provider-order column. The application matches the normalized event’s provider order ID to `payments.provider_order_id` after persistence; this is intentional for preserving unknown/out-of-order provider events.

RLS is enabled for all three tables by `0009_add_indexes_and_rls.sql`. `0016_comprehensive_rls_policies.sql` supplies service-role-all policies. The API uses the direct PostgreSQL repository, not client-side Supabase table access. No production RLS change was made.

## 3. Column population matrix

### 3.1 `payments`

| Column | What fills it / condition | Writer(s) | NULL/empty assessment |
|---|---|---|---|
| `id` | New UUID for each checkout intent | `payment.service.createCheckout`; DB default is bypassed by explicit value | Never null; intentional stable internal key |
| `booking_id` | Authoritatively resolved from `ticketId` after guest-token/owner check | Checkout service/repository insert | Never null; FK protects lifecycle |
| `provider` | Currently always `razorpay` from provider registry | Checkout service | Never null; enum is broader than implemented provider but no current row mismatch |
| `provider_order_id` | Razorpay order response `body.id`; order is created from server-calculated booking advance | Razorpay adapter, then checkout insert | Never null/unique; required reconciliation key |
| `provider_payment_id` | Only after server-side Razorpay lookup succeeds with matching order and `captured`, or a valid captured webhook supplies the ID | `verifyCheckoutPayment`, captured-webhook branch | NULL on 7 pending rows is intentional. NULL on browser-verified captured rows is also possible until a webhook; current captured rows are provider-ID populated |
| `checkout_session_id` | Razorpay adapter returns the order ID as the checkout session | Checkout insert | Nullable for provider portability; all current rows populated |
| `checkout_url` | Hosted redirect providers may return a URL; Razorpay adapter intentionally returns `null` because the customer uses in-page/modal Checkout.js | Checkout insert; customer page branches only if non-null | NULL in 11/11 is intentional, not a persistence defect |
| `public_client_token` | Public Razorpay key ID returned by adapter for Checkout.js | Checkout insert; customer resume page reads it | Nullable for providers that do not need a client key; all current rows populated; secret is not exposed |
| `amount_minor` | `rupeesToPaise(booking.advanceAmount)` is server-authoritative; adapter response is checked against it | Checkout service/repository insert | Never null; positive check is correct |
| `currency` | Server sets INR and validates provider result | Checkout insert / provider result | Never null; INR-only is intentional v1 contract |
| `inr_amount_paise` | Same server-authoritative advance amount as `amount_minor` | Checkout insert | Never null; duplicated canonical amount is an integrity surface but no current mismatch evidence |
| `status` | `pending` at checkout; `captured` after server verification or valid webhook; `failed` on failure webhook; `needs_review` on amount/currency mismatch; `refunded` on admin refund or refund webhook | Payment service | Pending/expired attempts are intentionally retained history; no `expired` enum/job exists, so they remain pending |
| `payment_method` | Provider `method` after trusted server lookup/webhook capture | Verify/webhook update | NULL before capture is intentional; current captured rows are `netbanking` |
| `fee_minor` / `tax_minor` | Zero at checkout; provider fee/tax on trusted capture | Checkout insert, verify/webhook update | Backend semantics treat null as zero in mapper, but current rows are non-null. A null legacy/bypass row would lose distinction between unknown and zero; no live defect observed |
| `idempotency_key` | UUID from customer checkout attempt | Checkout service/repository insert | Never null/unique; intentional idempotent replay key |
| `webhook_event_id` | Only a valid signed provider webhook that matches the order supplies the provider event ID | Captured/failed/refunded/needs-review webhook branches | NULL on all 11 is expected for browser-verified captures and pending attempts, but the absence of all webhook rows is a configuration blocker (see findings) |
| `reconciliation_status` | `pending` at insert; `matched` after trusted capture/failure/refund; `needs_review` for amount/currency mismatch | Payment service | Current pending/captured values are intentional; `duplicate` is present in the backend type but no writer was found |
| `failure_reason` | Event type on failure; amount/currency mismatch diagnostic on review | Webhook service | NULL before a failure/review is intentional; all current rows are null because no such event was accepted |
| `verified_at` | Current server time when a trusted capture is accepted | Verify/webhook capture branch | NULL until capture; current 7 pending rows are correct, 4 captured rows populated |
| `expires_at` | Provider checkout expiry, currently 30 minutes after order creation | Razorpay/HMAC adapter, checkout insert | Never null; it governs reopening pending checkout only. Captured rows retaining the original expiry is intentional historical metadata |
| `created_at` / `updated_at` | Creation time; `updated_at` changes on lifecycle updates | Checkout insert and payment update repository | Never null; expected audit timestamps |

### 3.2 `refunds`

| Column | What fills it / condition | Writer(s) | NULL/empty assessment |
|---|---|---|---|
| `id` | New UUID per refund record | Admin refund service or booking cancellation transition | Never null; intentional |
| `payment_id` | Selected captured payment for the booking | Admin refund service; cancellation transition | Never null; FK cascade. Service picks the first captured payment, while total-paid calculation can sum multiple captured rows; no current multi-captured booking evidence |
| `booking_id` | Resolved booking UUID | Same writers | Never null; FK cascade. Duplicate with payment relationship is application-consistent but not DB-enforced |
| `provider_refund_id` | Provider refund response ID for admin/provider API refund | Admin refund service after gateway call | NULL is intentional for cancellation-generated policy records, but there is no later provider execution path for those records (confirmed defect) |
| `amount_minor` | Full captured amount for admin refund; policy percentage of total captured amount for cancellation transition | Payment service / booking service | Must be positive under DB check, but cancellation intentionally emits zero for 0%-refund slabs (confirmed schema/code mismatch) |
| `currency` | Captured payment currency, normally INR | Same writers | Never null; intentional |
| `reason` | Required admin reason or generated cancellation policy explanation | Admin schema/service; booking cancellation service | Never null; intentional audit explanation |
| `status` | `processed`/`pending` from provider admin refund; cancellation uses `pending` when amount > 0 and `processed` when amount is zero | Refund creation only; no later update found | `failed` is modeled but no writer/transition was found. Pending provider/cancellation records have no reconciliation job. This is a lifecycle gap |
| `idempotency_key` | Admin request key or deterministic `cancel-{bookingId}-v{version}` key | Refund writers | Never null/unique; intentional duplicate prevention |
| `created_at` | Service clock at creation | Refund writers | Never null; intentional |

### 3.3 `raw_webhooks`

| Column | What fills it / condition | Writer(s) | NULL/empty assessment |
|---|---|---|---|
| `id` | New UUID when signature and JSON parse validation pass | `payment.service.reconcileWebhook` → repository | Never null; intentional |
| `provider` | Route parameter, currently literal `razorpay` | Webhook controller/service | Never null; intentional provider partition |
| `event_id` | Razorpay payload `id`, then entity ID, then generated fallback; stored before business matching | Razorpay adapter + repository | Never null/unique. Generated fallback is a provider-data-quality fallback; it is not a browser callback ID |
| `event_type` | Provider payload event name | Adapter/repository | Never null; intentional |
| `payload` | Parsed provider JSON (`event.raw`) re-serialized into JSONB | Webhook repository | Never null. Hash preserves exact raw bytes; JSONB itself loses formatting/order, acceptable for queryable audit storage but not byte-for-byte raw archival |
| `payload_hash` | SHA-256 of exact request raw body | Webhook service | Never null; intentional tamper/audit evidence |
| `processed` | False at insert; true after each recognized/ignored/mismatch/capture branch completes | Webhook service → `markProcessed` | False is intentional during retry/error/unknown-order handling. Unknown orders are persisted false and returned HTTP 200, but no operational reprocessing/list endpoint was found |
| `received_at` | Service clock when accepted | Webhook service/repository | Never null; intentional |

## 4. Writers and readers

### Customer/public writers/readers

1. Customer booking flow creates a server-authoritative booking draft, then `POST /api/v1/payments/create-checkout` (payment routes/controller/service). Guest access token or authenticated owner proves access; client-supplied monetary fields are deleted by `assertNoClientAmount` and ignored.
2. Customer `PaymentResumePage` opens Razorpay modal using `providerOrderId`, `amountMinor`, `currency`, and `publicClientToken`, then calls authenticated `POST /api/v1/payments/:paymentId/verify` with Razorpay order/payment/signature. It polls `GET /api/v1/payments/:paymentId/status` and reads the booking through customer-auth APIs.
3. The customer never writes payment status, refund status, webhook IDs, or provider IDs directly.
4. Customer status projection exposes payment status/reconciliation and booking status, not raw webhook payloads or admin refund rows.

### Provider/webhook writers/readers

- `POST /api/v1/payments/webhooks/:provider` preserves raw bytes using `rawBody.ts`, verifies `X-Razorpay-Signature`, parses/normalizes the event, records `raw_webhooks`, matches `provider_order_id`, updates `payments`, and marks the event processed.
- Valid captured events also transition a non-cancelled booking to `paid_confirmed` and queue the payment-confirmed notification.
- Failure and refund webhook branches update `payments`; they do **not** update `refunds` or the booking on refund.
- No webhook replay, raw-webhook admin reader, or refund reconciliation worker was found.

### Admin writers/readers

- Admin-only `GET /api/v1/ops/admin/payments` lists payment rows plus booking ticket, method, and `capturedAt=verifiedAt`. `admin/src/lib/api.ts` maps nullable provider/payment/webhook/capture fields without fabricating values.
- `FinancePage` displays gateway order reference, optional webhook ID (otherwise “browser-verified”), method, amount, capture timestamp, reconciliation, and status.
- Admin-only `POST /api/v1/ops/admin/refunds` requires `super_admin`, reason, booking ID/ticket, and idempotency key; it calls the provider refund API and, if provider status is processed, updates payment to `refunded` and booking to `refunded`.
- The admin finance form exposes an editable refund amount, but `admin.controller.ts` omits `body.amountMinor` when calling the service, and `payment.service.refund` always sends `captured.amountMinor`. This is a confirmed UI/API mismatch.
- Admin booking cancellation (`POST /api/v1/ops/admin/bookings/:id/transition` to `cancelled`) creates a policy refund row based on captured payments, but does not call a provider refund API.

## 5. Confirmed defects and severity

### DEF-03-01 — Cancellation can violate the live `refunds.amount_minor > 0` check (**High**)

**Evidence:**

- Migration `0006_create_payments_and_refunds.sql:30-40` and live inventory line 165 require `refunds.amount_minor > 0`.
- `backend/src/modules/bookings/booking.service.ts:417-426` intentionally sets `amountMinor: refundEval.refundAmountMinor` and `status: refundAmountMinor > 0 ? "pending" : "processed"`.
- `cancellation.engine.ts:44-50`, `132-143`, and `180-184` intentionally return `refundAmountMinor=0` for the `<24 hours`/no-show cab slabs and 0%-refund tour slabs.
- The in-memory integration test expects a zero-amount processed row (`booking-cancellation-refund.test.ts:146-152`), but memory repositories do not enforce PostgreSQL checks.

**Impact:** A real PostgreSQL cancellation of a paid booking under a 0%-refund policy attempts to insert `amount_minor=0`, violates the database check, rolls back the cancellation transaction, and can prevent the booking from being cancelled. This is a code/schema contract defect, not merely an unverified live condition.

**Bounded fix:** Either (a) do not insert a `refunds` row when the refundable amount is zero and retain the policy result in an audit/cancellation record, or (b) explicitly change the check to `amount_minor >= 0` after finance/legal review. Add a PostgreSQL-backed regression test for both 0 and positive policy outcomes.

### DEF-03-02 — Cancellation creates pending refund records but never executes or reconciles the provider refund (**High**) 

**Evidence:**

- `booking.service.ts:392-430` inserts a pending refund record for a positive policy amount during cancellation but never invokes `PaymentProvider.refund`.
- `payment.service.ts:416-496` is the only provider-refund path; it requires `booking.status === "paid_confirmed"` and therefore cannot be used after cancellation sets the booking to `cancelled`.
- Search found no refund-worker, pending-refund updater, provider-refund retry, or refund-row update method.
- `refunds` has no update repository method (`db/types.ts:116-120` only has create/get-by-idempotency/list), and `reconcileWebhook` refund branch updates only `payments` (`payment.service.ts:303-312`).

**Impact:** The nominal 24+ hour cancellation path can leave a `pending` refund row with `provider_refund_id=NULL` and no external refund ever initiated. A later provider refund webhook cannot complete the refund row or booking lifecycle. The current table is empty, so no live row is harmed, but the defect is demonstrable in code.

**Bounded fix:** Choose one reviewed design: execute the provider refund inside a durable outbox/job after cancellation, or create a refund intent and expose a controlled finance worker that can process a cancelled booking. Add refund update/list-by-provider-ID operations, provider idempotency, retry/failure states, and a webhook branch that updates the matching refund and booking atomically/idempotently.

### DEF-03-03 — Finance UI amount field does not control the actual refund amount (**High**)

**Evidence:**

- `FinancePage.tsx:261-270` displays editable `amount`, validates it against the selected payment, and `:294-296` submits the chosen value.
- `admin/src/lib/api.ts:140-149` sends only `{ bookingId, reason, idempotencyKey }`; it drops the amount.
- `admin.controller.ts:48-58` parses `CreateRefundSchema.amountMinor` but omits it when invoking `payments.refund`.
- `payment.service.ts:459-464` always passes `captured.amountMinor` to the provider and `:468-476` persists the full amount.

**Impact:** An operator can enter a partial refund amount, see the UI validate it, and the backend will still refund and record the full captured amount. This can over-refund and makes the finance ledger disagree with operator intent.

**Bounded fix:** Either remove the amount control and make the UI explicitly full-refund-only, or thread a server-validated `amountMinor` through controller/service/provider, enforce `0 < amount <= refundable balance`, and add partial-refund aggregation/idempotency tests. Do not trust the browser amount without server checks.

### DEF-03-04 — Provider refund webhooks do not complete the refund lifecycle (**Medium/High**) 

**Evidence:**

- `payment.service.ts:303-312` sets the payment to `refunded`, fills `webhook_event_id`, and marks the webhook processed, but never finds/updates a `refunds` row or transitions the booking.
- `RefundRecord.status` includes `pending`, `processed`, and `failed` (`domain.ts:215-225`), but there is no refunds update repository method and no writer for `failed`.
- The payment-system specification explicitly calls for `refund.created`, `refund.processed`, and `refund.failed` handling, while implementation only maps a generic `refunded` payment status.

**Impact:** A provider-confirmed refund can leave `refunds.status='pending'` and `booking.status='paid_confirmed'` (or, for a non-admin external refund, otherwise diverge), while payment alone says `refunded`. Current raw webhook/refund tables are empty, so this is latent but confirmed by code path absence.

**Bounded fix:** Parse provider refund ID/payment ID, update the corresponding refund row idempotently, record failed/pending transitions, and transition the booking only when the refund amount/status policy permits. Add out-of-order and duplicate event tests.

### DEF-03-05 — Admin reconciliation type omits a backend-supported value (**Low, latent**)

`PaymentRecord.reconciliationStatus` includes `"duplicate"` (`backend/src/types/domain.ts:205-208`), while `admin/src/lib/types.ts:85-99` permits only `pending | matched | needs_review`. No current live row is duplicate and no writer was found, so this is not a present data defect; it is a contract gap to resolve by either removing the unused backend value or adding it to the admin type/display mapping.

## 6. Configuration blocker / intentional emptiness

### CFG-03-01 — Razorpay webhook secret mismatch blocks `raw_webhooks` and webhook IDs (**Configuration blocker, not schema defect**)

Earlier live evidence in `reports/schema-audit-findings.md:22-32` and `reports/schema-model-alignment.md:19-24` records Razorpay webhook requests reaching staging and returning HTTP 401. The backend correctly verifies raw bytes against `RAZORPAY_WEBHOOK_SECRET`; `app.ts:375-382` wires the configured secret, and `rawBody.ts` preserves exact bytes. The Razorpay Dashboard secret must match the deployed staging variable before a signed event can be accepted. This audit did not change the secret or replay a webhook.

Consequences of the blocker:

- `raw_webhooks` remains 0 rows.
- `webhook_event_id` remains NULL for all 11 payments.
- The 4 current captured rows are valid browser/server-verified captures (`reconciliation_status=matched`, `verified_at` set); it would be incorrect to fabricate webhook IDs from browser callbacks.

### Intentional nullable/empty values

- Razorpay `checkout_url=NULL`: modal/in-page Checkout.js; durable references are `provider_order_id` and `checkout_session_id`.
- Pending `provider_payment_id`, `payment_method`, `verified_at`, `webhook_event_id`, and `failure_reason`: no trusted capture/failure webhook yet.
- `refunds=0`: no refund action has been executed; cancellation-generated rows are not created until a captured booking is cancelled, and admin refund calls were not run.
- `raw_webhooks=0`: no signed webhook has passed verification; do not create synthetic rows.
- Pending rows retained after `expires_at`: abandoned attempts are historical payment intents; current code refuses to reuse an expired pending intent and can create a new order. There is no expiry cleanup/state transition.
- `provider_refund_id=NULL` is intentional for cancellation-generated policy records before a gateway call, but the lack of a subsequent execution path is DEF-03-02.

## 7. Cross-table lifecycle trace

1. **Booking draft → payment intent:** customer draft stores server fare/advance; checkout resolves `bookings.id`, calls Razorpay order creation, sets booking `draft → pending_payment`, inserts `payments(status=pending)`.
2. **Browser/server verification:** authenticated owner sends order/payment/signature; adapter validates HMAC and server GET; amount/currency must match. Payment becomes `captured`, provider payment/method/fee/tax/reconciliation/verified time fill; booking becomes `paid_confirmed`; notification job is queued.
3. **Signed webhook:** raw body signature is verified, a unique raw event is inserted first, then order ID joins to payment. Failure/refund/review/capture branches update payment; captured branch also confirms booking. Unknown order is persisted unprocessed and returns 200.
4. **Cancellation:** admin transitions paid booking to cancelled; captured amounts are summed and policy computes refundable amount; cancellation inserts a refund intent linked to the first captured payment. Positive amount is `pending`, zero amount is `processed`; no gateway call occurs (DEF-03-02), and zero conflicts with DB check (DEF-03-01).
5. **Admin refund:** super admin resolves booking by UUID or ticket, chooses captured payment, calls provider, inserts refund row, and only for provider `processed` updates payment `refunded` and booking `refunded`. Provider-pending rows are inserted but no later reconciliation path exists.
6. **Delete behavior:** deleting a booking cascades to payments and refunds; deleting a payment cascades to refunds. `raw_webhooks` is intentionally independent and is not deleted with a payment/booking.

## 8. Controlled lifecycle test / audit limitation

No live lifecycle mutation was run because the task prohibits production payment/refund writes, migrations, webhook replays, deletes, and external submissions. The bounded safe substitute was the in-memory application test slice:

- `booking-payment.test.ts`: checkout from server amount, idempotent replay, captured webhook, duplicate webhook, invalid signature, amount mismatch, and order-level event without payment ID.
- `booking-payment-lifecycle.test.ts`: failure webhook, access-token security, refund webhook payment-state update.
- `booking-cancellation-refund.test.ts`: 100% positive refund intent and 0% retained cancellation behavior.
- `payment-provider-production.test.ts`: production credential enforcement and provider-side verification.

**Result:** 4 files, 18 tests passed. These tests prove service behavior but do not exercise PostgreSQL constraints or a real Razorpay refund. The required next bounded validation is a disposable PostgreSQL/schema test (or a transaction rolled back on a non-production database) covering: 0-amount cancellation insert, positive cancellation refund execution, admin partial amount, provider-pending then processed refund webhook, duplicate/out-of-order webhook, and booking/payment/refund status consistency. A real provider webhook/refund drill must remain a separately approved staging operation after the secret is fixed.

## 9. Recommended fix order

1. **P0 finance correctness:** remove or implement the Finance amount field; prevent full-refund overcharge from a partial UI selection (DEF-03-03).
2. **P0 cancellation correctness:** decide zero-refund representation and eliminate the PostgreSQL check/code contradiction (DEF-03-01).
3. **P0 refund durability:** add a durable provider-refund job/outbox and refund-row update/retry methods; never leave cancellation refunds permanently pending (DEF-03-02).
4. **P1 webhook reconciliation:** parse and persist provider refund IDs/statuses, update refund rows and booking state idempotently, including failed/out-of-order events (DEF-03-04).
5. **P1 operational hygiene:** add expiry/abandoned-attempt reporting or a non-destructive retention policy; do not delete payment history automatically.
6. **P2 contract cleanup:** reconcile the unused `duplicate` reconciliation value and consider a DB-level relationship constraint ensuring refund booking/payment belong to the same booking.
7. **Deployment verification:** align Razorpay Dashboard and Render webhook secrets, then perform an explicitly approved staging signed-webhook drill; verify `raw_webhooks.processed`, `payments.webhook_event_id`, and status transitions without using fabricated browser IDs.
