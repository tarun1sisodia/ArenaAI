import os
from pathlib import Path
from dotenv import load_dotenv

# Load root .env, agents/.env, and freellmapi/.env if available
load_dotenv()
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / "freellmapi" / ".env")

# Google Gemini / AI Studio key for Google ADK
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# FreeLLMAPI Local Gateway
GATEWAY_BASE_URL = os.getenv("FREELLM_GATEWAY_URL", "http://127.0.0.1:3001/v1")
GATEWAY_API_KEY = os.getenv("FREELLM_API_KEY", "")

# Default models
SUPERVISOR_MODEL = os.getenv("SUPERVISOR_MODEL", "gemini-3.6-flash")
FAST_WORKER_MODEL = os.getenv("FAST_WORKER_MODEL", "auto")
