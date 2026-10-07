# Contract changelog

## 0.1.0 — 2026-10-07 (pilot)
- **C-ENUM-001 (new, PILOT):** canonical vehicle tiers = long form
  (`sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`).
  Decided by Tarun (D1). Matches DB `vehicle_tier_enum` (migration 0002).
  Legacy short ids (`innova`, `tempo`) readable via `resolveTierKey()` during
  data migration, never writable.
- **C-API-001 (new, PILOT):** `POST /api/v1/fares/calculate` contract pinned —
  `.strict()` request, `vehicleTier ∈ C-ENUM-001`, `FareResponseSchema` response,
  server-authoritative fare.
- **C-WIRE (new, FROZEN):** envelope, casing, money units, error shape, auth model.
- **C-SCHEMA (FROZEN):** 28 tables / 365 columns from migrations 0001–0033
  (+ 0034 canonical fleet keys).
- **Migration 0034:** `route_catalog.available_fleets` default short → long form;
  backfills existing arrays (expand-and-contract: reads accept both forms via
  `resolveTierKey()`, so this is non-breaking).
- Seeds (`dossier-seeds.ts`): `fleetPrices`/`extraRates` keys and `tierCode`
  migrated short → long form.
