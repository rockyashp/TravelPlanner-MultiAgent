"""
LangGraph 7-Agent Parallel Travel Pipeline.
Standardized on Indian Rupees (INR / ₹) and Open APIs.

Topology:
                  [START]
                     │
              [intent_agent]
                     │
     ┌───────────────┼───────────────┬───────────────┐
     ▼               ▼               ▼               ▼
[attractions]    [culinary]       [weather]      [transit]
     │               │               │               │
     └───────────────┴───────────────┴───────────────┘
                     │  (Fan-in: all 4 parallel agents complete)
                     ▼
             [budget_safety]
                     │
                     ▼
               [synthesizer]
                     │
                   [END]
"""
from __future__ import annotations

import asyncio
from typing import Any
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, END

from app.models import TripState
from app.agents import (
    intent_agent_node,
    attractions_node,
    culinary_node,
    weather_agent_node,
    transit_agent_node,
    budget_safety_node,
    synthesizer_node,
)


# ── TypedDict state representation for LangGraph ─────────────────────────────

class GraphState(TypedDict, total=False):
    raw_query: str
    origin: str
    origin_city: str
    origin_lat: float
    origin_lon: float
    destination: str
    location: str
    city: str
    country: str
    lat: float
    lon: float
    duration_days: int
    vibe: str
    budget: str
    budget_inr: int
    party_type: str
    pace: str
    dietary: str
    themes: list[str]
    attractions: list[dict[str, Any]]
    food_spots: list[dict[str, Any]]
    specialty_dishes: list[str]
    weather_data: dict[str, Any]
    transit_data: dict[str, Any]
    budget_breakdown: dict[str, Any]
    safety_data: dict[str, Any]
    safety_tips: list[str]
    cultural_etiquette: list[str]
    itinerary: dict[str, Any]
    error: str


# ── Node Wrappers (isolated key updates to avoid parallel race conditions) ───

async def _intent_wrapper(state: GraphState) -> dict[str, Any]:
    s = TripState(**{k: v for k, v in state.items() if v is not None})
    res = await intent_agent_node(s)
    return {
        "origin": res.origin,
        "origin_city": res.origin_city,
        "origin_lat": res.origin_lat,
        "origin_lon": res.origin_lon,
        "destination": res.destination,
        "location": res.location,
        "city": res.city,
        "country": res.country,
        "lat": res.lat,
        "lon": res.lon,
        "duration_days": res.duration_days,
        "vibe": res.vibe,
        "budget": res.budget,
        "budget_inr": res.budget_inr,
        "party_type": res.party_type,
        "pace": res.pace,
        "dietary": res.dietary,
        "themes": res.themes,
        "error": res.error,
    }


async def _attractions_wrapper(state: GraphState) -> dict[str, Any]:
    s = TripState(**{k: v for k, v in state.items() if v is not None})
    res = await attractions_node(s)
    return {"attractions": res.attractions}


async def _culinary_wrapper(state: GraphState) -> dict[str, Any]:
    s = TripState(**{k: v for k, v in state.items() if v is not None})
    res = await culinary_node(s)
    return {"food_spots": res.food_spots, "specialty_dishes": res.specialty_dishes}


async def _weather_wrapper(state: GraphState) -> dict[str, Any]:
    s = TripState(**{k: v for k, v in state.items() if v is not None})
    res = await weather_agent_node(s)
    return {"weather_data": res.weather_data}


async def _transit_wrapper(state: GraphState) -> dict[str, Any]:
    s = TripState(**{k: v for k, v in state.items() if v is not None})
    res = await transit_agent_node(s)
    return {"transit_data": res.transit_data}


async def _budget_safety_wrapper(state: GraphState) -> dict[str, Any]:
    s = TripState(**{k: v for k, v in state.items() if v is not None})
    res = await budget_safety_node(s)
    return {
        "budget_breakdown": res.budget_breakdown,
        "safety_data": res.safety_data,
        "safety_tips": res.safety_tips,
        "cultural_etiquette": res.cultural_etiquette,
    }


async def _synthesizer_wrapper(state: GraphState) -> dict[str, Any]:
    s = TripState(**{k: v for k, v in state.items() if v is not None})
    res = await synthesizer_node(s)
    return {"itinerary": res.itinerary, "error": res.error}


# ── Graph Builder ─────────────────────────────────────────────────────────────

def _build_graph() -> StateGraph:
    builder = StateGraph(GraphState)

    # 1. Add all 7 Nodes
    builder.add_node("intent_agent",   _intent_wrapper)
    builder.add_node("attractions",    _attractions_wrapper)
    builder.add_node("culinary",       _culinary_wrapper)
    builder.add_node("weather",        _weather_wrapper)
    builder.add_node("transit",        _transit_wrapper)
    builder.add_node("budget_safety",  _budget_safety_wrapper)
    builder.add_node("synthesizer",    _synthesizer_wrapper)

    # 2. Entry point
    builder.set_entry_point("intent_agent")

    # 3. Parallel Fan-Out: intent_agent -> 4 concurrent domain agents
    for node in ("attractions", "culinary", "weather", "transit"):
        builder.add_edge("intent_agent", node)

    # 4. Parallel Fan-In: all 4 domain agents -> budget_safety
    for node in ("attractions", "culinary", "weather", "transit"):
        builder.add_edge(node, "budget_safety")

    # 5. Convergence: budget_safety -> synthesizer -> END
    builder.add_edge("budget_safety", "synthesizer")
    builder.add_edge("synthesizer", END)

    return builder


_compiled_graph = _build_graph().compile()


async def run_trip_pipeline(raw_query: str) -> TripState:
    """Execute the full 7-agent travel pipeline and return final TripState."""
    initial: GraphState = {
        "raw_query": raw_query,
        "attractions": [],
        "food_spots": [],
        "specialty_dishes": [],
        "weather_data": {},
        "transit_data": {},
        "budget_breakdown": {},
        "safety_data": {},
        "safety_tips": [],
        "cultural_etiquette": [],
        "themes": [],
    }
    final = await _compiled_graph.ainvoke(initial)
    return TripState(**final)
