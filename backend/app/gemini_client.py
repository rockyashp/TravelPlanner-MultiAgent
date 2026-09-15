"""
Resilient Gemini Client supporting both `google.genai` and `google.generativeai`.
Includes automatic multi-model failover and clean JSON extraction.
"""
from __future__ import annotations

import json
import re
from typing import Any

from app.config import GEMINI_API_KEY, GEMINI_MODEL

# Try google.genai first, fall back to google.generativeai
_USE_GENAI_SDK = False
try:
    from google import genai
    _client = genai.Client(api_key=GEMINI_API_KEY)
    _USE_GENAI_SDK = True
except Exception:
    import google.generativeai as genai_legacy
    genai_legacy.configure(api_key=GEMINI_API_KEY)

# Primary model + valid fallback models in priority order
MODEL_PRIORITY = [
    GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-pro-latest",
]


def extract_json(text: str) -> dict[str, Any]:
    """Extract and parse the first valid JSON object from LLM output."""
    cleaned = re.sub(r"```(?:json)?", "", text).strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in text: {text[:200]!r}")
    return json.loads(match.group())


async def generate_json_with_fallback(prompt: str) -> dict[str, Any]:
    """
    Generate JSON content with automatic multi-model fallback.
    Supports both google.genai and google.generativeai SDKs.
    """
    last_error: Exception | None = None

    for model_name in MODEL_PRIORITY:
        try:
            print(f"[GeminiClient] Trying model '{model_name}'...")
            if _USE_GENAI_SDK:
                response = _client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                text = response.text if response else ""
            else:
                import google.generativeai as genai_legacy
                model = genai_legacy.GenerativeModel(model_name)
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                text = response.text if response else ""

            if text:
                parsed = extract_json(text)
                print(f"[GeminiClient] [OK] Success with model '{model_name}'")
                return parsed

        except Exception as exc:
            err_str = str(exc)
            last_error = exc
            print(f"[GeminiClient] Model '{model_name}' notice: {err_str[:60]}, trying next...")

    # If all models failed, raise the last exception
    raise last_error or RuntimeError("All Gemini models exhausted.")
