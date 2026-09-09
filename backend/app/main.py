"""FastAPI application entry point."""
from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import PlanTripRequest, PlanTripResponse
from app.graph import run_trip_pipeline

app = FastAPI(
    title="Multi-Agent Travel Planner API",
    version="1.0.0",
    description="LangGraph + Gemini powered travel itinerary generator.",
)

# Allow the Vite dev server (and any origin in dev) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Meta"])
async def health_check() -> dict:
    return {"status": "ok", "service": "Multi-Agent Travel Planner"}


@app.post("/api/plan-trip", response_model=PlanTripResponse, tags=["Planner"])
async def plan_trip(body: PlanTripRequest) -> PlanTripResponse:
    """
    Accept a natural-language travel query and return a day-by-day itinerary.

    The pipeline runs:
      1. Intent Parser  → extracts structured trip details
      2. Attractions Agent + Culinary Agent  → run in PARALLEL via LangGraph
      3. Synthesizer Agent  → produces final JSON itinerary
    """
    try:
        state = await run_trip_pipeline(body.query)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if state.error and not state.itinerary:
        raise HTTPException(status_code=502, detail=state.error)

    return PlanTripResponse(
        success=not bool(state.error),
        itinerary=state.itinerary,
        meta={
            "location":      state.location,
            "city":          state.city,
            "country":       state.country,
            "duration_days": state.duration_days,
            "vibe":          state.vibe,
            "budget":        state.budget,
            "attractions_found": len(state.attractions),
            "food_spots_found":  len(state.food_spots),
        },
        error=state.error,
    )
