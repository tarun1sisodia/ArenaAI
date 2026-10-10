# SK Baghel Tour & Travels (ArenaAI) — BACKEND Test Plan: 100 Tests

**Target:** `backend/` — Fastify 5 + TypeScript + Zod + PostgreSQL (Supabase) + Razorpay + LocationIQ + WhatsApp/Email, deployed on Render (Docker).
**Derived from:** repo README, `docs/DEPLOYMENT.md`, `BACKEND_RULES.md` (10 Golden Laws, DDL, route table, webhook sequence) and `ADMIN_CUSTOMER_BACKEND_AUDIT_AND_OPERATING_SPEC.md` (audit dated 27 Sep 2026).
**Important:** these tests were written from the repo's specifications and audit. I did not read the TypeScript source, so route paths and field names may differ slightly. If reality differs from the docs, log it in the **Drift list** (see ranking prompt). Do not silently skip the test.

---

## 0. How this plan was designed (technique sources)

- **Razorpay docs:** duplicate webhooks are detected with the `x-razorpay-event-id` header, and events can arrive out of order (for example `captured` before `authorized`). This drives BE-050 to BE-054.
- **Concurrency write-ups and OSS booking repos:** sequential tests make race-prone code look correct. Use two-session barriers and fire ~20 identical parallel requests asserting exactly one winner. DB-level exclusion or unique constraints beat application-level checks. This drives BE-056, BE-063, BE-064, BE-067 to BE-069.
- **OWASP API Top 10 playbooks:** BOLA/IDOR, mass assignment, JWT claim tampering, verb tampering, rate-limit bypass. This drives BE-027, BE-036, BE-070 to BE-079.
- **Payment chaos tooling:** decline spikes, minimum-amount transactions, duplicate-webhook replay, provider outages. This drives BE-009 to BE-011, BE-046, BE-098.
- **Playwright/QA practice:** network abort, slow network, rage-click. See the React and Admin files.
- **Source honesty note:** Reddit/X/Instagram threads were not retrievable through my search tool. The patterns above come from engineering blogs, OSS repos, vendor docs and OWASP material.

## 1. Environment (disposable only; never run destructive tests on production)

- Staging stack: fresh Postgres 16 (or Supabase branch), backend built from `main`, Razorpay **test mode** keys + a mock Razorpay server for fault injection, mock LocationIQ/WhatsApp/Email.
- Tools: `curl`/`httpie`, `psql`, `k6`, `fast-check` (property tests), `jwt_tool`, `toxiproxy` (fault injection), a small script runner able to **fire N requests behind a barrier**.
- Test users: `customer_A`, `customer_B`, and one staff user for each role (`content_editor`, `moderator`, `dispatcher`, `finance`, `super_admin`) via `app_metadata.role`.

## 2. Legend

- **Severity:** `P0` money / security / data-loss release blocker · `P1` major · `P2` moderate · `P3` minor.
- **KNOWN-GAP(audit):** flagged as unfixed in the repo's own audit. Expect FAIL today. If already fixed, it becomes a regression guard. It still counts in the score.
- **INV-n:** invariant SQL checks. Run them after every state-changing test.
  - **INV-1** No booking in `paid_confirmed / driver_assigned / in_transit / completed` without a `captured` payment whose `amount_paise = advance_amount × 100`.
  - **INV-2** At most one captured payment (one advance) per booking; no duplicate ledger transitions.
  - **INV-3** `total_fare = base_fare + night_allowance + driver_allowance − discount_amount` and `balance_amount = total_fare − advance_amount ≥ 0`.
  - **INV-4** Σ refunds per payment ≤ payment amount.
  - **INV-5** `ticket_id` unique and matches `^AGR-[0-9]{8}-[0-9]{4}$`; `version` strictly monotonic.
  - **INV-6** `cancelled` booking has no captured-and-unrefunded payment; `refunded` booking has a refund row.

### Hostile value sets (reused everywhere)

- **HV-NUM:** `0, -0, -1, 0.001, 1e308, 1e-9, NaN, Infinity, "10", "1,000", "１０" (full-width), [10], {"$gt":0}, null, true, 9007199254740993, 2147483648, 100.005`
- **HV-STR:** `"", " ", "\u200b\u200b", 1 char, 2 chars, 10,000 chars, "'; DROP TABLE x;--", "<script>alert(1)</script>", "${7*7}", "{{7*7}}", "\u0000", "😀"×50, "आगरा", "مرحبا", NFC vs NFD "é", "a\r\nBcc: x@y", "%00", "../../etc/passwd", leading/trailing spaces`
- **HV-DATE:** `past, now, now+1min, 2028-02-29, 2027-02-29, 9999-12-31, "2026-10-10T10:00:00" (no zone), "…+05:30", "…Z", with ms, "2026-13-01", epoch number, "", null`
- **HV-JSON:** `invalid JSON, empty body, array body, string body, 10 MB body, nesting depth 1000, duplicate keys, "__proto__" key, extra unknown fields, Content-Type text/plain | x-www-form-urlencoded | multipart | charset=utf-16, gzip bomb`
- **HV-ID:** `UUID v1, v4, nil UUID, UPPERCASE UUID, {braces}, another user's id, non-existent id, SQL meta, 1 MB string, Unicode look-alike digits`

### CRUD coverage map

| Entity | Create | Read | Update | Delete / Archive |
|---|---|---|---|---|
| Booking | BE-022–034 | BE-035–041 | BE-062–066 | BE-066, BE-092 |
| Payment / Refund | BE-042, BE-058 | BE-070 | BE-047–057, BE-059–060 | BE-092 |
| Catalog / Media | BE-080, BE-084 | BE-083 | BE-081–082, BE-085 | BE-080, BE-085 |
| Fare rules / Fleet | BE-090 | BE-018 | BE-090 | BE-090 |
| Review / Inquiry | BE-086, BE-087 | BE-086 | BE-086 | BE-086 |
| Audit log | BE-078 | BE-089 | blocked (append-only) BE-078 | blocked BE-078 |

---

# TESTS

## A. Boot, config, health (BE-001 to BE-008)

### BE-001 · Production boot refuses missing required env `P0` `CONFIG`
1. Set `NODE_ENV=production`; unset `DATABASE_URL`; keep everything else valid.
2. Run `node dist/server.js`.
3. Repeat, unsetting one at a time: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `CORS_ORIGINS`, `API_BASE_URL`.
- **Pass:** every run exits non-zero in ≤5 s, names the exact variable, never opens port 4000, prints no secret values.
- **Proof:** `ss -ltnp | grep 4000` is empty; stderr has no secrets.

### BE-002 · `ALLOW_TEST_AUTH` can never reach production `P0` `SEC`
1. Boot production with `ALLOW_TEST_AUTH=true`, then `TRUE`, `1`, `yes`.
2. Boot development with the flag; send the test-auth credential the code accepts to an admin route.
3. Boot production without the flag; send the same test credential.
- **Pass:** production refuses to start for every spelling. Dev accepts test auth only with the flag. Production-mode returns 401 for the test credential.

### BE-003 · CORS allowlist strictness `P0` `SEC`
1. Boot prod with `CORS_ORIGINS` = `*`, `http://site.com`, `https://site.com/` (trailing slash), `https://a.com,,https://b.com`, ` https://a.com `.
2. With a valid config send OPTIONS preflights with `Origin`: allowed origin, `null`, `https://agraskbagheltourandtravels.com.evil.com`, `https://evil-agraskbagheltourandtravels.com`, `HTTPS://…`.
3. Read `Access-Control-Allow-Origin` / `-Credentials`.
- **Pass:** invalid configs fail to boot; only exact allowlisted origins are echoed; look-alikes and `null` get no ACAO; never `*` together with credentials.

