"""
Weather & Dynamic Seasonal Agent
----------------------------------
Fetches a 7-day Open-Meteo forecast for the destination.
Identifies rain-risk slots and suggests indoor contingency activities using Gemini.
"""
from __future__ import annotations

from typing import Any
from app.models import TripState
from app.services.weather_service import fetch_weather
from app.gemini_client import generate_json_with_fallback


async def weather_agent_node(state: TripState) -> TripState:
    """Fetch weather + generate contingency tips via Gemini."""
    print(f"[WeatherAgent] Fetching 7-day forecast for lat={state.lat:.4f}, lon={state.lon:.4f}...")

    weather = await fetch_weather(state.lat, state.lon, days=7)

    # Ask Gemini for concise weather summary + indoor contingencies
    if weather.get("days"):
        day_lines = "\n".join(
            f"  {d['date']}: {d['condition']}, max {d['temp_max_c']}°C / "
            f"min {d['temp_min_c']}°C, rain {d['rain_probability_pct']}%, UV {d['uv_index']}"
            for d in weather["days"][:5]
        )
        prompt = f"""\
You are a travel weather advisor.
Destination: {state.location}
Forecast (next 5 days):
{day_lines}

Return ONLY a JSON object:
{{
  "overall_summary": "2-sentence climate overview for a traveller",
  "best_days": ["date1", "date2"],
  "rain_risk_days": ["date3"],
  "indoor_contingencies": ["Visit a museum on rainy days", "..."],
  "packing_weather_tips": ["Light layers recommended", "..."]
}}
"""
        try:
            insights = await generate_json_with_fallback(prompt)
            weather["ai_insights"] = insights
        except Exception as exc:
            print(f"[WeatherAgent] AI insights skipped: {exc}")

    state.weather_data = weather
    days_count = len(weather.get("days", []))
    print(f"[WeatherAgent] Retrieved {days_count}-day forecast.")
    return state
