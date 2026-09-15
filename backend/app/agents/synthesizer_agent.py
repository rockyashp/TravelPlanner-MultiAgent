"""
Master Itinerary Synthesizer & Geo-Clustering Agent
-----------------------------------------------------
Combines outputs from all 6 upstream agents into a geo-clustered,
day-by-day master itinerary JSON.
Strictly standardized on Indian Rupees (INR / ₹) with exact latitude/longitude coordinates.
"""
from __future__ import annotations

from typing import Any
from app.models import TripState
from app.gemini_client import generate_json_with_fallback

_SYSTEM_PROMPT = """\
You are an expert Principal Travel Itinerary Architect.
Synthesize all agent findings into a polished, geo-clustered day-by-day travel plan.
All currency must be strictly formatted in Indian Rupees (INR / ₹). Do NOT use USD ($).

Requirements:
1. Geo-cluster attractions and dining spots by geographical proximity for Morning, Afternoon, and Evening to eliminate backtracking.
2. Provide exact place names, coordinates (lat, lon), estimated entry fees in INR (₹), and dining costs in INR (₹).
3. Include realistic travel notes between stops (e.g. '15-min auto ride ~₹60' or '10-min walk').

JSON Schema (Strict):
{
  "origin": "Origin City",
  "destination": "Destination City",
  "duration_days": integer,
  "budget_tier": "low|medium|high",
  "vibe": "string",
  "summary": "2–3 sentence trip overview",
  "highlights": ["Top highlight 1", "Top highlight 2", "Top highlight 3"],
  "days": [
    {
      "day": 1,
      "title": "Day Title (e.g. 'Day 1: North Goa Coastal Exploration & Fort Aguada')",
      "theme": "Theme of the day",
      "morning": {
        "time": "09:00 AM",
        "activity": "Activity name",
        "place": "Place name",
        "description": "Engaging 2-sentence description",
        "tips": "Practical tip",
        "estimated_cost_inr": "Free / ₹50",
        "lat": 15.49,
        "lon": 73.82,
        "duration_hours": 2.0
      },
      "afternoon": {
        "time": "01:30 PM",
        "activity": "Activity name",
        "place": "Place name",
        "description": "Engaging 2-sentence description",
        "tips": "Practical tip",
        "estimated_cost_inr": "₹100",
        "lat": 15.50,
        "lon": 73.83,
        "duration_hours": 2.5
      },
      "evening": {
        "time": "06:00 PM",
        "activity": "Evening sunset or cultural activity",
        "place": "Place name",
        "description": "Engaging 2-sentence description",
        "tips": "Practical tip",
        "estimated_cost_inr": "Free",
        "lat": 15.51,
        "lon": 73.84,
        "duration_hours": 2.0
      },
      "meals": [
        {
          "meal": "breakfast",
          "place": "Cafe / Restaurant name",
          "cuisine": "Cuisine type",
          "budget_note": "₹150–₹250/person",
          "estimated_cost_inr": 200,
          "lat": 15.49,
          "lon": 73.82
        },
        {
          "meal": "lunch",
          "place": "Restaurant name",
          "cuisine": "Authentic Regional Thali / Specialties",
          "budget_note": "₹350–₹500/person",
          "estimated_cost_inr": 400,
          "lat": 15.50,
          "lon": 73.83
        },
        {
          "meal": "dinner",
          "place": "Dining spot",
          "cuisine": "Cuisine type",
          "budget_note": "₹450–₹700/person",
          "estimated_cost_inr": 550,
          "lat": 15.51,
          "lon": 73.84
        }
      ],
      "travel_note": "Local transit guidance between activities (e.g. 'Rent a scooter for ₹400/day or hire local auto-rickshaws for ₹50–₹100 between stops')."
    }
  ],
  "practical_tips": [
    "Tip 1 in INR",
    "Tip 2 in INR",
    "Tip 3 in INR",
    "Tip 4 in INR",
    "Tip 5 in INR"
  ],
  "estimated_daily_budget_inr": "e.g. ₹2,500 – ₹4,000/day"
}
"""


