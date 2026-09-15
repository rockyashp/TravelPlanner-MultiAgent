"""
Transit service for intercity and local transport calculations.
Computes Haversine distance, travel time estimates, and rule-based
INR (₹) fare baselines for Flights, Trains, Buses, and Cabs.
"""
from __future__ import annotations

import math
from typing import Any

# Average speed estimates (km/h)
SPEED_FLIGHT = 650
SPEED_TRAIN = 70
SPEED_BUS = 55
SPEED_CAB = 60

# Indian Rupee (₹) fare benchmarks per km
COST_PER_KM_TRAIN_SLEEPER = 0.55
COST_PER_KM_TRAIN_3AC = 1.40
COST_PER_KM_TRAIN_2AC = 2.10
COST_PER_KM_BUS_VOLVO = 1.80
COST_PER_KM_CAB_OUTSTATION = 14.00


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points in km."""
    if lat1 == 0.0 and lon1 == 0.0:
        return 500.0  # default assumption if origin not geocoded
    if lat2 == 0.0 and lon2 == 0.0:
        return 500.0

    r = 6371.0  # Earth's radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def estimate_intercity_transit(
    origin: str,
    destination: str,
    orig_lat: float,
    orig_lon: float,
    dest_lat: float,
    dest_lon: float,
) -> dict[str, Any]:
    """
    Calculates distance and generates accurate baseline estimates in INR (₹)
    for Flight, Train, Bus, and Outstation Cab between two cities.
    """
    air_dist = haversine_distance_km(orig_lat, orig_lon, dest_lat, dest_lon)
    road_dist = max(50.0, air_dist * 1.25)  # road winding factor ~1.25
    rail_dist = max(50.0, air_dist * 1.15)  # rail winding factor ~1.15

    # 1. Flight calculation
    flight_possible = air_dist >= 180.0
    if flight_possible:
        flight_duration_hrs = round(1.0 + (air_dist / SPEED_FLIGHT), 1)
        # Dynamic airfare curve: base ₹2,500 + ₹4.5 per km
        flight_fare_low = int(max(2500, 2200 + (air_dist * 3.8)))
        flight_fare_high = int(max(4000, flight_fare_low * 1.6))
        flight_info = {
            "available": True,
            "mode": "Flight",
            "duration": f"{flight_duration_hrs}h (inc. airport wait ~3.5h)",
            "estimated_fare_inr": f"₹{flight_fare_low:,} – ₹{flight_fare_high:,}",
            "avg_cost_inr": (flight_fare_low + flight_fare_high) // 2,
            "details": f"Direct or 1-stop connecting flight from {origin or 'origin'} to {destination}.",
            "booking_tip": "Book 3–4 weeks in advance on Indigo/Air India/MakeMyTrip for best fares.",
        }
    else:
        flight_info = {
            "available": False,
            "mode": "Flight",
            "duration": "N/A (Short distance)",
            "estimated_fare_inr": "N/A",
            "avg_cost_inr": 0,
            "details": "Distance too short for commercial scheduled flights.",
            "booking_tip": "Recommended to travel by Express Train, Bus, or Cab.",
        }

    # 2. Train calculation
    train_duration_hrs = round(rail_dist / SPEED_TRAIN, 1)
    train_sleeper_fare = int(max(250, rail_dist * COST_PER_KM_TRAIN_SLEEPER))
    train_3ac_fare = int(max(650, rail_dist * COST_PER_KM_TRAIN_3AC))
    train_2ac_fare = int(max(1100, rail_dist * COST_PER_KM_TRAIN_2AC))
    train_info = {
        "available": True,
        "mode": "Train / Rail (IRCTC)",
        "duration": f"~{int(train_duration_hrs)}h {int((train_duration_hrs % 1) * 60)}m",
        "estimated_fare_inr": f"Sleeper: ₹{train_sleeper_fare:,} | 3AC: ₹{train_3ac_fare:,} | 2AC: ₹{train_2ac_fare:,}",
        "avg_cost_inr": train_3ac_fare,
        "details": f"Direct Superfast / Vande Bharat / Express trains running between {origin or 'origin'} and {destination}.",
        "booking_tip": "Book via IRCTC 60–120 days early or check Tatkal at 10 AM (AC) / 11 AM (Non-AC).",
    }

    # 3. Intercity Bus (Volvo / Sleeper)
    bus_duration_hrs = round(road_dist / SPEED_BUS, 1)
    bus_fare_low = int(max(350, road_dist * 1.20))
    bus_fare_volvo = int(max(750, road_dist * COST_PER_KM_BUS_VOLVO))
    bus_info = {
        "available": road_dist <= 1200.0,
        "mode": "Intercity Bus (Volvo AC / Sleeper)",
        "duration": f"~{int(bus_duration_hrs)}h {int((bus_duration_hrs % 1) * 60)}m",
        "estimated_fare_inr": f"₹{bus_fare_low:,} (Seater) – ₹{bus_fare_volvo:,} (Multi-Axle Sleeper)",
        "avg_cost_inr": bus_fare_volvo,
        "details": f"Overnight or daytime AC Volvo/Scania sleeper buses from state RTC & private operators.",
        "booking_tip": "Book via RedBus, AbhiBus, or state transport (KSRTC/MSRTC/HRTC) for live bus tracking.",
    }

    # 4. Outstation Cab / Self-Drive
    cab_duration_hrs = round(road_dist / SPEED_CAB, 1)
    cab_fare = int(road_dist * COST_PER_KM_CAB_OUTSTATION)
    toll_estimate = int(road_dist * 1.8)
    total_cab_fare = cab_fare + toll_estimate
    cab_info = {
        "available": road_dist <= 800.0,
        "mode": "Outstation Cab / Self-Drive",
        "duration": f"~{int(cab_duration_hrs)}h {int((cab_duration_hrs % 1) * 60)}m ({int(road_dist)} km)",
        "estimated_fare_inr": f"₹{total_cab_fare:,} (Includes ~₹{toll_estimate:,} tolls & fuel)",
        "avg_cost_inr": total_cab_fare,
        "details": f"Direct private sedan/SUV cab via Ola Outstation, Uber Intercity, or Savaari.",
        "booking_tip": "Best for groups of 3–4 travelers seeking door-to-door comfort and scenic stops.",
    }

    return {
        "distance_km": int(road_dist),
        "origin": origin,
        "destination": destination,
        "options": [flight_info, train_info, bus_info, cab_info],
        "local_transit_recommendations": {
            "metro": "Use Metro Smart Card or QR ticketing for fast, air-conditioned urban transit (₹20–₹60 per trip).",
            "auto_rickshaw": "Insist on meter fare or use predefined prepaid auto booths (Base ₹30, then ~₹15–₹18/km).",
            "app_cabs": "Ola & Uber operate across the city. Average city ride ranges between ₹150–₹350.",
            "rentals": "Scooter / bike rentals available at ₹400–₹700/day (ideal for Goa, Kerala, Puducherry, Himachal).",
        },
    }
