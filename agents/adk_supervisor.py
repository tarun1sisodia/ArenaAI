import os
from typing import Optional
from pydantic import BaseModel, Field
from google.adk import Agent
from google.genai import types
from agents.config import GEMINI_API_KEY, SUPERVISOR_MODEL

# Ensure GEMINI_API_KEY is available in the environment for Google ADK
os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY

class ArenaAIDecomposedTasks(BaseModel):
    """The structured decomposition of an ArenaAI feature into micro-tasks."""
    feature_name: str = Field(description="Short title of the feature or route")
    target_subsystem: str = Field(description="Target subsystem: 'fullstack', 'backend', 'frontend', or 'catalog'")
    backend_task: Optional[str] = Field(default=None, description="Explicit instructions for the Fastify/Zod Backend specialist")
    frontend_task: Optional[str] = Field(default=None, description="Explicit instructions for the React 19 / TSX Frontend specialist")
    catalog_task: Optional[str] = Field(default=None, description="Explicit instructions for the 900+ Route / Tour Catalog specialist")
    test_task: Optional[str] = Field(default=None, description="Explicit instructions for the Vitest QA specialist")

SUPERVISOR_INSTRUCTION = """You are the Lead Software Architect for the SK Baghel Tour & Travels monorepo (ArenaAI).
Architecture context:
- Backend: Node.js, Fastify, TypeScript, PostgreSQL, Zod schemas, Vitest.
- Frontend: React 19, TypeScript, Vite, Tailwind v4, accessible editorial templates, 0 CLS.
- Catalog & Routes: 900+ outstation routes, tour packages, JSON-LD schema, stopover itineraries, Yamuna Expressway toll rules.

Your responsibility:
Given a user requirement, decompose it into isolated, atomic micro-tasks with STRICT token boundaries:
1. If it involves backend APIs/database: specify backend_task (Fastify routes + Zod schemas).
2. If it involves customer/admin UI: specify frontend_task (React 19 TSX components).
3. If it involves outstation routes/tours: specify catalog_task (route data, stopovers, FAQs, fares).
4. If it requires testing: specify test_task (Vitest test scenarios).

Keep each task description focused, concise, and bounded (under 150 words per task). Do not write implementation code; only write the exact specifications.
"""

def create_supervisor_agent() -> Agent:
    """Creates the Google ADK Supervisor Agent for ArenaAI."""
    return Agent(
        name="arena_ai_supervisor",
        model=SUPERVISOR_MODEL,
        instruction=SUPERVISOR_INSTRUCTION,
        output_schema=ArenaAIDecomposedTasks,
        generate_content_config=types.GenerateContentConfig(
            temperature=0.1,
            response_mime_type="application/json",
        ),
    )
