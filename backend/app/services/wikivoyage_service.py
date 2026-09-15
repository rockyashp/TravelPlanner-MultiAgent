"""
WikiVoyage / Wikipedia REST API scraper.
Fetches brief summaries/descriptions for POI names.
Uses the Wikipedia REST summary endpoint with redirects enabled.
"""
from __future__ import annotations

import asyncio
import httpx
from typing import Any

_WIKI_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
_HEADERS = {
    "User-Agent": "SAFAR-AI-Travel-Planner/2.0 (https://github.com/travel; travel@example.com)",
    "Accept": "application/json",
}


async def fetch_poi_summary(name: str) -> str:
    """
    Return a one-paragraph description for a POI name from Wikipedia.
    Returns empty string on failure.
    """
    if not name or name == "Unnamed spot":
        return ""
    try:
        title = name.replace(" ", "_")
        async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:
            resp = await client.get(
                _WIKI_SUMMARY_URL.format(title=title),
                headers=_HEADERS,
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("extract", "")[:400]
    except Exception:
        pass
    return ""


async def enrich_places_with_wiki(
    places: list[dict[str, Any]], max_enriched: int = 8
) -> list[dict[str, Any]]:
    """
    Enrich up to `max_enriched` places with a Wikipedia description.
    Runs fetches concurrently for speed.
    """
    async def _enrich(place: dict[str, Any]) -> dict[str, Any]:
        summary = await fetch_poi_summary(place["name"])
        if summary:
            return {**place, "wiki_summary": summary}
        return place

    top = places[:max_enriched]
    rest = places[max_enriched:]
    enriched = await asyncio.gather(*[_enrich(p) for p in top])
    return list(enriched) + rest
