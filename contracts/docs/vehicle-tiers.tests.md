# Test docs: `backend/tests/contract/vehicle-tiers.contract.test.ts`
Contract: **C-ENUM-001** (`contracts/enums/vehicle-tiers.ts`). Read this if a test here fails.

## WHY — what real bug each test prevents

**Background.** The codebase used two tier-key forms: long/canonical
(`innova-crysta`, `tempo-traveller`) and short (`innova`, `tempo`). Seeds, the
`route_catalog.available_fleets` DB default, and `extra_rates` rows used short keys
while the fare engine and zod schemas used canonical keys. The 2026-10-06 audit
found this caused **silent wrong fares**: admin-entered rates under short keys were
invisible to canonical-key lookups (F3/F4), and fixed-price rows silently fell
through to per-km pricing (F2). Tarun decided (D1, 2026-10-07): **long form is
canonical, everywhere.**

| Test | Why it exists |
|------|---------------|
| generated copy in sync | The lock mechanism: `contracts/` is the source of truth; the three app copies are generated. If an agent hand-edits a copy, this test fails the build instead of letting the layers drift again. |
| domain.ts parity | `backend/src/types/domain.ts` defines its own `VEHICLE_TIERS`. If anyone adds/removes a tier there without going through the contract change process, this catches it. |
| DB enum parity | The DB `vehicle_tier_enum` (migration 0002) is the other authority. If a future migration changes the enum without updating the contract (or vice versa), this fails. No live DB needed — it parses the migration SQL. |
| `toCanonicalTierKey` cases | Pins the normalization behavior: short ids map to canonical, canonical passes through, garbage returns `undefined` (so callers reject loudly instead of guessing). |
| tier meta | Pins the business facts Tarun gave: labels + seat counts (Sedan 4, Ertiga 6, Innova 6-7, Tempo 12, Urbania 16) and the short-id bridge for compatibility reads. |
| `resolveTierKey` cases | Pins the read rule: canonical key wins; compatibility short id is accepted for old rows (so the data migration doesn't break reads); a miss returns `undefined` — never a silent fallback to a wrong price. |

## WHAT — exactly what is asserted
1. `backend/src/contracts/vehicle-tiers.ts` ends with the exact bytes of
   `contracts/enums/vehicle-tiers.ts` and carries the GENERATED header.
2. `[...DOMAIN_TIERS]` deep-equals `[...CONTRACT_TIERS]`.
3. The set of values in `CREATE TYPE vehicle_tier_enum` (parsed from
   `backend/migrations/0002_create_enums.sql`) equals the contract set.
4. `toCanonicalTierKey("innova") === "innova-crysta"`,
   `toCanonicalTierKey("tempo") === "tempo-traveller"`,
   identity on canonical input, `undefined` on `"suv"` / `""`.
5. Every tier has non-empty `label`, `seats`, `shortId` in `VEHICLE_TIER_META`.
6. `resolveTierKey({sedan:1900, innova:2850}, "innova-crysta")` →
   `{ value: 2850, via: "compat" }`; canonical-first when both exist;
   `{ value: undefined, via: "miss" }` on miss or null record.

## HOW — updating these tests when the contract intentionally changes
Scenario: Tarun adds a 6th fleet, e.g. `"kia-carnival"` (canonical long form).

1. **Change the contract** (only via `contracts/LOCKED.md` § change process):
   - Add `"kia-carnival"` to `VEHICLE_TIERS` in `contracts/enums/vehicle-tiers.ts`.
   - Add its meta: `{ label: "Kia Carnival", seats: "7", shortId: "carnival" }`.
   - Add a DB migration adding the value to `vehicle_tier_enum` (expand-and-contract).
   - Bump `contracts/CHANGELOG.md`.
2. **Regenerate copies:** `npx tsx contracts/scripts/sync-contracts.ts`
   (the sync test then passes again by itself).
3. **Update this test file:**
   - `toCanonicalTierKey` cases: add `expect(toCanonicalTierKey("carnival")).toBe("kia-carnival")`.
   - `resolveTierKey` cases: add a compatibility record case if old rows will carry the short id.
   - The DB-enum parity test needs **no change** — it reads the migration, so it
     automatically expects the new value once the migration exists. If it fails,
     you forgot the migration.
   - The domain-parity test needs **no change** if `domain.ts` re-exports the
     contract; if it still defines its own list, update it there too (or better,
     switch it to a re-export and delete the duplication).
4. Run `npx vitest run tests/contract/vehicle-tiers.contract.test.ts` — all green.
