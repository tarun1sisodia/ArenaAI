from openai import AsyncOpenAI
from agents.config import GATEWAY_BASE_URL, GATEWAY_API_KEY, FAST_WORKER_MODEL
from agents.templates.task_template import AgentTaskTemplate, BACKEND_TEMPLATE_DEFAULTS

async def generate_backend_module(
    task_description: str,
    context_slice: str = "",
    client: AsyncOpenAI = None,
) -> str:
    """Generates Fastify routes, Zod schemas, and services following BACKEND_RULES.md."""
    if client is None:
        client = AsyncOpenAI(base_url=GATEWAY_BASE_URL, api_key=GATEWAY_API_KEY)

    template = AgentTaskTemplate(
        role=BACKEND_TEMPLATE_DEFAULTS["role"],
        domain=BACKEND_TEMPLATE_DEFAULTS["domain"],
        objective=BACKEND_TEMPLATE_DEFAULTS["objective"],
        rules=BACKEND_TEMPLATE_DEFAULTS["rules"],
        context_slice=context_slice,
        task_input=task_description,
        output_format=BACKEND_TEMPLATE_DEFAULTS["output_format"],
    )

    prompt = template.build_prompt()

    response = await client.chat.completions.create(
        model=FAST_WORKER_MODEL,
        messages=[
            {"role": "system", "content": "You are a Node.js Fastify and TypeScript Backend Specialist. Follow the provided template strictly."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content
