"""
Standardized Task & Context Template System for Multi-Agent Workflows.

Prevents context window overload and token waste by enforcing:
1. Strict token budgeting (bounded, atomic context slices only).
2. Explicit output format contract (no conversational preamble or fluff).
3. Standardized role, constraints, and inputs per specialist agent.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class AgentTaskTemplate(BaseModel):
    """Structured contract passed to a specialist LLM worker."""
    role: str = Field(description="Role and persona of the specialist agent")
    domain: str = Field(description="Subsystem/domain name (e.g. Backend Fastify, React UI, Route Catalog, Vitest)")
    objective: str = Field(description="Single clear sentence on the goal")
    rules: List[str] = Field(description="Hard technical constraints and conventions to enforce")
    context_slice: Optional[str] = Field(default=None, description="Strictly bounded, relevant code types/schemas only")
    task_input: str = Field(description="The specific atomic requirement")
    output_format: str = Field(description="Exact format specification (e.g. code block only, JSON only)")

    def build_prompt(self) -> str:
        """Renders the template into a clean, token-efficient system/user prompt."""
        sections = [
            f"### ROLE: {self.role} ({self.domain})",
            f"### OBJECTIVE:\n{self.objective}\n",
            "### RULES & CONSTRAINTS:",
        ]
        for rule in self.rules:
            sections.append(f"- {rule}")

        if self.context_slice and self.context_slice.strip():
            sections.append(f"\n### STRICT CONTEXT SLICE:\n```typescript\n{self.context_slice.strip()}\n```")

        sections.append(f"\n### TASK INPUT:\n{self.task_input}")
        sections.append(f"\n### REQUIRED OUTPUT FORMAT:\n{self.output_format}")

        return "\n".join(sections)


# ── PRE-BUILT TEMPLATES FOR ARENA AI (SK BAGHEL MONOREPO) ─────────────────

BACKEND_TEMPLATE_DEFAULTS = {
    "role": "Fastify Backend & Zod Schema Specialist",
    "domain": "Node.js Fastify + TypeScript Backend",
    "objective": "Implement robust, type-safe API route handlers, Zod schemas, and service functions.",
    "rules": [
        "Follow BACKEND_RULES.md: snake_case for PostgreSQL DB, camelCase for TypeScript/API domain.",
        "Use Zod for all request body, query, and parameter validations.",
        "Return structured HTTP responses via sendSuccess(reply, data) or throw standard Errors.*.",
        "Idempotency-safe: mutating routes must accept idempotencyKey where appropriate.",
        "Output ONLY TypeScript code inside ```typescript ... ``` blocks with zero conversational chatter.",
    ],
    "output_format": "Output pure TypeScript code with types, Zod schemas, and Fastify route/service handler.",
}

FRONTEND_TEMPLATE_DEFAULTS = {
    "role": "React 19, Design Taste & Anti-Slop UI Specialist",
    "domain": "SK Baghel Tour & Travels (react/ & admin/)",
    "objective": "Build distinct, high-taste, accessible React 19 UI components with zero AI-slop tells.",
    "rules": [
        "Brand Identity: Evoke luxury Agra heritage travel — Mughal architecture, warm sandstone, refined elegance (NOT a generic SaaS cab app).",
        "Design Tokens (theme.css): EB Garamond for headlines, Plus Jakarta Sans for UI/body text. Use semantic tokens: terracotta (#9F3C16), sandstone wash (#F5EBE1), ink midnight (#0F131A), ivory surface (#FDF8F5), gold accent (#D99A3E). Never hardcode random hex codes.",
        "Anti-Slop Discipline (taste-skill): NO AI-purple/teal gradients, NO generic 3-column icon-boxes, NO fake 01/02/03 numbered markers on non-sequential items, NO glassmorphism on every section, NO generic fade-and-slide-up on every element.",
        "Deliberate Motion: Use motion sparingly and purposefully (useReducedMotion() and GPU transforms: opacity, translate3d). Never delay content readability or FCP.",
        "Core Web Vitals & SEO: Exactly ONE semantic <h1> per page. Zero layout shifts (CLS=0.00). Crawlable <a href='...'> links instead of div click-handlers.",
        "Editorial Copy: Headlines name the specific landmark/route. Avoid hollow buzzwords like 'seamlessly'.",
        "Check DESIGN_LOCKS.md: Never restyle or break locked components without explicit confirmation.",
        "Output ONLY clean React 19 TypeScript (TSX) component code inside ```tsx ... ``` blocks with zero conversational chatter.",
    ],
    "output_format": "Output production-grade, accessible React 19 TSX component code adhering to taste-skill and design tokens.",
}

ROUTE_CATALOG_TEMPLATE_DEFAULTS = {
    "role": "Route & Tour Package Catalog Specialist",
    "domain": "900+ Outstation Routes & Tour Packages (SEO/AEO/GEO)",
    "objective": "Generate complete, structured metadata, stopover itineraries, pricing rules, and JSON-LD schema for outstation routes or tours.",
    "rules": [
        "Include exact distance (km), estimated drive time, highway name, and key stopovers/rest areas.",
        "Include departure recommendations and Yamuna / Taj Expressway toll policies.",
        "Generate 3-4 factual route FAQs for AEO / Answer Engine search extraction.",
        "Include Schema.org TaxiService / TouristTrip structured JSON-LD format.",
        "Output ONLY JSON or TypeScript catalog item inside code blocks with zero conversational chatter.",
    ],
    "output_format": "Output structured JSON matching the CatalogItemRecord / Route interface.",
}

TEST_TEMPLATE_DEFAULTS = {
    "role": "QA & Vitest Automation Specialist",
    "domain": "Automated Testing (backend/tests)",
    "objective": "Generate comprehensive Vitest integration and unit tests.",
    "rules": [
        "Use vitest (describe, it, expect) and app.inject() for Fastify route tests.",
        "Test happy path (200/201), client error handling (400 Zod validation), auth guards (401/403), and 404s.",
        "Mock external services (Razorpay, WhatsApp, SMS) to keep tests fast and deterministic.",
        "Output ONLY TypeScript test code inside ```typescript ... ``` blocks with zero conversational chatter.",
    ],
    "output_format": "Output production-ready Vitest test suite code.",
}
