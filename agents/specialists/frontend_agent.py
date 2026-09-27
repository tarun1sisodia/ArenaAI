from openai import AsyncOpenAI
from agents.config import GATEWAY_BASE_URL, GATEWAY_API_KEY, FAST_WORKER_MODEL
from agents.templates.task_template import AgentTaskTemplate, FRONTEND_TEMPLATE_DEFAULTS

async def generate_frontend_component(
    task_description: str,
    context_slice: str = "",
    client: AsyncOpenAI = None,
) -> str:
    """Generates React 19 UI components conforming to FRONTEND_RULES.md."""
    if client is None:
        client = AsyncOpenAI(base_url=GATEWAY_BASE_URL, api_key=GATEWAY_API_KEY)

    template = AgentTaskTemplate(
        role=FRONTEND_TEMPLATE_DEFAULTS["role"],
        domain=FRONTEND_TEMPLATE_DEFAULTS["domain"],
        objective=FRONTEND_TEMPLATE_DEFAULTS["objective"],
        rules=FRONTEND_TEMPLATE_DEFAULTS["rules"],
        context_slice=context_slice,
        task_input=task_description,
        output_format=FRONTEND_TEMPLATE_DEFAULTS["output_format"],
    )

    prompt = template.build_prompt()

    response = await client.chat.completions.create(
        model=FAST_WORKER_MODEL,
        messages=[
            {"role": "system", "content": "You are a React 19, Design Taste & Anti-Slop UI Specialist for SK Baghel Tour & Travels. Follow design-taste-frontend, frontend-design, and FRONTEND_RULES.md strictly."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content
