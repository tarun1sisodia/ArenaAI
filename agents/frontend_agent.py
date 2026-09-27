# agents/frontend_agent.py
import asyncio
from openai import AsyncOpenAI, APIError, RateLimitError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from agents.config import GATEWAY_BASE_URL, GATEWAY_API_KEY, FAST_WORKER_MODEL
from agents.templates.task_template import AgentTaskTemplate, FRONTEND_TEMPLATE_DEFAULTS
from agents.utils.code_extractor import extract_code_block

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((RateLimitError, APIError, asyncio.TimeoutError))
)
async def generate_frontend_component(task_description: str, context_slice: str = "", client: AsyncOpenAI = None) -> str:
    if client is None:
        client = AsyncOpenAI(base_url=GATEWAY_BASE_URL, api_key=GATEWAY_API_KEY, timeout=30.0)
        
    template = AgentTaskTemplate(
        **FRONTEND_TEMPLATE_DEFAULTS,
        context_slice=context_slice,
        task_input=task_description
    )

    response = await client.chat.completions.create(
        model=FAST_WORKER_MODEL,
        messages=[
            {"role": "system", "content": template.build_system_prompt()},
            {"role": "user", "content": template.build_user_prompt()}
        ],
        temperature=0.2,
    )
    
    return extract_code_block(response.choices[0].message.content, "tsx")
