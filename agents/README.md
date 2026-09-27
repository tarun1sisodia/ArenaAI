# Google ADK + FreeLLMAPI Multi-Agent Workflow for ArenaAI

This multi-agent pipeline demonstrates how to use **Google Agent Development Kit (ADK)** alongside our **FreeLLMAPI Gateway** to run fast, parallel, task-decomposed workflows for the **SK Baghel Tour & Travels (ArenaAI)** monorepo without context overload or rate limits.

---

## 🏗️ Architecture

```
                       ┌───────────────────────────────┐
                       │   Developer / User Request    │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │    Google ADK Supervisor      │
                       │   (Gemini 2.5 Flash / ADK)    │
                       │   - Decomposes into 4 tasks   │
                       └───────────────┬───────────────┘
                                       │
            ┌──────────────────┬───────┴──────────┬──────────────────┐
            ▼                  ▼                  ▼                  ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │Backend Agent │   │Frontend Agent│   │Catalog Agent │   │  Test Agent  │
    │(Fastify/Zod) │   │ (React 19)   │   │ (900+ Routes)│   │   (Vitest)   │
    └───────┬──────┘   └───────┬──────┘   └───────┬──────┘   └───────┬──────┘
            │                  │                  │                  │
            └──────────────────┴───────┬──────────┴──────────────────┘
                                       ▼
                       ┌───────────────────────────────┐
                       │     FreeLLMAPI Gateway        │
                       │    http://localhost:3001/v1   │
                       └───────────────┬───────────────┘
                                       │
                ┌──────────────┬───────┴──────┬──────────────┐
                ▼              ▼              ▼              ▼
             Groq          Cerebras        Mistral      OpenRouter
```

---

## ⚡ Key Rules for Parallel Prompting

1. **Never send the whole repository**: High-throughput models perform best on bounded, atomic tasks (500–2,000 tokens).
2. **One responsibility per specialist agent**:
   - `backend_agent`: Fastify routes, PostgreSQL queries, Zod input/output schemas, and error handling.
   - `frontend_agent`: React 19 + TypeScript components, responsive Tailwind CSS layouts, and accessibility standards.
   - `catalog_agent`: 900+ outstation route structures, corridor classifications, distance/fare cards, and stopover FAQs.
   - `test_agent`: Vitest test suites, boundary conditions, edge cases, and mocked fixtures.
3. **Execute in Parallel**: All active specialists execute concurrently via `asyncio.gather()`. FreeLLMAPI distributes the calls across your active provider keys (Groq, Cerebras, Google, Mistral, OpenRouter) so no single provider hits rate limits.

---

## 🚀 How to Run the Workflow

From the workspace root (`/home/bot/Internship/ArenaAI`):

```bash
# 1. Start FreeLLMAPI Gateway (if not already running)
npm run start --prefix freellmapi

# 2. Run with default sample task (Agra to Haridwar Route)
python3 -m agents.run_workflow

# 3. Or pass your own custom requirement:
python3 -m agents.run_workflow "Create a tour package for Same Day Mathura Vrindavan with timings, car rates, and FAQ schema"
```

---

## 📁 Directory Structure

- `agents/config.py`: Environment configuration for Google ADK and FreeLLMAPI gateway.
- `agents/adk_supervisor.py`: Google ADK supervisor agent responsible for task decomposition into micro-tasks.
- `agents/specialists/backend_agent.py`: Specialist agent for Fastify APIs, Zod schemas, and database queries.
- `agents/specialists/frontend_agent.py`: Specialist agent for React 19 UI components and Tailwind styling.
- `agents/specialists/catalog_agent.py`: Specialist agent for 900+ routes, tour packages, and pricing rules.
- `agents/specialists/test_agent.py`: Specialist agent for Vitest unit and integration test suites.
- `agents/run_workflow.py`: End-to-end parallel execution orchestrator script.