def _geo_cluster_places(places: list[dict], n_days: int) -> list[list[dict]]:
    """Cluster places into n_days buckets to reduce travel backtracking."""
    if not places or n_days <= 0:
        return [[] for _ in range(n_days)]

    with_coords = [p for p in places if p.get("lat") and p.get("lon")]
    without_coords = [p for p in places if not (p.get("lat") and p.get("lon"))]

    with_coords.sort(key=lambda p: (p.get("lat", 0), p.get("lon", 0)))

    buckets: list[list[dict]] = [[] for _ in range(n_days)]
    for i, place in enumerate(with_coords):
        buckets[i % n_days].append(place)
    for i, place in enumerate(without_coords):
        buckets[i % n_days].append(place)
    return buckets


async def synthesizer_node(state: TripState) -> TripState:
    """Combine all agent outputs -> geo-clustered final itinerary in INR."""
    dest = state.destination or state.location or "Goa"
    print(f"[Synthesizer] Building master geo-clustered itinerary for {dest} ({state.duration_days} days) in INR...")

    clusters = _geo_cluster_places(state.attractions, state.duration_days)

    attractions_summary = "\n".join(
        f"- {p['name']} (type: {p['type']}, fee: {p.get('entry_fee_inr', 'Free')}, lat: {p.get('lat','?')}, lon: {p.get('lon','?')})"
        for p in state.attractions[:18]
    ) or "Real OpenStreetMap spots available."

    food_summary = "\n".join(
        f"- {p['name']} (cuisine: {p.get('tags', {}).get('cuisine', 'local')}, est: {p.get('meal_cost_note', 'Rs 350/person')}, lat: {p.get('lat','?')}, lon: {p.get('lon','?')})"
        for p in state.food_spots[:18]
    ) or "Authentic regional dining spots available."

    specialties_str = ", ".join(state.specialty_dishes) if state.specialty_dishes else "Regional Specialties"

    transit_summary = ""
    if state.transit_data.get("options"):
        transit_summary = "\n".join(
            f"  * {opt['mode']}: {opt['estimated_fare_inr']} ({opt['duration']})"
            for opt in state.transit_data["options"] if opt.get("available")
        )

    user_prompt = f"""
Trip Profile:
  Origin       : {state.origin or 'Mumbai'}
  Destination  : {dest}
  Duration     : {state.duration_days} Day(s)
  Budget Tier  : {state.budget.upper()} (Target: Rs {state.budget_inr:,} if specified)
  Party Type   : {state.party_type}
  Pace         : {state.pace}
  Dietary      : {state.dietary or 'Any'}
  Themes       : {', '.join(state.themes) if state.themes else 'general'}
  Center Coords: lat={state.lat:.4f}, lon={state.lon:.4f}

Intercity Transit Summary ({state.origin} -> {dest}):
{transit_summary}

Regional Food Specialties to Feature:
{specialties_str}

Real OpenStreetMap Cultural Attractions:
{attractions_summary}

Real OpenStreetMap Dining Spots:
{food_summary}

Generate the complete master itinerary JSON now strictly in Indian Rupees (INR / Rs).
"""

    try:
        itinerary = await generate_json_with_fallback(_SYSTEM_PROMPT + "\n\n" + user_prompt)
        state.itinerary = itinerary
        print(f"[Synthesizer] [OK] Master Itinerary generated ({len(itinerary.get('days', []))} days).")
    except Exception as exc:
        print(f"[Synthesizer] Notice: Model fallback, constructing algorithmic itinerary ({exc})")
        state.itinerary = _build_fallback_itinerary_inr(state)

    return state


