# ArenaAI Agent Runbook

## Start every task

```bash
cd /home/ubuntu/ArenaAI
git status --short
git branch --show-current
git log -3 --oneline
```

Read `docs/agent/00_CONTEXT_HANDOFF.md`, then the applicable root rules and the main operating specification.

## Choose the implementation slice

Implement vertically when possible:

```text
Zod/schema → pure rule → service → migration → repository → controller → route → tests → documentation
```

Keep admin write and customer read boundaries explicit. Prefer the existing service/repository patterns instead of adding parallel data sources.

## Local verification

```bash
npm run typecheck --prefix react
npm run build --prefix react
npm run typecheck --prefix admin
npm run build --prefix admin
npm run typecheck --prefix backend
npm run build --prefix backend
npm test --prefix backend -- --run

git diff --check
git status --short
```

Use focused tests first, then the full relevant suite. If a test needs PostgreSQL, do not silently replace it with memory persistence; state the missing environment or use a disposable database.

## Data/source-of-truth checks

For any admin-editable field, verify this chain:

```text
Admin mutation → PostgreSQL transaction → audit event → public API → customer selector/page → cache invalidation
```

A static React value may be an SEO/editorial baseline but must not override live price, distance, availability, booking state, or payment state.

## Content lifecycle checks

Before implementing archive/delete behavior, verify:

- Stable URL and slug preservation
- `draft/published/paused/archived/retired` state
- Bookability is derived server-side
- Sitemap and canonical behavior
- Structured data availability (`OutOfStock` or no offer when unavailable)
- Alternatives and enquiry CTA
- Audit record and authorization

Never route every retired page to the homepage. Use a relevant 301 only for substantially equivalent intent; use 410 only after deliberate review.

## Payment checks

- Amount comes from the persisted server fare.
- Client never submits authoritative total or distance.
- Provider webhook signature is verified against raw body.
- Duplicate webhook is idempotent.
- Checkout failure never becomes confirmed/paid.
- Refund and reconciliation are audited.
- Razorpay webhook route is `/api/v1/payments/webhooks/razorpay`.
- Secret belongs in Render environment, never in Git or chat.

## Deployment checks

Customer API base must be set through deployment configuration. Current fallback backend is:

```text
https://client-juj4.onrender.com
```

Admin/customer Cloudflare origins must be exact entries in backend CORS configuration. Render must have database URL, migration process, payment provider configuration, webhook secret, and server-side LocationIQ configuration as appropriate.

## Commit discipline

```bash
git diff --check
git add <specific-files>
git commit -m "type: concise change"
git push origin main
git status --short
git rev-parse HEAD origin/main
```

Do not force-push. Do not commit generated `dist/` output unless the repository already tracks it intentionally.

## Safe response format

Report:

1. What changed
2. What was verified
3. What remains
4. Commit/hash if pushed
5. Any deployment action the user must perform

Do not repeat or expose credentials found in the environment or user messages.
