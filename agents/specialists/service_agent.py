from openai import AsyncOpenAI
from agents.config import GATEWAY_BASE_URL, GATEWAY_API_KEY, FAST_WORKER_MODEL

SYSTEM_INSTRUCTION = """You are a specialist Backend Service Engineer.
Your only job is to write clean, modular, async business logic functions for FastAPI.
Rules:
1. Output ONLY python code inside ```python ``` blocks.
2. Use type hints, proper error handling (e.g. ValueError or HTTPException), and docstrings.
3. Keep functions pure and decoupled from framework overhead where possible.
"""

async def generate_service_logic(task_description: str, schema_context: str = "", client: AsyncOpenAI = None) -> str:
    """Generates business logic service functions for the given task and optional schema context."""
    if client is None:
        client = AsyncOpenAI(base_url=GATEWAY_BASE_URL, api_key=GATEWAY_API_KEY)
        
    prompt = f"Implement the core service functions for this feature:\n{task_description}\n"
    if schema_context:
        prompt += f"\nTarget Schemas:\n{schema_context}\n"

    response = await client.chat.completions.create(
        model=FAST_WORKER_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content