### BE-004 · Razorpay must be mandatory in production `P0` `PAY` `KNOWN-GAP(audit)`
1. Prod boot with `RAZORPAY_KEY_ID` set but secret / webhook secret missing.
2. Prod boot with no Razorpay variables at all.
3. If it boots: `POST /payments/create-checkout` for a valid draft; then POST a webhook signed with an arbitrary "test" secret.
- **Pass:** production never selects the HMAC/test adapter. Boot fails, or checkout returns 503; no forged webhook can flip a booking.
- **DB:** booking still `pending_payment`; no `captured` payment.

### BE-005 · Liveness vs readiness under DB loss `P0` `OPS`
1. Boot normally; `curl /health` and `/ready` (expect 200 and a postgres store).
2. Stop Postgres (or revoke pool credentials).
3. Poll both every second for 30 s; then restore the DB.
- **Pass:** `/health` stays 200; `/ready` returns **503** within 2 polls (never 200 "degraded"); returns 200 ≤30 s after restore with no restart. `"store":"memory"` in production counts as FAIL.

### BE-006 · Information disclosure on public ops endpoints `P2` `SEC`
1. GET `/health`, `/ready`, `/`, `/api`, `/api/v1`, `/openapi.json`, `/docs`, `/.env`, `/package.json`, `/%2e%2e/`.
2. Inspect bodies and headers.
- **Pass:** no env values, versions, DB host or stack traces; no `X-Powered-By`; unknown paths return the standard 404 envelope; Swagger/docs are absent or auth-gated in production.

### BE-007 · Graceful shutdown during an in-flight webhook `P1` `RESILIENCE`
1. Make the webhook handler slow (5 s via test hook or `pg_sleep`).
2. Send a valid signed webhook; at t=1 s send `SIGTERM`; at t=2 s send a new request.
- **Pass:** the in-flight request fully commits (or fully rolls back and returns 5xx); new connections are refused/503; exit code 0 inside the platform grace period; INV-1 clean.

### BE-008 · Migration runner idempotency and concurrency `P1` `DB`
1. On an empty Postgres run `node dist/db/migrate.js`; run it again.
2. On a second empty DB run two copies concurrently.
3. Edit the bytes of an already-applied migration file and rerun.
- **Pass:** run 2 is a no-op; concurrent runs apply each migration exactly once (advisory lock, no "already exists" crash); the tampered migration is detected and aborts; migration-history row count equals file count.

## B. Fare engine (BE-009 to BE-021)

### BE-009 · Advance-deposit boundary table `P0` `FARE`
Formula: `advance = max(500, round(total × 0.28 / 100) × 100)`.
1. Call the advance function (or craft inputs yielding these totals): `400, 500, 1000, 1607, 1608, 1964, 1965, 17857, 100000, 999999.99`.
2. Compare to expected: `400→500 (see BE-011), 500→500, 1000→500, 1607→500, 1608→500, 1964→500, 1965→600, 17857→5000, 100000→28000, 999999.99→280000`.
3. Assert every result is an integer multiple of 100 and ≥ 500.
- **Pass:** all ten match exactly.

### BE-010 · Rounding at x.5 boundaries and float drift `P1` `FARE`
1. Evaluate total pairs just either side of the half-way points: `2321.42 → 600`, `2321.43 → 700`, `2678.57 → 700`, `2678.58 → 800`.
2. Run each 1,000× sequentially and across 8 parallel workers.
3. Compare to a decimal-arithmetic oracle (BigNumber/Decimal).
- **Pass:** identical results every run and equal to the oracle; any float-vs-decimal divergence is reported as a defect.

### BE-011 · Total fare below the ₹500 advance floor `P0` `FARE`
1. Craft inputs so `total_fare` ∈ `{1, 99.99, 400, 499.99, 500, 500.01}`.
2. POST `/fares/calculate` and `/bookings/draft` for each.
3. Check DB constraints: `advance_amount ≥ 500`, `balance_amount ≥ 0`, `total_fare > 0`.
- **Pass:** a defined rule applies (clamp advance to total, or 422 MIN_FARE). The system never persists a negative balance and never returns 500 from a CHECK violation (SQLSTATE 23514).
- **DB:** `SELECT count(*) FROM bookings WHERE balance_amount < 0` returns 0.

### BE-012 · Night allowance boundaries (IST) `P0` `FARE`
1. Quote pickups (UTC): `2026-10-10T16:29:59Z` (21:59:59 IST), `16:30:00Z` (22:00), `23:29:59Z` (04:59:59 IST), `23:30:00Z` (05:00), `18:30:00Z` (midnight IST), and a trip starting 21:00 IST that runs past 22:00.
2. Repeat for all five vehicle tiers.
3. Run the server once with `TZ=UTC` and once with `TZ=Asia/Kolkata`.
- **Pass:** allowance applies only inside the documented window with documented boundary inclusivity; amounts follow the per-tier rule (₹300/₹400/₹500); results identical under both server timezones.

### BE-013 · Outstation 300 km/day minimum `P0` `FARE`
1. Round trip: pickup D 09:00, return D+1 09:00, 250 km total.
2. Same-day round trip, 100 km.
3. Pickup 23:30 D, return 00:30 D+1 (1 hour, two calendar days).
4. Five-day trip, 400 km.
5. `returnDatetime == pickupDatetime`; `returnDatetime < pickupDatetime`.
- **Pass:** billed km = `max(actual, 300 × billable days)` with one documented day-counting rule (calendar vs 24 h blocks); invalid return times → 422; response breakdown equals the DB snapshot.

### BE-014 · `distanceKm` type and range probes `P0` `DATA`
1. POST `/fares/calculate` and `/bookings/draft` with `distanceKm` from HV-NUM plus `999999.99, 1000000, 100.005, 0.004`.
- **Pass:** only positive finite numbers inside `NUMERIC(8,2)` range are accepted; rounding is deterministic; everything else is 400/422 with the field path. Zero 5xx; no leaked SQLSTATE 22003 "numeric overflow".

### BE-015 · Client-supplied money is ignored `P0` `SEC`
1. Capture baseline quote Q0.
2. Resend with extra fields: `totalFare:1, baseFare:1, advanceAmount:500, discountAmount:99999, perKmRate:0.01, fareRulesVersion:"v0", currency:"USD", amountPaise:100`.
3. Repeat on `/bookings/draft` and `/payments/create-checkout`.
4. Read the DB row.
- **Pass:** responses equal Q0 (fields stripped) or all are rejected 400 consistently; DB fare columns equal the server calculation.

### BE-016 · Promo-code abuse `P1` `FARE`
1. Try: valid, expired, not-yet-active, exhausted, `save10` vs `SAVE10`, ` SAVE10 `, 10,000 chars, `' OR 1=1--`, `null`, `""`, emoji, array of two, two stacked codes.
2. Use a code whose discount ≥ base fare.
3. Fire 20 parallel drafts (barrier) using a `max_redemptions=1` code.
- **Pass:** invalid/expired → clean 422 PROMO_INVALID; discount never makes `total_fare ≤ 0`; exactly one redemption; no SQL error text. (Promo admin CRUD is absent per the audit, so seed rows directly.)

