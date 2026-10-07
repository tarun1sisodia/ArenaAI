# C-WIRE — Wire conventions (admin ↔ backend ↔ react). Status: FROZEN (pilot)

## 1. Response envelope
Every API response uses one envelope:
- success: `{ "success": true, "data": { ... }, "requestId": "..." }`
- failure: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "requestId": "..." } }`
- Every error carries `requestId`. (Audit found 9 divergent shapes — they are being aligned; new code must use the envelope.)

## 2. Casing
- **Database:** `snake_case` (`fleet_prices`, `pickup_datetime`).
- **API wire:** `camelCase` (`fleetPrices`, `pickupDatetime`).
- The mapping is mechanical. Known deliberate renames (documented, not bugs):
  - `note` (request) → appended to `notes text[]` (DB) on PATCH inquiries / rental-enquiries.
- Never invent a third casing. Compressed wire formats (catalog manifest `{o,d,km,...}`)
  are versioned and documented where they are used.

## 3. Money units
- **Database:** paise as integer (`payments.amount_minor`, `refunds.amount_minor`).
- **Wire / engine:** rupees as number (`totalFare`, `fareVersion`).
- Conversion happens once at the payment boundary (`payment.service.ts`).
  Client-submitted totals are never trusted (Law 2 — server-authoritative fares).

## 4. Errors
- Validation failures: `400` + `error.code = "VALIDATION_ERROR"` + field-level message.
- Unknown enum/tier keys, unpriced tiers: `400` with a message naming the bad key and the valid keys. Never silently ignore.
- Auth: missing/invalid token → `401`; wrong role → `403` (fail-closed).

## 5. Auth model
- Global `onRequest` hook resolves identity (anonymous tolerated); each handler enforces
  via `requireRole()`. All `/ops/admin/*` = `super_admin` only.
- Webhooks: HMAC verified over the raw body BEFORE any DB write (fail-closed).

## 6. Tiers (pointer)
- Tier keys follow C-ENUM-001 (`contracts/enums/vehicle-tiers.ts`): long form only on the wire.
