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
6. [`react/docs/DESIGN.md`](react/docs/DESIGN.md) and [`docs/project/DESIGN_LOCKS.md`](docs/project/DESIGN_LOCKS.md) — any UI step; verify a component is not LOCKED before editing it
7. [`docs/project/ANIMATION_RULES.md`](docs/project/ANIMATION_RULES.md) — before adding or modifying any animation
8. [`docs/PAYMENT_SYSTEM.md`](docs/PAYMENT_SYSTEM.md) + [`.agents/rules/PAYMENT_AGENT_RULES.md`](.agents/rules/PAYMENT_AGENT_RULES.md) — before any Razorpay, webhook, refund or "mark paid" work
9. [`BACKEND_RULES.md`](BACKEND_RULES.md) — before any backend, API, database, controller or integration work
10. [`FRONTEND_RULES.md`](FRONTEND_RULES.md) — master frontend architectural standard, typography scale, design tokens, SSG, and component rules

Implement **exactly one step** from the tracker (`react/docs/04_PROGRESS_TRACKER.md`
for frontend/React, [`docs/project/PROGRESS.md`](docs/project/PROGRESS.md) for backend). Update the tracker
when that step is done. Never skip ahead.

`react/docs/` holds the frontend-specific pack (`00_START_HERE.md` is its overview:
design, animation, launch checklist, fix plan). Platform-wide project history and
planning documents live in `docs/project/`; the root retains operational rules,
`README.md`, and the latest `ADMIN_CUSTOMER_BACKEND_AUDIT_AND_OPERATING_SPEC.md`.
The agent handoff and repeatable runbook are in `docs/agent/`.

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

<!-- beacon:workflow:start -->
## Beacon — feature workflow

This project uses Beacon (a local planning/visualization panel; run `beacon` to open it). When you start work on a FEATURE — whether referenced via an `@beacon:feature://…` mention, an `@beacon:note://…` note the user wrote in the Notes panel (treat its checkbox `- [ ]` todos as subtasks and order features by their dependencies), or just described in chat — follow these steps in order:

### 1. Load context FIRST — do NOT Glob/Grep the codebase blind

Call `beacon_context_for_feature({ id | title | query })` BEFORE reading files. It returns, in one round-trip:
- the files the feature is attached to,
- what those files import + what imports them (live code-graph blast radius),
- endpoints in the feature's domain + the tables each touches + those tables' FK relations,
- sibling architecture components and the project's conventions.

That bundle replaces the discovery phase. Read only the files it returns plus whatever those imports lead you to. If the feature has no files attached yet, the bundle still gives you the domain map — Glob is a last resort.

Mid-feature, when deciding whether a change is safe, call `beacon_blast_radius({ path })` for the file you're about to edit — same code-graph data, file-centric.

For a symbol-level question — who calls X, what X reaches, how A gets to B — reach for the live symbol graph instead of grepping: `beacon query "<question>"` for a scoped subgraph, `beacon explain <symbol>` for callers and callees with file:line, `beacon affected <symbol>` for what a change to it reaches, or `beacon path <A> <B>` for how one symbol reaches another — from the terminal, or the `beacon_graph` MCP tool. Model-free, one call, answers straight from the graph.

### 2. Design the data BEFORE writing code

Determine the database tables the feature needs. If any don't exist yet, design the schema and call `beacon_propose_plan` (tables + relations + endpoints). This renders an **editable draft on the /plan page** for the user to review. The tool BLOCKS until the user clicks Approve / Discard / submits feedback. Implement migrations + code ONLY after it returns approval.

When listing endpoints, give each `uses: [{ table, access }]` so the endpoint→table links draw on /db.

EVERY feature MUST carry `category` (e.g. AUTH | SEARCH | DATA | INTEL | BILLING | …; `cluster` is accepted as an alias) and `priority` (0 = P0 critical, 1 = P1 high, 2 = P2 medium, 3 = P3 low). Beacon REJECTS a plan whose features omit either — `beacon_propose_plan` returns the list of what's missing, and an ExitPlanMode ```beacon block is denied — so set both on every feature instead of relying on defaults.

