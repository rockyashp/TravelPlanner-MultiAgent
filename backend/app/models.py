"""
Pydantic models for the 7-Agent AI Travel Planning pipeline.
Strictly standardized on Indian Rupees (INR / ₹).
"""
from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


# ── Transit Schemas ───────────────────────────────────────────────────────────

class TransitOption(BaseModel):
    available: bool = True
    mode: str = "Flight"  # "Flight" | "Train / Rail" | "Intercity Bus" | "Outstation Cab"
    duration: str = ""
    estimated_fare_inr: str = ""
    avg_cost_inr: int = 0
    details: str = ""
    booking_tip: str = ""


class LocalTransitInfo(BaseModel):
    metro: str = ""
    auto_rickshaw: str = ""
    app_cabs: str = ""
    rentals: str = ""


class TransitComparisonData(BaseModel):
    origin: str = ""
    destination: str = ""
    distance_km: int = 0
    options: list[TransitOption] = Field(default_factory=list)
    local_transit_recommendations: dict[str, str] = Field(default_factory=dict)
    summary: str = ""


# ── Activity & Dining Schemas ──────────────────────────────────────────────────

class TimeSlot(BaseModel):
    time: str = ""
    activity: str = ""
    place: str = ""
    description: str = ""
    tips: str = ""
    estimated_cost_inr: str = "Free"
    lat: float = 0.0
    lon: float = 0.0
    duration_hours: float = 2.0


class MealItem(BaseModel):
    meal: str = "lunch"  # "breakfast" | "lunch" | "dinner" | "street_food"
    place: str = ""
    cuisine: str = "Local Specialties"
    budget_note: str = "₹250–₹400/person"
    estimated_cost_inr: int = 350
    lat: float = 0.0
    lon: float = 0.0


class DayPlan(BaseModel):
    day: int = 1
    title: str = ""
    theme: str = ""
    morning: TimeSlot = Field(default_factory=TimeSlot)
    afternoon: TimeSlot = Field(default_factory=TimeSlot)
    evening: TimeSlot = Field(default_factory=TimeSlot)
    meals: list[MealItem] = Field(default_factory=list)
    travel_note: str = ""


class FinalItinerary(BaseModel):
    origin: str = ""
    destination: str = ""
    duration_days: int = 1
    budget_tier: str = "medium"
    vibe: str = ""
    summary: str = ""
    highlights: list[str] = Field(default_factory=list)
    days: list[DayPlan] = Field(default_factory=list)
    practical_tips: list[str] = Field(default_factory=list)
    estimated_daily_budget_inr: str = "₹1,500 – ₹3,000/day"


# ── Weather Schemas ────────────────────────────────────────────────────────────

class WeatherDay(BaseModel):
    date: str = ""
    temp_max_c: float | None = None
    temp_min_c: float | None = None
    precipitation_mm: float = 0.0
    rain_probability_pct: int = 0
    uv_index: float = 0.0
    sunrise: str = ""
    sunset: str = ""
    condition: str = "Clear"
    wmo_code: int = 0


class WeatherAIInsights(BaseModel):
    overall_summary: str = ""
    best_days: list[str] = Field(default_factory=list)
    rain_risk_days: list[str] = Field(default_factory=list)
    indoor_contingencies: list[str] = Field(default_factory=list)
    packing_weather_tips: list[str] = Field(default_factory=list)


class WeatherData(BaseModel):
    timezone: str = "Asia/Kolkata"
    latitude: float = 0.0
    longitude: float = 0.0
    days: list[WeatherDay] = Field(default_factory=list)
    ai_insights: WeatherAIInsights = Field(default_factory=WeatherAIInsights)


# ── Budget & Safety Schemas (INR ₹) ──────────────────────────────────────────

class BudgetCategoryINR(BaseModel):
    low: str = "₹1,000"
    mid: str = "₹2,500"
    note: str = ""


