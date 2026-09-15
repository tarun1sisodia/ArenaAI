# AI Operating Rules — SK Baghel Tour & Travels

This workspace follows the multi-phase static-frontend protocol in the repo-root
documentation pack.

## Core directives

1. **One step at a time**
   - Implement exactly one discrete step from `03_PHASE_PLAN.md`.
   - Never batch multiple steps into a single reply or skip ahead.

2. **Consult single sources of truth**
   - Stack & architecture: `02_PROJECT_CONTEXT.md`
   - Visual system: `DESIGN.md` — never hardcode arbitrary colors/sizes
   - Locked designs & patterns: `DESIGN_LOCKS.md` — verify status before editing any existing component, pattern, or logic
   - Animation verification: `ANIMATION_RULES.md` — SEO safety & accessibility before adding animations
   - Payments: `docs/PAYMENT_SYSTEM.md` + `.agents/rules/PAYMENT_AGENT_RULES.md` — never live-charge without webhook + server fare
   - Backend Architecture & Engineering: `BACKEND_RULES.md` — for all backend APIs, database schemas, and integration
   - Sequence & acceptance: `03_PHASE_PLAN.md` (frontend) / `PLAN.md` (backend)
   - State & history: `04_PROGRESS_TRACKER.md` (frontend) / `PROGRESS.md` (backend)

3. **Update the progress tracker after every step**
   - Check the step `[x]`
   - Update **Current State** (phase, next step, date, blockers)
   - Append **Session Log** (in `04_PROGRESS_TRACKER.md` or `PROGRESS.md`)
   - Deviations → **Decision Log**; stalls → **Blockers**

4. **Code quality**
   - No placeholder / partial code
   - Frontend only, mock data, root-relative URLs
   - `booking.js` only on `book.html`
   - Leave `design-guide/` untouched
   - Stay on branch `arena/01a05b8c-arenaai`

5. **Design Lock Compliance**
   - NEVER modify, restyle, refactor, or override any component, design, pattern, or logic listed as `LOCKED` in `DESIGN_LOCKS.md` without explicit user permission.
   - If a requested step or change touches a locked component, STOP and ask the user for confirmation first. If not locked, proceed normally.