When the workspace HAS A FRONTEND (Beacon knows — the agent set `hasFrontend` at init, or frontend files were detected), every feature must ALSO carry `layer`: `"frontend" | "backend" | "fullstack"` — which side of the stack the work lands on. Plans omitting it are REJECTED the same way category/priority are. It works on every surface that creates roadmap cards (`beacon_propose_plan`, the ```beacon block, `beacon_feature` — sub-tasks default to the parent's layer) and on architecture components (`beacon_feature` action:done / `beacon_init_persist`). In a pure-backend repo, never set it — the boards don't show it there.

### Adding a card directly — `beacon_feature` (no review gate)

To put a card on the board WITHOUT the plan-review flow, call `beacon_feature` — ONE tool for a feature's whole lifecycle:
- `{ action: "add" }` creates a card in a SINGLE call. It defaults to `status: "backlog"` (a PENDING item you're NOT working on yet); pass `status: "active"` to start it IN_PROGRESS now. A title that matches an existing card in the SAME category + layer returns `exists` (reuse it) — the same title in a DIFFERENT category or layer (FE/BE/FS) creates a distinct card; `add` never activates or demotes a card already on the board.
- `{ action: "start" }` marks an existing card IN_PROGRESS (create-or-flag).
- `{ action: "subtasks" }` adds child tasks under a card.
- `{ action: "done" }` completes feature(s) and registers the files/architecture touched.

A NEW card REQUIRES `category` + `priority` (and `layer` where the workspace has a frontend). Use `beacon_propose_plan` / `beacon_present_plan` only when you want the user to REVIEW before the card lands.

REUSE before you create. Call `beacon_map` FIRST — it lists every card with its `category`, `priority`, `layer` and `status`, so you reuse an existing category (don't invent a near-synonym) and spot duplicates WITHOUT calling `beacon_entities`. Beacon blocks only an EXACT duplicate — same title AND category AND layer — plus a card created without a category; a same-named card in a DIFFERENT category, or on a different layer (frontend/backend/fullstack), is allowed as its own card. `category` is the ONLY domain field. `front` (in `beacon_feature`) nests a card UNDER an existing parent feature — it is NOT a domain tag; a `front` that matches no real feature is rejected.

When listing features, give each `dependsOn: ["Other feature title", …]` for any feature that must ship after another in the same plan. Beacon draws these as "depends on" links so the roadmap shows the dependency chain instead of loose, disconnected cards.

A roadmap item that is a BUG to fix (not a feature to build) should carry `kind: "BUG"` — it renders as a typed bug card. This works everywhere roadmap cards are created: `beacon_propose_plan` features, the ```beacon block, `beacon_feature` (add/start when the user is working on a bug; or `subtasks` items for a bug discovered mid-work), and `beacon_init_persist` roadmap items. Default is FEATURE.

### 2b. Presenting a plan in plan mode (ExitPlanMode)

In Codex (which has no ExitPlanMode), always present plans via `beacon_present_plan` / `beacon_propose_plan` instead — this section applies to Claude Code's plan mode only.

When you present a plan via ExitPlanMode (not `beacon_propose_plan`) and it proposes DB tables/relations/endpoints or roadmap features, embed ONE fenced ```beacon code block of JSON in the plan — the same shapes `beacon_propose_plan` accepts:

```beacon
{ "tables": [...], "relations": [...], "endpoints": [...], "features": [...] }
```

Beacon extracts it deterministically and **strips the block from the prose** (it's never shown in the annotation panel), then renders the tables + features as an **editable board** on /plan so the user can edit them and have those edits flow back as feedback. Omit the block for pure code-change plans.

**The board is built ONLY from the block — prose is NOT parsed.** If your plan describes ANY database models/tables/columns in the prose (e.g. "Model `legal_precedent.py` — natural key (court, …)"), you MUST also put them in the block's `tables` array (with `columns`), or the /db tab will be empty for that plan. Same for endpoints (`endpoints` with `uses:[{table,access}]`) and features (`features`). A plan that lists five tables in prose but ships a block with only `features` renders an empty database board — exactly the "I described models but the DB tab is empty" failure. Mirror every DB entity you mention into the block.

### 2c. Mark the files you mention — write repo-relative paths in backticks

When a plan, feature, or architecture-component description mentions a source file, write its **repo-relative path inside backticks** — `app/api/plan/route.ts`, not "the plan route". On the /plan canvas Beacon turns every backticked token that matches a REAL repo file into a clickable mention that opens it in the user's editor; a bare filename matching several files (e.g. `route.ts`) opens a pick-one dropdown of the same-named candidates. The match is deterministic against the live code graph, so a path that isn't a real file just stays plain text — there's no special syntax to learn and no downside to over-marking: always name files by their real path so the reader can jump straight to the code.

### 3. At the end, register the work — in ONE call

Call `beacon_feature({ action: "done" })` **ONCE** with a `features` array — one entry per feature the plan created — each with the files you touched and a short markdown description. This flips each one to **Done** — including its sub-tasks (the cascade completes every PENDING/IN_PROGRESS child; a sub-task you did NOT finish must be set BLOCKED or CANCELLED before registering, so it survives visibly) — and keeps `beacon_context_for_feature` accurate for the next session.

Key each entry by its node `id`: the ids are handed back to you when the plan is approved (in the approval message / additionalContext), so you don't fuzzy-match titles or pay a disambiguation round-trip. If you don't have an id, `title` still works.

Register them all in that single batched call. If a plan added five features, that's ONE `beacon_feature({ action: "done" })` call with five entries — NOT five calls, and NOT just an umbrella ("Harden auth"), which leaves the individual features stuck on **Pending**.

If the feature added or materially changed a REAL architectural component (a subsystem — NOT a file), also pass `architecture: [{ title, domain, role, … }]` so the Architecture map stays accurate. It upserts curated components by title; never list files as components. If you found a bug or something worth investigating in a component's code, add `bugs: [{ note }]` to its architecture entry — it renders as a bug flag on the node (attributed to the agent); identical open flags are not duplicated. Only flag what you actually saw in the code.

Pull raw planning data anytime with `beacon_entities` (features / architecture / tables / endpoints).
<!-- beacon:workflow:end -->
