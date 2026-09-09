"""
Resilient Gemini Client with automatic model failover and JSON parsing.
Handles 429 rate limits gracefully with clean ASCII logging.
"""
from __future__ import annotations

import json
import re
from typing import Any

from google import genai
from app.config import GEMINI_API_KEY, GEMINI_MODEL

_client = genai.Client(api_key=GEMINI_API_KEY)

# Primary model + fallback models in priority order
MODEL_PRIORITY = [
    GEMINI_MODEL,
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-flash-latest",
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
    Generate JSON content with automatic multi-model fallback on 429 quota exhaustion.
    """
    last_error: Exception | None = None

    for model in MODEL_PRIORITY:
        try:
            print(f"[GeminiClient] Trying model '{model}'...")
            response = _client.models.generate_content(
                model=model,
                contents=prompt,
            )
            if response and response.text:
                parsed = extract_json(response.text)
                print(f"[GeminiClient] [OK] Success with model '{model}'")
                return parsed
        except Exception as exc:
            err_str = str(exc)
            last_error = exc
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
                print(f"[GeminiClient] Model '{model}' quota hit (429). Failing over to next model...")
            else:
                print(f"[GeminiClient] Model '{model}' notice: {err_str[:80]}, trying next...")

    # If all models failed, raise the last exception
    raise last_error or RuntimeError("All Gemini models exhausted.")
