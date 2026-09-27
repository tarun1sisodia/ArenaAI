# agents/orchestrator.py
from agents.schema_agent import generate_schemas
from agents.service_agent import generate_service_logic
from agents.frontend_agent import generate_frontend_component
from agents.test_agent import generate_unit_tests

async def orchestrate_feature(feature_request: str):
    """
    Chains the ArenaAI agents to build a full feature stack from a single prompt.
    Example: "Build a WhatsApp Booking Webhook Endpoint"
    """
    print(f"🚀 Orchestrating feature: {feature_request}")
    
    # 1. Generate Pydantic Schemas
    print("📐 Generating Schemas...")
    schema_code = await generate_schemas(feature_request)
    
    # 2. Generate Backend Logic (Pass schema as context)
    print("⚙️ Generating Service Logic...")
    service_code = await generate_service_logic(feature_request, schema_context=schema_code)
    
    # 3. Generate Frontend UI (Pass schema types as context)
    print("🎨 Generating Frontend Components...")
    frontend_code = await generate_frontend_component(f"Build UI for {feature_request}", context_slice=schema_code)
    
    # 4. Generate Tests
    print("🧪 Generating Tests...")
    test_code = await generate_unit_tests(f"Test {feature_request}", code_context=service_code)
    
    return {
        "schema": schema_code,
        "service": service_code,
        "frontend": frontend_code,
        "tests": test_code
    }

if __name__ == "__main__":
    import asyncio
    # Test run
    # result = asyncio.run(orchestrate_feature("Create a Night Charge Surcharge Calculation Logic"))
    # print(result['service'])
