import asyncio
import sys
from google.adk import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from openai import AsyncOpenAI

from agents.config import GATEWAY_BASE_URL, GATEWAY_API_KEY, FAST_WORKER_MODEL
from agents.adk_supervisor import create_supervisor_agent, ArenaAIDecomposedTasks
from agents.specialists.backend_agent import generate_backend_module
from agents.specialists.frontend_agent import generate_frontend_component
from agents.specialists.catalog_agent import generate_route_or_package
from agents.specialists.test_agent import generate_unit_tests

async def run_parallel_pipeline(user_request: str):
    print("=" * 75)
    print("🚀 ARENA AI: GOOGLE ADK + FREELLMAPI MULTI-AGENT WORKFLOW")
    print("=" * 75)
    print(f"\n[1] Requirement:\n    {user_request}\n")

    # Step 1: Supervisor (Google ADK) decomposes the task into atomic micro-tasks
    print("[2] 🧠 Supervisor Agent: Decomposing into bounded micro-tasks...")
    raw_output = None
    try:
        supervisor = create_supervisor_agent()
        session_service = InMemorySessionService()
        runner = Runner(app_name="arena_ai_pipeline", agent=supervisor, session_service=session_service)
        session = await session_service.create_session(app_name="arena_ai_pipeline", user_id="developer")

        message = types.Content(role="user", parts=[types.Part.from_text(text=user_request)])
        events = []
        async for event in runner.run_async(session_id=session.id, user_id="developer", new_message=message):
            events.append(event)

        for event in reversed(events):
            if hasattr(event, "content") and event.content:
                raw_output = event.content
                break
            elif hasattr(event, "actions") and event.actions:
                for act in event.actions:
                    if hasattr(act, "output") and act.output:
                        raw_output = act.output
                        break
    except Exception as adk_err:
        print(f"    (ADK Supervisor unavailable [{adk_err}], using Gateway fallback...)")
        try:
            gw_client = AsyncOpenAI(base_url=GATEWAY_BASE_URL, api_key=GATEWAY_API_KEY, timeout=30.0)
            decomp_res = await gw_client.chat.completions.create(
                model=FAST_WORKER_MODEL,
                messages=[
                    {"role": "system", "content": "You are Lead Architect. Output valid JSON matching fields: feature_name, target_subsystem, backend_task, frontend_task, catalog_task, test_task."},
                    {"role": "user", "content": f"Decompose this task into micro-tasks: {user_request}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            raw_output = decomp_res.choices[0].message.content
        except Exception as gw_err:
            print(f"    (Gateway fallback exception: {gw_err})")

    try:
        if isinstance(raw_output, str):
            decomposed = ArenaAIDecomposedTasks.model_validate_json(raw_output)
        elif isinstance(raw_output, dict):
            decomposed = ArenaAIDecomposedTasks.model_validate(raw_output)
        else:
            decomposed = ArenaAIDecomposedTasks(
                feature_name="Feature Implementation",
                target_subsystem="fullstack",
                backend_task=f"Implement Fastify route and Zod schema for: {user_request}",
                frontend_task=f"Implement React 19 UI component for: {user_request}",
                catalog_task=f"Implement route/package details for: {user_request}",
                test_task=f"Implement Vitest test suite for: {user_request}",
            )
    except Exception as e:
        print(f"    (Fallback mapping used: {e})")
        decomposed = ArenaAIDecomposedTasks(
            feature_name="Feature Implementation",
            target_subsystem="fullstack",
            backend_task=f"Implement Fastify route and Zod schema for: {user_request}",
            frontend_task=f"Implement React 19 UI component for: {user_request}",
            catalog_task=f"Implement route/package details for: {user_request}",
            test_task=f"Implement Vitest test suite for: {user_request}",
        )

    print(f"    ✓ Feature:    {decomposed.feature_name}")
    print(f"    ✓ Subsystem:  {decomposed.target_subsystem}")
    if decomposed.backend_task:
        print(f"    ✓ Backend:    {decomposed.backend_task[:75]}...")
    if decomposed.frontend_task:
        print(f"    ✓ Frontend:   {decomposed.frontend_task[:75]}...")
    if decomposed.catalog_task:
        print(f"    ✓ Catalog:    {decomposed.catalog_task[:75]}...")
    if decomposed.test_task:
        print(f"    ✓ QA/Test:    {decomposed.test_task[:75]}...")

    # Step 2: Dispatch active specialist agents IN PARALLEL via Gateway
    print("\n[3] ⚡ Dispatching Active Specialist Agents IN PARALLEL via FreeLLMAPI Gateway...")
    client = AsyncOpenAI(base_url=GATEWAY_BASE_URL, api_key=GATEWAY_API_KEY)

    tasks_to_run = []
    task_labels = []

    if decomposed.backend_task:
        tasks_to_run.append(generate_backend_module(decomposed.backend_task, client=client))
        task_labels.append("BACKEND (Fastify + Zod)")

    if decomposed.frontend_task:
        tasks_to_run.append(generate_frontend_component(decomposed.frontend_task, client=client))
        task_labels.append("FRONTEND (React 19 + TSX)")

    if decomposed.catalog_task:
        tasks_to_run.append(generate_route_or_package(decomposed.catalog_task, client=client))
        task_labels.append("ROUTE CATALOG (900+ Routes)")

    if decomposed.test_task:
        tasks_to_run.append(generate_unit_tests(decomposed.test_task, client=client))
        task_labels.append("QA & TESTS (Vitest)")

    t0 = asyncio.get_event_loop().time()
    results = await asyncio.gather(*tasks_to_run, return_exceptions=True)
    elapsed = asyncio.get_event_loop().time() - t0

    print(f"\n[4] ✅ {len(tasks_to_run)} Specialist Agents Completed in {elapsed:.2f}s!")

    for label, res in zip(task_labels, results):
        print("\n" + "=" * 75)
        print(f"📦 {label}:")
        print("-" * 75)
        if isinstance(res, Exception):
            print(f"❌ Error during execution: {res}")
        else:
            print(str(res).strip())
    print("=" * 75)

if __name__ == "__main__":
    prompt = "Create an outstation route for Agra to Haridwar taxi with Yamuna/NH58 stopovers, fares, and FAQ schema."
    if len(sys.argv) > 1:
        prompt = " ".join(sys.argv[1:])
    asyncio.run(run_parallel_pipeline(prompt))
