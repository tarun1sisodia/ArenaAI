# Bugs, Risks, and Technical Debt — SK Baghel Tour & Travels

**Document status:** Living register  
**Source of truth:** [Backend Architecture Plan](BACKEND_ARCHITECTURE_PLAN.md)

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
| BUG-001 | Critical | Payments | Client-submitted totals could be trusted accidentally | Recalculate every fare on the server and create Razorpay orders from the persisted amount | Closed in backend tests — client amounts are stripped and checkout uses persisted advance |
| BUG-002 | Critical | Webhooks | Duplicate Razorpay deliveries could trigger duplicate confirmation or fulfillment | Store provider event IDs and use an idempotency key with an atomic state transition | Closed in backend tests — duplicate webhook returns 200 without side effects |
| BUG-003 | High | Payments | A success redirect could be treated as proof of payment | Treat a verified webhook as authoritative; use redirect only to trigger status polling | Closed in code — only signed provider reconciliation sets paid_confirmed |
| BUG-004 | High | Privacy | Public booking responses could expose customer phone or email | Mask personal data and require ticket token or phone verification | Closed in backend tests — token/phone required and phone masked |
| BUG-005 | High | Secrets | API keys or service-role credentials could enter logs or source control | Environment-only secrets, secret scanning, and redaction middleware | In progress — env-only secrets and pino redaction; staging secret scan still required |
| BUG-006 | High | Booking | Concurrent requests could create duplicate tickets or reservations | Use database uniqueness constraints and transactional insertion | Closed in schema/code — unique ticket_id plus retry allocation |
| BUG-007 | Medium | Location | LocationIQ outages could block fare estimation | Add bounded timeout, cache reads, clear fallback messaging, and provider monitoring | Open |
| BUG-008 | Medium | Scope | Unrequested driver-app or live-tracking code could increase complexity and privacy risk | Reject driver app, GPS telemetry, WebSockets, and live tracking from implementation | Closed by scope decision |
| BUG-009 | Medium | Dispatch | A driver could be assigned to overlapping trips | Validate time windows and driver status inside a transaction | Open |
| BUG-010 | Medium | Notifications | WhatsApp or email delivery could fail after payment succeeds | Queue notifications, retry safely, and expose delivery status to operations | Planned |
| BUG-011 | Medium | Refunds | Refund processing could diverge from booking status | Require authorized refund action and record provider refund ID before final status update | Open |
| BUG-012 | Low | Documentation | API and model definitions can drift from implementation | Run contract tests and review [API.md](API.md) and [MODELS.md](MODELS.md) with each schema change | Open |

## Required Verification Scenarios

The following scenarios must be automated before launch: duplicate webhook delivery, invalid webhook signature, altered fare request, repeated draft-booking request, concurrent driver assignment, expired passenger link, failed notification retry, and refund replay.

## Defect Workflow

New issues begin in `Open`. An issue moves to `In Progress` only when an owner and reproduction or acceptance test exist. It moves to `Ready for Verification` after implementation and to `Closed` only after the acceptance test passes in a representative environment.

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"

The risks and controls in this register are derived from [1].
