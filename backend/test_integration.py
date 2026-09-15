"""
End-to-end integration test suite.
Tests the full 7-agent pipeline with INR pricing and Live Map Coordinates
across diverse Indian routes.
"""
from __future__ import annotations

import asyncio
import sys
from app.graph import run_trip_pipeline
from app.services.weather_service import fetch_weather
from app.services.country_service import fetch_country_info
from app.services.transit_service import estimate_intercity_transit


async def test_services():
    print("=== 1. Testing Open API & Transit Services ===")

    # 1. Weather
    print("Testing Open-Meteo Weather for Jaipur (26.9124, 75.7873)...")
    wx = await fetch_weather(26.9124, 75.7873, days=5)
    assert "days" in wx, "Weather failed"
    print(f" Weather returned {len(wx['days'])} forecast days.")

    # 2. Country info
    print("Testing RestCountries for India...")
    country = await fetch_country_info("India")
    assert country.get("country") != "", "Country fetch failed"
    print(f" RestCountries: capital={country.get('capital')}, currencies={country.get('currencies')}")

    # 3. Transit heuristics
    print("Testing Transit calculations: Mumbai to Jaipur...")
    transit = estimate_intercity_transit("Mumbai", "Jaipur", 18.9220, 72.8347, 26.9124, 75.7873)
    assert len(transit["options"]) == 4, "Transit failed to return 4 modes"
    print(f" Transit distance: ~{transit['distance_km']} km, modes: {[o['mode'] for o in transit['options']]}")


async def test_full_pipeline_destinations():
    print("\n=== 2. Testing Full 7-Agent Pipeline on Indian Routes ===")

    test_queries = [
        "Plan a 3-day trip from Mumbai to Jaipur for a couple, budget Rs 20,000, focus on forts, palaces and authentic Rajasthani food.",
    ]

    for q in test_queries:
        print(f"\n--- Testing query: '{q}' ---")
        state = await run_trip_pipeline(q)

        print(f"Origin: {state.origin} | Destination: {state.destination} ({state.city}, {state.country})")
        print(f"Coordinates: lat={state.lat:.4f}, lon={state.lon:.4f}")
        print(f"Intercity Transit Options: {len(state.transit_data.get('options', []))}")
        print(f"Attractions found: {len(state.attractions)}")
        print(f"Food spots found: {len(state.food_spots)}")
        print(f"Specialty dishes: {len(state.specialty_dishes)}")
        print(f"Forecast days: {len(state.weather_data.get('days', []))}")
        print(f"Budget generated: {bool(state.budget_breakdown)}")
        print(f"Safety tips: {len(state.safety_tips)}")
        print(f"Itinerary days: {len(state.itinerary.get('days', []))}")

        # Verify geo coordinates on all activities
        for day in state.itinerary.get("days", []):
            for slot in ["morning", "afternoon", "evening"]:
                act = day.get(slot, {})
                assert "lat" in act and "lon" in act, f"Missing coordinates in day {day.get('day')} {slot}"

        assert state.itinerary, "Synthesizer failed to generate an itinerary"
        assert len(state.itinerary.get("days", [])) > 0, "Itinerary has 0 days"
        print(f" [PASS] Success for {state.origin} -> {state.destination} with verified geo-coordinates!")


async def main():
    try:
        await test_services()
        await test_full_pipeline_destinations()
        print("\n=== ALL INTEGRATION TESTS PASSED WITH LIVE MAP COORDINATES! ===")
    except Exception as exc:
        print(f"\nTEST FAILED: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
