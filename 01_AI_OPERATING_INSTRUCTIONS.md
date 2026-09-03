# AI Operating Instructions — SK Baghel Town & Travels

You are implementing the SK Baghel customer website defined in
`02_PROJECT_CONTEXT.md` and `03_PHASE_PLAN.md`, tracked in `04_PROGRESS_TRACKER.md`.
Follow these rules exactly. They exist because this build spans multiple sessions —
without them, context and correctness both degrade.

## 1. Before writing any code, every session

1. Read `PRD.md` (master/final product requirements) — it defines the full product,
   SEO and engineering goals. Do not silently deviate from it.
2. Read `02_PROJECT_CONTEXT.md` in full. Do not deviate from its stack/architecture
   decisions without flagging the deviation explicitly to the user first.
3. If the step touches any UI, also read `DESIGN.md` in full. Never invent a
   color, font size, spacing value, or radius that isn't in `DESIGN.md` — if one
   is missing, add it to `DESIGN.md` first and note the addition in the
   Decision Log, rather than hardcoding a one-off value.
4. Read `04_PROGRESS_TRACKER.md`. Find the **Current State** block at the top — it
   tells you the current phase, current step, and any open blockers.
5. Read the section of `03_PHASE_PLAN.md` for the current phase only.
6. If the tracker's "Current State" and the checkbox list disagree about what's done,
   stop and ask the user which is correct. Do not guess.

## 2. Execution rules

- **Implement exactly one step at a time.** One step = one unit of work from the
  phase plan. Do not batch multiple steps into one response, even if they seem
  related or small.
- **Do not start a step whose dependencies aren't checked off.**
- **Do not silently expand scope.** If a step reveals that an earlier phase was
  incomplete or wrong, stop, explain what you found, and ask before fixing it
  retroactively.
- **No partial code.** Every file you produce or modify should be complete and
  runnable — no `// ... rest stays the same` placeholders in files you're actively
  changing.
- **State your assumptions.** If a step is underspecified, pick the most reasonable
  interpretation consistent with `02_PROJECT_CONTEXT.md`, state the assumption in one
  line, and proceed. Only stop and ask if the ambiguity would change the
  architecture, not just a detail.
- **Frontend only** unless the user later adds a backend phase. Mock data. No live
  Razorpay, no APIs, no CMS.
- **Leave `design-guide/` and `proposal/` untouched.** They are source archives.
- **This Arena session is fixed to branch `arena/01a05b8c-arenaai`.** Do not switch
  or push any other branch.

## 3. After every step

Update `04_PROGRESS_TRACKER.md`:

1. Check the box for the completed step.
2. Update the **Current State** block: current phase, current step (the next
   unchecked one), and today's date.
3. Add one line to the **Session Log** table: what was done, which files were
   touched.
4. If you deviated from `02_PROJECT_CONTEXT.md` in any way, add a line to the
   **Decision Log** explaining why.
5. If you hit something you couldn't resolve, add it to the **Blockers** section
   instead of guessing past it.

Never rewrite or delete prior tracker history — only append and update the Current
State block.

## 4. Ending a phase

Before checking off the last step of a phase, re-read that phase's **Acceptance
Criteria** in `03_PHASE_PLAN.md` and verify each one is actually true, not just
"probably true." State explicitly which criteria you verified and how (ran it,
tested it, inspected it). Only then move the Current State to the next phase's
first step.

## 5. If you're not sure this file is being followed

If you (the AI) notice you've gone more than one step without updating the tracker,
stop and say so — don't keep building on an untracked base.
