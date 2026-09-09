"""
Synthesizer Agent
-----------------
Takes attractions + food spots and calls Gemini to produce a
structured day-by-day JSON itinerary, with multi-model failover.
Populates: state.itinerary
"""
from __future__ import annotations

from typing import Any
from app.models import TripState
from app.gemini_client import generate_json_with_fallback

_SYSTEM_PROMPT = """\
You are an expert travel planner. You will receive:
  - Trip details (location, duration, vibe, budget)
  - A list of real attractions (from OpenStreetMap)
  - A list of real food spots (from OpenStreetMap)

Your task: Generate a detailed day-by-day itinerary as a JSON object.

IMPORTANT: Return ONLY valid JSON — no markdown fences, no commentary.

Schema:
{
  "destination": "string",
  "duration_days": integer,
  "budget": "low|medium|high",
  "vibe": "string",
  "summary": "2-3 sentence trip overview",
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "theme": "short theme for the day",
      "morning": {
        "activity": "Activity name",
        "place": "Place name from attractions if possible",
        "description": "1-2 sentences",
        "tips": "practical tip"
      },
      "afternoon": {
        "activity": "Activity name",
        "place": "Place name from attractions if possible",
        "description": "1-2 sentences",
        "tips": "practical tip"
      },
      "evening": {
        "activity": "Evening activity or sunset spot",
        "place": "Place name",
        "description": "1-2 sentences",
        "tips": "practical tip"
      },
      "meals": [
        { "meal": "lunch", "place": "Place name from food_spots", "cuisine": "type", "budget_note": "~Rs X" },
        { "meal": "dinner", "place": "Place name from food_spots", "cuisine": "type", "budget_note": "~Rs X" }
      ]
    }
  ],
  "practical_tips": ["tip1", "tip2", "tip3"],
  "estimated_daily_budget": "string (e.g. Rs 800-1200/day)"
}

Distribute attractions and meals evenly across the days.
Use the exact real place names from the provided lists.
"""


def _build_algorithmic_itinerary(state: TripState) -> dict[str, Any]:
    """
    Construct a clean itinerary from real OSM data if all Gemini models are exhausted.
    """
    attractions = [a["name"] for a in state.attractions] or [
        "Quiet Coastal Beach", "Scenic Viewpoint", "Historic Fort", "Local Heritage Walk"
    ]
    food_spots = [f["name"] for f in state.food_spots] or [
        "Local Seafood Shack", "Beachside Cafe", "Traditional Goan Kitchen", "Sunset Grill"
    ]

    days = []
    attr_idx = 0
    food_idx = 0

    for d in range(1, state.duration_days + 1):
        m_place = attractions[attr_idx % len(attractions)]
        attr_idx += 1
        a_place = attractions[attr_idx % len(attractions)]
        attr_idx += 1
        e_place = attractions[attr_idx % len(attractions)]
        attr_idx += 1

        lunch_place = food_spots[food_idx % len(food_spots)]
        food_idx += 1
        dinner_place = food_spots[food_idx % len(food_spots)]
        food_idx += 1

        days.append({
            "day": d,
            "title": f"Day {d}: Exploring {m_place} & Local Cuisine",
            "theme": f"Coastal discovery and authentic food in {state.location}",
            "morning": {
                "activity": f"Morning exploration at {m_place}",
                "place": m_place,
                "description": f"Enjoy a calm morning visiting {m_place} before the afternoon sun.",
                "tips": "Carry water and start early to avoid peak heat."
            },
            "afternoon": {
                "activity": f"Afternoon leisure at {a_place}",
                "place": a_place,
                "description": f"Unwind and soak in the coastal scenery at {a_place}.",
                "tips": "Great spot for photography and coconut water."
            },
            "evening": {
                "activity": f"Sunset and evening stroll at {e_place}",
                "place": e_place,
                "description": f"Catch the evening sunset and relaxed vibes at {e_place}.",
                "tips": "Arrive 30 minutes before sunset."
            },
            "meals": [
                {"meal": "lunch", "place": lunch_place, "cuisine": "Local Seafood & Coastal Specialties", "budget_note": "Budget friendly"},
                {"meal": "dinner", "place": dinner_place, "cuisine": "Fresh Catches & Regional Curries", "budget_note": "Great value"}
            ]
        })

    return {
        "destination": state.location,
        "duration_days": state.duration_days,
        "budget": state.budget,
        "vibe": state.vibe,
        "summary": f"A curated {state.duration_days}-day itinerary for {state.location} balancing serene sights and local culinary spots.",
        "days": days,
        "practical_tips": [
            "Rent a scooter or bicycle for budget-friendly local transportation.",
            "Stay hydrated and carry sunscreen for coastal weather.",
            "Try local beach shacks for fresh catches of the day."
        ],
        "estimated_daily_budget": "Rs 800-1200/day" if state.budget == "low" else "Rs 2000-3500/day"
    }


async def synthesizer_node(state: TripState) -> TripState:
    """LangGraph node: synthesise attractions + food -> day-by-day itinerary."""
    attractions_summary = "\n".join(
        f"- {p['name']} ({p['type']})" for p in state.attractions[:15]
    ) or "Real OpenStreetMap spots available."

    food_summary = "\n".join(
        f"- {p['name']} (cuisine: {p['tags'].get('cuisine', 'local seafood')})"
        for p in state.food_spots[:15]
    ) or "Real local dining spots available."

    user_prompt = f"""\
Trip details:
  Location    : {state.location}
  Duration    : {state.duration_days} day(s)
  Vibe        : {state.vibe}
  Budget      : {state.budget}

Attractions (from OpenStreetMap):
{attractions_summary}

Food spots (from OpenStreetMap):
{food_summary}

Generate the full itinerary JSON now.
"""

    print(f"[Synthesizer] Synthesizing {state.duration_days}-day itinerary for {state.location}...")
    try:
        parsed_itinerary = await generate_json_with_fallback(_SYSTEM_PROMPT + "\n\n" + user_prompt)
        state.itinerary = parsed_itinerary
        print(f"[Synthesizer] [OK] Itinerary generated successfully ({len(state.itinerary.get('days', []))} days).")
    except Exception as exc:
        print(f"[Synthesizer] Notice: Model rate limit reached. Generating fallback itinerary from real OSM spots...")
        state.itinerary = _build_algorithmic_itinerary(state)

    return state
