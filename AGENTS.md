# Agent rules — SK Baghel Tour & Travels (monorepo)

This repository is a monorepo with three independently deployable applications:
`react/` (customer site), `admin/` (operations desk) and `backend/` (API).
Deployment topology, provider settings and the command contract live in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Read before writing code, every session

1. [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — hosts, build commands, env vars, release order. **Read this before touching any deployment config.**
2. [`react/docs/01_AI_OPERATING_INSTRUCTIONS.md`](react/docs/01_AI_OPERATING_INSTRUCTIONS.md) — how to operate on this codebase
3. [`react/docs/02_PROJECT_CONTEXT.md`](react/docs/02_PROJECT_CONTEXT.md) — architecture and conventions
4. [`react/docs/04_PROGRESS_TRACKER.md`](react/docs/04_PROGRESS_TRACKER.md) — frontend tracker; read the **Current State** block first
5. [`react/docs/03_PHASE_PLAN.md`](react/docs/03_PHASE_PLAN.md) — **current phase only**
6. [`react/docs/DESIGN.md`](react/docs/DESIGN.md) and [`DESIGN_LOCKS.md`](DESIGN_LOCKS.md) — any UI step; verify a component is not LOCKED before editing it
7. [`ANIMATION_RULES.md`](ANIMATION_RULES.md) — before adding or modifying any animation
8. [`docs/PAYMENT_SYSTEM.md`](docs/PAYMENT_SYSTEM.md) + [`.agents/rules/PAYMENT_AGENT_RULES.md`](.agents/rules/PAYMENT_AGENT_RULES.md) — before any Razorpay, webhook, refund or "mark paid" work
9. [`BACKEND_RULES.md`](BACKEND_RULES.md) — before any backend, API, database, controller or integration work

Implement **exactly one step** from the tracker (`react/docs/04_PROGRESS_TRACKER.md`
for frontend/React, [`PROGRESS.md`](PROGRESS.md) for backend). Update the tracker
when that step is done. Never skip ahead.

`react/docs/` holds the frontend-specific pack (`00_START_HERE.md` is its overview:
design, animation, launch checklist, fix plan). Platform-wide documents —
`PRD.md`, `02_PROJECT_CONTEXT.md`, `03_PHASE_PLAN.md`, `04_PROGRESS_TRACKER.md`,
`README.md`, `docs/DEPLOYMENT.md` — all live in the repository root, so there is one
copy of each. The `PRD.md`, `02_…`, `03_…` and `04_…` files inside `react/docs/` are
pointers to those root documents; their old static-site text is in git history
(`git show 2c02ee3:<path>`).

## Build hygiene (enforced by CI)

- Builds write **only** inside `react/dist`, `admin/dist` and `backend/dist`. The one
  tracked file a build rewrites is `react/public/sitemap.xml`.
- Never point `react/scripts/generate-sitemap.ts`, the pre-renderer, or any other
  build script at the repository root or a root `dist/`.
- Never commit `dist/`, `node_modules/`, `.env*` (except the examples) or generated
  copies of app output.
- Frontend bundles are public: no database, payment, webhook or service-role secret
  may ever reach `react/` or `admin/` build output. CI fails the build if secret
  names appear in either bundle.
- `react/dist` and `admin/dist` must remain deployable artifacts: the customer app
  keeps real 404 semantics (`404.html`, `not_found_handling: "404-page"`), the admin
  app keeps its SPA fallback (`admin/public/_redirects` +
  `not_found_handling: "single-page-application"`).

## Verify before you finish

```bash
npm run verify    # typecheck x3 + backend tests + build x3 (same as CI)
```
