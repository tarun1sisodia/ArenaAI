# AI Operating Rules — SK Baghel Tour & Travels

This workspace follows the multi-phase monorepo protocol (`react/`, `admin/`, `backend/`)
governed by the root operating specification and agent runbook.

## Core directives

1. **One step at a time**
   - Implement exactly one discrete step from the active backlog in `ADMIN_CUSTOMER_BACKEND_AUDIT_AND_OPERATING_SPEC.md` or tracker.
   - Never batch multiple steps into a single reply or skip ahead.
   - For every single operation implemented, verify locally, report results, and allow manual user testing before moving to the next step.

2. **Consult single sources of truth**
   - Primary Operational Specification: `ADMIN_CUSTOMER_BACKEND_AUDIT_AND_OPERATING_SPEC.md`
   - Agent Context Handoff: `docs/agent/00_CONTEXT_HANDOFF.md`
   - Agent Runbook: `docs/agent/01_AGENT_RUNBOOK.md`
   - Change Ledger: `docs/agent/02_CHANGE_LEDGER.md`
   - Backend Architecture & Engineering: `BACKEND_RULES.md` — PostgreSQL/Supabase is authoritative
   - Frontend Architecture & Design Standard: `FRONTEND_RULES.md`
   - Visual system: `DESIGN.md` — never hardcode arbitrary colors/sizes
   - Locked designs & patterns: `DESIGN_LOCKS.md` — verify status before editing any existing component, pattern, or logic
   - Animation verification: `ANIMATION_RULES.md` — SEO safety & accessibility before adding animations
   - Payments: `docs/PAYMENT_SYSTEM.md` + `.agents/rules/PAYMENT_AGENT_RULES.md` — never live-charge without signed webhook + server fare
   - Sequence & acceptance: `ADMIN_CUSTOMER_BACKEND_AUDIT_AND_OPERATING_SPEC.md` / `03_PHASE_PLAN.md` / `PLAN.md`
   - State & history: `docs/agent/02_CHANGE_LEDGER.md` / `04_PROGRESS_TRACKER.md` / `PROGRESS.md`

3. **Update the progress tracker after every step**
   - Check the step `[x]`
   - Update **Current State** (phase, next step, date, blockers)
   - Append **Change Ledger / Session Log** (in `docs/agent/02_CHANGE_LEDGER.md` and trackers)
   - Deviations → **Decision Log**; stalls → **Blockers**

4. **Code quality & environment hygiene**
   - No placeholder / partial code
   - Server-authoritative calculations: customer frontend never computes or submits prices or distances
   - Never commit `.env*` secrets, keys, or passwords
   - Leave `design-guide/` untouched
   - Work on active branch `main`

5. **Design Lock Compliance**
   - NEVER modify, restyle, refactor, or override any component, design, pattern, or logic listed as `LOCKED` in `DESIGN_LOCKS.md` without explicit user permission.
   - If a requested step or change touches a locked component, STOP and ask the user for confirmation first. If not locked, proceed normally.
