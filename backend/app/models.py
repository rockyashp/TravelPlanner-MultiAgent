"""Pydantic models shared across agents and the API layer."""
from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


# ── Graph state ──────────────────────────────────────────────────────────────

class TripState(BaseModel):
    """Mutable state passed through the LangGraph nodes."""

    # Set by the user / API
    raw_query: str = ""

    # Populated by Intent Parser
    location: str = ""
    city: str = ""          # OSM-friendly city name
    country: str = ""
    duration_days: int = 1
    vibe: str = ""
    budget: str = "medium"  # "low" | "medium" | "high"

    # Populated by parallel agents
    attractions: list[dict[str, Any]] = Field(default_factory=list)
    food_spots: list[dict[str, Any]] = Field(default_factory=list)

    # Populated by Synthesizer
    itinerary: dict[str, Any] = Field(default_factory=dict)

    # Error propagation
    error: str = ""


# ── API request / response ────────────────────────────────────────────────────

class PlanTripRequest(BaseModel):
    query: str = Field(..., min_length=5, max_length=1000,
                       example="I want to go to Goa for 2 days, low budget, want to eat seafood and see quiet beaches.")


class PlanTripResponse(BaseModel):
    success: bool
    itinerary: dict[str, Any]
    meta: dict[str, Any] = Field(default_factory=dict)
    error: str = ""
