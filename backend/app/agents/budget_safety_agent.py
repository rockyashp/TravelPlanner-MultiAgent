"""
Budget Optimizer & Safety / Packing Specialist Agent
-----------------------------------------------------
Aggregates overall financial breakdown strictly in Indian Rupees (INR / ₹):
  - Accommodation (₹/night & total)
  - Intercity & Local Travel (₹)
  - Food & Dining (₹/day & total)
  - Attractions & Entry Tickets (₹)
  - Emergency & Miscellaneous Fund (₹)
  - Total Estimated Trip Cost in INR (₹)
"""
from __future__ import annotations

from typing import Any
from app.models import TripState
from app.gemini_client import generate_json_with_fallback
from app.services.country_service import fetch_country_info

_PROMPT_TEMPLATE = """\
You are an expert Indian travel budget planner and tourist safety advisor.
Trip details:
  Origin       : {origin}
  Destination  : {destination}
  Duration     : {days} day(s)
  Budget Tier  : {budget_tier} (low = budget backpacker/hostels, medium = comfortable 3-star/AC, high = luxury resorts/5-star)
  Party Type   : {party_type}
  Pace         : {pace}
  Target Budget: {target_budget}
  Weather summary: {weather_summary}

Calculate a realistic, detailed cost breakdown STRICTLY in Indian Rupees (INR / ₹).
Do NOT use USD ($). All values must have the ₹ symbol.

Return ONLY valid JSON (no markdown):
{{
  "currency": "INR (₹)",
  "total_estimated_inr": "e.g. ₹18,500 – ₹24,000",
  "per_day_average_inr": "e.g. ₹4,500/day",
  "breakdown": {{
    "accommodation": {{"low": "₹1,200/night", "mid": "₹2,800/night", "total": "₹8,400", "note": "Hostel / 3-star AC Hotel"}},
    "intercity_transit": {{"low": "₹1,500", "mid": "₹4,500", "total": "₹4,500", "note": "Train 3AC / Flight"}},
    "local_transport": {{"low": "₹400/day", "mid": "₹800/day", "total": "₹2,400", "note": "Metro, Autos & Scooter Rent"}},
    "meals_dining": {{"low": "₹500/day", "mid": "₹1,200/day", "total": "₹3,600", "note": "Breakfast, Thali & Cafe meals"}},
    "sightseeing_tickets": {{"low": "₹200", "mid": "₹800", "total": "₹1,200", "note": "Forts, Museums & Activity entries"}},
    "emergency_buffer": {{"amount": "₹2,500", "note": "10% contingency & shopping buffer"}}
  }},
  "money_saving_tips": [
    "Book trains via IRCTC 60 days early or check non-peak flight dates",
    "Use Metro Smart Cards or rent a two-wheeler for ₹400/day instead of individual cabs",
    "Eat at authentic local food thali joints for huge savings over tourist beachfront cafes"
  ],
  "safety_tips": [
    "Use prepaid auto/taxi booths at railway stations and airports to avoid inflated quotes",
    "Keep emergency numbers (112) handy and share your live location when traveling late",
    "Beware of unverified touts claiming popular monuments or temple gates are closed"
  ],
  "cultural_etiquette": [
    "Remove shoes before entering temples, mosques, and traditional heritage spaces",
    "Dress modestly with covered shoulders and knees at religious sites",
    "Tipping: 5% to 10% is customary at sit-down dining spots; ₹20–₹50 for luggage porters"
  ],
  "packing_checklist": {{
    "documents": ["Aadhaar / Passport / ID Card", "Train / Flight ticket printouts / DigiYatra", "Hotel booking confirmations"],
    "clothing": ["Breathable cotton garments", "Light jacket/cardigan for AC transit", "Comfortable walking shoes"],
    "health_hygiene": ["Sunscreen SPF 50+", "Mosquito repellent (Odomos)", "Basic medical kit (Paracetamol, ORS electrolytes)"],
    "electronics": ["Power bank (10,000mAh+)", "Universal adapter & phone charging cables"],
    "money_misc": ["Cash in ₹100 / ₹200 / ₹500 denominations for local vendors & autos", "UPI payment apps active on phone"]
  }}
}}
"""


