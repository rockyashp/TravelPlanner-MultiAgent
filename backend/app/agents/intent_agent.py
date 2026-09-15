"""
Intent & Profile Agent
-----------------------
Parses user query into structured travel parameters:
  - Origin & Destination cities
  - Budget in INR / Tier (Budget, Moderate, Luxury)
  - Party type (Solo, Couple, Family, Friends), Pace, Dietary restrictions
  - Geocodes Origin and Destination coordinates via Nominatim with fast cache.
"""
from __future__ import annotations

import re
import httpx
from app.models import TripState
from app.gemini_client import generate_json_with_fallback

_SYSTEM_PROMPT = """\
You are an expert travel intent and profile analyst.
Given a user travel prompt, extract all preferences into a strict JSON object.
All currency logic must default to Indian Rupees (INR / ₹).

JSON Schema:
{
  "origin": "Origin city name (e.g. 'Mumbai' or 'Delhi' or default 'Mumbai' if unstated)",
  "destination": "Destination city/state name (e.g. 'Goa' or 'Manali' or 'Paris')",
  "city": "OSM-friendly destination city name (e.g. 'Panaji' or 'Shimla')",
  "country": "Country name (e.g. 'India' or 'France')",
  "duration_days": integer (default 3 if unspecified),
  "vibe": "comma-separated vibes (e.g. 'beaches, seafood, sunsets')",
  "budget_tier": "one of 'low' | 'medium' | 'high' (default 'medium')",
  "budget_inr": integer total budget in INR if specified (e.g. 25000) or 0,
  "party_type": "one of 'solo' | 'couple' | 'family' | 'friends' (default 'solo')",
  "pace": "one of 'relaxed' | 'balanced' | 'packed' (default 'balanced')",
  "dietary": "dietary preferences if any (e.g. 'Vegetarian', 'Jain', 'Seafood', 'Halal' or '')",
  "themes": ["array of themes like 'history', 'beach', 'adventure', 'nightlife']
}

Examples:
- "Trip from Delhi to Goa for 4 days for couple budget ₹30,000" -> origin: "Delhi", destination: "Goa", duration_days: 4, party_type: "couple", budget_tier: "medium", budget_inr: 30000
- "Goa 2 days low budget seafood" -> origin: "Mumbai", destination: "Goa", duration_days: 2, party_type: "solo", budget_tier: "low", budget_inr: 0, dietary: "Seafood"
"""

_HEADERS = {"User-Agent": "SAFAR-AI-Travel-Planner/2.0"}

_CITY_GEO_CACHE: dict[str, tuple[float, float]] = {
    "mumbai": (18.9220, 72.8347),
    "delhi": (28.6139, 77.2090),
    "new delhi": (28.6139, 77.2090),
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "goa": (15.2993, 74.1240),
    "panaji": (15.4909, 73.8278),
    "pune": (18.5204, 73.8567),
    "hyderabad": (17.3850, 78.4867),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639),
    "jaipur": (26.9124, 75.7873),
    "udaipur": (24.5854, 73.7125),
    "manali": (32.2396, 77.1887),
    "shimla": (31.1048, 77.1734),
    "kerala": (9.9312, 76.2673),
    "kochi": (9.9312, 76.2673),
    "rishikesh": (30.0869, 78.2676),
    "varanasi": (25.3176, 82.9739),
    "agra": (27.1767, 78.0081),
    "amritsar": (31.6340, 74.8723),
    "dubai": (25.2048, 55.2708),
    "paris": (48.8566, 2.3522),
    "tokyo": (35.6762, 139.6503),
    "london": (51.5074, -0.1278),
    "singapore": (1.3521, 103.8198),
    "bangkok": (13.7563, 100.5018),
    "bali": (-8.4095, 115.1889),
}


async def geocode_city(name: str) -> tuple[float, float]:
    """Geocode city name using in-memory cache or OpenStreetMap Nominatim."""
    if not name:
        return 0.0, 0.0
    clean = name.lower().split(",")[0].strip()
    if clean in _CITY_GEO_CACHE:
        return _CITY_GEO_CACHE[clean]

    try:
        async with httpx.AsyncClient(timeout=5, follow_redirects=True) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": name, "format": "json", "limit": 1},
                headers=_HEADERS,
            )
            if resp.status_code == 200:
                data = resp.json()
                if data:
                    lat, lon = float(data[0]["lat"]), float(data[0]["lon"])
                    _CITY_GEO_CACHE[clean] = (lat, lon)
                    return lat, lon
    except Exception as exc:
        print(f"[IntentAgent] Geocode note for '{name}': {exc}")

    return 18.9220, 72.8347  # Default to Mumbai if unresolved


