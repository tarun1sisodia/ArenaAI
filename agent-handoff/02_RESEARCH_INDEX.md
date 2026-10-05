# Research artifact index

This folder contains the evidence and plans produced during the ArenaAI alignment work.

| File | Purpose |
|---|---|
| `00_AGENT_HANDOFF_README.md` | Portable context, safety rules, current commits, unresolved issues, and deliverables. |
| `01_16_STAGE_WORK_ORDER.md` | Agent-ready execution procedure for all 16 scan stages. |
| `reports/live-schema-inventory.md` | Live Supabase table, column, type, nullability, keys, row-count, and RLS inventory. |
| `reports/schema-audit-findings.md` | Earlier verified payment/schema findings, including Razorpay webhook 401 and RLS warnings. |
| `reports/schema-model-alignment.md` | Backend/admin/database alignment findings and payment mapping fixes. |
| `reports/phase1-table-scan-findings.md` | 16-stage scan status, population explanations, Route Catalog defect evidence, and fixes. |
| `reports/end-to-end-data-alignment-plan.md` | Full phased plan from inventory through controlled tests, fixes, RLS, and deployment verification. |

## Known completed code changes

The source repository contains these already-pushed fixes:

- Razorpay server-side browser callback verification.
- Admin finance payment field mapping.
- Route Catalog extension-field persistence.

Agents should verify the commits rather than duplicating the changes.

## Important live-source caveat

The live database evidence is a snapshot from the Supabase project at the time of the audit. Re-run read-only queries before making decisions because row counts and statuses can change.
