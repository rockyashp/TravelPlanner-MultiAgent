"""
Culinary Agent
--------------
Queries OpenStreetMap Overpass API for real food spots, shacks, cafes,
and seafood restaurants matching the traveler's budget and vibe.
"""
from __future__ import annotations

from app.models import TripState
from app.overpass_client import (
    elements_to_places,
    get_bounding_box,
    query_overpass,
)


async def culinary_node(state: TripState) -> TripState:
    """LangGraph node: fetch real budget-aware food spots from OpenStreetMap."""
    search_target = state.location or state.city or "Goa, India"
    print(f"[CulinaryAgent] Finding {state.budget}-budget food for '{search_target}'...")

    bbox = await get_bounding_box(search_target)
    if bbox:
        s, w, n, e = bbox
        ql = f"""\
[out:json][timeout:10];
(
  node["amenity"="restaurant"]({s}, {w}, {n}, {e});
  node["amenity"="cafe"]({s}, {w}, {n}, {e});
  node["amenity"="fast_food"]({s}, {w}, {n}, {e});
);
out body 25;
"""
        elements = await query_overpass(ql, timeout=10)
    else:
        elements = []

    places = elements_to_places(elements, limit=25)

    # Sort places matching the vibe (e.g. seafood, shacks, local)
    vibe_lower = (state.vibe or "").lower()
    keywords = [w for w in ["seafood", "fish", "beach", "shack", "goan", "local", "cafe", "grill"]
                if w in vibe_lower]

    if keywords:
        def _score(p: dict) -> int:
            cuisine = (p.get("tags", {}).get("cuisine") or "").lower()
            name = (p.get("name") or "").lower()
            score = 0
            for kw in keywords:
                if kw in cuisine:
                    score += 3
                if kw in name:
                    score += 2
            return score
        places.sort(key=_score, reverse=True)

    state.food_spots = places[:20]
    print(f"[CulinaryAgent] Found {len(state.food_spots)} real OSM food spots.")
    return state
