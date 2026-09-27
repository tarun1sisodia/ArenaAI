from openai import AsyncOpenAI
from agents.config import GATEWAY_BASE_URL, GATEWAY_API_KEY, FAST_WORKER_MODEL
from agents.templates.task_template import AgentTaskTemplate, TEST_TEMPLATE_DEFAULTS

async def generate_unit_tests(
    task_description: str,
    code_context: str = "",
    client: AsyncOpenAI = None,
) -> str:
    """Generates Vitest / Jest unit and integration tests using task templates."""
    if client is None:
        client = AsyncOpenAI(base_url=GATEWAY_BASE_URL, api_key=GATEWAY_API_KEY)

    template = AgentTaskTemplate(
        role=TEST_TEMPLATE_DEFAULTS["role"],
        domain=TEST_TEMPLATE_DEFAULTS["domain"],
        objective=TEST_TEMPLATE_DEFAULTS["objective"],
        rules=TEST_TEMPLATE_DEFAULTS["rules"],
        context_slice=code_context,
        task_input=task_description,
        output_format=TEST_TEMPLATE_DEFAULTS["output_format"],
    )

    prompt = template.build_prompt()

    response = await client.chat.completions.create(
        model=FAST_WORKER_MODEL,
        messages=[
            {"role": "system", "content": "You are a Specialist QA Automation Engineer. Follow the provided template strictly."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content
