# SK Baghel Tour & Travels — Documentation Pack

This pack orients a coding AI (agent or chat) working on the **frontend** of the
platform without losing context between sessions. The repository is a monorepo:
`react/` (customer site), `admin/` (operations desk) and `backend/` (API).

## Files in this pack

| File | Purpose | When it's read |
|---|---|---|
| `01_AI_OPERATING_INSTRUCTIONS.md` | The rules the AI follows while building. Closest thing to a system prompt. | Every session, first |
| `DESIGN.md` | Visual identity — colours, type, spacing, shape, components. Source of truth for anything visual. | Any step that touches UI |
| `ANIMATION_RULES.md` | Motion gate: what may animate, and the SEO/accessibility pre-checks. | Before adding or changing any animation |
| `05_FRONTEND_FIX_PLAN.md`, `06_AUDIT_REPORT.md` | Frontend remediation plan and audit findings. | When working through known frontend issues |
| `LAUNCH_CHECKLIST.md` | Pre-launch content and QA items. | Before launch |
| `REACT-MIGRATION-PLAN.md` | How the static site was migrated into `react/`. | Historical reference |

Documents that describe the whole platform live at the **repository root**:

| File | Purpose |
|---|---|
| [`../../PRD.md`](../../PRD.md) | Master product requirements: goals, SEO/AI-search strategy, admin and API scope, engineering, QA gates, client decision points |
| [`../../02_PROJECT_CONTEXT.md`](../../02_PROJECT_CONTEXT.md) | Fixed architecture, stack and conventions for all three apps |
| [`../../03_PHASE_PLAN.md`](../../03_PHASE_PLAN.md) | Delivered phases, the current plan, and what comes next |
| [`../../04_PROGRESS_TRACKER.md`](../../04_PROGRESS_TRACKER.md) | Living state: current phase, blockers, decision log, checklist |
| [`../../docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md) | Hosts, build commands, env vars, release order, rollback |
| [`../../README.md`](../../README.md) | Commands, environment split, repository layout, build hygiene |

The earlier copies of `PRD.md`, `02_PROJECT_CONTEXT.md`, `03_PHASE_PLAN.md` and
`04_PROGRESS_TRACKER.md` in this folder were the static-site versions and had drifted
from the root documents; they are now pointers. Their historical text is available via
`git show 2c02ee3:<path>`.

Also always-on: [`../../AGENTS.md`](../../AGENTS.md) (repo root) and
[`.agents/rules/AGENTS.md`](../../.agents/rules/AGENTS.md).

Payments: [`../../docs/PAYMENT_SYSTEM.md`](../../docs/PAYMENT_SYSTEM.md) (architecture,
Razorpay, webhooks, scenarios, security) and
[`.agents/rules/PAYMENT_AGENT_RULES.md`](../../.agents/rules/PAYMENT_AGENT_RULES.md)
(hard rules for agents). Live charges stay out of scope until that spec is implemented
and its drills pass.

## How to run this with another AI

**Every time you open a new chat/session**, the first message should be:

> Read `AGENTS.md`, `PRD.md`, `02_PROJECT_CONTEXT.md`, `03_PHASE_PLAN.md`,
> `04_PROGRESS_TRACKER.md` and `react/docs/DESIGN.md`. Tell me the current phase and
> step from the tracker, then implement only that step. Update the tracker when done.

If the AI has file access it must re-read those files itself each session.
`04_PROGRESS_TRACKER.md` is the file that changes most.

## The core rule

**One step at a time. Update the tracker after every step. Never skip ahead.**
If the AI tries to do three steps in one reply, stop it — that is the failure mode
this pack exists to prevent.

## What this project actually is

A three-application platform for **Agra SK Baghel Tour & Travels**:

- `react/` — bilingual (EN/HI) pre-rendered customer site with a 5-step booking funnel,
  React 19 + Vite 7 + TypeScript, deployed to Cloudflare Pages.
- `admin/` — operations desk (dispatch, finance, catalog, reviews, inquiries, audit)
  with role-based access, deployed to Cloudflare Pages.
- `backend/` — Fastify + PostgreSQL API that owns fares, bookings, payments, catalog,
  reviews and permissions, deployed as a Docker service.

The approved visual system is Dark Navy + Golden (`design-guide/` is the original PDF
source; `DESIGN.md` is the agent-facing spec). Call and WhatsApp are the primary
conversions; `book.html` is deliberately `noindex`.
