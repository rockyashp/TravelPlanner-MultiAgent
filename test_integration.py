"""
Phase 3 Integration Verification Script
Tests the full multi-agent pipeline with the test query:
'I want to go to Goa for 2 days, low budget, want to eat seafood and see quiet beaches.'
"""
import asyncio
import os
import sys
import json
import time
from dotenv import load_dotenv

# Load env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.graph import run_trip_pipeline
from app.models import TripState

TEST_QUERY = "I want to go to Goa for 2 days, low budget, want to eat seafood and see quiet beaches."


async def run_verification():
    print("=" * 80)
    print("PHASE 3: FULL MULTI-AGENT INTEGRATION VERIFICATION")
    print("=" * 80)
    print(f"\nUser Query: \"{TEST_QUERY}\"\n")

    start_time = time.time()

    print("Step 1: Dispatching LangGraph pipeline...")
    try:
        final_state: TripState = await run_trip_pipeline(TEST_QUERY)
    except Exception as e:
        print(f"\nPipeline execution failed: {e}")
        return False

    elapsed = time.time() - start_time
    print(f"\nPipeline completed in {elapsed:.2f} seconds!\n")

    print("=" * 80)
    print("1. INTENT PARSER OUTPUT")
    print("=" * 80)
    print(f"  * Location      : {final_state.location}")
    print(f"  * City / Region : {final_state.city}")
    print(f"  * Country       : {final_state.country}")
    print(f"  * Duration      : {final_state.duration_days} day(s)")
    print(f"  * Budget        : {final_state.budget}")
    print(f"  * Vibe / Focus  : {final_state.vibe}")

    print("\n" + "=" * 80)
    print("2. PARALLEL AGENTS OUTPUT (Overpass OSM)")
    print("=" * 80)
    print(f"  * Attractions Agent found : {len(final_state.attractions)} spots")
    for a in final_state.attractions[:4]:
        print(f"    - {a['name']} ({a['type']})")

    print(f"\n  * Culinary Agent found    : {len(final_state.food_spots)} spots")
    for f in final_state.food_spots[:4]:
        cuisine = f.get('tags', {}).get('cuisine', 'local seafood')
        print(f"    - {f['name']} (cuisine: {cuisine})")

    print("\n" + "=" * 80)
    print("3. SYNTHESIZER AGENT OUTPUT (Day-by-Day JSON Itinerary)")
    print("=" * 80)
    itinerary = final_state.itinerary
    print(f"  * Destination : {itinerary.get('destination')}")
    print(f"  * Summary     : {itinerary.get('summary')}")
    print(f"  * Daily Budget: {itinerary.get('estimated_daily_budget')}")

    days = itinerary.get("days", [])
    print(f"\n  * Days Planned: {len(days)}")
    for d in days:
        print(f"\n    Day {d.get('day')}: {d.get('title')}")
        if d.get('theme'):
            print(f"       Theme: {d.get('theme')}")
        m = d.get('morning', {})
        print(f"       Morning  : {m.get('activity')} @ {m.get('place')}")
        a = d.get('afternoon', {})
        print(f"       Afternoon: {a.get('activity')} @ {a.get('place')}")
        e = d.get('evening', {})
        print(f"       Evening  : {e.get('activity')} @ {e.get('place')}")
        meals = d.get('meals', [])
        if meals:
            meal_strs = [f"{meal.get('meal')}: {meal.get('place')}" for meal in meals]
            print(f"       Meals    : {', '.join(meal_strs)}")

    tips = itinerary.get("practical_tips", [])
    if tips:
        print(f"\n  * Practical Tips ({len(tips)}):")
        for idx, tip in enumerate(tips[:3], 1):
            print(f"    {idx}. {tip}")

    # Assertions for verification
    assert final_state.duration_days == 2, f"Expected 2 days, got {final_state.duration_days}"
    assert "low" in final_state.budget.lower(), f"Expected low budget, got {final_state.budget}"
    assert len(days) >= 2, f"Expected at least 2 days in itinerary, got {len(days)}"
    assert itinerary.get("destination"), "Missing destination in itinerary"

    print("\n" + "*" * 80)
    print("ALL INTEGRATION VERIFICATION CHECKS PASSED!")
    print("*" * 80 + "\n")
    return True


if __name__ == "__main__":
    success = asyncio.run(run_verification())
    if not success:
        sys.exit(1)
