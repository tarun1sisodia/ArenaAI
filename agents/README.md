# Google ADK + FreeLLMAPI Multi-Agent Workflow Prototype

This prototype demonstrates how to use **Google Agent Development Kit (ADK)** alongside our **FreeLLMAPI Gateway** to run fast, parallel, task-decomposed workflows without context overload or rate limits.

---

## 🏗️ Architecture

```
                       ┌───────────────────────────────┐
                       │   Developer Requirement       │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │   Google ADK Supervisor       │
                       │   (Gemini 2.5 Flash)          │
                       │   - Decomposes into 3 tasks   │
                       └───────────────┬───────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
        ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
        │ Schema Agent │       │Service Agent │       │  Test Agent  │
        │  (Pydantic)  │       │(FastAPI Core)│       │   (Pytest)   │
        └───────┬──────┘       └───────┬──────┘       └───────┬──────┘
                │                      │                      │
                └──────────────────────┼──────────────────────┘
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

1. **Never send the whole repository**: Free and fast models perform best on bounded, atomic tasks (500–2,000 tokens).
2. **One responsibility per agent**:
   - `schema_agent`: Pydantic V2 models, types, and field validations.
   - `service_agent`: Core business logic functions, pure transformations, error handling.
   - `test_agent`: Pytest unit tests, boundary conditions, mock fixtures.
3. **Execute in Parallel**: All 3 agents execute concurrently via `asyncio.gather()`. FreeLLMAPI distributes the calls across your active provider keys (Groq, Cerebras, Google, Mistral, OpenRouter) so no single provider hits rate limits.

---

## 🚀 How to Run the Prototype

From the workspace root:

```bash
# Run with default example task (Discount calculation)
/home/bot/Internship/av-suite/backend/.venv/bin/python3 -m agents.run_workflow

# Or run with your own custom requirement:
/home/bot/Internship/av-suite/backend/.venv/bin/python3 -m agents.run_workflow "Add appointment cancellation policy with 24-hour window and refund processing"
```

---

## 📁 Directory Structure

- `agents/config.py`: Environment configuration for Google ADK and FreeLLMAPI gateway.
- `agents/adk_supervisor.py`: Google ADK supervisor agent responsible for task decomposition.
- `agents/specialists/schema_agent.py`: Specialist agent for Pydantic V2 models.
- `agents/specialists/service_agent.py`: Specialist agent for FastAPI business logic.
- `agents/specialists/test_agent.py`: Specialist agent for Pytest unit tests.
- `agents/run_workflow.py`: End-to-end parallel execution script.
