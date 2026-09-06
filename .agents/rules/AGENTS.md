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
   - Animation verification: `ANIMATION_RULES.md` — SEO safety & accessibility before adding animations
   - Sequence & acceptance: `03_PHASE_PLAN.md`
   - State & history: `04_PROGRESS_TRACKER.md`

3. **Update the progress tracker after every step**
   - Check the step `[x]`
   - Update **Current State** (phase, next step, date, blockers)
   - Append **Session Log**
   - Deviations → **Decision Log**; stalls → **Blockers**

4. **Code quality**
   - No placeholder / partial code
   - Frontend only, mock data, root-relative URLs
   - `booking.js` only on `book.html`
   - Leave `design-guide/` and `proposal/` untouched
   - Stay on branch `arena/01a05b8c-arenaai`
