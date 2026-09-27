from openai import AsyncOpenAI
from agents.config import GATEWAY_BASE_URL, GATEWAY_API_KEY, FAST_WORKER_MODEL
from agents.templates.task_template import AgentTaskTemplate, ROUTE_CATALOG_TEMPLATE_DEFAULTS

async def generate_route_or_package(
    route_details: str,
    context_slice: str = "",
    client: AsyncOpenAI = None,
) -> str:
    """Generates structured catalog data, stopovers, fares, and FAQ schema for a route or package."""
    if client is None:
        client = AsyncOpenAI(base_url=GATEWAY_BASE_URL, api_key=GATEWAY_API_KEY)

    template = AgentTaskTemplate(
        role=ROUTE_CATALOG_TEMPLATE_DEFAULTS["role"],
        domain=ROUTE_CATALOG_TEMPLATE_DEFAULTS["domain"],
        objective=ROUTE_CATALOG_TEMPLATE_DEFAULTS["objective"],
        rules=ROUTE_CATALOG_TEMPLATE_DEFAULTS["rules"],
        context_slice=context_slice,
        task_input=route_details,
        output_format=ROUTE_CATALOG_TEMPLATE_DEFAULTS["output_format"],
    )

    prompt = template.build_prompt()

    response = await client.chat.completions.create(
        model=FAST_WORKER_MODEL,
        messages=[
            {"role": "system", "content": "You are a specialized Route & Tour Catalog Data Engineer. Follow the provided template and rules strictly."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content
