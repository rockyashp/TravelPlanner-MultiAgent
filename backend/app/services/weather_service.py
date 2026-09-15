"""
Open-Meteo weather service — no API key required.
Fetches a 7-day hourly/daily forecast for given coordinates.
"""
from __future__ import annotations

import httpx
from typing import Any

_BASE_URL = "https://api.open-meteo.com/v1/forecast"

_WMO_DESCRIPTIONS: dict[int, str] = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Icy fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
    95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Heavy thunderstorm",
}


async def fetch_weather(lat: float, lon: float, days: int = 7) -> dict[str, Any]:
    """
    Fetch daily forecast + sunrise/sunset for the given coordinates.
    Returns a structured dict ready for the Weather Agent to consume.
    Falls back to an empty scaffold on network errors.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "precipitation_probability_max",
            "uv_index_max",
            "sunrise",
            "sunset",
            "weathercode",
        ],
        "timezone": "auto",
        "forecast_days": min(days, 7),
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(_BASE_URL, params=params)
            resp.raise_for_status()
            raw = resp.json()

        daily = raw.get("daily", {})
        dates: list[str] = daily.get("time", [])
        days_data = []
        for i, date in enumerate(dates):
            wmo = daily.get("weathercode", [])[i] if i < len(daily.get("weathercode", [])) else 0
            days_data.append({
                "date": date,
                "temp_max_c": _safe(daily.get("temperature_2m_max"), i),
                "temp_min_c": _safe(daily.get("temperature_2m_min"), i),
                "precipitation_mm": _safe(daily.get("precipitation_sum"), i, 0.0),
                "rain_probability_pct": _safe(daily.get("precipitation_probability_max"), i, 0),
                "uv_index": _safe(daily.get("uv_index_max"), i, 0),
                "sunrise": _safe(daily.get("sunrise"), i, ""),
                "sunset": _safe(daily.get("sunset"), i, ""),
                "condition": _WMO_DESCRIPTIONS.get(wmo, "Unknown"),
                "wmo_code": wmo,
            })

        return {
            "timezone": raw.get("timezone", "UTC"),
            "latitude": lat,
            "longitude": lon,
            "days": days_data,
        }

    except Exception as exc:
        print(f"[WeatherService] fetch failed: {exc}")
        return {"timezone": "UTC", "latitude": lat, "longitude": lon, "days": []}


def _safe(lst: list | None, idx: int, default: Any = None) -> Any:
    """Safely index into a possibly-None or short list."""
    if not lst or idx >= len(lst):
        return default
    val = lst[idx]
    return val if val is not None else default
