"""
Attractions & Cultural Discovery Agent
----------------------------------------
Queries OpenStreetMap Overpass API for tourism, heritage, viewpoints, and beaches.
Augments top POIs with Wikipedia summaries and INR (₹) entrance cost estimates.
"""
from __future__ import annotations

from app.models import TripState
from app.overpass_client import elements_to_places, get_bounding_box, query_overpass
from app.services.wikivoyage_service import enrich_places_with_wiki


def _estimate_inr_entry(poi_type: str, name: str) -> str:
    """Estimate entrance fee in Indian Rupees (₹) based on sight type."""
    t = poi_type.lower()
    n = name.lower()
    if any(w in n for w in ["beach", "viewpoint", "park", "ghat", "promenade", "bridge", "market"]):
        return "Free Entry"
    if any(w in t for w in ["museum", "gallery"]):
        return "₹50 – ₹150 (₹500 for Foreigners)"
    if any(w in t for w in ["castle", "fort", "palace", "monument"]):
        return "₹25 – ₹100 (₹300 – ₹600 for Foreigners)"
    if "temple" in n or "church" in n or "mosque" in n:
        return "Free Entry (Donation optional)"
    return "Free / Nominal Entry (₹20–₹50)"


async def attractions_node(state: TripState) -> TripState:
    """Fetch real attractions from OSM + enrich with Wiki + INR ticket estimates."""
    target = state.destination or state.city or state.location or "Goa, India"
    print(f"[AttractionsAgent] Finding cultural sights for '{target}'...")

    bbox = await get_bounding_box(target)
    elements: list[dict] = []
    if bbox:
        s, w, n, e = bbox
        ql = f"""\
[out:json][timeout:10];
(
  node["tourism"="attraction"]({s},{w},{n},{e});
  node["tourism"="viewpoint"]({s},{w},{n},{e});
  node["tourism"="museum"]({s},{w},{n},{e});
  node["historic"="monument"]({s},{w},{n},{e});
  node["historic"="fort"]({s},{w},{n},{e});
  node["historic"="castle"]({s},{w},{n},{e});
  node["natural"="beach"]({s},{w},{n},{e});
  node["leisure"="park"]({s},{w},{n},{e});
);
out center 25;
"""
        elements = await query_overpass(ql, timeout=6)

    places = elements_to_places(elements, limit=20)

    # Attach INR ticket estimates and suggested dwell times
    for p in places:
        p_type = p.get("type", "attraction")
        p["entry_fee_inr"] = _estimate_inr_entry(p_type, p["name"])
        p["dwell_time"] = "1.5 – 2 hours" if "fort" in p_type or "museum" in p_type else "45 – 60 mins"

    # Enrich top 6 with Wikipedia descriptions
    if places:
        places = await enrich_places_with_wiki(places, max_enriched=6)

    state.attractions = places
    print(f"[AttractionsAgent] Found {len(places)} real OSM attractions with INR pricing.")
    return state
