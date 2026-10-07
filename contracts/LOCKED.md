# LOCKED.md — what "locked" means and the only way to change a contract

## What locked means
1. **Source of truth:** `contracts/` is the only place a contract is defined.
   Generated copies (`backend/src/contracts/`, `admin/src/contracts/`, `react/src/contracts/`)
   are byte-identical (plus a header) — verified by `contracts/scripts/sync-contracts.ts`
   and enforced by `backend/tests/contract/vehicle-tiers.contract.test.ts` (sync test).
2. **No silent edits:** `.github/CODEOWNERS` marks `contracts/` and
   `backend/tests/contract/` as Tarun-only review. Any PR touching them needs his approval.
3. **CI gate:** `npm run test:contract` must pass. The sync test fails the build if a
   generated copy drifts from its source; the parity tests fail if code enums drift
   from the DB enums. Red build = rejected change.
4. **Versioned:** every contract change bumps `contracts/CHANGELOG.md`. A contract
   change without a changelog entry + version bump is incomplete.

## The only way to change a locked contract (change process)
1. **Tarun requests it** (chat is fine — e.g. "change X").
2. Update the contract source in `contracts/` + CHANGELOG entry + version bump.
3. Re-run `npx tsx contracts/scripts/sync-contracts.ts` to regenerate all copies.
4. Update **every consumer** listed in `contracts/REGISTRY.md` for that contract.
   This is where dead code appears — old branches referencing the old shape.
5. Update/extend the contract tests **and** their `contracts/docs/*.tests.md`
   (why/what/how) files.
6. **Tarun reviews** the diff (contract + consumers + tests + docs) and approves.
   Nothing merges without this step.

## What agents must never do
- Edit a generated copy directly (they are overwritten by the sync).
- Widen a contract (add a value, relax a schema) to make failing code pass —
  fix the code, not the contract.
- Add a "temporary" exception without a CHANGELOG entry and a removal date.
