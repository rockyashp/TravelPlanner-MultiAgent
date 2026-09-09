export interface TimeSlot {
  activity: string;
  place: string;
  description: string;
  tips?: string;
}

export interface Meal {
  meal: string;
  place: string;
  cuisine: string;
  budget_note?: string;
}

export interface DayPlan {
  day: number;
  title: string;
  theme?: string;
  morning: TimeSlot;
  afternoon: TimeSlot;
  evening: TimeSlot;
  meals: Meal[];
}

export interface Itinerary {
  destination: string;
  duration_days: number;
  budget: "low" | "medium" | "high" | string;
  vibe: string;
  summary: string;
  days: DayPlan[];
  practical_tips: string[];
  estimated_daily_budget?: string;
  error?: string;
}

export interface AgentMeta {
  location?: string;
  city?: string;
  country?: string;
  duration_days?: number;
  vibe?: string;
  budget?: string;
  attractions_found?: number;
  food_spots_found?: number;
}

export interface PlanTripResponse {
  success: boolean;
  itinerary: Itinerary;
  meta?: AgentMeta;
  error?: string;
}

export type AgentStatus = 'idle' | 'running' | 'completed' | 'error';

export interface AgentPipelineProgress {
  intentParser: AgentStatus;
  attractionsAgent: AgentStatus;
  culinaryAgent: AgentStatus;
  synthesizer: AgentStatus;
}
