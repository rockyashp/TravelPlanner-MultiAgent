import type { PlanTripResponse } from '../types/travel';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function generateItinerary(query: string): Promise<PlanTripResponse> {
  const response = await fetch(`${API_BASE_URL}/api/plan-trip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
