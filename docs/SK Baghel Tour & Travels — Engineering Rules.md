# SK Baghel Tour & Travels — Engineering Rules

**Status:** Canonical rules  
**Applies to:** Admin, Backend, Customer, shared contracts, tests, and AI coding agents  
**Last reviewed:** 2026-10-09

## 1. Source-of-truth rules

1. Database state comes from Backend transactions.
2. Pricing formulas come from the Backend pricing domain.
3. Cross-app enums/contracts come from `contracts/`.
4. Public Customer data comes from a verified release projection.
5. Booking/payment state comes from Backend/provider verification.
6. Documentation in this canonical set overrides historical plans when they conflict.
7. A feature's current implementation may differ from the target, but the difference must be recorded and tested; it must not be silently normalized in documentation.

## 2. Feature-by-feature development rule

- Build one vertical or capability at a time.
- Do not start the next feature when the current feature has only passed typecheck/build.
- The current feature must pass unit, contract, integration, lifecycle, and staging manual acceptance.
- The user must verify create, update, publish, render, search, booking handoff, and archive behavior on staging.
- Record the accepted release ID, test evidence, known limitations, and next step in `Memory.md` only after implementation begins.

## 3. Contract rules

- Define or update the contract before editing consumers.
- Use `contracts/REGISTRY.md` to name the source, consumers, and tests.
- API wire fields are camelCase; database fields are snake_case.
- Use an explicit adapter when an existing endpoint temporarily differs.
- Never create a third casing or a second meaning for the same field.
- Canonical vehicle tiers are exactly:

```text
sedan
ertiga
innova-crysta
tempo-traveller
urbania
```

- Legacy `innova` and `tempo` may be read only during compatibility migration; they are never written to new records or emitted in new public releases.
- Unknown enum keys fail with a named validation error.
- API success and error envelopes follow `contracts/WIRE.md`.
- Money is integer minor units in payment/database boundaries and rupees in API/pricing display boundaries; conversion occurs once and is tested.

## 4. Admin rules

- Admin never imports Supabase database clients for business writes and never executes SQL.
- Every form has an explicit payload builder.
- Form defaults must not overwrite existing values on partial edit.
- “Save” and “Publish” are separate state transitions unless a documented atomic command exists.
- Admin displays saved, published, release, and deployed states separately.
- Preflight availability checks improve UX but do not replace database uniqueness constraints.
- Every mutation handles loading, success, validation, authorization, network failure, and retry states.
- Admin must not treat a deploy-hook request as proof that the Customer site is live.

## 5. Backend rules

- Route handlers translate HTTP only; services coordinate use cases; repositories persist.
- Parse and validate at the API boundary with strict schemas.
- Apply cross-field business rules in one domain location.
- Use database transactions for related state changes.
- Return the persisted result, not a request-shaped guess.
- Do not catch an error only to return stale data or an empty success response.
- Every mutation has an idempotency strategy where retries/double-clicks are possible.
- Every important mutation records actor, request ID, correlation ID, entity ID, old state, new state, and source version.
- Authorization is enforced on Backend even if the UI hides a button.
- Client totals, client status, and client payment claims are never trusted.

## 6. Error handling and fallback rules

Normal production paths fail closed.

Forbidden:

- `catch {}` that hides a failed write.
- Returning `[]` after a required public endpoint fails.
- Falling back from production to staging.
- Preserving an old snapshot while reporting a fresh build.
- Inventing a missing fleet price.
- Rendering a generic page when a typed entity is missing.
- Treating a partial release as complete.

Allowed only as explicit emergency behavior:

- A last-known-good release fallback behind a named flag.
- It must print the stale release ID/time.
- It must show Admin that the release is stale.
- It must never claim that the new data is live.

Errors must say:

1. what operation failed;
2. which entity/request was involved;
3. whether the database changed;
4. whether publication was queued;
5. what the operator should do next.

## 7. Publication rules

- Draft is private.
- Only published and active entities enter the public release.
- Every release has one ID, version, timestamp, and source fingerprint.
- Duplicate UUID or slug fails the release.
- Missing published records fail the release.
- Inconsistent section versions fail the release.
- Build input is schema-validated before HTML generation.
- Generated pages and sitemap entries must match one-to-one.
- A deploy hook starts work; deployment verification is a separate check.
- Publication must be retryable and idempotent.

## 8. Customer rules

- Customer renders the public release and does not recreate Backend pricing formulas.
- Essential SEO content must exist in pre-rendered HTML.
- Every entity family has an explicit resolver and template.
- Wrong family, missing slug, draft, and archived item produce the documented unavailable/404 result.
- The customer URL is derived from one stable public identifier.
- The customer sends booking intent and selection; Backend returns authoritative quote/state.
- Browser localStorage/cache may prefill UX but never override the current public release or Backend authority.

## 9. Testing rules

A test is incomplete unless it states:

- **What it does:** setup, operation, observed outputs.
- **Why it matters:** failure mode prevented.
- **Boundary:** Admin, API, database, release, build, page, or booking.
- **Evidence:** IDs, versions, paths, HTML markers, and response bodies.

Mandatory adversarial categories:

- duplicate submit and concurrent create;
- duplicate UUID/slug in public release;
- partial update overwriting missing fields;
- stale Admin edit overwriting a newer version;
- direct API bypass of Admin validation;
- draft/archived leakage;
- missing/unknown fleet keys;
- endpoint 404/500/timeout;
- malformed or empty release;
- wrong environment source;
- retry after timeout;
- failed build replacing good release;
- old customer page submitting a booking;
- manipulated client price;
- unauthorized publish/archive/refund.

Required test layers:

1. Unit tests for pure rules.
2. Contract tests for schemas and envelopes.
3. Integration tests for API/database transactions.
4. Release tests for projection completeness and uniqueness.
5. Build tests for manifest/SSG behavior.
6. Browser/E2E tests for Admin-to-Customer workflows.
7. Manual staging acceptance by the user.

## 10. Payment and booking rules

- Booking draft stores an immutable quote/fare snapshot.
- Final payable state comes from verified provider webhook state.
- Duplicate/out-of-order webhooks are idempotent.
- Amount mismatch is rejected and audited.
- Refunds are Backend operations with permission checks and audit records.
- No frontend path marks a booking paid.
- Do not change the existing working booking flow while repairing catalogue publication unless the feature contract explicitly requires the handoff.

## 11. Database and migration rules

- Migrations are append-only.
- Use expand-and-contract for schema changes.
- Add database uniqueness constraints for public identifiers.
- Never delete data or columns as a shortcut.
- Backfill legacy values with a report showing before/after counts.
- Every migration has rollback/recovery notes and a staging rehearsal.

## 12. AI agent rules

The AI agent must:

- read the canonical docs before proposing implementation;
- inspect the actual repository before naming files or APIs;
- make one small, reviewable change set per feature step;
- explain data flow and contract changes before coding;
- preserve the working booking/payment path;
- run the required tests and report exact commands/results;
- stop at a permission, schema, or product ambiguity that materially changes behavior;
- update documentation after a confirmed architectural decision.

The AI agent must not:

- rebuild the whole backend without evidence;
- add guessed endpoints or fields;
- duplicate business rules in React/Admin;
- hide errors with broad fallback catches;
- mark a feature complete from a green build alone;
- begin the next phase before staging sign-off;
- create `Memory.md` before coding starts.
