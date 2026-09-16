---
name: beacon-explain
description: Teach the user part of THIS codebase as an interactive visual lesson on Beacon's /learn page — a concept map + plain-English narrative they can question — instead of a wall of text. Use when the user says "explain", "teach me", "walk me through", "how does X work", or "help me understand the Y category".
---

# Explain the codebase visually (/beacon-explain)

When the user wants to UNDERSTAND part of the code (not build something), don't dump prose in the
terminal and don't open a plan — plans are for building. Author an interactive **Lesson** and push it
with the `beacon_explain` MCP tool: a curated concept map (boxes + labeled arrows) beside a
plain-English narrative on Beacon's /learn page. The tool BLOCKS while the user reads, highlights text
to ask questions, and drops question notes; it returns their questions, you ANSWER and re-push, looping
until they Save the lesson. There is NO approve/discard — understanding, not building.

## 1. Load context first — don't explain blind

Before writing, call `beacon_context_for_feature` / `beacon_map` and read the relevant files so the
lesson is accurate. Name real files, functions, tables, and endpoints — never vague descriptions.

## 2. Write like a great teacher — the house style (this is the whole point)

Every lesson must read like a patient senior engineer explaining to a sharp newcomer:

- **Plain English, always.** Define any term the first time it appears. No unexplained jargon, no
  wall of nouns.
- **Problem-first.** Open each component with the PROBLEM it solves — a concrete human scenario, the
  tension that forced the design, then the decision and what it means. (e.g. "When a salesperson
  confirms an order it must also land in the ERP — but the ERP can be slow or down, and you do *not*
  want confirmation to hang. So the sync is *decoupled*: confirming succeeds immediately and the push
  happens in the background, with retries.")
- **Concrete step-by-step flow.** Walk the real path as a numbered list. Each step is ONE clear
  action and names the real identifier in backticks — file (`order-placed-sync-erp.ts`), function
  (`syncOrderToErpWorkflow`), event (`order.placed`), column (`erp_sync_record`), value
  (`requires_human_action`). Enumerate the cases (success / retryable / rejected / …) with the plain
  meaning of each.
- **Anticipate-and-answer "Why X?".** After the flow, add short sections that answer the confusions a
  reader will actually have ("Why two status columns?", "Why is the ledger append-only?"). ALWAYS
  explain why the alternative is worse ("claiming success could hide a real failure; claiming hard
  failure could cause a duplicate order later").
- **A worked example with real data.** Show the mechanism running on one concrete case — ideally a
  small markdown table of state transitions — and land the insight ("that's 8 rows for one order, and
  that's the point").
- **Typographic discipline.** **Bold** the decisions, *italic* the concepts being introduced, and put
  `inline code` around every real identifier — on /learn, backticked real file paths become clickable
  to open in the user's editor.

## 3. Map the prose to the board

Every component/flow you NAME in the narrative becomes a `node` (title + a one-line `summary` for its
face + a fuller `detail` + the real `files` it maps to). Every "A does X to B" becomes an `edge` with
a relationship VERB — one of: imports, calls, persists to, reads from, writes to, routes to, depends
on, emits, returns, contains, extends — never a bare line. Keep the resting set small (~4–7 nodes);
push depth into `detail`, not the node face. Supply `steps` for the guided walkthrough: the first step
is the overview (empty `focusIds`), then teach one node (or a few) per step in order, each with its
`focusIds`.

When the topic involves DATABASE tables, pass them in `tables` (they render as annotated schema cards
on the SAME board, not just raw schemas). For each table give a one-line `note` (why it exists), mark
the key columns `isPk`, point FKs at another table with `fkTo: "<that table's id>"`, give EVERY column a
short plain-English `note`, and add a `sample` row or two (the worked example, made concrete). Connect a
concept to its table with an `edge` (e.g. `persists to` / `reads from`) whose `toId` is the table's id —
so the learner sees the table IN CONTEXT, wired to the code that uses it.

## 4. Answer in the loop — don't stop after one round

`beacon_explain` returns the user's questions, each tagged `[q:ID]`. Answer EACH by calling
`beacon_explain` AGAIN with the SAME lesson plus `answers: [{ questionId, answer }]` (keyed by the id).
Every answer must ADD understanding (rationale, trade-off) — never just restate the question. Expand
the narrative or add nodes where it helps. Keep looping until the tool reports the user saved or closed
the lesson.
