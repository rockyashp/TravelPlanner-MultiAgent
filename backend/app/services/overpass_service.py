"""
Overpass service adapter wrapping the high-performance OpenStreetMap client.
"""
from app.overpass_client import (
    get_bounding_box,
    query_overpass,
    elements_to_places,
    build_place_name,
)

__all__ = [
    "get_bounding_box",
    "query_overpass",
    "elements_to_places",
    "build_place_name",
]
