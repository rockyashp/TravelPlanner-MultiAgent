"""
Intercity & Local Transit Specialist Agent
--------------------------------------------
Evaluates travel modes between Origin and Destination:
  1. Flights: Airfare estimates in INR (₹), flight duration, and nearest airport codes.
  2. Trains (IRCTC): Fares in INR (₹) for Sleeper / 3AC / 2AC, duration, and rail stations.
  3. Intercity Buses (Volvo / Sleeper): Fares in INR (₹) and journey times.
  4. Outstation Cabs / Self-Drive: Distance in km, toll estimates, and cab fares in INR (₹).
  5. Local City Transit: Metro lines, auto-rickshaw rates/km in ₹, Ola/Uber averages in ₹.
"""
from __future__ import annotations

from app.models import TripState
from app.services.transit_service import estimate_intercity_transit
from app.gemini_client import generate_json_with_fallback

_PROMPT_TEMPLATE = """\
You are an expert Indian intercity logistics and transit strategist.
Origin: {origin}
Destination: {destination}
Distance: ~{distance_km} km

Calculated baseline transit options in INR (₹):
{options_summary}

Your task: Provide enhanced practical tips and booking advice for a traveler heading from {origin} to {destination}.
Return ONLY valid JSON (no markdown):
{{
  "recommended_mode": "Flight / Train / Bus / Cab",
  "rationale": "1-2 sentences on why this mode is best for the budget and duration",
  "flight_advice": "Nearest airports (e.g. DEL -> GOI/GOX) and best booking window",
  "train_advice": "Top train names (e.g. Vande Bharat / Rajdhani / Duronto) and booking tips",
  "bus_advice": "Key boarding points and recommended bus operators",
  "cab_advice": "Highway route (e.g. NH48) and driving conditions",
  "local_transit_tip": "Specific advice on Metro / Autos / Bike rentals at {destination}"
}}
"""


async def transit_agent_node(state: TripState) -> TripState:
    """Evaluate transit options in INR between Origin and Destination."""
    print(f"[TransitAgent] Calculating intercity transit: {state.origin} -> {state.destination}...")

    transit_info = estimate_intercity_transit(
        origin=state.origin or "Mumbai",
        destination=state.destination or state.location or "Goa",
        orig_lat=state.origin_lat,
        orig_lon=state.origin_lon,
        dest_lat=state.lat,
        dest_lon=state.lon,
    )

    options_summary = "\n".join(
        f"- {opt['mode']}: {opt['estimated_fare_inr']} ({opt['duration']})"
        for opt in transit_info["options"]
        if opt["available"]
    )

    prompt = _PROMPT_TEMPLATE.format(
        origin=state.origin or "Mumbai",
        destination=state.destination or "Goa",
        distance_km=transit_info["distance_km"],
        options_summary=options_summary,
    )

    try:
        ai_advice = await generate_json_with_fallback(prompt)
        transit_info["ai_advice"] = ai_advice
        transit_info["summary"] = ai_advice.get("rationale", f"Transit options available from {state.origin} to {state.destination}.")
        print(f"[TransitAgent] [OK] Intercity transit options generated in INR.")
    except Exception as exc:
        print(f"[TransitAgent] Notice: using heuristic transit advice ({exc})")
        transit_info["summary"] = f"Compare Flights, Trains, Buses, and Cabs from {state.origin} to {state.destination} based on your travel budget and schedule."

    state.transit_data = transit_info
    return state
