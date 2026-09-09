"""
Manual test script for the backend agents and Overpass API.
Run: python test_backend.py
"""
import asyncio
import os
import sys

# Ensure backend is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY", "your_key_here")

from app.overpass_client import query_overpass, elements_to_places


async def test_overpass():
    """Test Overpass API with a simple query."""
    print("=" * 60)
    print("Testing Overpass API client...")
    print("=" * 60)

    ql = '[out:json][timeout:15];area[name="Goa"]->.a;(node["natural"="beach"](area.a););out body 8;'
    elements = await query_overpass(ql)
    places = elements_to_places(elements, 8)

    print(f"✓ Overpass returned {len(places)} beaches in Goa")
    for p in places:
        print(f"  - {p['name']} ({p['type']})")
    print()


async def test_attractions_agent():
    """Test the Attractions Agent with mock state."""
    print("=" * 60)
    print("Testing Attractions Agent...")
    print("=" * 60)

    from app.agents.attractions_agent import attractions_node
    from app.models import TripState

    state = TripState(raw_query="Goa beaches", city="Panaji", location="Goa, India")
    state = await attractions_node(state)

    print(f"✓ Found {len(state.attractions)} attractions")
    for a in state.attractions[:5]:
        print(f"  - {a['name']}")
    print()


async def test_culinary_agent():
    """Test the Culinary Agent with mock state."""
    print("=" * 60)
    print("Testing Culinary Agent...")
    print("=" * 60)

    from app.agents.culinary_agent import culinary_node
    from app.models import TripState

    state = TripState(
        raw_query="seafood in Goa",
        city="Panaji",
        location="Goa, India",
        vibe="seafood",
        budget="low"
    )
    state = await culinary_node(state)

    print(f"✓ Found {len(state.food_spots)} food spots")
    for f in state.food_spots[:5]:
        cuisine = f['tags'].get('cuisine', 'local')
        print(f"  - {f['name']} (cuisine: {cuisine})")
    print()


async def main():
    print("\n🧪 Backend Agent Test Suite\n")

    try:
        await test_overpass()
    except Exception as e:
        print(f"❌ Overpass test failed: {e}\n")

    try:
        await test_attractions_agent()
    except Exception as e:
        print(f"❌ Attractions agent test failed: {e}\n")

    try:
        await test_culinary_agent()
    except Exception as e:
        print(f"❌ Culinary agent test failed: {e}\n")

    print("=" * 60)
    print("✓ Backend tests complete")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
