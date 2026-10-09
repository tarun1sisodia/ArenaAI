# ArenaAI Documentation Index

## Start here

- [Canonical Product Requirements](project/PRD.md)
- [Canonical Architecture](project/Architecture.md)
- [Canonical Engineering Rules](project/Rules.md)
- [Canonical Feature Phases](project/Phases.md)
- [Canonical Design System](project/Design.md)
- `Memory.md` is intentionally created only after implementation begins.
- [Detailed catalog lifecycle and adversarial test reference](CATALOG_PUBLISHING_RECOVERY_PLAN.md)
- [Agent context handoff](agent/00_CONTEXT_HANDOFF.md)
- [Agent runbook](agent/01_AGENT_RUNBOOK.md)
- [Admin/customer/backend operating specification](../ADMIN_CUSTOMER_BACKEND_AUDIT_AND_OPERATING_SPEC.md)

## Core rules kept at repository root

- [`SKILL.md`](../SKILL.md)
- [`AGENTS.md`](../AGENTS.md)
- [`BACKEND_RULES.md`](../BACKEND_RULES.md)
- [`FRONTEND_RULES.md`](../FRONTEND_RULES.md)

These remain at the root because tooling and agents may resolve them by conventional path.

## Project history and reference material

Historical plans, audits, migration notes, progress trackers, and app-specific references are in [`docs/project/`](project/). They are reference material unless the canonical documents explicitly point to them.

## Backend

Backend API, database, deployment, model, controller and migration documentation is in [`docs/backend/`](backend/).

## Admin

Admin API contracts, models, controllers, PRD and design documentation is in [`docs/admin/`](admin/).

## React/customer

Customer frontend documentation is in [`react/docs/`](../react/docs/). Component-local README files remain next to their source folders.

## Security and testing

Security audit materials remain in `.agents/skills/security-audit/` and `security-audit-run-1/`. TestSprite materials remain in `testsprite/`.
