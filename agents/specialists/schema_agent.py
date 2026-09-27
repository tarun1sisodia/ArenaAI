from openai import AsyncOpenAI
from agents.config import GATEWAY_BASE_URL, GATEWAY_API_KEY, FAST_WORKER_MODEL

SYSTEM_INSTRUCTION = """You are a specialist Backend Schema Engineer.
Your only job is to generate clean, robust, modern Pydantic V2 schemas.
Rules:
1. Output ONLY python code inside ```python ``` blocks.
2. Include field types, Field() constraints, and docstrings.
3. Do not include database models or business logic. Keep it strictly to Pydantic schemas.
"""

async def generate_schemas(task_description: str, client: AsyncOpenAI = None) -> str:
    """Generates Pydantic schemas for the given task description."""
    if client is None:
        client = AsyncOpenAI(base_url=GATEWAY_BASE_URL, api_key=GATEWAY_API_KEY)
        
    response = await client.chat.completions.create(
        model=FAST_WORKER_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": f"Create the required Pydantic V2 schemas for this feature:\n{task_description}"}
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content
