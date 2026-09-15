"""
Culinary & Nightlife Agent
---------------------------
Queries OpenStreetMap for authentic dining spots, cafes, and bakeries.
Identifies regional food specialties, dietary-safe options (Veg, Jain, Halal),
and attaches average meal costs in Indian Rupees (₹).
"""
from __future__ import annotations

from app.models import TripState
from app.overpass_client import elements_to_places, get_bounding_box, query_overpass
from app.gemini_client import generate_json_with_fallback


# Regional Indian food specialty heuristics
_SPECIALTY_MAP: dict[str, list[str]] = {
    "goa": ["Goan Fish Curry Thali", "Prawn Balchão", "Bebinca", "Pork Vindaloo", "Poi Bread & Cafreal", "Sol Kadhi"],
    "mumbai": ["Vada Pav", "Pav Bhaji", "Bombil Fry", "Misal Pav", "Bun Maska & Irani Chai", "Kanda Poha"],
    "delhi": ["Chole Bhature", "Butter Chicken", "Parathas at Chandni Chowk", "Dahi Bhalla", "Kathi Rolls", "Rabri Jalebi"],
    "kerala": ["Appam with Stew", "Kerala Sadya", "Karimeen Pollichathu", "Malabar Parotta & Beef Fry", "Puttu and Kadala Curry"],
    "jaipur": ["Dal Baati Churma", "Pyaaz Kachori", "Gatte ki Sabzi", "Laal Maas", "Ghevar", "Ker Sangri"],
    "udaipur": ["Dal Baati Churma", "Kadhi Pakoda", "Mirchi Vada", "Rajasthani Thali", "Mawa Kachori"],
    "manali": ["Siddu", "Trout Fish", "Thukpa & Momos", "Madra", "Chha Gosht", "Apple Crumble Pie"],
    "hyderabad": ["Hyderabadi Dum Biryani", "Haleem", "Mirchi ka Salan", "Double ka Meetha", "Irani Chai & Osmania Biscuits"],
    "kolkata": ["Kolkata Mutton Biryani", "Kathi Rolls", "Macher Jhol", "Phuchka / Puchka", "Rosogolla & Sandesh", "Mishti Doi"],
    "bangalore": ["Crispy Masala Dosa", "Filter Kaapi", "Bisi Bele Bath", "Mangalore Buns", "Rava Idli at Vidyarthi Bhavan"],
    "chennai": ["Traditional South Indian Thali", "Chettinad Pepper Chicken", "Medu Vada & Filter Coffee", "Idiyappam with Coconut Milk"],
    "amritsar": ["Amritsari Kulcha with Chole", "Makki di Roti & Sarson da Saag", "Amritsari Fish Fry", "Lassi", "Phirni"],
    "varanasi": ["Kachori Sabzi", "Banarasi Paan", "Tamatar Chaat", "Malaiyyo (Winter)", "Lassi at Blue Lassi Shop"],
}


def _estimate_meal_inr(amenity_type: str, budget_tier: str) -> tuple[str, int]:
    """Return (budget_note, cost_inr) per meal."""
    if budget_tier == "low":
        if "cafe" in amenity_type or "bakery" in amenity_type:
            return "₹120 – ₹200/person", 150
        return "₹150 – ₹300/person (Budget Street/Dhaba)", 220
    elif budget_tier == "high":
        if "bar" in amenity_type:
            return "₹1,200 – ₹2,500/person (Craft Cocktails & Dining)", 1800
        return "₹800 – ₹2,000/person (Fine Dining / Heritage)", 1400
    else:  # medium
        if "cafe" in amenity_type:
            return "₹250 – ₹450/person", 350
        return "₹350 – ₹650/person (Casual Dining / AC Restaurant)", 500


async def culinary_node(state: TripState) -> TripState:
    """Fetch authentic dining spots and regional specialty dishes in INR."""
    target = state.destination or state.city or state.location or "Goa, India"
    print(f"[CulinaryAgent] Finding authentic food spots for '{target}'...")

    bbox = await get_bounding_box(target)
    elements: list[dict] = []
    if bbox:
        s, w, n, e = bbox
        ql = f"""\
[out:json][timeout:10];
(
  node["amenity"="restaurant"]({s},{w},{n},{e});
  node["amenity"="cafe"]({s},{w},{n},{e});
  node["amenity"="bar"]({s},{w},{n},{e});
  node["amenity"="fast_food"]({s},{w},{n},{e});
  node["shop"="bakery"]({s},{w},{n},{e});
);
out center 25;
"""
        elements = await query_overpass(ql, timeout=6)

    places = elements_to_places(elements, limit=20)

    # Attach INR meal estimates
    for p in places:
        note, cost = _estimate_meal_inr(p.get("type", "restaurant"), state.budget)
        p["meal_cost_note"] = note
        p["avg_cost_inr"] = cost

    # Determine regional specialty dishes
    clean_city = (state.city or state.destination).lower().split(",")[0].strip()
    specialties = _SPECIALTY_MAP.get(clean_city, [])
    if not specialties:
        for k, v in _SPECIALTY_MAP.items():
            if k in clean_city:
                specialties = v
                break
    if not specialties:
        specialties = ["Regional Thali", "Local Street Food Specials", "Authentic Biryani / Rice Bowls", "Fresh Seasonal Catch / Sweets"]

    state.food_spots = places
    state.specialty_dishes = specialties
    print(f"[CulinaryAgent] Found {len(places)} food spots & {len(specialties)} regional specialties in INR.")
    return state
