"""Application config — loaded once at startup."""
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
# Default to standard production flash model with high quota
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

OVERPASS_URL: str = "https://overpass-api.de/api/interpreter"

if not GEMINI_API_KEY:
    raise EnvironmentError(
        "GEMINI_API_KEY is not set. Add it to the .env file in the project root."
    )
