# agents/templates/task_template.py
from typing import List, Optional
from pydantic import BaseModel, Field

class AgentTaskTemplate(BaseModel):
    role: str = Field(description="Role and persona of the specialist agent")
    domain: str = Field(description="Subsystem/domain name")
    objective: str = Field(description="Single clear sentence on the goal")
    rules: List[str] = Field(description="Hard technical constraints and conventions")
    context_slice: Optional[str] = Field(default=None, description="Strictly bounded code context")
    task_input: str = Field(description="The specific atomic requirement")
    output_format: str = Field(description="Exact format specification")
    code_language: str = Field(default="python", description="Language for markdown blocks (python, typescript, tsx, json)")

    def build_system_prompt(self) -> str:
        sections = [
            f"You are a {self.role} specializing in {self.domain}.",
            f"### OBJECTIVE:\n{self.objective}\n",
            "### STRICT RULES & CONSTRAINTS:",
        ]
        for rule in self.rules:
            sections.append(f"- {rule}")
        sections.append(f"\n### REQUIRED OUTPUT FORMAT:\n{self.output_format}")
        return "\n".join(sections)

    def build_user_prompt(self) -> str:
        sections = []
        if self.context_slice and self.context_slice.strip():
            # DYNAMIC MARKDOWN BLOCK
            sections.append(f"### STRICT CONTEXT SLICE:\n```{self.code_language}\n{self.context_slice.strip()}\n```")
        sections.append(f"\n### TASK INPUT:\n{self.task_input}")
        return "\n".join(sections)

# ─── PRE-BUILT TEMPLATES ───────────────────────────────────────────────────────

PYTHON_BACKEND_TEMPLATE_DEFAULTS = {
    "role": "FastAPI Backend & Pydantic Schema Specialist",
    "domain": "Python FastAPI + SQLModel/Pydantic V2",
    "objective": "Implement robust, type-safe API route handlers, Pydantic schemas, and async service functions.",
    "rules": [
        "Use Pydantic V2 for all request body, query, and parameter validations.",
        "Use async/await for all database and I/O operations.",
        "Return structured HTTP responses via standard FastAPI JSONResponse.",
        "Output ONLY python code inside ```python ...``` blocks with zero conversational chatter."
    ],
    "output_format": "Pure Python code with types, Pydantic schemas, and FastAPI route handlers.",
    "code_language": "python"
}

BACKEND_TEMPLATE_DEFAULTS = {
    "role": "Fastify Backend & Zod Schema Specialist",
    "domain": "Node.js Fastify + TypeScript Backend",
    "objective": "Implement robust, type-safe API route handlers, Zod schemas, and service functions.",
    "rules": [
        "Follow BACKEND_RULES.md: snake_case for PostgreSQL DB, camelCase for TypeScript/API domain.",
        "Use Zod for all request body, query, and parameter validations.",
        "Return structured HTTP responses via sendSuccess(reply, data) or throw standard Errors.*.",
        "Output ONLY TypeScript code inside ```typescript ...``` blocks with zero conversational chatter."
    ],
    "output_format": "Output pure TypeScript code with types, Zod schemas, and Fastify route/service handler.",
    "code_language": "typescript"
}

FRONTEND_TEMPLATE_DEFAULTS = {
    "role": "React 19, Design Taste & Anti-Slop UI Specialist",
    "domain": "SK Baghel Tour & Travels (Astro/React Islands)",
    "objective": "Build distinct, high-taste, accessible React 19 UI components with zero AI-slop tells.",
    "rules": [
        "Brand Identity: Evoke luxury Agra heritage travel — Mughal architecture, warm sandstone, refined elegance.",
        "Design Tokens: Use semantic tokens (terracotta, sandstone wash, ink midnight). Never hardcode random hex codes.",
        "Anti-Slop Discipline: NO AI-purple/teal gradients, NO generic 3-column icon-boxes, NO glassmorphism everywhere.",
        "Core Web Vitals: Exactly ONE semantic <h1> per page. Zero layout shifts (CLS=0.00).",
        "Output ONLY clean React 19 TypeScript (TSX) component code inside ```tsx ...``` blocks."
    ],
    "output_format": "Production-grade, accessible React 19 TSX component code.",
    "code_language": "tsx"
}

TEST_TEMPLATE_DEFAULTS = {
    "role": "QA & Pytest/Vitest Automation Specialist",
    "domain": "Automated Testing",
    "objective": "Generate comprehensive integration and unit tests.",
    "rules": [
        "Test happy path, client error handling (400 validation), and 404s.",
        "Mock external services (WhatsApp, SMS, Payment Gateways) to keep tests deterministic.",
        "Output ONLY test code inside ```python or ```typescript blocks."
    ],
    "output_format": "Production-ready test suite code.",
    "code_language": "python" # Can be overridden dynamically
}

ROUTE_CATALOG_TEMPLATE_DEFAULTS = {
    "role": "Travel Copywriter & SEO Specialist",
    "domain": "900+ Outstation Routes & Tour Packages (SEO/AEO/GEO)",
    "objective": "Generate rich, engaging, and highly specific markdown itineraries and JSON-LD schema for outstation routes.",
    "rules": [
        "Mention specific highways (e.g., Yamuna Expressway, NH44) and logical stopovers.",
        "Include 3 unique FAQs relevant to the specific route for Answer Engine Optimization (AEO).",
        "DO NOT use generic AI fluff like 'embark on a seamless journey'. Use editorial, heritage-focused language.",
        "Output ONLY valid Markdown or JSON."
    ],
    "output_format": "Pure Markdown or JSON-LD structured data.",
    "code_language": "json"
}
