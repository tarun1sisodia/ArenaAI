# ArenaAI Agent Change Ledger

## 2026-09-27

### `0d6bd95` — SEO/AEO/GEO lifecycle governance

Merged into the root operating specification:

- Draft/published/paused/archived/retired lifecycle
- Stable URL preservation
- Archive without losing SEO value
- Sitemap and canonical rules
- AEO answer and structured-data rules
- GEO/entity consistency rules
- Lifecycle acceptance tests

### Phase 1 — Step 1.1: Production Payment Provider Enforcement

Implemented:

- Mandatory Razorpay credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) enforced in `backend/src/config/env.ts` when `NODE_ENV === "production"`.
- Test/dummy credentials (`rzp_test_local*`) strictly prohibited in production.
- `createRazorpayAdapter` in `backend/src/providers/adapters/razorpay.ts` throws immediately if HMAC fallback is attempted with `isProduction: true`.
- Created comprehensive unit test suite in `backend/tests/unit/payment-provider-production.test.ts` (5 tests passing).
- Verified with full monorepo typecheck (`react`, `admin`, `backend`).

## Current webhook route

```text
https://client-juj4.onrender.com/api/v1/payments/webhooks/razorpay
```

The Razorpay webhook secret must exactly matches Render's `RAZORPAY_WEBHOOK_SECRET`. Never store the secret here.

## Current verification baseline

- React typecheck/build passed after live-flow safety changes.
- Admin typecheck/build passed after auth hardening.
- Backend typecheck/build passed.
- Focused backend network-header and catalog-manifest tests passed.

## Known next work

See `docs/agent/00_CONTEXT_HANDOFF.md` and section 8 of the root operating specification. The most important engineering task is making database fare rules and catalog routes the single production source used by public fare calculation and booking.
