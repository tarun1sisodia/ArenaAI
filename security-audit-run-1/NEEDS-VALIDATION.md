# Needs-Validation Items — ArenaAI Security Audit Run 1

These items have source-grounded hypotheses but require owner-observed or deployment-visible confirmation before a severity can be assigned.

---

## SEC-009 · CORS No-Origin Behavior in Production

**Hypothesis**: `backend/src/app.ts:95-103` calls `cb(null, true)` for requests with no Origin header in production. This means all server-to-server callers (curl, mobile, scripts) are allowed without Origin restriction.

**Source trace**: `app.ts:94-110` (CORS callback) — both the `if (env.NODE_ENV === 'production')` block and the outer `else` block call `cb(null, true)` for missing Origin.

**Why not confirmed**: CORS is a browser security primitive, not an API authentication mechanism. Non-browser callers are never bound by CORS regardless of server settings. The correct controls for non-browser callers (JWT, HMAC) are in place. This is standard behavior for an API server.

**Validation needed**: Confirm no middleware, auth hook, or route handler treats the presence or value of the `Origin` header as a trust signal. Static analysis of current source shows no such usage.

**Owner action**: Review `app.ts:94-110` and confirm this is intentional. Consider adding a comment documenting why no-Origin is allowed (webhook providers, mobile clients).

---

## SEC-010 · Razorpay Amount Echo Not Asserted

**Hypothesis**: `razorpay.ts:74` stores `body.amount` (echoed from Razorpay order creation API) as the payment record's `amountMinor`. If Razorpay returns a different amount than ordered due to rounding or API bug, the webhook amount-match check would compare against the Razorpay-returned value, not the server-computed value.

**Source trace**: `razorpay.ts:49` sends `amount: command.amountMinor`. `razorpay.ts:74` stores `body.amount`. `payment.service.ts:139` stores `checkout.amountMinor` (the Razorpay-echoed value). `payment.service.ts:262` checks `event.amountMinor === payment.amountMinor` — both sides are Razorpay-reported.

**Why not confirmed**: Razorpay's order API is documented to echo exactly the amount ordered. A mismatch would indicate a provider bug, not an attacker-controlled path. The risk is theoretical.

**Validation needed**: Confirm that `body.amount === command.amountMinor` when Razorpay processes the order correctly. Consider adding an assertion: `if (body.amount !== command.amountMinor) throw new Error(...)`.

**Owner action**: Add assertion `body.amount === command.amountMinor` in `razorpay.ts:64-66` before using `body.amount`. This makes the check explicit and visible.