### BE-017 · Vehicle-tier availability `P1` `FARE`
1. Quote tiers: each enum value, `bus`, `SEDAN`, `"sedan "`, `null`, `["sedan"]`.
2. Mark `urbania` inactive in fare rules; quote and draft it.
3. Open an existing `urbania` booking (voucher, transition).
- **Pass:** unknown/inactive → 422 VEHICLE_UNAVAILABLE; existing bookings keep working.

### BE-018 · Fare-rule version propagation and snapshot `P0` `FARE` `KNOWN-GAP(audit)`
1. Record `/fleet`, `/fares/calculate` and a draft under active version v1; keep that booking.
2. Admin activates v2 (+10% per-km).
3. Within the cache window repeat the three calls.
4. Re-read the step-1 booking.
- **Pass:** all three endpoints reflect v2 with identical numbers; new bookings store `fare_rules_version=v2`; the old booking's totals and version are unchanged. (The audit says public fare calculation still uses static data, so expect FAIL today.)

### BE-019 · Trip-type × tier matrix with a property-based oracle `P1` `FARE`
1. Build an independent oracle (~30 lines) from BACKEND_RULES.
2. Generate 10,000 random valid inputs (fast-check) across 4 trip types × 5 tiers × distances × dates.
3. Compare API output to the oracle.
4. Add invalid combos: round-trip without return, one-way with return, local-tour at 500 km, airport-transfer at 1 km.
- **Pass:** 0 mismatches; every invalid combo is 422; p95 latency <100 ms.

