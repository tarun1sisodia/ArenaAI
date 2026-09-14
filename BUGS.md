# Bugs, Risks, and Technical Debt — SK Baghel Tour & Travels

**Document status:** Living register  
**Source of truth:** [Backend Architecture Plan](BACKEND_ARCHITECTURE_PLAN.md)
**Last Hardened:** 2026-09-14 — Security hardening pass for Medium/Reddit edge cases

## How to Use This Register

Every issue should record its impact, owner, reproduction or detection method, mitigation, and verification evidence. Security and payment issues take priority over cosmetic or optimization work.

## Severity Definitions

| Severity | Meaning | Response target |
|---|---|---|
| Critical | Money movement, authentication, data loss, or production outage is possible | Stop release and remediate immediately |
| High | A core booking or dispatch workflow is unreliable or materially insecure | Remediate before production launch |
| Medium | A bounded feature defect or operational weakness exists | Schedule in the current delivery phase |
| Low | Minor usability, documentation, or maintainability issue | Address during normal backlog grooming |

## Known Risks and Open Items

| ID | Severity | Area | Risk or bug | Mitigation | Status |
|---|---|---|---|---|---|
| BUG-001 | Critical | Payments | Client-submitted totals could be trusted accidentally | Recalculate every fare on the server and create Razorpay orders from the persisted amount; strip client money fields via assertNoClientAmount and Zod strip | **Closed** — Verified in booking-payment.test.ts, client amounts stripped, checkout uses persisted advance |
| BUG-002 | Critical | Webhooks | Duplicate Razorpay deliveries could trigger duplicate confirmation or fulfillment | Store provider event IDs and use an idempotency key with an atomic state transition; transaction with REPEATABLE READ and FOR UPDATE | **Closed** — duplicate webhook returns 200 without side effects, tested |
| BUG-003 | High | Payments | A success redirect could be treated as proof of payment | Treat a verified webhook as authoritative; use redirect only to trigger status polling; returnUrl validated against CORS allowlist | **Closed** — only signed provider reconciliation sets paid_confirmed |
| BUG-004 | High | Privacy | Public booking responses could expose customer phone or email | Mask personal data and require ticket token or exact phone verification; remove last4 bypass; driver PII only to token holders | **Closed** — token/phone required, phone masked, last4 rejected (contract test), driver reveal only to token/admin |
| BUG-005 | High | Secrets | API keys or service-role credentials could enter logs or source control | Environment-only secrets, secret scanning, and redaction middleware; helmet HSTS; pino redaction includes guestAccessToken, signatures, idempotency keys | **Closed** — env-only secrets, pino redaction expanded, production env validation requires secrets, no secrets in code |
| BUG-006 | High | Booking | Concurrent requests could create duplicate tickets or reservations | Use database uniqueness constraints and transactional insertion; retry allocation 8 times; check duplicate booking within 5 min window | **Closed** — unique ticket_id plus retry allocation plus duplicate booking detection |
| BUG-007 | Medium | Location | LocationIQ outages could block fare estimation | Add bounded timeout (2.5s), cache reads (30-day TTL), clear fallback messaging, and provider monitoring | **Mitigated** — timeout, cache, fallback implemented; monitoring still open |
| BUG-008 | Medium | Scope | Unrequested driver-app or live-tracking code could increase complexity and privacy risk | Reject driver app, GPS telemetry, WebSockets, and live tracking from implementation | **Closed** by scope decision |
| BUG-009 | Medium | Dispatch | A driver could be assigned to overlapping trips | Validate time windows and driver status inside a transaction; check assigned_driver_id bookings with driver_assigned/in_transit and isOverlapping | **Closed** — overlapping check implemented with 24h default window, tier compatibility, vehicle active check, version optimistic locking |
| BUG-010 | Medium | Notifications | WhatsApp or email delivery could fail after payment succeeds | Queue notifications, retry safely (max 3 attempts), and expose delivery status to operations; dedupe key | **Mitigated** — retry with backoff, dedupe, timeout 5s; BullMQ for scale still planned |
| BUG-011 | Medium | Refunds | Refund processing could diverge from booking status | Require authorized refund action and record provider refund ID before final status update; check existing processed refunds to prevent double refund; transaction | **Closed** — idempotency inside tx, already-refunded check, status transition validated |
| BUG-012 | Low | Documentation | API and model definitions can drift from implementation | Run contract tests and review [API.md](API.md) and [MODELS.md](MODELS.md) with each schema change | **Mitigated** — 38 tests covering contract, security edge cases; SECURITY_HARDENING.md added |
| BUG-013 | High | Auth | JWT role escalation via user_metadata | Only trust app_metadata.role, validate sub, issuer, token length | **Closed** — authGuard fixed, only app_metadata.role trusted |
| BUG-014 | High | Injection | XSS via specialNotes, name, address; prototype pollution via __proto__ | Sanitize free-text (strip HTML tags), reject script/javascript/on* patterns, hasOwnProperty check for __proto__ | **Closed** — sanitizeText added, Zod regex, rawBody pollution check fixed |
| BUG-015 | High | Open Redirect | returnUrl/cancelUrl could point to attacker domain | Validate against CORS allowlist, require HTTPS | **Closed** — isAllowedReturnUrl implemented |
| BUG-016 | Medium | Promo Abuse | Promo codes could be reused beyond maxRedemptions or after expiry | Validate isActive, validFrom/validTo, maxRedemptions in applyPromo with DB lookup; increment redemption count on payment captured | **Closed** — promo lookup with expiry and redemption checks |
| BUG-017 | Medium | Rate Limit | No per-route rate limiting, webhook could be rate-limited | Per-route limits via fastify rate-limit config, webhook allowlisted but still HMAC protected | **Closed** — all routes have explicit rateLimit config |

## Required Verification Scenarios

All scenarios automated:

- duplicate webhook delivery — booking-payment.test.ts duplicate test
- invalid webhook signature — booking-payment.test.ts invalid signature test
- altered fare request — booking-payment.test.ts sends totalFare:1, expects server recalc
- repeated draft-booking request — booking.service duplicate detection within 5 min
- concurrent driver assignment — dispatch-catalog.test.ts version conflict 409
- expired passenger link — booking service asserts pickup not in past, contract test rejects past datetime
- failed notification retry — notification.service max 3 attempts, marks failed
- refund replay — refund idempotency key returns existing, already-refunded check
- phone enumeration via last4 — contract test rejects last4, expects 400
- XSS via notes — contract test rejects <script>
- overlapping driver assignment — dispatch.service isOverlapping check

## Defect Workflow

New issues begin in `Open`. An issue moves to `In Progress` only when an owner and reproduction or acceptance test exist. It moves to `Ready for Verification` after implementation and to `Closed` only after the acceptance test passes in a representative environment.

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"
[2]: backend/SECURITY_HARDENING.md "Security Hardening Details"

The risks and controls in this register are derived from [1] and hardened per [2].