def _build_algorithmic_budget_inr(state: TripState) -> dict[str, Any]:
    """Robust rule-based budget in INR if LLM is unavailable."""
    d = state.duration_days
    tier = state.budget

    if tier == "low":
        hotel_night = 1200
        transit_cost = 2000
        local_day = 400
        food_day = 600
        sight_total = 400
    elif tier == "high":
        hotel_night = 6500
        transit_cost = 9000
        local_day = 1800
        food_day = 2500
        sight_total = 2000
    else:  # medium
        hotel_night = 2800
        transit_cost = 4500
        local_day = 800
        food_day = 1200
        sight_total = 1000

    hotel_total = hotel_night * d
    local_total = local_day * d
    food_total = food_day * d
    contingency = int((hotel_total + transit_cost + local_total + food_total + sight_total) * 0.10)
    grand_total = hotel_total + transit_cost + local_total + food_total + sight_total + contingency
    per_day = grand_total // d

    return {
        "currency": "INR (₹)",
        "total_estimated_inr": f"₹{grand_total:,}",
        "per_day_average_inr": f"₹{per_day:,}/day",
        "breakdown": {
            "accommodation": {"low": f"₹{hotel_night:,}/night", "mid": f"₹{int(hotel_night * 1.3):,}/night", "total": f"₹{hotel_total:,}", "note": f"{tier.title()} accommodation"},
            "intercity_transit": {"low": f"₹{transit_cost:,}", "mid": f"₹{int(transit_cost * 1.4):,}", "total": f"₹{transit_cost:,}", "note": "Train 3AC / Flight estimate"},
            "local_transport": {"low": f"₹{local_day:,}/day", "mid": f"₹{int(local_day * 1.3):,}/day", "total": f"₹{local_total:,}", "note": "Metro, Autos & Rentals"},
            "meals_dining": {"low": f"₹{food_day:,}/day", "mid": f"₹{int(food_day * 1.3):,}/day", "total": f"₹{food_total:,}", "note": "Breakfast, Lunch, Dinner & Snacks"},
            "sightseeing_tickets": {"low": f"₹{sight_total:,}", "mid": f"₹{int(sight_total * 1.5):,}", "total": f"₹{sight_total:,}", "note": "Entry tickets & guides"},
            "emergency_buffer": {"amount": f"₹{contingency:,}", "note": "10% contingency buffer"},
        },
        "money_saving_tips": [
            "Book train tickets via IRCTC in advance for guaranteed 3AC/2AC berths.",
            "Rent scooters or utilize Metro smart cards for daily city commuting.",
            "Choose regional thali meals at local establishments for delicious, budget-friendly dining.",
        ],
        "safety_tips": [
            "Always agree on auto fares beforehand or insist on digital meters.",
            "Keep emergency contact 112 saved on speed dial.",
            "Stay hydrated and prefer sealed bottled water.",
        ],
        "cultural_etiquette": [
            "Respect local dress codes when visiting places of worship.",
            "Tipping 5%–10% at sit-down dining spots is customary.",
            "Always seek permission before photographing local residents or heritage rituals.",
        ],
        "packing_checklist": {
            "documents": ["Aadhaar / Passport", "Flight / Train Tickets", "Hotel Booking Receipts"],
            "clothing": ["Comfortable cotton clothes", "Light jacket for air-conditioned travel", "Walking footwear"],
            "health_hygiene": ["Sunscreen SPF 50+", "Mosquito repellent", "Basic first aid kit"],
            "electronics": ["Power bank", "Phone charging cables"],
            "money_misc": ["Cash in small denominations (Rs 100/Rs 200)", "UPI enabled payment app"],
        },
    }


async def budget_safety_node(state: TripState) -> TripState:
    """Optimize budget in INR and generate safety/packing advice."""
    print(f"[BudgetSafetyAgent] Generating INR financial model & safety checklist for {state.destination}...")

    # Fetch country metadata for international/domestic context
    country_info = await fetch_country_info(state.country or "India")

    # Weather summary for context
    weather_days = state.weather_data.get("days", [])
    if weather_days:
        weather_summary = f"{weather_days[0].get('condition', 'Pleasant')}, high {weather_days[0].get('temp_max_c', '30')}C."
    else:
        weather_summary = "Pleasant travel conditions."

    target_str = f"Rs {state.budget_inr:,}" if state.budget_inr > 0 else f"{state.budget.upper()} tier"

    prompt = _PROMPT_TEMPLATE.format(
        origin=state.origin or "Mumbai",
        destination=state.destination or "Goa",
        days=state.duration_days,
        budget_tier=state.budget,
        party_type=state.party_type,
        pace=state.pace,
        target_budget=target_str,
        weather_summary=weather_summary,
    )

    try:
        data = await generate_json_with_fallback(prompt)
        state.budget_breakdown = {
            "currency": "INR (₹)",
            "total_estimated_inr": data.get("total_estimated_inr", "Rs 15,000 - Rs 25,000"),
            "per_day_average_inr": data.get("per_day_average_inr", "Rs 3,500/day"),
            "breakdown": data.get("breakdown", {}),
            "money_saving_tips": data.get("money_saving_tips", []),
            "transit_saving_tips": data.get("transit_saving_tips", []),
        }
        state.safety_data = {
            "emergency_contacts": {
                "National Emergency": "112",
                "Police": "100",
                "Ambulance": "108 / 102",
                "Fire": "101",
                "Women Helpline": "1091",
                "Tourist Helpline": "1363",
            },
            "safety_tips": data.get("safety_tips", []),
            "cultural_etiquette": data.get("cultural_etiquette", []),
            "packing_checklist": data.get("packing_checklist", {}),
            "country_info": country_info,
        }
        state.safety_tips = data.get("safety_tips", [])
        state.cultural_etiquette = data.get("cultural_etiquette", [])
        print(f"[BudgetSafetyAgent] [OK] Budget model (INR) and safety checklist ready.")
    except Exception as exc:
        print(f"[BudgetSafetyAgent] Notice: using algorithmic budget & safety ({exc})")
        fb = _build_algorithmic_budget_inr(state)
        state.budget_breakdown = fb
        state.safety_data = {
            "emergency_contacts": {
                "National Emergency": "112",
                "Police": "100",
                "Ambulance": "108 / 102",
                "Fire": "101",
                "Women Helpline": "1091",
                "Tourist Helpline": "1363",
            },
            "safety_tips": fb["safety_tips"],
            "cultural_etiquette": fb["cultural_etiquette"],
            "packing_checklist": fb["packing_checklist"],
            "country_info": country_info,
        }
        state.safety_tips = fb["safety_tips"]
        state.cultural_etiquette = fb["cultural_etiquette"]

    return state
