# ArenaAI API TestSprite context

Base URL: `http://localhost:4000` locally or `https://api.skbagheltravels.in` in an isolated staging environment.

## Response conventions

Success responses generally use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "error": { "code": string, "message": string, "requestId": string } }`. Assert status code, envelope, and request ID. Do not assert exact timestamps or generated UUIDs.

## Public/system endpoints

- `GET /health` → 200 and `{success:true,data.status:"ok"}`.
- `GET /ready` → 200 with `data.status` `ready` or `degraded`; production should report ready with the configured database.

## Fares

- `POST /api/v1/fares/calculate`
- Required/important fields include `tripType`, `vehicleTier`, `originName`, `destinationName`, `pickupDatetime`, and `distanceKm` where the selected fare mode requires them.
- Validate future date/time, supported vehicle tier, positive distance, supported trip type, currency/fee arithmetic, night allowance, round trip, package/local routes, promo behavior, and fare version.
- Reject missing fields, invalid enum values, negative/NaN/huge distance, past pickup, unknown vehicle, malformed promo, extra unknown keys, and XSS-like strings.

## Locations

- `GET /api/v1/locations/autocomplete?q=agra`
- Query must be bounded and should return curated static suggestions when LocationIQ is not configured.
- Test empty/short query, URL-encoded Unicode, no results, provider timeout/failure, and response shape.

## Bookings

- `POST /api/v1/bookings/draft`
- `GET /api/v1/bookings/:ticketId`
- Draft creation must persist a fare snapshot, generate `AGR-YYYYMMDD-XXXX`, and reject past pickup, invalid phone, invalid passenger/vehicle combination, malformed fields, XSS-like notes, and unknown keys.
- Voucher reads require full phone verification or a valid guest token. No verification is 401; a last-four-only query is 400; full valid phone succeeds and masks customer data.
- Do not expose internal IDs, payment secrets, full PII, or untrusted notes without sanitization.

## Payments and webhooks

- `POST /api/v1/payments/create-checkout`
- `POST /api/v1/payments/webhooks/:provider`
- Checkout must use a persisted booking/advance and reject unknown ticket, wrong amount, unsupported currency/provider, duplicate idempotency key misuse, and unauthorized access.
- Webhooks must verify signatures, reject missing/invalid signatures, reject malformed raw bodies, handle duplicate event IDs idempotently, and never treat an unverified browser redirect as payment success.
- Use mock/test provider secrets and disposable data only.

## Catalog and reviews

- Catalog routes are under `/api/v1/catalog` and `/api/v1/ops/admin/catalog` as implemented in `backend/src/modules/catalog/catalog.routes.ts`.
- Review routes are under `/api/v1/reviews` and `/api/v1/ops/admin/reviews` as implemented in `backend/src/modules/reviews/review.routes.ts`.
- Test published/hidden filtering, pagination bounds, slug lookup, invalid UUIDs, sanitized review text, rating range 1–5, minimum/maximum review length, status transitions, and duplicate moderation actions.

## Inquiries

- `POST /api/v1/inquiries`
- Valid name is 2–80 alphabetic characters, phone is 10–14 digits with optional `+`, email is optional but must be valid, message is 10–2000 characters, and unknown keys are rejected.
- Test rate limit after the allowed burst, duplicate submissions, whitespace-only values, HTML/script/event-handler payloads, and safe error responses.

## Admin operations

- `GET /api/v1/ops/admin/audit-logs`
- `GET /api/v1/ops/admin/bookings`
- `POST /api/v1/ops/admin/refunds`
- Protected operations must reject missing/invalid JWTs, wrong roles, invalid UUIDs, invalid status/page/pageSize, missing or reused refund idempotency keys, insufficient amount, unsafe reason, and repeated refund requests.

## Security and cross-cutting checks

- CORS allows configured customer/admin origins and rejects unknown origins.
- Security headers from Helmet are present.
- JSON body limit is 1 MB.
- Rate limits return the documented error envelope and headers.
- Every failure has a request ID; secrets and stack traces are not returned.
- `Content-Type` and method handling reject malformed requests cleanly.
- Test OPTIONS/CORS preflight, malformed JSON, unsupported methods, encoded traversal-like paths, and concurrent duplicate writes.
