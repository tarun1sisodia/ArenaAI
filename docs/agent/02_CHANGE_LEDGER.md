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

### `927069b` — Live flow safety and operating specification

Implemented:

- Fail-closed admin role claim check
- Production API fallback to Render backend
- Payment checkout failure no longer becomes success
- Development-only payment simulation
- Database readiness HTTP 503
- Full admin/customer/backend audit and 70-operation specification

## Current expected webhook route

```text
https://client-juj4.onrender.com/api/v1/payments/webhooks/razorpay
```

The Razorpay webhook secret must exactly match Render's `RAZORPAY_WEBHOOK_SECRET`. Never store the secret here.

## Current verification baseline

- React typecheck/build passed after live-flow safety changes.
- Admin typecheck/build passed after auth hardening.
- Backend typecheck/build passed.
- Focused backend network-header and catalog-manifest tests passed.

## Known next work

See `docs/agent/00_CONTEXT_HANDOFF.md` and section 8 of the root operating specification. The most important engineering task is making database fare rules and catalog routes the single production source used by public fare calculation and booking.
