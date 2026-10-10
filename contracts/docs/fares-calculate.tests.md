# Test docs: C-API-001 tests in `backend/tests/contract/vehicle-tiers.contract.test.ts`
Contract: **C-API-001** — `POST /api/v1/fares/calculate`
(source: `backend/src/modules/fares/fare.schema.ts`).

## WHY — what real bug each test prevents

| Test | Why it exists |
|------|---------------|
| canonical tier → 200 + `FareResponseSchema` parse | The strongest contract assertion in the suite: the actual HTTP response body must parse against `FareResponseSchema`. If anyone adds/removes/renames a response field (the exact drift the 2026-10-06 audit hunted), this test fails instead of admin/react silently reading a missing field. |
| short tier id → 400 | Pins the API boundary rule: the wire speaks **canonical long form only** (`z.enum(VEHICLE_TIERS)`). Compatibility short ids are normalized *inside* the backend for old DB rows — they are never valid on the wire. If someone loosens the schema to accept anything, this test fails. |

Background: `CalculateFareSchema` is `.strict()` and server-authoritative (client
distance is ignored for pricing — BACKEND_RULES.md Law 2). The response contract
also covers the F2 fix: a fixed-price row with no price for the requested tier now
returns `400 TIER_NOT_PRICED` instead of silently falling through to per-km.

## WHAT — exactly what is asserted
1. `POST /api/v1/fares/calculate` with
   `{ tripType: "one-way", vehicleTier: "sedan", originName: "Agra",
      destinationName: "Delhi", pickupDatetime: <future>, distanceKm: 230 }`
   → `200`, `body.success === true`,
   `FareResponseSchema.safeParse(body.data).success === true`,
   `body.data.vehicleTier === "sedan"`, `body.data.totalFare > 0`.
2. Same payload with `vehicleTier: "innova"` → `400`,
   `body.error.code === "VALIDATION_ERROR"`.

## HOW — updating these tests when the contract intentionally changes
Scenario: Tarun adds a required request field, e.g. `couponChannel`.

1. Update `CalculateFareSchema` in `backend/src/modules/fares/fare.schema.ts`
   (and `FareResponseSchema` if the response changes) — via the §6 change process.
2. Update the `basePayload` in this test file to include the new field.
3. If the response schema gained a field, no test change is needed for the parse
   assertion to keep working — but add an explicit `expect` for the new field so
   the contract is pinned, not just parseable.
4. Know what `safeParse` does and does not catch: it **fails** on a missing
   required field or a wrong type (that's the drift alarm), but it **strips and
   ignores extra fields** the API sends (`z.object()` is not `.strict()`). So if
   the contract *removes* a response field, also delete its explicit `expect`
   here — and if you want to pin "the API sends no undocumented fields", that
   needs either `.strict()` on `FareResponseSchema` or an explicit key-set
   assertion (a deliberate future hardening, not in the pilot).
5. Run `npx vitest run tests/contract/vehicle-tiers.contract.test.ts` — all green.
