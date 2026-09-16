---
name: beacon-plan
description: Present your current plan or approach to the user on Beacon's /plan canvas for review — instead of asking for approval in prose. Use when the user says "present the plan", "show me the plan", "let me see it / the plan", or whenever you are about to end a turn asking whether to proceed with a plan, design, or approach.
---

# Present a plan on Beacon (/beacon-plan)

Beacon reviews plans on a canvas at /plan — never as a wall of text in the terminal. So do NOT
end a turn with "here's my plan… should I proceed?" in prose. Present it through Beacon and let the
tool BLOCK until the user decides.

## How to present

Call the **`beacon_present_plan`** MCP tool with your plan as markdown:

- `description`: a one-line summary shown in the review header.
- `markdown`: the full plan as markdown (headings, lists, code).
- If the plan proposes DB tables / relations / endpoints or roadmap features, embed ONE fenced
  ```beacon JSON block in the markdown — the same shapes `beacon_propose_plan` accepts:

```beacon
{ "tables": [...], "relations": [...], "endpoints": [...], "features": [...] }
```

Beacon extracts that block deterministically, strips it from the prose, and renders an editable
board on /plan. The board is built ONLY from the block — prose is never parsed — so mirror EVERY
table/endpoint/feature you mention in the prose into the block, or that board will be empty.

- **Declare your scope.** List the repo-relative files this plan will touch in a top-level
  `"contract"` array in the block (or the `contract` arg of `beacon_propose_plan`). Those files are
  frozen at approval and you're held to them while implementing — editing an undeclared file pauses
  for the user's authorization (which then adds it to the contract), and the /plan Changes view
  groups your edits On-plan vs Strayed against them. Declare the files you genuinely expect to edit
  (if omitted, the scope is inferred from the files you name in backticks).

`beacon_present_plan` opens /plan and BLOCKS until the user clicks Approve / Discard / submits
feedback, then returns their verdict. Implement code or migrations ONLY after it returns approval.
If it returns feedback, revise and call it again.

## Which tool

- **Pure schema/feature plan** (tables + endpoints + roadmap features, little prose) → you may use
  `beacon_propose_plan` with the structured fields instead; it's the same review loop.
- **Anything else** (a code-change plan, a mixed plan, a "how should I approach X") → use
  `beacon_present_plan` with markdown so the full reasoning shows on /plan.

If `beacon_present_plan` isn't available, the panel isn't wired here — fall back to ExitPlanMode
with the same ```beacon block (Claude Code only; Codex has no ExitPlanMode), or tell the user to
run `beacon` in this repo once.