class BudgetBreakdownINR(BaseModel):
    currency: str = "INR (₹)"
    total_estimated_inr: str = "₹12,000 – ₹18,000"
    per_day_average_inr: str = "₹3,500/day"
    breakdown: dict[str, Any] = Field(default_factory=dict)
    money_saving_tips: list[str] = Field(default_factory=list)
    transit_saving_tips: list[str] = Field(default_factory=list)


class SafetyAndPackingData(BaseModel):
    emergency_contacts: dict[str, str] = Field(
        default_factory=lambda: {
            "National Emergency": "112",
            "Police": "100",
            "Ambulance": "108 / 102",
            "Fire": "101",
            "Women Helpline": "1091",
            "Tourist Helpline": "1363",
        }
    )
    safety_tips: list[str] = Field(default_factory=list)
    cultural_etiquette: list[str] = Field(default_factory=list)
    tipping_norms: str = "5%–10% in sit-down restaurants, ₹20–₹50 for porters."
    scam_alerts: list[str] = Field(default_factory=list)
    packing_checklist: dict[str, list[str]] = Field(default_factory=dict)
    local_phrases: list[dict[str, str]] = Field(default_factory=list)


# ── Mutable LangGraph State ────────────────────────────────────────────────────

class TripState(BaseModel):
    """LangGraph state threaded through the 7-agent pipeline."""

    raw_query: str = ""

    # 1. Intent & Profile Agent
    origin: str = ""
    origin_city: str = ""
    origin_lat: float = 0.0
    origin_lon: float = 0.0

    destination: str = ""
    location: str = ""  # alias for destination
    city: str = ""
    country: str = "India"
    lat: float = 0.0
    lon: float = 0.0
    duration_days: int = 2
    vibe: str = ""
    budget: str = "medium"      # "low" | "medium" | "high"
    budget_inr: int = 0         # numerical target if provided
    party_type: str = "solo"    # "solo" | "couple" | "family" | "friends"
    pace: str = "balanced"      # "relaxed" | "balanced" | "packed"
    dietary: str = ""           # e.g., "Vegetarian", "Jain", "Halal"
    themes: list[str] = Field(default_factory=list)

    # 2. Attractions Agent
    attractions: list[dict[str, Any]] = Field(default_factory=list)

    # 3. Culinary Agent
    food_spots: list[dict[str, Any]] = Field(default_factory=list)
    specialty_dishes: list[str] = Field(default_factory=list)

    # 4. Weather Agent
    weather_data: dict[str, Any] = Field(default_factory=dict)

    # 5. Intercity & Local Transit Agent
    transit_data: dict[str, Any] = Field(default_factory=dict)

    # 6. Budget Optimizer & Safety/Packing Agent
    budget_breakdown: dict[str, Any] = Field(default_factory=dict)
    safety_data: dict[str, Any] = Field(default_factory=dict)
    safety_tips: list[str] = Field(default_factory=list)
    cultural_etiquette: list[str] = Field(default_factory=list)

    # 7. Synthesizer Itinerary Output
    itinerary: dict[str, Any] = Field(default_factory=dict)

    # Error logging
    error: str = ""


# ── API Request / Response Schemas ────────────────────────────────────────────

class PlanTripRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        example="Plan a 3-day trip from Mumbai to Goa for a couple, budget ₹25,000, vegetarian food, beach and sunset vibe.",
    )


class PlanTripResponse(BaseModel):
    success: bool
    itinerary: dict[str, Any]
    transit: dict[str, Any] = Field(default_factory=dict)
    weather: dict[str, Any] = Field(default_factory=dict)
    budget_breakdown: dict[str, Any] = Field(default_factory=dict)
    safety: dict[str, Any] = Field(default_factory=dict)
    meta: dict[str, Any] = Field(default_factory=dict)
    error: str = ""


# ── SSE Event Model ───────────────────────────────────────────────────────────

class AgentEvent(BaseModel):
    node: str
    status: str  # "started" | "completed" | "error"
    summary: str = ""
    data: dict[str, Any] = Field(default_factory=dict)
