---
name: beacon-init
description: Read this repository and map its architecture, schema, and roadmap into Beacon (the local visual planning panel). Use when the user runs /beacon-init, asks to "set up Beacon for this repo", or asks to initialize/bootstrap Beacon's map of this codebase.
---

# Map this repo into Beacon (/beacon-init)

The user already has Beacon running. You're going to map this repository's architecture into it — what used to be `beacon init`. **You** do the analysis (your session already has the codebase context); Beacon just persists what you send.

## What you produce

A single `beacon_init_persist` MCP tool call with:

- **hasFrontend**: `true` or `false` — does this repo have a frontend surface (UI code)? You just read the repo, so you know. Set it explicitly; it gates the frontend/backend `layer` distinction on the boards (a pure-backend repo never shows it).
- **classificationRoots** (optional): the top-level directories whose immediate children are the meaningful groups on the Files canvas — e.g. `["frontend", "backend/app"]`. The canvas groups files ONE level below each root (so `frontend` → `frontend/components`, `frontend/app`, …). Pick the dir sitting directly ABOVE the real package dirs — use `frontend/src` if there's a `src/` wrapper. List both sides of a monorepo so neither collapses into one flat blob. Not every dir — just where grouping should START. Omit it for a simple single-root repo; the canvas falls back to automatic grouping.
- **components**: 8–25 main building blocks of this codebase. NOT every file. Group them by `domain` (short UPPERCASE: AUTH, API, DATA, UI, JOBS, INFRA, BILLING, SEARCH, …). For each: a one-line technical `role`, a one-sentence plain-language `plain`, the few `files` that implement it (repo-relative), `depends` listing other component titles it relies on — and, when `hasFrontend` is true, `layer` (`"frontend" | "backend" | "fullstack"`). Use the dependency graph you can see in the source — files that import each other heavily usually belong together. If you spot a bug or something worth investigating while reading a component's code, add `bugs: [{ note }]` to that component — it renders as a bug flag on the node (attributed to the agent). Only flag what you actually saw in the code; don't speculate.
- **roadmap**: 3–6 BROAD strategic directions. Big-picture themes only — "Harden auth & security", "Add observability", "Scale the data layer", "Pay down test-coverage debt". NOT detailed tasks. NOT file-level. Each gets a short title and one-line `why`. If one of them is a concrete BUG to fix (something broken you saw in the code), add `kind: "BUG"` so it renders as a typed bug card. When `hasFrontend` is true, give each a `layer` too (`"frontend" | "backend" | "fullstack"`).
- **overview**: one paragraph describing what this project is and its stack. This lands in AGENTS.md as the project intro.
- **conventions**: 3–8 concrete rules a contributor MUST follow — build/test commands, where code goes, patterns, things easy to get wrong. Infer from actual files, not assumptions.
- **snapshot** (optional but encouraged): `{ tables, relations, endpoints }` for the existing database. If the project uses Prisma, read `prisma/schema.prisma`. If SQLAlchemy, read the model files. If Django, read `models.py`. If you find no obvious schema source, skip the snapshot — don't fabricate.

## How to do it

1. **Survey**. Use `LS` / `Glob` to see the top-level structure. Read `README.md` and the manifest (`package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` / `pom.xml`).
2. **Sample the source.** Read 15–30 representative files — one per cluster you can identify. Don't read everything; pick by name (route files, model files, main entrypoints, key services). The goal is to identify boundaries, not memorize every line.
3. **Identify the schema** if any. `prisma/schema.prisma` → translate each model into a `tables` entry. `alembic`/SQLAlchemy → read the latest models. Django → read `models.py`. Skip the snapshot if the source-of-truth isn't obvious.
4. **Identify endpoints** if any. Look for routes — Next.js `app/api/*` files, FastAPI `@router.*` / `@app.*`, Express `app.get`/etc. For each endpoint try to fill `uses: [{ table, access }]` so the canvas can draw which endpoint touches which table.
5. **Call `beacon_init_persist`** ONCE with the whole analysis. It replaces any prior init-derived map (idempotent) and regenerates `AGENTS.md`.

## What you should NOT do

- Don't propose detailed tasks in `roadmap` — that's what `beacon_propose_plan` is for. Init roadmap is strategic only.
- Don't list every file as a `component`. Aim for ~15. If you have 40, you're listing files, not components.
- Don't fabricate tables/endpoints. If you can't find the schema source, omit `snapshot`.
- Don't ask the user to confirm before persisting. The user invoked /beacon-init — that's the confirmation.

## If `beacon_init_persist` is NOT in your tools (or the call can't reach the daemon)

That happens when this repo was never opened with `beacon`: there's no `.mcp.json`, so the Beacon MCP server isn't in this session — and MCP tools can't be added mid-session. (It also covers a wired repo whose daemon is down, so the tool call errors.) **Do NOT stop and tell the user to run `beacon` first.** /beacon-init bootstraps itself: write the EXACT analysis object you'd have passed to `beacon_init_persist` to a temp JSON file, then persist it through the CLI:

```bash
beacon init-persist /tmp/beacon-init.json   # or: beacon init-persist < /tmp/beacon-init.json
```

That one command wires the repo (writes `.mcp.json` + skills so your NEXT session gets the `beacon_*` tools natively, heals the global install), starts the Beacon daemon if it isn't running, registers + provisions this workspace, and POSTs your analysis to the same `/api/init` endpoint the MCP tool uses — so init completes in THIS session. Read the counts it prints and report them.

After the tool (or `beacon init-persist`) returns, tell the user the counts (components / roadmap / tables / endpoints) and point them at the running Beacon panel.
