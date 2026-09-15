// TypeScript definitions for SAFAR-AI 7-Agent Travel Planner
// Standardized on Indian Rupees (INR / ₹) & Live Interactive Map

export interface TransitOption {
  available: boolean;
  mode: string; // "Flight" | "Train / Rail (IRCTC)" | "Intercity Bus (Volvo AC / Sleeper)" | "Outstation Cab / Self-Drive"
  duration: string;
  estimated_fare_inr: string;
  avg_cost_inr: number;
  details: string;
  booking_tip: string;
}

export interface TransitData {
  origin?: string;
  destination?: string;
  distance_km?: number;
  options?: TransitOption[];
  local_transit_recommendations?: Record<string, string>;
  summary?: string;
  ai_advice?: {
    recommended_mode?: string;
    rationale?: string;
    flight_advice?: string;
    train_advice?: string;
    bus_advice?: string;
    cab_advice?: string;
    local_transit_tip?: string;
  };
}

export interface TimeSlot {
  id?: string;
  time?: string;
  activity: string;
  place: string;
  description: string;
  tips?: string;
  estimated_cost_inr?: string;
  lat?: number;
  lon?: number;
  duration_hours?: number;
  category?: 'attraction' | 'restaurant' | 'transit';
  day_number?: number;
  stop_order?: number;
}

export interface Meal {
  id?: string;
  meal: string;
  place: string;
  cuisine: string;
  budget_note?: string;
  estimated_cost_inr?: number;
  lat?: number;
  lon?: number;
  category?: 'restaurant';
  day_number?: number;
  stop_order?: number;
}

export interface DayPlan {
  day: number;
  title: string;
  theme?: string;
  morning: TimeSlot;
  afternoon: TimeSlot;
  evening: TimeSlot;
  meals: Meal[];
  travel_note?: string;
}

export interface Itinerary {
  origin?: string;
  destination: string;
  duration_days: number;
  budget_tier?: 'low' | 'medium' | 'high' | string;
  budget?: string;
  vibe: string;
  summary: string;
  highlights?: string[];
  days: DayPlan[];
  practical_tips: string[];
  estimated_daily_budget_inr?: string;
  estimated_daily_budget?: string;
}

export interface WeatherDay {
  date: string;
  temp_max_c: number | null;
  temp_min_c: number | null;
  precipitation_mm: number;
  rain_probability_pct: number;
  uv_index: number;
  sunrise: string;
  sunset: string;
  condition: string;
  wmo_code: number;
}

export interface WeatherAIInsights {
  overall_summary: string;
  best_days: string[];
  rain_risk_days: string[];
  indoor_contingencies: string[];
  packing_weather_tips: string[];
}

export interface WeatherData {
  timezone: string;
  latitude: number;
  longitude: number;
  days: WeatherDay[];
  ai_insights?: WeatherAIInsights;
}

export interface BudgetBreakdownCategory {
  low?: string;
  mid?: string;
  total?: string;
  amount?: string;
  note?: string;
}

export interface BudgetBreakdownINR {
  currency: string;
  total_estimated_inr: string;
  per_day_average_inr: string;
  breakdown: {
    accommodation?: BudgetBreakdownCategory;
    intercity_transit?: BudgetBreakdownCategory;
    local_transport?: BudgetBreakdownCategory;
    meals_dining?: BudgetBreakdownCategory;
    sightseeing_tickets?: BudgetBreakdownCategory;
    emergency_buffer?: { amount?: string; note?: string };
    [key: string]: any;
  };
  money_saving_tips: string[];
  transit_saving_tips?: string[];
}

export type BudgetBreakdown = BudgetBreakdownINR;

export interface SafetyAndPackingData {
  emergency_contacts?: Record<string, string>;
  safety_tips: string[];
  cultural_etiquette: string[];
  tipping_norms?: string;
  scam_alerts?: string[];
  packing_checklist?: Record<string, string[]>;
  country_info?: any;
}

export type SafetyData = SafetyAndPackingData;

export interface MapPin {
  id: string;
  lat: number;
  lon: number;
  label: string;
  title?: string;
  description?: string;
  tips?: string;
  cost?: string;
  time?: string;
  type: 'attraction' | 'restaurant' | 'transit';
  day: number;
  slot?: 'morning' | 'afternoon' | 'evening' | 'meal';
  stopOrder?: number;
}

export interface TripMeta {
  origin?: string;
  origin_city?: string;
  destination?: string;
  city?: string;
  country?: string;
  lat?: number;
  lon?: number;
  duration_days?: number;
  vibe?: string;
  budget?: string;
  budget_inr?: number;
  party_type?: string;
  pace?: string;
  dietary?: string;
  themes?: string[];
  attractions_found?: number;
  food_spots_found?: number;
  specialty_dishes?: string[];
}

export interface PlanTripResponse {
  success: boolean;
  itinerary: Itinerary;
  transit?: TransitData;
  weather?: WeatherData;
  budget_breakdown?: BudgetBreakdownINR;
  safety?: SafetyAndPackingData;
  meta?: TripMeta;
  error?: string;
}

export type AgentStatus = 'idle' | 'started' | 'running' | 'completed' | 'error';

export interface AgentPipelineProgress {
  intent_agent: AgentStatus;
  attractions: AgentStatus;
  culinary: AgentStatus;
  weather: AgentStatus;
  transit: AgentStatus;
  budget_safety: AgentStatus;
  synthesizer: AgentStatus;
}
