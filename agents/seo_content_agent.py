# agents/seo_content_agent.py
import asyncio
from openai import AsyncOpenAI, APIError, RateLimitError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from agents.config import GATEWAY_BASE_URL, GATEWAY_API_KEY, FAST_WORKER_MODEL
from agents.templates.task_template import AgentTaskTemplate, ROUTE_CATALOG_TEMPLATE_DEFAULTS

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((RateLimitError, APIError, asyncio.TimeoutError))
)
async def generate_route_seo_content(origin: str, destination: str, distance: str, client: AsyncOpenAI = None) -> str:
    if client is None:
        client = AsyncOpenAI(base_url=GATEWAY_BASE_URL, api_key=GATEWAY_API_KEY, timeout=45.0)
        
    task_desc = f"Write the SEO content and 3 AEO FAQs for the taxi route: {origin} to {destination}. Distance: {distance}."
    
    template = AgentTaskTemplate(
        **ROUTE_CATALOG_TEMPLATE_DEFAULTS,
        task_input=task_desc
    )

    response = await client.chat.completions.create(
        model=FAST_WORKER_MODEL,
        messages=[
            {"role": "system", "content": template.build_system_prompt()},
            {"role": "user", "content": template.build_user_prompt()}
        ],
        temperature=0.7, # Higher temp for creative editorial copy
    )
    
    return response.choices[0].message.content.strip()