### BE-020 · Datetime parsing formats `P1` `DATA`
1. Send `pickupDatetime` from HV-DATE, including `…+05:30`, no zone, milliseconds, date-only and an epoch number.
- **Pass:** only the documented format is accepted. (Zod's `datetime()` rejects offsets by default; confirm that is intended, since Indian clients often send `+05:30`.) Accepted values are normalised to UTC; format errors are distinct from business-rule errors.

### BE-021 · Money arithmetic exactness `P0` `DATA`
1. Create 1,000 drafts with fractional distances (`123.456, 0.01, 33.333`) and discounts.
2. Run INV-3 over all rows.
3. Compare JSON numbers with DB numerics as strings.
- **Pass:** zero INV-3 violations at 2 dp; no float artefacts like `0.30000000000000004`; NUMERIC→JS conversion is deliberate and consistent.

## C. Booking draft (create) and data types (BE-022 to BE-034)

### BE-022 · Phone validation `P0` `DATA`
1. POST draft with `customerPhone`: `9876543210`, `+919876543210`, `919876543210`, `98765 43210`, `+91-98765-43210`, 9 digits, 14 digits, 15 digits, `+`, `0000000000`, Arabic-Indic digits, full-width digits, `\u200b9876543210`, `9876543210\n`.
2. For accepted ones read `customer_phone` in the DB.
3. Look up each via recovery/admin search.
- **Pass:** `^\+?[0-9]{10,14}$` is enforced with anchors; non-ASCII digits and trailing newline are rejected; one canonical stored form (or a documented rule that the same number in three formats is treated the same); column `VARCHAR(20)` never overflows; policy for `0000000000` is decided.

### BE-023 · Email field `P2` `DATA`
1. `customerEmail`: omitted, `null`, `""`, `a@b`, `a@b.co`, `A@B.CO`, `a+tag@b.co`, `"a b"@x.co`, 255-char local part, 256 total, a Devanagari address, trailing space.
- **Pass:** omitted/null OK; empty string handled gracefully (clients often send `""` for blank optional fields); >255 → 422, not SQLSTATE 22001 as a 500; normalisation policy documented.

### BE-024 · Hostile text in every string field `P0` `DATA`
1. Apply HV-STR to `originName, destinationName, pickupAddress, dropAddress, customerName, flightTrainNumber` (the last is `VARCHAR(50)`).
- **Pass:** minimum length counts real characters (`min(2)` alone accepts zero-width-only; reject after trim/normalise); NUL byte `\u0000` → 422, not Postgres 22021 as a 500; 51-char `flightTrainNumber` → 422, not 22001; Hindi/emoji round-trip byte-exact (NFC).

### BE-025 · `specialNotes` limit semantics `P2` `DATA`
1. Send 499, 500 and 501 chars; 250 and 251 emoji (JS length 2 each); CRLF-heavy text; an HTML payload.
2. Read back through admin detail and the customer voucher.
- **Pass:** limit is counted consistently (code points vs UTF-16) and documented; no truncation inside a surrogate pair; HTML is stored raw but escaped on every output; no 5xx.

### BE-026 · Content-type and JSON structure abuse `P1` `DATA`
1. POST `/bookings/draft` with every HV-JSON case, including a 1 KB gzip body that expands to 1 GB.
- **Pass:** 400/413/415 with the standard envelope; `bodyLimit` enforced before parsing; process RSS grows <50 MB; `/health` stays responsive; `Object.prototype` unpolluted.

### BE-027 · Mass assignment on draft creation `P0` `SEC`
1. Add to a valid body: `status:"paid_confirmed", id, ticket_id:"AGR-20260101-0001", user_id:<other user>, guest_access_token:"AAAA…", version:99, advance_amount:500, assigned_driver_id, assigned_vehicle_id, created_at:"2000-01-01", fare_rules_version:"v0", is_admin:true`.
2. Read the DB row.
- **Pass:** unknown keys are rejected (strict) or stripped; the row has initial status, `version=1`, server-generated ids and timestamps.

### BE-028 · Ticket-ID generation, uniqueness, format limits `P0` `DATA`
1. Create 500 drafts sequentially, then 100 in parallel (barrier).
2. Create drafts at 18:29 UTC and 18:31 UTC (before/after IST midnight).
3. Force the daily counter to 9999 and create 3 more.
- **Pass:** all IDs unique and match `^AGR-[0-9]{8}-[0-9]{4}$` (the checkout schema uses the same regex); the date part follows one documented zone; counter overflow fails safely or the regex is widened everywhere. The API must never issue a ticket that `/payments/create-checkout` then rejects. A unique-index violation must never surface as 500.

### BE-029 · Guest-token quality `P0` `SEC`
1. Create 5,000 drafts.
2. Analyse `guest_access_token`: length, charset, uniqueness, entropy, correlation with ticket/time/phone.
3. Check at-rest format (plaintext vs hash) and log output.
- **Pass:** CSPRNG, ≥128 bits entropy, 0 collisions, no pattern; DB stores a hash (or the risk is acknowledged); the schema's `min(16)` is not the real strength; token never in logs.

### BE-030 · Duplicate submission / idempotent draft `P1` `CONC`
1. Send the same draft payload twice 200 ms apart.
2. Send 20 identical requests in parallel (barrier).
3. Repeat with an identical `Idempotency-Key` header (if supported).
- **Pass:** documented policy; never a half-created row (booking without fare snapshot); row count equals the number of success responses.

### BE-031 · Pickup/return business rules `P1` `DATA`
1. Pickup: past, now, +1 min, +30 min, +2 years, `9999-12-31`.
2. Return: before pickup, equal to pickup, >1 year after pickup.
3. One-way with a return date; local-tour with a return date.
- **Pass:** minimum lead time and maximum horizon enforced with distinct error codes; incompatible fields rejected/ignored consistently; no 5xx on extreme years (timestamptz range).

### BE-032 · Draft row forensic inspection `P0` `DB`
1. Create one draft.
2. `SELECT * FROM bookings WHERE ticket_id=…`; run `\d bookings`.
3. Check `payments`, `refunds`, `device_registrations` for that booking.
- **Pass:** column types as DDL; timestamps are timestamptz UTC; `version=1`; initial status per spec; INV-3 holds; no payment row before checkout; `customer_phone` ≤20 chars.

### BE-033 · Quote→draft price drift `P1` `FARE`
1. Quote → T1.
2. Admin changes per-km rate (new active version).
3. Immediately POST the same draft inputs.
- **Pass:** draft total is a fresh server calculation (T2), never trusting T1; the response carries `fare_rules_version` (or a `fareChanged` flag) so UIs can warn; DB stores T2 and its version.

### BE-034 · Injection sweep `P0` `SEC`
1. Inject `' OR '1'='1`, `'; DROP TABLE bookings;--`, `$(sleep 5)`, `{"$ne":null}`, `%'--`, `UNION SELECT` into every string field, header, query and path parameter of: draft, voucher GET, inquiries, reviews, locations autocomplete, admin list filters.
2. Time every request; inspect tables afterwards.
- **Pass:** no response >2 s above baseline (no time-based injection); all tables intact; payloads handled literally; DB log shows parameterised statements only.

## D. Booking read, voucher, privacy (BE-035 to BE-041)

### BE-035 · Voucher masking exactness `P0` `PRIVACY`
1. Create bookings with phones `9876543210`, `+919876543210`, 14 digits and emails `s@gmail.com`, `sanjay@gmail.com`, `a@b.co`, a 60-char local part.
2. GET each voucher with a valid token.
3. Compare to the spec masks (`+91 98**** **21`, `s****@gmail.com`).
- **Pass:** consistent mask format; short local parts don't leak the full value; masking happens server-side (raw values absent from the JSON).

### BE-036 · Guest-token verification and enumeration safety `P0` `SEC`
1. GET with: correct token; wrong token; another booking's token; empty; 15 chars; 10 KB; valid token for a non-existent ticket.
2. Compare status, body, headers, and median latency (500 samples each).
- **Pass:** all failures return identical status and body (no existence oracle); latency distributions indistinguishable (constant-time compare); token never in URLs/logs.

### BE-037 · Phone-only recovery path `P0` `SEC` `KNOWN-GAP(audit)`
1. GET `/bookings/:ticketId` with ticket + customer phone but no token (and any phone-lookup parameter).
2. Try the phone of a different booking.
- **Pass:** rejected; recovery requires an OTP/challenge or the high-entropy token.

### BE-038 · Ticket enumeration and rate limiting `P1` `SEC`
1. Script GETs for `AGR-<today>-0001 … 9999` without a token.
2. Note when 429 starts (spec: 60/min).
3. Rotate `X-Forwarded-For` / IPv6 addresses.
- **Pass:** 0 records disclosed; 429 with `Retry-After` at the limit; spoofed XFF does not reset the counter unless it comes from a trusted proxy.

### BE-039 · Path-parameter fuzz `P1` `DATA`
1. `ticketId`: `../../etc/passwd`, `AGR-20261010-0001%00`, lowercase, trailing space, full-width digits, 1 MB string, `AGR-20261340-0001`, `AGR-00000000-0000`, `%252e%252e`.
- **Pass:** 400 (or uniform 404); never 500; no traversal; uniform envelope.

### BE-040 · Response contract and field leakage `P0` `PRIVACY`
1. Validate voucher, draft, checkout, webhook ack, inquiry and review responses against an allowlist JSON schema.
2. Search all responses/headers for: `guest_access_token` (outside draft creation), `razorpay_signature`, secrets, `user_id`, internal notes, driver phone before assignment, server banners.
- **Pass:** only allowlisted fields; driver contact appears only after assignment and only to the verified customer/admin; no secrets or banners.

### BE-041 · Caching of private responses `P1` `SEC`
1. GET voucher, draft and checkout responses; read `Cache-Control`, `Vary`, `ETag`.
2. Through Cloudflare, request the same URL from two IPs with different tokens.
- **Pass:** `Cache-Control: no-store`/`private`; the CDN never serves one user's voucher to another; ETags leak nothing.

## E. Payments and webhooks (BE-042 to BE-057)

### BE-042 · Checkout happy path and amount derivation `P0` `PAY`
1. Create a draft (advance A).
2. POST `/payments/create-checkout {ticketId, guestAccessToken, idempotencyKey:uuid4}`.
3. Inspect the provider order and DB.
- **Pass:** order amount = `advance_amount × 100` paise (integer), INR; exactly one `payments` row (`pending`, `razorpay_order_id`, `idempotency_key` stored); no secrets in the response.

### BE-043 · Client cannot influence the charge `P0` `PAY` `SEC`
1. Add `amount, amountPaise, currency:"USD", advance, discount, receipt` to the checkout body.
2. After the draft, directly set `bookings.advance_amount` to an invalid value in the DB (simulating corruption) and call checkout.
- **Pass:** extras rejected/ignored; amount always derived from the persisted server value; a DB value breaking invariants (<500) makes checkout refuse.

### BE-044 · `idempotencyKey` semantics `P1` `PAY`
1. Same key twice, sequential and 20 parallel.
2. Same key with a different ticket.
3. Keys: `abc`, UUID v1, UPPERCASE, `{uuid}`, nil UUID, 37 chars, missing.
4. Reuse a key after the payment is captured.
- **Pass:** same key + ticket → same order, one row; key reused across tickets → 409/422; invalid → 400; provider-side order count equals DB row count.

### BE-045 · Checkout on invalid booking states `P0` `PAY`
1. Attempt checkout for each status: `draft, pending_payment, paid_confirmed, driver_assigned, in_transit, completed, cancelled, refunded`, and for a booking whose pickup is in the past.
2. Create a second checkout with a different key while the first order is pending.
- **Pass:** only eligible states proceed (others 409 with a code); the second-order policy is documented (reuse or void) and a late capture on a voided order is reconciled, never double-confirmed.

### BE-046 · Provider outage and ambiguous success `P0` `PAY` `CHAOS`
1. Mock Razorpay to return: 500, 429, timeout (>10 s), connection reset, malformed 200, and a 200 delivered after the client gave up.
2. Call checkout; then retry with the same key.
3. Inspect `payments` and the booking.
- **Pass:** 502/503 with a code, no stack or secrets; no orphan `pending` row without an order id (or marked failed); the retry reconciles the order that was actually created; booking state unchanged.

### BE-047 · Webhook happy path `P0` `PAY`
1. HMAC-SHA256 the raw bytes with the webhook secret; send `payment.captured` with the correct order id, amount, currency.
2. Query the DB.
- **Pass:** 200; payment `captured` with `razorpay_payment_id` and `verified_at`; booking `paid_confirmed`, `version+1`; exactly one notification job; INV-1 to INV-3 hold.

### BE-048 · Signature attack matrix `P0` `SEC`
1. Send a valid body with signature: missing, empty, uppercase hex, 63 and 65 hex chars, 10 chars, 64 non-hex chars, valid signature of a different body, valid signature of a whitespace-reformatted body, wrong secret, duplicate header (array), 10 KB value.
- **Pass:** every case → 401, **never 500** (Node's `timingSafeEqual` throws on unequal-length buffers, so a length guard must exist); zero DB writes; one warning log with requestId and no full signature.

### BE-049 · Raw-body fidelity `P0` `SEC`
1. Send signed payloads containing Unicode (`é`, `हिन्दी`), escaped slashes `\/`, reordered keys, trailing newline, CRLF, a 1 MB body, declared `charset=utf-16`, `Content-Encoding: gzip`, content types `application/json` and `text/plain`.
2. Alter each by exactly one byte and resend.
- **Pass:** untouched payloads verify against the original bytes (200); one-byte changes → 401; JSON is parsed only after verification; oversize → 413 without DB write.

### BE-050 · Duplicate delivery idempotency `P0` `PAY`
1. Send the identical signed event (same `x-razorpay-event-id`) 10× sequentially, then 20× in parallel (barrier).
2. Same body with a different event id; same event id with a different body.
- **Pass:** all 200; exactly one ledger transition and one notification (INV-2); one event-log row per event id; same id with a different body is rejected/flagged as tampering.

### BE-051 · Event order and multi-event payments `P0` `PAY`
1. Per payment send: `authorized → captured → order.paid`.
2. `captured → authorized`.
3. `failed → captured` (retry success on the same order).
4. `captured → failed` (late failure).
5. `captured → refunded → captured` (stale).
- **Pass:** captured never regresses to failed/authorized; later success after failure is honoured; repeated captured events are no-ops; final state agrees with provider truth.

### BE-052 · Amount mismatch and precision `P0` `PAY`
1. Webhook amount = expected, expected−1, expected+1, `0`, `-1`, `"50000"` (string), `50000.5`, `2^53+1`, `null`, missing.
- **Pass:** any mismatch → booking NOT `paid_confirmed`; payment marked needs-review with an alert; documented ack policy; paise BIGINT never loses precision in JS; no 5xx.

### BE-053 · Identity and currency mismatches `P0` `PAY`
1. Valid signature but: currency `USD`; order id of booking B with `notes.ticket_id` of booking A; unknown order id; entity status `failed` while event says captured; missing entity; unknown event types (`refund.created`, `dispute.created`).
- **Pass:** no state change on any mismatch; unknown order → acknowledged and logged (so the provider stops retrying) or per documented policy; unknown events acknowledged with no side effects.

### BE-054 · Late, old and after-cancel captures `P0` `PAY`
1. Cancel a booking (or let a pending one expire).
2. Deliver a captured webhook for it.
3. Replay a 7-day-old captured event for an already-processed payment.
4. Deliver an old event never seen before.
- **Pass:** booking stays cancelled/expired; the ledger records the capture; flagged `refund_required` and visible to admins; replays idempotent; INV-6 catches any miss. Money is never silently lost.

### BE-055 · Transaction atomicity under fault `P0` `PAY` `CHAOS`
1. Inject failure after `UPDATE payments` but before `UPDATE bookings` (`pg_terminate_backend`, kill process, or throw in a test hook).
2. Inspect the DB.
3. Replay the same webhook as the provider would.
- **Pass:** no half-state (INV-1); first attempt returns 5xx; the retry completes exactly once.

### BE-056 · Webhook vs poll vs cancel race `P0` `CONC`
1. With a barrier start simultaneously: webhook(captured), 50× GET voucher, admin cancel, admin assign.
2. Repeat 200 iterations with random jitter.
- **Pass:** always a legal final state (INV-1 to INV-6); version increments once per accepted transition; no deadlock (40P01) or serialization failure surfacing as 500.

### BE-057 · Provider path parameter and redirect trust `P0` `SEC`
1. POST `/payments/webhooks/:provider` with `paypal`, `stripe`, `RAZORPAY`, `mock`, `test`, empty, `../x`, a very long value.
2. In production mode specifically try `mock`/`test`.
3. GET a voucher with `?razorpay_payment_id=…&razorpay_signature=…` (simulated browser redirect).
- **Pass:** unknown/unimplemented providers → 404/400 and are never verified with Razorpay's secret; test providers disabled in production; a client redirect or query string never changes booking state (Law 3).

## F. Refunds (BE-058 to BE-061)

### BE-058 · Refund happy path `P0` `PAY`
1. Seed a `paid_confirmed` booking with a captured payment.
2. As super admin: `POST /ops/admin/refunds {paymentId, amount, reason, idempotencyKey}`.
3. Query DB and provider.
- **Pass:** `refunds.amount_paise` correct; payment marked refunded (or partially); booking `refunded` per state machine; audit row with actor and requestId; INV-4 holds.

### BE-059 · Refund amount and concurrency edges `P0` `PAY`
1. Amounts: HV-NUM, more than captured, exactly captured, partial 40% then 70%, three × 34%.
2. Refund a pending, failed and already-refunded payment.
3. Fire 20 identical refunds in parallel (barrier).
4. `reason`: empty, 10,000 chars, `<script>`.
- **Pass:** cumulative refunds never exceed captured (INV-4); exactly one provider refund per idempotency key; ineligible payments → 409; reason validated and length-bounded.

### BE-060 · Refund provider-failure semantics `P0` `PAY`
1. Mock the refund call: 500, timeout after acceptance, 400 "already refunded", delayed 200.
2. Inspect `refunds.status`; retry.
- **Pass:** status reflects provider truth (`processing`/`failed`, not the DDL default `'processed'` unless confirmed); retry never double-refunds; a failed refund leaves the booking retryable with an audit trail.

### BE-061 · Refund authorization `P0` `SEC`
1. Call the refund route with: no token, customer JWT, dispatcher, content admin, finance, super_admin (role in `app_metadata`), same role only in `user_metadata`, expired, tampered token.
2. Make 11 calls within one minute.
- **Pass:** only the server-controlled role grants access; others 401/403; 429 after 10/min; DB unchanged on denial.

## G. State machine and concurrency (BE-062 to BE-069)

### BE-062 · Exhaustive transition matrix `P0` `STATE`
1. Seed one booking per status (`draft, pending_payment, paid_confirmed, driver_assigned, in_transit, completed, cancelled, refunded`).
2. For each, attempt every target status (8×8 = 64).
3. Record HTTP code, error code and DB status.
- **Pass:** only spec transitions succeed (`draft→pending_payment→paid_confirmed→driver_assigned→completed`; `pending_payment→cancelled`; `paid_confirmed/driver_assigned→refunded`); `in_transit` handling is documented (in the enum, absent from the spec chain); every other pair → 400 `INVALID_TRIP_TRANSITION` with the DB unchanged; `paid_confirmed` cannot be forced via an admin endpoint.

### BE-063 · Optimistic locking `P0` `CONC`
1. Two admin sessions read booking `version=N`.
2. With a barrier both submit an update with `expectedVersion=N`.
3. Also submit: missing, `N−1`, `N+5`, `"N"`, `-1`, `2^31`, `null`.
- **Pass:** exactly one 200 (version N+1), the other 409 VERSION_CONFLICT; invalid values 400; no lost update.

### BE-064 · Driver/vehicle double allocation `P0` `CONC` `KNOWN-GAP(audit ops 50/51)`
1. Create two time-overlapping bookings.
2. Two dispatchers assign the same driver, then the same vehicle, simultaneously (barrier).
3. Repeat with adjacent, non-overlapping bookings.
- **Pass:** overlap blocked at the DB level (exclusion constraint on a `tstzrange`, or advisory lock) and returned as 409; adjacent allowed. A sequential-only run is insufficient.

### BE-065 · Assignment preconditions `P1` `STATE`
1. Assign a driver to: a `pending_payment` booking; a non-existent driver; `police_verified=false`; `off_duty`/`on_trip`; an inactive vehicle; a vehicle of the wrong tier; random UUIDs (HV-ID).
- **Pass:** 4xx with specific codes; FK violations (23503) never surface as 500; only `paid_confirmed → driver_assigned` succeeds.

### BE-066 · Cancel semantics `P0` `STATE`
1. Cancel from every status.
2. Cancel a pending booking that has a live provider order.
3. Cancel twice.
4. Cancel a paid booking.
- **Pass:** only legal paths; cancelling pending voids the provider order (a late capture is handled as in BE-054); cancelling paid requires the refund path; a second cancel is idempotent or 409 (documented).

### BE-067 · Invariant fuzzer under mixed load `P0` `CONC`
1. Seed 200 bookings.
2. Run 60 s of random concurrent operations across 50 workers: draft, checkout, webhook (duplicate/out-of-order), transition, assign, cancel, refund.
3. Run INV-1 to INV-6.
- **Pass:** all invariants return zero violating rows; zero 5xx except injected faults.

### BE-068 · READ COMMITTED check-then-insert races `P0` `CONC` `DB`
1. Find every "SELECT conflicting row, then INSERT" path: vehicle/driver availability, promo redemption, ticket counter, unique slug.
2. For each, open two sessions with a barrier before commit and force the interleaving.
3. Confirm enforcement uses a constraint or `SELECT … FOR UPDATE`, not just an application check.
- **Pass:** a `UNIQUE`/`EXCLUDE` constraint or row lock exists; the interleaving yields exactly one success.

### BE-069 · Lock-order deadlock hunt `P1` `CONC`
1. Run 100 parallel iterations of: webhook (payments→bookings), admin refund (bookings→payments), cancel.
2. Watch logs/`pg_stat_database.deadlocks` for 40P01.
- **Pass:** none, or deadlocks are retried transparently; never a 500.

## H. Authentication, authorization, RBAC (BE-070 to BE-079)

### BE-070 · Route authorization matrix `P0` `SEC`
1. List every route (~24+, BACKEND_RULES §6.1 plus admin extras).
2. Call each with: no token, malformed, expired, wrong signing key, valid customer, each staff role.
3. Compare to the documented matrix.
- **Pass:** 100% match; 401 vs 403 used correctly; no unexpected 200 or 500; results saved as CSV.

### BE-071 · JWT forgery set `P0` `SEC`
1. Tokens: `alg=none`; HS256 signed with the public key (algorithm confusion); tampered role re-signed with a random key; token from another Supabase project; past `exp`; future `nbf`; missing `exp`; wrong `aud`/`iss`; `kid` pointing at an attacker JWKS; empty signature; `Bearer  ` with extra whitespace.
- **Pass:** all 401 with generic messages; clock-skew tolerance within the documented limit.

### BE-072 · Role source of truth `P0` `SEC`
1. Create a user and set `user_metadata.role="super_admin"` through the Supabase client (user-editable).
2. Create a user with no role claim.
3. `app_metadata.role` variants: `SUPER_ADMIN`, `"super_admin "`, `["super_admin"]`, `superadmin`.
- **Pass:** only the exact server-controlled `app_metadata.role` authorises; missing/odd role → 403 (regression guard for the fixed fail-open bug).

### BE-073 · `ADMIN_EMAIL` single-account lock `P1` `SEC`
1. Set `ADMIN_EMAIL=admin@gmail.com`.
2. Authenticate super_admin users with: `Admin@Gmail.com`, `a.dmin@gmail.com`, `admin+x@gmail.com`, `admin@googlemail.com`, a Cyrillic-"а" homoglyph, an unverified email, no email claim.
- **Pass:** policy applied exactly (case-insensitive compare only; Gmail dot/plus tricks not treated as equal unless intended); unverified/missing email denied; denials audited.

### BE-074 · Session and role revocation window `P1` `SEC`
1. Remove `super_admin` in Supabase while the token is valid.
2. Keep calling the admin API until `exp`.
3. Delete the user and repeat.
- **Pass:** maximum exposure equals a documented, short token TTL (≤15 min suggested) or sensitive routes (refund, publish, unmask PII) re-check role freshness; actor is audited.

### BE-075 · Object-level authorization (IDOR/BOLA) `P0` `SEC` `KNOWN-GAP(audit: device registration)`
1. As customer A (or guest token A) request booking B: GET voucher, POST `/reviews` with B's ticket, POST device registration with B's `booking_id`/`user_id`, GET payment status.
2. In admin sub-resources swap UUIDs (media of another item, review of another item).
- **Pass:** 403/404 uniformly; device registration binds only to a verified owner; DB rows unchanged.

### BE-076 · Privilege and mass assignment on admin writes `P0` `SEC` `KNOWN-GAP(audit: roles collapse to super_admin)`
1. As content admin: PATCH catalog with `status:"published"`, call publish, change `id/created_at/slug` of a published item.
2. As moderator publish a review; as dispatcher call refund.
3. Add `{"role":"admin","isVerified":true,"balance":99999}` to every admin body.
- **Pass:** publish/refund only for designated roles; extra fields ignored; every denial is 403 with an audit entry.

### BE-077 · HTTP verb and path-normalisation bypass `P1` `SEC`
1. Try GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS/TRACE on every route.
2. Path variants: `/OPS/admin/bookings`, `//ops/admin/bookings`, `/ops/admin/bookings/`, `/ops/admin/bookings/%2e%2e/..`, `;x=1`, trailing dot.
3. Confirm the auth hook ran.
- **Pass:** unlisted methods → 405/404 with envelope; no variant bypasses auth; HEAD leaks nothing protected.

### BE-078 · Audit-log integrity `P0` `SEC` `KNOWN-GAP(audit: actor fallback, limit ignored)`
1. Perform 10 admin writes as two different users.
2. Read the audit rows.
3. As the app DB role (and via PostgREST) try UPDATE/DELETE/TRUNCATE on the audit table.
- **Pass:** actor id/email is the real user (never a literal `super_admin`); requestId and before/after JSON present with secrets redacted; table is append-only; `limit` is honoured.

### BE-079 · Row-Level Security and direct DB API `P0` `SEC` `DB`
1. With the Supabase **anon** key call PostgREST `/rest/v1/bookings`, `/payments`, `/refunds`, `/profiles`, `/drivers`.
2. Repeat with customer A's JWT.
3. Grep `react/dist` and `admin/dist` for the service-role key.
4. `SELECT relname, relrowsecurity FROM pg_class` for every table.
- **Pass:** anon gets 0 rows/401; customers see only their rows; payments/refunds/drivers unreadable by customers; service key absent from bundles; RLS enabled on every table.

## I. Catalog, media, reviews, inquiries, fare rules (BE-080 to BE-090)

### BE-080 · Catalog CRUD and slug rules `P1` `CRUD`
1. POST create (draft); GET list and detail; PATCH fields; archive; attempt a hard DELETE.
2. Slugs: `Taj` vs `taj`, `taj mahal`, `ताज`, `../x`, `new`, `admin`, 200 chars; two concurrent creates with the same slug.
- **Pass:** one audit row per step; slugs unique case-insensitively and URL-safe; concurrent create → one 201 and one 409; hard delete blocked when bookings reference the item.

### BE-081 · Catalog field types and boundaries `P1` `DATA`
1. Fields: price (HV-NUM), duration, `seatsRemaining` (`-1, 2.5, 1e9`), stops array (0, 1, 10,000 items, nulls), title/summary/description (HV-STR), nested JSON depth 500, HTML with script/iframe/`onerror`.
- **Pass:** bounded arrays/strings; HTML sanitised server-side; invalid → 422 with field path; no 5xx; catalog starting price is never used as the booking price.

### BE-082 · Lifecycle state machine and contradictions `P1` `STATE`
1. Walk `draft→published→paused→archived→retired` and every illegal jump.
2. Send contradictory combos: `archived + bookable=true`, `draft + indexPolicy=index`, `retired` without a reason, `redirectTarget` to an external domain / itself / a non-existent page.
- **Pass:** illegal → 409/422; derived fields computed server-side; retirement requires a reason plus one outcome (preserve / 301 / 410); redirect loops impossible.

### BE-083 · Draft/archived visibility leaks `P0` `SEC` `KNOWN-GAP(audit: public media)`
1. Anonymously request `/catalog/:slug` for each status, the list endpoints, the manifest, and `/media/:id` for draft/archived media or media whose parent is draft.
2. POST a booking draft against a paused/archived item.
- **Pass:** draft/retired → 404 everywhere; paused/archived → informational, `bookable=false`; booking against them rejected; media of a non-published parent → 404.

### BE-084 · Image upload validation `P0` `SEC` `KNOWN-GAP(audit)`
1. Upload: HTML renamed `.jpg`, PHP polyglot, SVG with `<script>`, 0 bytes, PNG bytes labelled jpeg, truncated JPEG, 25 MB file, tiny PNG declaring 40000×40000 (decompression bomb), animated GIF/APNG, JPEG with EXIF GPS, invalid base64 padding, filename `../../x.jpg`.
- **Pass:** validated by magic bytes + full decode + pixel cap + size cap; SVG rejected or sanitised; EXIF stripped; filenames ignored/generated; memory spike bounded; no object stored on rejection.

### BE-085 · Media/DB consistency and reorder `P1` `CRUD` `DB`
1. Force the DB insert to fail after the storage upload (kill DB or unique violation).
2. List the storage prefix.
3. Delete a media item and request its public URL.
4. Reorder with duplicate, negative and gapped `sort_order`; run two concurrent reorders.
- **Pass:** no orphan object (compensating delete); deleted media → 404 (CDN purged); sort order normalised and unique; concurrent reorder deterministic.

### BE-086 · Review pipeline `P1` `CRUD`
1. `POST /reviews` with ticket + token: ratings `0, 1, 5, 5.01, "5", NaN`; text from HV-STR; duplicate for the same booking; booking not completed; `verified:true` in the body.
2. Moderator approve / reject (no reason) / publish; non-super publish.
3. Public GET.
- **Pass:** lands as pending; rating integer 1–5 enforced (the DDL's rating CHECK is on `drivers`, so confirm the review table has one); `verified` is server-derived; one review per booking; only published reviews visible; reject needs a reason; output escaped.

### BE-087 · Inquiries and limiter bypass `P1` `SEC`
1. Send 6 inquiries within a minute (limit 5).
2. Spoof `X-Forwarded-For`, `X-Real-IP`, `CF-Connecting-IP`; rotate User-Agent.
3. HV-STR in every field; 1,000 parallel requests from one IP.
- **Pass:** 6th → 429 with `Retry-After`; spoofed headers don't evade the limit unless from a trusted proxy; duplicate/honeypot suppression; DB rows equal accepted count.

### BE-088 · LocationIQ proxy `P2` `INTEG`
1. `/locations/autocomplete?q=` `""`, `a`, 10k chars, `%`, `आगरा`, emoji, SQL meta; `limit=1e9`.
2. Mock provider: 429, 500, timeout, invalid JSON, 10 MB response.
3. Same query in different case/spacing ×50.
- **Pass:** `q` and `limit` bounded; provider failures degrade gracefully with no token or raw provider error; response size capped; cache keys normalised, TTL set, poison-proof; token never in logs or responses.

### BE-089 · Pagination, filter and sort hardening `P1` `DATA`
1. On admin lists (bookings, catalog, reviews, inquiries, audit): `page=0,-1,a,1e9`; `limit=0,1,100,101,1e6`; `sort=created_at;DROP…`; unknown sort; tampered cursor; search `%`, `_`, `\`.
2. Insert 500 rows with identical `created_at` and page through.
- **Pass:** limits clamped; sort via allowlist; LIKE wildcards escaped; no duplicate or missing rows across pages (stable tiebreaker); audit `limit` honoured.

### BE-090 · Fare-rule version CRUD and invariants `P0` `CRUD` `DB`
1. Create draft version; activate; roll back; list versions.
2. Two admins activate different versions simultaneously.
3. Values: `per_km_rate` `0, -1, 9999.99, 10000, 12.345`; seating `0, -1, 2.5`; luggage `-1`; all vehicles inactive.
- **Pass:** exactly one active version (partial unique index); old versions immutable; `NUMERIC(6,2)` overflow → 422, not 500; invalid ints rejected; all-inactive guarded or clear 422 on quote; each action audited.

## J. Database integrity (BE-091 to BE-094)

### BE-091 · Constraint wall via direct SQL `P0` `DB`
1. On a disposable DB, INSERT/UPDATE directly (bypassing the API): bookings with `total_fare=0`, `advance=499`, `balance=-1`, `distance=0`, `base_fare=-1`, duplicate `ticket_id`, 21-char phone, bad enum; payments with `amount_paise=0`, duplicate order id, duplicate `idempotency_key`; drivers with rating `0.99/5.01`; vehicles with `per_km_rate=0`, `seating=0`; refunds `amount=0`; device `platform='windows'`; duplicate `(user_id, device_id)`.
2. Also try `advance=5000, total=600` and a booking whose total ≠ sum of components.
- **Pass:** each rejected with the right SQLSTATE (23514/23505/22001/22P02/23503). If the last two succeed, record a gap: add `CHECK (advance_amount <= total_fare AND balance_amount = total_fare - advance_amount)`.

### BE-092 · FK/cascade ledger safety `P0` `DB`
1. Delete a booking that has payments and refunds.
2. Delete a profile that has bookings.
3. Delete a vehicle/driver tied to active bookings.
- **Pass:** financial rows never vanish via cascade (expect RESTRICT or soft delete). If `ON DELETE CASCADE` on `payments.booking_id` / `refunds.*` lets the ledger disappear, log it as a defect. `SET NULL` on user deletion must not break voucher or refund views.

### BE-093 · Schema/enum/code drift detection `P1` `DB`
1. Dump the live schema (`pg_dump -s`) and enums.
2. Compare to Zod enums, TS types, MODELS.md and the RBAC role list.
3. Confirm every table the rules mention exists (`raw_webhooks`, audit log, `catalog_items`, `catalog_item_media`, reviews, inquiries, fare rules).
- **Pass:** zero drift. Known suspects: `user_role_enum` (`customer, driver, dispatcher, super_admin`) vs RBAC roles (`content_editor, moderator, finance…`); `in_transit` status; `driver` role although there is no driver app; Razorpay-only payment columns vs a "multi-provider" requirement; `raw_webhooks` missing from the initial DDL.

### BE-094 · Migration safety and rollback `P1` `DB`
1. Load 100k bookings and 100k payments.
2. Apply the newest migration with `lock_timeout=2s` and a `statement_timeout`.
3. While applying, run the previous app version (N−1) read/write traffic.
4. Follow `DATABASE_MIGRATION_ROLLBACK.md` in staging.
- **Pass:** no lock >2 s; N−1 keeps working after the expand step; the rollback doc runs cleanly; no destructive single-step changes.

## K. Cross-cutting: limits, errors, logs, chaos, load, DR (BE-095 to BE-100)

### BE-095 · Rate-limit coverage and client identity `P1` `SEC`
1. For each limited route (fares 60, locations 60, draft 30, checkout 20, voucher 60, inquiries 5, refunds 10, reviews 10, publish 20, audit 30) send limit+1 requests within a minute.
2. Repeat through two backend instances behind a load balancer.
3. Spoof proxy headers.
- **Pass:** 429 at limit+1 with `Retry-After` and the envelope; counters shared across instances (or limits documented per instance); the real client IP comes from a trusted-proxy config (Cloudflare → Render); webhooks exempt from the limiter but still signature-gated.

### BE-096 · Error envelope and leakage `P1` `API`
1. Provoke 400, 401, 403, 404, 405, 409, 413, 415, 422, 429, 500, 502, 503.
2. Throw a non-Error value and an unhandled rejection in a test route.
- **Pass:** always `{success:false, error:{code,message,requestId}}`; `requestId` equals the `x-request-id` header; no stack traces, SQL, file paths, table or constraint names; Zod details never echo secrets; process does not crash.

### BE-097 · Log hygiene and PII redaction `P0` `PRIVACY`
1. Send requests containing a bearer JWT, guest token, phone, email, webhook signature, secret-like values and a service-role header.
2. Capture stdout / Render logs and grep.
- **Pass:** tokens, secrets and signatures redacted; phones/emails masked; newline/ANSI injection in headers neutralised; every line has a requestId.

### BE-098 · Dependency outage and recovery `P0` `CHAOS`
1. Under 100 rps mixed load inject: (a) Postgres down for 60 s, (b) pool exhaustion by long queries, (c) Supabase Auth/JWKS unreachable, (d) Razorpay down, (e) LocationIQ down, (f) WhatsApp/email down.
2. Observe, then restore each.
- **Pass:** no crash; DB-dependent routes return 503 within 2 s (no hangs); admin auth fails **closed** when JWKS is unreachable; unrelated routes keep working; auto-recovery ≤30 s; notification failures never fail a webhook (queued/retried).

### BE-099 · Load, soak and cold start `P1` `PERF`
1. k6 ramp 50→500 rps on `/fares/calculate`, `/bookings/draft`, `/fleet`; 30-min soak at 100 rps.
2. Webhook storm: 200/s with 50% duplicates.
3. After >15 min idle (Render free tier) send the first request.
- **Pass:** p95 <500 ms, errors <1%; RSS and event-loop lag flat (no leak in process-local caches such as the manifest); storm yields one transition per event; cold start succeeds within the frontend timeout or returns 503 + `Retry-After` that clients handle.

### BE-100 · Ledger reconciliation and restore drill `P0` `DB`
1. Restore the latest backup into a scratch DB.
2. Run INV-1 to INV-6 plus orphan queries (paid bookings without captured payments; captured payments without paid bookings; refunds above captured).
3. Compare per-day Σcaptured − Σrefunded with the Razorpay payment/settlement export.
4. Measure restore time against RPO/RTO.
- **Pass:** 0 invariant rows; daily totals match the provider exactly; any mismatch is listed with payment ids; restore time documented.

---

# FINAL RANKING PROMPT (copy everything below this line into your AI agent or hand it to a QA engineer)

```text
ROLE
You are a principal QA/SRE auditor. Your job is to execute the BACKEND test plan (BE-001 … BE-100) in this
file against the ArenaAI / SK Baghel backend and produce an evidence-based ranking of the system.

INPUTS
- This file (tests, legend, INV-1…INV-6, hostile value sets HV-*).
- The repo (backend/), a disposable staging stack (Postgres, mock Razorpay/LocationIQ/WhatsApp), test users per role.
- NEVER run destructive or load tests against production or live payment credentials.

EXECUTION RULES
1. Run every test exactly as written. After every state-changing test run INV-1…INV-6.
2. Record one status per test: PASS | PARTIAL | FAIL | BLOCKED (with reason) | N/A (with reason).
3. Evidence is mandatory for every result: request/response (headers+body), SQL output, log lines, or screenshot.
   No evidence = BLOCKED, never PASS. Do not guess or infer results from reading code alone.
4. Run flaky/concurrency tests 3 times (BE-030, 050, 056, 063, 064, 067–069, 099). Any single failure = FAIL.
5. If a route/field in the docs differs from reality, still test the real behavior and add an entry to the DRIFT LIST.
6. Tests tagged KNOWN-GAP(audit) are expected to fail today; still execute and score them. If they pass, note "fixed since audit".
7. When a test fails, give a minimal reproduction (curl/SQL), the violated rule (Law #, INV-n, or spec line), and a concrete fix.

SCORING
- Weights: P0=10, P1=5, P2=3, P3=1. PASS=100% of weight, PARTIAL=50%, FAIL=0%, BLOCKED/N-A excluded from the denominator.
- Overall score = 100 × (sum earned) / (sum possible). Also compute a score per tag/category:
  CONFIG/OPS, FARE, DATA, PRIVACY, PAY, STATE/CONC, SEC, CRUD, DB, CHAOS/PERF.
- Coverage confidence = (tests executed with evidence) / 100. Report it; below 90% the rank is provisional.

GATES (caps override the score)
- Any FAIL in a P0 test tagged PAY, SEC or DB  -> overall rank capped at D.
- Any INV-1, INV-2 or INV-4 violation found at any time -> rank capped at D and mark "MONEY-INTEGRITY BREACH".
- Any other P0 FAIL -> capped at C.
- 3 or more P1 FAILs inside one category -> that category is RED; two RED categories cap the rank at C.
- Rank table: S >= 95 (no P0/P1 FAIL) | A 85–94 | B 70–84 | C 55–69 | D 40–54 | F < 40.
- Release verdict: GO only if rank >= B, zero P0 FAIL, and no MONEY-INTEGRITY BREACH; otherwise NO-GO.

OUTPUT (in this order)
1. VERDICT: rank letter, numeric score, coverage confidence, GO/NO-GO, one-paragraph rationale.
2. CATEGORY TABLE: category | tests | pass/partial/fail/blocked | score | GREEN/AMBER/RED.
3. TOP 10 RISKS: ranked by severity × exploitability × blast radius, each with test id(s), impact in rupees/customers, fix.
4. FAILED/PARTIAL TEST LIST: id | what happened | repro | root cause hypothesis | fix | effort (S/M/L).
5. MONEY-INTEGRITY STATEMENT: results of INV-1…INV-6 before and after the run; any unreconciled payment ids.
6. SECURITY STATEMENT: auth bypass, IDOR, injection, secret exposure findings (or "none found with evidence list").
7. DRIFT LIST: docs vs code vs DB vs Zod mismatches found.
8. KNOWN-GAP STATUS: for each audit gap -> still open / fixed.
9. 30/60/90-DAY HARDENING PLAN: ordered by risk reduction per effort.
10. MACHINE-READABLE BLOCK:
    {"rank":"","score":0,"coverage":0,"verdict":"GO|NO-GO","caps":[],
     "categories":{"PAY":0},"results":[{"id":"BE-001","status":"PASS","evidence":"path-or-snippet","notes":""}]}

AFTER FIXES
Re-run only FAIL/PARTIAL/BLOCKED tests plus INV-1…INV-6 and output a DELTA report (score change, newly broken tests = regression).
Honesty rule: if you could not run something, say so. A lower honest score beats an inflated one.
```