def _heuristic_parse(query: str) -> dict:
    """Fast regex fallback if Gemini is momentarily unavailable."""
    q = query.lower()

    # Days
    days_match = re.search(r"(\d+)\s*(?:day|days|d)", q)
    days = int(days_match.group(1)) if days_match else 3

    # Budget INR number
    inr_match = re.search(r"(?:rs\.?|inr|₹)\s*([\d,]+)", q)
    budget_inr = int(inr_match.group(1).replace(",", "")) if inr_match else 0

    # Budget tier
    tier = "medium"
    if any(w in q for w in ["low", "budget", "cheap", "backpack", "hostel"]):
        tier = "low"
    elif any(w in q for w in ["luxury", "premium", "5 star", "resort", "expensive"]):
        tier = "high"

    # Party
    party = "solo"
    if "couple" in q or "partner" in q or "wife" in q or "husband" in q:
        party = "couple"
    elif "family" in q or "kids" in q or "children" in q:
        party = "family"
    elif "friends" in q or "group" in q:
        party = "friends"

    # Origin & Destination heuristics
    origin = "Mumbai"
    destination = "Goa"
    city = "Panaji"
    country = "India"

    from_match = re.search(r"from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+)", q)
    if from_match:
        origin = from_match.group(1).strip().title()
        destination = from_match.group(2).strip().split()[0].title()
        city = destination
    else:
        for known in _CITY_GEO_CACHE:
            if known in q:
                destination = known.title()
                city = destination
                break

    return {
        "origin": origin,
        "destination": destination,
        "city": city,
        "country": country,
        "duration_days": days,
        "vibe": "local culture, sights, dining",
        "budget_tier": tier,
        "budget_inr": budget_inr,
        "party_type": party,
        "pace": "balanced",
        "dietary": "Vegetarian" if "veg" in q else "",
        "themes": ["culture", "sights"],
    }


async def intent_agent_node(state: TripState) -> TripState:
    """LangGraph node: Parse intent and geocode origin & destination."""
    prompt = f"{_SYSTEM_PROMPT}\n\nUser query: {state.raw_query}"
    try:
        parsed = await generate_json_with_fallback(prompt)
        state.origin = parsed.get("origin", "Mumbai")
        state.destination = parsed.get("destination", parsed.get("location", state.raw_query))
        state.location = state.destination
        state.city = parsed.get("city", state.destination)
        state.country = parsed.get("country", "India")
        state.duration_days = max(1, int(parsed.get("duration_days", 3)))
        state.vibe = parsed.get("vibe", "")
        state.budget = parsed.get("budget_tier", "medium").lower()
        state.budget_inr = int(parsed.get("budget_inr", 0))
        state.party_type = parsed.get("party_type", "solo").lower()
        state.pace = parsed.get("pace", "balanced").lower()
        state.dietary = parsed.get("dietary", "")
        state.themes = parsed.get("themes", [])
        print(f"[IntentAgent] -> {state.origin} to {state.destination} | {state.duration_days}d | {state.budget.upper()} (Rs {state.budget_inr:,} target) | {state.party_type}")
    except Exception as exc:
        print(f"[IntentAgent] Notice: using heuristic parse ({exc})")
        fb = _heuristic_parse(state.raw_query)
        for k, v in fb.items():
            if hasattr(state, k):
                setattr(state, k, v)
        state.location = state.destination

    # Geocode both Origin and Destination
    orig_lat, orig_lon = await geocode_city(state.origin)
    dest_lat, dest_lon = await geocode_city(state.destination)

    state.origin_lat, state.origin_lon = orig_lat, orig_lon
    state.lat, state.lon = dest_lat, dest_lon

    print(f"[IntentAgent] Geocoded -> Origin({state.origin}): {orig_lat:.4f},{orig_lon:.4f} | Dest({state.destination}): {dest_lat:.4f},{dest_lon:.4f}")
    return state
