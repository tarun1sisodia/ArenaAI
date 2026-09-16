---
name: beacon-refresh
description: Re-survey the repo and update Beacon's architecture / schema / endpoints map after /beacon-init was already run — picks up new components, removed ones, schema changes, and new routes. Use when the user runs /beacon-refresh or asks to "refresh", "update", "re-sync", or "bring Beacon up to date" with the current code.
---

# Refresh Beacon's map (/beacon-refresh)

Beacon was already initialized in this repo (`/beacon-init` ran at some point). The codebase has moved since then — new modules, removed ones, schema changes, new routes. Your job is to re-survey the current code, show the user what changed, then persist the refreshed map.

## How it differs from /beacon-init

- **Init is a cold start** — no prior map, you survey everything fresh.
- **Refresh is incremental** — the map already exists. Read what's there first, then diff against the source so you can tell the user what actually changed. The user gets to see "+ 3 new components, − 1 removed, ~ 2 changed roles" instead of an opaque re-run.

## What gets preserved vs replaced

The `beacon_init_persist` tool **replaces only init-derived nodes** (`source=INIT`). A curated architecture node (created by `beacon_feature` action:done or by hand) whose title matches a component in your refreshed analysis is **merged in place** — your fresh `domain`/`role`/`plain`/`layer`/`files` land on it, but it keeps its source, position, status, and bug flags, and no duplicate INIT node is created. Curated nodes your analysis does NOT mention survive untouched, as do hand-edited tables, custom positions, notes, and draft feature plans. So you can re-run this freely.

The one caveat: if the user manually edited an INIT-source node on the canvas (e.g., renamed it, rewrote its role), that edit IS overwritten when you re-persist — and a renamed node no longer title-matches, so it survives as its own card. If the user mentions hand-curated INIT nodes, ask whether they want those carried into the new analysis verbatim.

## How to do it

1. **Read the current map.** Call `beacon_entities` with `{ kind: "architecture" }`, `{ kind: "roadmap" }`, `{ kind: "tables" }`, `{ kind: "endpoints" }`. This is what Beacon has now.
2. **Survey the source like init.** Same approach as `/beacon-init`: `LS` / `Glob` for top-level structure, read `README.md` and the manifest, sample 15–30 representative files. Focus on areas likely to have changed — diff your memory against what `beacon_entities` returned.
3. **Build the diff in your head.** For each entity kind:
   - **components**: which titles in the current map no longer match any cluster you'd produce? Which clusters you'd produce don't appear in the current map?
   - **tables**: any added / removed since? Any model files you can see that aren't in the snapshot?
   - **endpoints**: walk the route directories — any new routes, any deleted ones?
   - **roadmap**: usually stable, but a strategic theme can finish or new ones can emerge.
4. **Surface the diff to the user, briefly, BEFORE persisting.** Something like:
   - **+ added**: NEW_COMPONENT_1, NEW_COMPONENT_2 (with one-line reason each)
   - **− removed**: STALE_COMPONENT (file no longer exists)
   - **~ changed**: COMPONENT_X (role expanded to cover Y)
   - **schema**: + 2 new tables (TableA, TableB); + 3 new endpoints; − 1 deprecated endpoint
   No need to wait for confirmation — just show the diff so the user sees what's about to land.
5. **Call `beacon_init_persist`** ONCE with the refreshed full analysis (same shape as init: `components`, `roadmap`, `overview`, `conventions`, `snapshot`, `hasFrontend` — re-assert it, the stack may have changed; and `classificationRoots` if the Files-canvas grouping needs to change, e.g. a new top-level dir like `mobile/` — OMIT it to keep the existing roots, don't pass `[]` unless you mean to clear them). It replaces all init-source nodes and regenerates `AGENTS.md`. Bug flags already on a component survive the refresh (they're carried over by title); add `bugs: [{ note }]` for anything NEW you found worth investigating — identical open flags are not duplicated.

## What you should NOT do

- Don't ask "should I refresh?" — the user invoked /beacon-refresh, that's the answer.
- Don't preserve stale components for sentimental reasons. If the underlying files are gone or merged into another component, drop it from the new `components` list.
- Don't pad with file-level granularity. Refresh maintains the same ~15-component altitude as init.
- Don't fabricate changes. If the codebase hasn't materially moved since the last init, say so and persist the current state anyway (re-runs are cheap; it's fine).

If `beacon_entities` or `beacon_init_persist` isn't available, the Beacon panel isn't running in this repo. Tell the user to run `beacon` here first, then re-invoke /beacon-refresh.

After the tool returns, report the final counts plus a one-line summary of the diff you surfaced.
