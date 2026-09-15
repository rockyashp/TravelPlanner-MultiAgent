"""
FastAPI entry point -- SAFAR-AI Multi-Agent Travel Planner.
Exposes:
  GET  /health                  -- service health check
  POST /api/plan-trip           -- full itinerary & logistics in INR (₹)
  POST /api/plan-trip/stream    -- real-time SSE multi-agent progress streaming
"""
from __future__ import annotations

import asyncio
import json
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from app.models import PlanTripRequest, PlanTripResponse, TripState
from app.graph import run_trip_pipeline

# Import individual agents for SSE streaming orchestration
from app.agents import (
    intent_agent_node,
    attractions_node,
    culinary_node,
    weather_agent_node,
    transit_agent_node,
    budget_safety_node,
    synthesizer_node,
)

app = FastAPI(
    title="SAFAR-AI Multi-Agent Travel Planner API",
    version="2.5.0",
    description="7-Agent LangGraph + Gemini + Open Data travel planner in Indian Rupees (INR / ₹).",
)

# CORS setup for Vite dev server & production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _state_to_response(state: TripState) -> PlanTripResponse:
    return PlanTripResponse(
        success=not bool(state.error) or bool(state.itinerary),
        itinerary=state.itinerary,
        transit=state.transit_data,
        weather=state.weather_data,
        budget_breakdown=state.budget_breakdown,
        safety=state.safety_data,
        meta={
            "origin":              state.origin,
            "origin_city":         state.origin_city,
            "destination":         state.destination or state.location,
            "city":                state.city,
            "country":             state.country,
            "lat":                 state.lat,
            "lon":                 state.lon,
            "duration_days":       state.duration_days,
            "vibe":                state.vibe,
            "budget":              state.budget,
            "budget_inr":          state.budget_inr,
            "party_type":          state.party_type,
            "pace":                state.pace,
            "dietary":             state.dietary,
            "themes":              state.themes,
            "attractions_found":   len(state.attractions),
            "food_spots_found":    len(state.food_spots),
            "specialty_dishes":    state.specialty_dishes,
        },
        error=state.error,
    )


@app.get("/health", tags=["Meta"])
async def health_check() -> dict:
    return {
        "status": "ok",
        "service": "SAFAR-AI Multi-Agent Travel Planner",
        "version": "2.5.0",
        "currency": "INR (₹)",
    }


@app.post("/api/plan-trip", response_model=PlanTripResponse, tags=["Planner"])
async def plan_trip(body: PlanTripRequest) -> PlanTripResponse:
    """
    Full 7-agent pipeline (blocking execution).
    Returns complete itinerary, intercity transit, weather, budget in INR (₹), and safety checklists.
    """
    try:
        state = await run_trip_pipeline(body.query)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if state.error and not state.itinerary:
        raise HTTPException(status_code=502, detail=state.error)

    return _state_to_response(state)


@app.post("/api/plan-trip/stream", tags=["Planner"])
async def plan_trip_stream(body: PlanTripRequest) -> EventSourceResponse:
    """
    SSE streaming endpoint.
    Yields real-time events as each of the 7 LangGraph nodes starts and completes.
    Final event carries the complete response payload.
    """
    async def _event_stream() -> AsyncIterator[dict]:
        state = TripState(raw_query=body.query)

        async def _emit(node: str, status: str, summary: str = "", data: dict | None = None):
            payload = {"node": node, "status": status, "summary": summary}
            if data:
                payload["data"] = data
            yield {"event": "agent_update", "data": json.dumps(payload)}

        # 1. Intent & Profile Agent
        async for ev in _emit("intent_agent", "started", "Parsing travel origin, destination, dates & INR budget..."):
            yield ev
        state = await intent_agent_node(state)
        target_str = f" | Target: ₹{state.budget_inr:,}" if state.budget_inr > 0 else ""
        async for ev in _emit(
            "intent_agent",
            "completed",
            f"Trip: {state.origin} -> {state.destination} | {state.duration_days}d | {state.budget.upper()}{target_str} | {state.party_type.title()}",
        ):
            yield ev

        # 2–5. Parallel Fan-Out: 4 Concurrent Agents
        async for ev in _emit("attractions", "started", "Fetching cultural landmarks from OpenStreetMap..."):
            yield ev
        async for ev in _emit("culinary", "started", "Discovering dining spots & regional food specialties..."):
            yield ev
        async for ev in _emit("weather", "started", "Querying Open-Meteo 7-day climate forecast..."):
            yield ev
        async for ev in _emit("transit", "started", f"Comparing Flights, Trains, Buses & Cabs ({state.origin} -> {state.destination})..."):
            yield ev

        results = await asyncio.gather(
            attractions_node(TripState(**state.model_dump())),
            culinary_node(TripState(**state.model_dump())),
            weather_agent_node(TripState(**state.model_dump())),
            transit_agent_node(TripState(**state.model_dump())),
            return_exceptions=True,
        )

        attr_state, cul_state, wx_state, transit_state = results

        if not isinstance(attr_state, Exception):
            state.attractions = attr_state.attractions
            async for ev in _emit("attractions", "completed", f"Found {len(state.attractions)} cultural sights with INR entry fees"):
                yield ev
        else:
            async for ev in _emit("attractions", "completed", "Attractions processed with fallback spots"):
                yield ev

        if not isinstance(cul_state, Exception):
            state.food_spots = cul_state.food_spots
            state.specialty_dishes = cul_state.specialty_dishes
            async for ev in _emit("culinary", "completed", f"Found {len(state.food_spots)} dining spots & {len(state.specialty_dishes)} regional dishes"):
                yield ev
        else:
            async for ev in _emit("culinary", "completed", "Culinary spots ready"):
                yield ev

        if not isinstance(wx_state, Exception):
            state.weather_data = wx_state.weather_data
            async for ev in _emit("weather", "completed", f"Retrieved {len(state.weather_data.get('days', []))}-day weather forecast & rain alerts"):
                yield ev
        else:
            async for ev in _emit("weather", "completed", "Weather forecast loaded"):
                yield ev

        if not isinstance(transit_state, Exception):
            state.transit_data = transit_state.transit_data
            summary_txt = state.transit_data.get("summary") or "Flight, Train, Bus & Cab comparisons ready"
            async for ev in _emit("transit", "completed", f"{summary_txt[:80]}..."):
                yield ev
        else:
            async for ev in _emit("transit", "completed", "Transit options evaluated in INR"):
                yield ev

        # 6. Budget (INR ₹) & Safety / Packing Agent (Fan-In)
        async for ev in _emit("budget_safety", "started", "Building detailed INR (₹) financial model & packing checklist..."):
            yield ev
        state = await budget_safety_node(state)
        total_inr = state.budget_breakdown.get("total_estimated_inr", "Budget ready")
        async for ev in _emit("budget_safety", "completed", f"Estimated budget: {total_inr} | Safety checklist & emergency contacts ready"):
            yield ev

        # 7. Master Itinerary Synthesizer & Geo-Clustering
        async for ev in _emit("synthesizer", "started", "Synthesizing geo-clustered master itinerary in INR (₹)..."):
            yield ev
        state = await synthesizer_node(state)
        days_count = len(state.itinerary.get("days", []))
        async for ev in _emit("synthesizer", "completed", f"Master {days_count}-day itinerary ready with interactive map coordinates!"):
            yield ev

        # Final Payload Emission
        response = _state_to_response(state)
        yield {
            "event": "complete",
            "data": json.dumps({"result": response.model_dump()}),
        }

    return EventSourceResponse(_event_stream())
