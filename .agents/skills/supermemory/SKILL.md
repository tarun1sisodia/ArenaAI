---
name: supermemory
description: >-
  Persistent memory and long-term project context recall for SK Baghel Tour & Travels (ArenaAI).
  Use to query past architectural decisions, verify design locks and client pricing rules,
  and remember key milestones using Supermemory API / CLI with container tag 'sk_baghel_travels'.
---

# Supermemory Context Integration — SK Baghel Tour & Travels

Supermemory provides persistent memory across coding sessions for this project.
It prevents context loss across agent turns and long-term conversations.

## Container Tag & Scoping
- **Container Tag:** `sk_baghel_travels` (isolated from other spaces/projects).
- **Environment Variable:** `SUPERMEMORY_API_KEY` (loaded from `.env`).
- **Fast CLI Script:** `./scripts/supermemory.sh` (wraps credentials and tag automatically).

## Fast Operations via `./scripts/supermemory.sh`

### 1. Fast Semantic Recall
Before modifying sensitive components or when checking client pricing/rules:
```bash
./scripts/supermemory.sh search "<query>" [threshold=0.25]
```

### 2. Save Important Milestone or Rule
When a new phase is completed, or a critical user decision/rule is established:
```bash
./scripts/supermemory.sh remember "<Fact or Rule content>"
```

### 3. Ingest Context Documents into Graph
To sync project specs or audit findings into the vector graph:
```bash
./scripts/supermemory.sh add <path/to/file.md> "<Document Title>"
```

### 4. Fetch User/Project Profile
To view synthesized preferences and constraints:
```bash
./scripts/supermemory.sh profile
```

## Key Memory Domains (sk_baghel_travels)
1. **Commercial Fare Rules**: Sedan ₹10/km, Ertiga ₹14/km, Innova ₹18/km, Tempo ₹25/km, Urbania ₹34/km. 300 km/day outstation minimum. 28% advance deposit.
2. **Security Posture**: SEC-001 through SEC-010 resolved. Zero test auth backdoor, HMAC verified webhooks, timing-safe string comparison, server-derived route distances, PostgreSQL RLS on all 14 tables.
3. **Architecture & Topology**: Monorepo with React (`:5173`), Admin Desk (`:5174`), Fastify Backend (`:4000`). Verification enforced via `npm run verify` (typechecks, 55 Vitest tests, CSS audit, and 3x builds).
4. **Operations Desk**: Single Super Admin model, Supabase Auth REST verification, endpoints under `/api/v1/ops/admin/*`.

