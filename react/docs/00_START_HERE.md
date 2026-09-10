# SK Baghel Tour & Travels — Documentation Pack

This pack is written so you can hand it to a coding AI (agent or chat) and have it
build the site phase by phase, without losing context between sessions.

## Files in this pack

| File | Purpose | When it's read |
|---|---|---|
| `PRD.md` | **Master/final product requirements doc** — full product/business goals, SEO strategy (intent → keyword → page → content → schema → technical), design, engineering, scalability, QA and launch gates. | First, before any build/scope discussion |
| `01_AI_OPERATING_INSTRUCTIONS.md` | The rules the AI must follow while building. Closest thing to a system prompt. | Every session, first |
| `02_PROJECT_CONTEXT.md` | Fixed architecture / stack / convention decisions. Prevents re-deciding mid-project. | Every session, first |
| `03_PHASE_PLAN.md` | The full build plan with acceptance criteria per phase. | Every session, plus when starting a new phase |
| `04_PROGRESS_TRACKER.md` | Checklist + running state. The AI **updates this file** as it completes steps. | Every session, first — and after every step |
| `DESIGN.md` | Visual identity — colors, type, spacing, shape, components. Source of truth for anything visual. | Any step that touches UI |

Also always-on: `AGENTS.md` (repo root) and `.agents/rules/AGENTS.md`.

Payments (future phase): `docs/PAYMENT_SYSTEM.md` (architecture, Razorpay, webhooks, scenarios, security) and `.agents/rules/PAYMENT_AGENT_RULES.md` (hard rules for agents). Live charges are still out of scope until that spec is implemented.

## How to run this with another AI

**Every time you open a new chat/session**, the first message should be:

> Read `01_AI_OPERATING_INSTRUCTIONS.md`, `02_PROJECT_CONTEXT.md`, `03_PHASE_PLAN.md`,
> `04_PROGRESS_TRACKER.md`, and `DESIGN.md`. Tell me the current phase and step from
> the tracker, then implement only that step. Update the tracker when done.

If the AI has file access, these files live in the repo root and it must re-read
them itself each session. `04_PROGRESS_TRACKER.md` is the one file that changes.

## The core rule

**One step at a time. Update the tracker after every step. Never skip ahead.**
If the AI tries to do three steps in one reply, stop it — that is the failure
mode this pack exists to prevent.

## What this project actually is

A **frontend-only** customer website for **Agra SK Baghel Tour & Travels**:
vanilla static HTML/CSS/JS, mock-data booking, bilingual EN/HI marketing pages
with hreflang. Not a React/Next app. Not a live payments backend. The approved
visual system is Dark Navy + Golden (`design-guide/` is the original PDF source;
`DESIGN.md` is the agent-facing spec).
