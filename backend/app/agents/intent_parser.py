"""
Intent Parser Agent
-------------------
Extracts structured trip intent from natural language using Gemini with failover.
Populates: location, city, country, duration_days, vibe, budget.
"""
from __future__ import annotations

import re
from app.models import TripState
from app.gemini_client import generate_json_with_fallback

_SYSTEM_PROMPT = """\
You are a travel intent parser. Given a user query, extract the following fields and
return ONLY a valid JSON object — no markdown fences, no commentary.

Fields:
  location    : Full descriptive location (e.g. "Goa, India")
  city        : OSM-friendly city/state name (e.g. "Panaji" or "Goa")
  country     : Country name (e.g. "India")
  duration_days: integer number of days (default 1 if unspecified)
  vibe        : short comma-separated list of vibes/interests (e.g. "quiet beaches, seafood")
  budget      : one of "low" | "medium" | "high" (default "medium")

Example output:
{
  "location": "Goa, India",
  "city": "Panaji",
  "country": "India",
  "duration_days": 2,
  "vibe": "quiet beaches, seafood",
  "budget": "low"
}
"""


def _heuristic_parse(query: str) -> dict:
    """Fast regex-based fallback if LLM is unavailable."""
    q_lower = query.lower()

    # Extract days
    days_match = re.search(r'(\d+)\s*(?:day|days)', q_lower)
    days = int(days_match.group(1)) if days_match else 2

    # Extract budget
    budget = "medium"
    if any(w in q_lower for w in ["low", "cheap", "budget", "backpack"]):
        budget = "low"
    elif any(w in q_lower for w in ["luxury", "high", "expensive", "5 star"]):
        budget = "high"

    # Extract common destinations
    location = "Goa, India"
    city = "Panaji"
    if "goa" in q_lower:
        location, city = "Goa, India", "Panaji"
    elif "tokyo" in q_lower:
        location, city = "Tokyo, Japan", "Tokyo"
    elif "paris" in q_lower:
        location, city = "Paris, France", "Paris"
    elif "kerala" in q_lower:
        location, city = "Kerala, India", "Kochi"
    elif "mumbai" in q_lower:
        location, city = "Mumbai, India", "Mumbai"

    return {
        "location": location,
        "city": city,
        "country": "India",
        "duration_days": days,
        "vibe": "seafood, beaches",
        "budget": budget,
    }


async def intent_parser_node(state: TripState) -> TripState:
    """LangGraph node: parse raw_query -> structured trip intent."""
    prompt = f"{_SYSTEM_PROMPT}\n\nUser query: {state.raw_query}"
    try:
        parsed = await generate_json_with_fallback(prompt)
        state.location = parsed.get("location", state.raw_query)
        state.city = parsed.get("city", "")
        state.country = parsed.get("country", "")
        state.duration_days = int(parsed.get("duration_days", 1))
        state.vibe = parsed.get("vibe", "")
        state.budget = parsed.get("budget", "medium").lower()
        print(f"[IntentParser] -> {state.city}, {state.country} | {state.duration_days}d | {state.budget}")
    except Exception as exc:
        print(f"[IntentParser] Falling back to heuristic parse due to: {exc}")
        fallback = _heuristic_parse(state.raw_query)
        state.location = fallback["location"]
        state.city = fallback["city"]
        state.country = fallback["country"]
        state.duration_days = fallback["duration_days"]
        state.vibe = fallback["vibe"]
        state.budget = fallback["budget"]

    return state
