"""
High-performance OpenStreetMap client with Nominatim bounding-box geocoding + Overpass.
100% Free & Open APIs.
"""
from __future__ import annotations

import httpx
from app.config import OVERPASS_URL

_HEADERS = {
    "User-Agent": "AuraTravelApp/1.0",
    "Accept": "*/*",
}

# Pre-cached bounding boxes (south, west, north, east) for popular travel hubs
_BBOX_CACHE: dict[str, tuple[float, float, float, float]] = {
    "goa": (14.80, 73.60, 15.80, 74.35),
    "panaji": (15.40, 73.75, 15.60, 73.90),
    "mumbai": (18.85, 72.75, 19.30, 73.05),
    "delhi": (28.40, 76.90, 28.85, 77.35),
    "bangalore": (12.80, 77.45, 13.15, 77.75),
    "tokyo": (35.50, 139.50, 35.85, 139.90),
    "paris": (48.75, 2.20, 48.95, 2.45),
    "london": (51.40, -0.30, 51.60, 0.10),
    "rome": (41.80, 12.35, 42.00, 12.60),
    "kerala": (8.30, 75.80, 12.80, 77.40),
}


async def get_bounding_box(location_name: str) -> tuple[float, float, float, float] | None:
    """
    Resolve location to (south, west, north, east) bbox.
    Uses fast in-memory cache or Nominatim OpenStreetMap API.
    """
    cleaned = location_name.lower().split(",")[0].strip()
    if cleaned in _BBOX_CACHE:
        return _BBOX_CACHE[cleaned]

    try:
        async with httpx.AsyncClient(timeout=6) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": location_name, "format": "json", "limit": 1},
                headers=_HEADERS,
            )
            if resp.status_code == 200:
                data = resp.json()
                if data and len(data) > 0:
                    bbox = data[0].get("boundingbox")
                    if bbox and len(bbox) == 4:
                        s, n, w, e = float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])
                        box = (s, w, n, e)
                        _BBOX_CACHE[cleaned] = box
                        return box
                    else:
                        lat, lon = float(data[0]["lat"]), float(data[0]["lon"])
                        box = (lat - 0.20, lon - 0.20, lat + 0.20, lon + 0.20)
                        _BBOX_CACHE[cleaned] = box
                        return box
    except Exception as exc:
        print(f"[Nominatim] Geocoding notice for '{location_name}': {exc}")

    # Default fallback: Goa bounding box
    return (14.80, 73.60, 15.80, 74.35)


async def query_overpass(ql: str, timeout: int = 12) -> list[dict]:
    """
    Execute Overpass QL query with clean header.
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                OVERPASS_URL,
                data={"data": ql},
                headers=_HEADERS,
            )
            if resp.status_code == 200:
                return resp.json().get("elements", [])
            else:
                print(f"[Overpass] status: {resp.status_code}")
    except Exception as exc:
        print(f"[Overpass] query notice: {exc}")

    return []


def build_place_name(tags: dict) -> str:
    """Extract best human-readable name from OSM tags."""
    return (
        tags.get("name:en")
        or tags.get("name")
        or tags.get("amenity")
        or tags.get("tourism")
        or tags.get("natural")
        or "Unnamed spot"
    )


def elements_to_places(elements: list[dict], limit: int = 20) -> list[dict]:
    """Convert raw Overpass elements to clean structured place dicts."""
    places = []
    seen_names = set()

    for el in elements:
        tags = el.get("tags", {})
        name = build_place_name(tags)
        if name in seen_names or name == "Unnamed spot" or len(name) < 2:
            continue
        seen_names.add(name)

        lat = el.get("lat") or (el.get("center", {}).get("lat"))
        lon = el.get("lon") or (el.get("center", {}).get("lon"))

        places.append(
            {
                "name": name,
                "lat": lat,
                "lon": lon,
                "type": (
                    tags.get("natural")
                    or tags.get("tourism")
                    or tags.get("amenity")
                    or tags.get("historic")
                    or tags.get("leisure")
                    or "place"
                ),
                "tags": {
                    k: v
                    for k, v in tags.items()
                    if k in ("cuisine", "opening_hours", "website", "phone", "description", "fee")
                },
            }
        )
        if len(places) >= limit:
            break

    return places
