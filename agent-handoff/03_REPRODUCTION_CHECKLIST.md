# Fresh-agent reproduction checklist

## 1. Clone and verify

```bash
gh repo clone tarun1sisodia/ArenaAI
cd ArenaAI
git log --oneline -8
git status --short --branch
```

Expected commits include:

- `efae9b7` or a descendant: end-to-end alignment plan
- `963428b` or its rebased equivalent: Route Catalog persistence fix
- `ee2952d` or a descendant: payment/admin mapping work

## 2. Read the handoff

Read in this order:

1. `agent-handoff/00_AGENT_HANDOFF_README.md`
2. `agent-handoff/01_16_STAGE_WORK_ORDER.md`
3. `agent-handoff/02_RESEARCH_INDEX.md`
4. every file in `agent-handoff/reports/`

## 3. Recreate local validation

```bash
cd backend
npm ci
npm run typecheck
npm test -- --run tests/unit/route-catalog-contract.test.ts tests/integration/catalog-manifest-f4.test.ts tests/unit/fare.engine.test.ts
cd ../admin
npm ci
npm run build
cd ..
```

## 4. Refresh live schema safely

Use the configured Supabase connector. First call `list_projects`, then inspect tables and migrations. All reads must:

- select only required columns;
- include an explicit `LIMIT`;
- paginate large reads;
- avoid secrets and personal identifiers;
- never run DML during the inventory phase.

Refresh:

- tables/columns/types/nullability;
- primary and foreign keys;
- row counts/status counts;
- null fractions;
- RLS enabled state and policies;
- migration ledger.

## 5. Continue the work

Run stages 1–16 from `01_16_STAGE_WORK_ORDER.md`. Do not restart the Route Catalog fix. Start with the column-population matrix and the catalog source-of-truth comparison.

## 6. Payment verification

Use test mode only. Never reuse a real customer payment. Verify browser callback and webhook independently. A browser callback must not populate `webhook_event_id`; only a verified webhook event may do that.

## 7. Final handoff requirements

Before finishing, provide:

- changed files and migration IDs;
- before/after row counts;
- test commands and results;
- deployment commit and logs;
- unresolved risks;
- rollback instructions;
- updated reports with no secrets or raw personal data.
