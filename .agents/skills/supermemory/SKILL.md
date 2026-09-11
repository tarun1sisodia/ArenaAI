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

## Common Operations

### 1. Recall / Search Memories
Before modifying sensitive components or when checking client pricing/rules:
```bash
SUPERMEMORY_API_KEY="$(grep SUPERMEMORY_API_KEY .env | cut -d= -f2)" \
npx -y supermemory search --tag sk_baghel_travels "<query>" --threshold 0.3 --json
```

### 2. Save Important Milestone or Rule
When a new phase is completed, or a critical user decision/rule is established:
```bash
SUPERMEMORY_API_KEY="$(grep SUPERMEMORY_API_KEY .env | cut -d= -f2)" \
npx -y supermemory remember --tag sk_baghel_travels --static "<Fact or Rule content>" --json
```

### 3. Ingest a Context Document
To sync a project spec into the vector graph:
```bash
SUPERMEMORY_API_KEY="$(grep SUPERMEMORY_API_KEY .env | cut -d= -f2)" \
npx -y supermemory add --tag sk_baghel_travels <path/to/file.md> --title "<Document Title>"
```

### 4. Fetch User/Project Profile
To view synthesized preferences and constraints:
```bash
SUPERMEMORY_API_KEY="$(grep SUPERMEMORY_API_KEY .env | cut -d= -f2)" \
npx -y supermemory profile --tag sk_baghel_travels --json
```
