"""
Attractions Agent
-----------------
Queries OpenStreetMap Overpass API for real tourist attractions, beaches,
viewpoints, and historic sites in the destination bounding box.
"""
from __future__ import annotations

from app.models import TripState
from app.overpass_client import (
    elements_to_places,
    get_bounding_box,
    query_overpass,
)


async def attractions_node(state: TripState) -> TripState:
    """LangGraph node: fetch real attractions from OpenStreetMap."""
    search_target = state.location or state.city or "Goa, India"
    print(f"[AttractionsAgent] Finding real sights for '{search_target}'...")

    bbox = await get_bounding_box(search_target)
    if bbox:
        s, w, n, e = bbox
        ql = f"""\
[out:json][timeout:10];
(
  node["natural"="beach"]({s}, {w}, {n}, {e});
  node["tourism"="attraction"]({s}, {w}, {n}, {e});
  node["tourism"="viewpoint"]({s}, {w}, {n}, {e});
  node["historic"="fort"]({s}, {w}, {n}, {e});
);
out body 20;
"""
        elements = await query_overpass(ql, timeout=10)
    else:
        elements = []

    places = elements_to_places(elements, limit=20)
    state.attractions = places
    print(f"[AttractionsAgent] Found {len(places)} real OSM attractions.")
    return state
