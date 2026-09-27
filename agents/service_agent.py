# agents/service_agent.py
import asyncio
from openai import AsyncOpenAI, APIError, RateLimitError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from agents.config import GATEWAY_BASE_URL, GATEWAY_API_KEY, FAST_WORKER_MODEL
from agents.templates.task_template import AgentTaskTemplate, PYTHON_BACKEND_TEMPLATE_DEFAULTS
from agents.utils.code_extractor import extract_code_block

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((RateLimitError, APIError, asyncio.TimeoutError))
)
async def generate_service_logic(task_description: str, schema_context: str = "", client: AsyncOpenAI = None) -> str:
    if client is None:
        client = AsyncOpenAI(base_url=GATEWAY_BASE_URL, api_key=GATEWAY_API_KEY, timeout=30.0)
        
    template = AgentTaskTemplate(
        **PYTHON_BACKEND_TEMPLATE_DEFAULTS,
        role="Backend Service Engineer",
        objective="Write clean, modular, async business logic functions for FastAPI.",
        context_slice=schema_context,
        task_input=task_description
    )

    response = await client.chat.completions.create(
        model=FAST_WORKER_MODEL,
        messages=[
            {"role": "system", "content": template.build_system_prompt()},
            {"role": "user", "content": template.build_user_prompt()}
        ],
        temperature=0.1,
    )
    
    return extract_code_block(response.choices[0].message.content, "python")
