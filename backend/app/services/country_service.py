"""
RestCountries + ExchangeRate-API service.
Retrieves currency, emergency numbers, language, calling code, and cultural context.
Uses follow_redirects=True for httpx.
"""
from __future__ import annotations

import httpx
from typing import Any

_REST_COUNTRIES_URL = "https://restcountries.com/v3.1/name/{country}"


async def fetch_country_info(country: str) -> dict[str, Any]:
    """
    Returns a structured country metadata dict for the safety/packing agent.
    Gracefully falls back on errors.
    """
    if not country:
        return _fallback(country)

    try:
        url = _REST_COUNTRIES_URL.format(country=country.strip())
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url, params={"fullText": "false"})
            if resp.status_code != 200:
                return _fallback(country)
            data = resp.json()

        if not data or not isinstance(data, list):
            return _fallback(country)

        c = data[0]
        # Currency
        currencies = c.get("currencies", {})
        currency_info = []
        if isinstance(currencies, dict):
            for code, info in currencies.items():
                currency_info.append({
                    "code": code,
                    "name": info.get("name", ""),
                    "symbol": info.get("symbol", ""),
                })

        # Languages
        languages = list(c.get("languages", {}).values()) if isinstance(c.get("languages"), dict) else []

        # Calling code
        idd = c.get("idd", {})
        calling_code = (idd.get("root", "") + (idd.get("suffixes") or [""])[0]).strip()

        # Capital
        capital = (c.get("capital") or [""])[0] if isinstance(c.get("capital"), list) else ""

        return {
            "country": c.get("name", {}).get("common", country),
            "capital": capital,
            "region": c.get("region", ""),
            "subregion": c.get("subregion", ""),
            "currencies": currency_info,
            "languages": languages,
            "calling_code": calling_code,
            "timezones": c.get("timezones", []),
            "flag_emoji": c.get("flags", {}).get("alt", ""),
        }

    except Exception as exc:
        print(f"[CountryService] fetch note for '{country}': {exc}")
        return _fallback(country)


def _fallback(country: str) -> dict[str, Any]:
    return {
        "country": country,
        "capital": "",
        "region": "",
        "subregion": "",
        "currencies": [],
        "languages": [],
        "calling_code": "",
        "timezones": [],
        "flag_emoji": "",
    }