def _build_fallback_itinerary_inr(state: TripState) -> dict[str, Any]:
    """Fallback rule-based itinerary in INR using real OSM POIs."""
    dest = state.destination or state.location or "Goa"
    attractions = state.attractions or [
        {"name": f"Historic Centre of {dest}", "lat": state.lat, "lon": state.lon, "entry_fee_inr": "Free Entry"},
        {"name": f"Scenic Sunset Promenade / Beach", "lat": state.lat + 0.01, "lon": state.lon + 0.01, "entry_fee_inr": "Free Entry"},
        {"name": f"Heritage Fort & Museum", "lat": state.lat - 0.01, "lon": state.lon - 0.01, "entry_fee_inr": "Rs 50 (Rs 500 for Foreigners)"},
    ]
    food_spots = state.food_spots or [
        {"name": f"Local {dest} Kitchen", "tags": {"cuisine": "Regional"}, "lat": state.lat, "lon": state.lon},
        {"name": "Traditional Cafe & Breakfast", "tags": {"cuisine": "Breakfast"}, "lat": state.lat + 0.005, "lon": state.lon},
    ]

    days = []
    for d in range(1, state.duration_days + 1):
        base = (d - 1) * 3
        a_m = attractions[base % len(attractions)]
        a_a = attractions[(base + 1) % len(attractions)]
        a_e = attractions[(base + 2) % len(attractions)]
        f_b = food_spots[(d - 1) % len(food_spots)]
        f_l = food_spots[d % len(food_spots)]
        f_d = food_spots[(d + 1) % len(food_spots)]

        days.append({
            "day": d,
            "title": f"Day {d}: Exploring {a_m['name']} & {dest} Heritage",
            "theme": f"Cultural immersion and authentic regional flavors in {dest}",
            "morning": {
                "time": "09:00 AM",
                "activity": f"Morning visit to {a_m['name']}",
                "place": a_m["name"],
                "description": f"Start your day exploring {a_m['name']} before peak midday temperatures.",
                "tips": "Carry a refillable water bottle and comfortable walking shoes.",
                "estimated_cost_inr": a_m.get("entry_fee_inr", "Free Entry"),
                "lat": a_m.get("lat", state.lat),
                "lon": a_m.get("lon", state.lon),
                "duration_hours": 2.0,
            },
            "afternoon": {
                "time": "02:00 PM",
                "activity": f"Afternoon discovery at {a_a['name']}",
                "place": a_a["name"],
                "description": f"Immerse yourself in the architecture and scenic views at {a_a['name']}.",
                "tips": "Great photo opportunities and shaded rest spots.",
                "estimated_cost_inr": a_a.get("entry_fee_inr", "Free Entry"),
                "lat": a_a.get("lat", state.lat),
                "lon": a_a.get("lon", state.lon),
                "duration_hours": 2.5,
            },
            "evening": {
                "time": "06:00 PM",
                "activity": f"Sunset & evening stroll at {a_e['name']}",
                "place": a_e["name"],
                "description": f"Unwind during golden hour at {a_e['name']}.",
                "tips": "Arrive 30 minutes before sunset to secure a good viewpoint.",
                "estimated_cost_inr": a_e.get("entry_fee_inr", "Free Entry"),
                "lat": a_e.get("lat", state.lat),
                "lon": a_e.get("lon", state.lon),
                "duration_hours": 2.0,
            },
            "meals": [
                {
                    "meal": "breakfast",
                    "place": f_b["name"],
                    "cuisine": "Traditional Morning Breakfast & Chai",
                    "budget_note": "Rs 150-Rs 250/person",
                    "estimated_cost_inr": 200,
                    "lat": f_b.get("lat", state.lat),
                    "lon": f_b.get("lon", state.lon),
                },
                {
                    "meal": "lunch",
                    "place": f_l["name"],
                    "cuisine": "Regional Authentic Thali / Specialties",
                    "budget_note": "Rs 350-Rs 500/person",
                    "estimated_cost_inr": 400,
                    "lat": f_l.get("lat", state.lat),
                    "lon": f_l.get("lon", state.lon),
                },
                {
                    "meal": "dinner",
                    "place": f_d["name"],
                    "cuisine": "Fresh Local Dining & Desserts",
                    "budget_note": "Rs 450-Rs 700/person",
                    "estimated_cost_inr": 550,
                    "lat": f_d.get("lat", state.lat),
                    "lon": f_d.get("lon", state.lon),
                },
            ],
            "travel_note": "Rent a scooter (Rs 400-Rs 600/day) or hire auto-rickshaws for short Rs 50-Rs 100 hops between spots.",
        })

    return {
        "origin": state.origin or "Mumbai",
        "destination": dest,
        "duration_days": state.duration_days,
        "budget_tier": state.budget,
        "vibe": state.vibe,
        "summary": f"A curated {state.duration_days}-day trip to {dest} balancing top sights, regional cuisine, and smooth transit in Indian Rupees (Rs).",
        "highlights": [a["name"] for a in attractions[:3]],
        "days": days,
        "practical_tips": [
            "Use UPI (Google Pay / PhonePe / Paytm) for contactless payments across food stalls and auto-rickshaws.",
            "Book train tickets via IRCTC in advance for guaranteed 3AC/2AC berths.",
            "Keep emergency contact 112 saved for all travel assistance across India.",
            "Carry a government ID (Aadhaar / Passport) for hotel check-ins and monument tickets.",
            "Pre-negotiate auto-rickshaw fares or insist on meter rates.",
        ],
        "estimated_daily_budget_inr": "Rs 2,000 - Rs 3,500/day",
    }
