import type { PlanTripResponse } from '../types/travel';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Standard fetch ────────────────────────────────────────────────────────────

export async function generateItinerary(query: string): Promise<PlanTripResponse> {
  const res = await fetch(`${API_BASE}/api/plan-trip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }
  return res.json();
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// ── SSE streaming ─────────────────────────────────────────────────────────────

export type AgentUpdateCallback = (node: string, status: string, summary: string) => void;
export type CompleteCallback = (result: PlanTripResponse) => void;
export type ErrorCallback = (err: string) => void;

/**
 * Calls the SSE streaming endpoint. Invokes callbacks as each agent emits events.
 * Returns a cleanup function that closes the EventSource.
 */
export function streamItinerary(
  query: string,
  onAgentUpdate: AgentUpdateCallback,
  onComplete: CompleteCallback,
  onError: ErrorCallback,
): () => void {
  // POST via fetch to start streaming, then consume the response body as SSE
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/plan-trip/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        onError(`Server error: ${res.status}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let eventType = 'message';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              if (eventType === 'agent_update') {
                onAgentUpdate(parsed.node, parsed.status, parsed.summary ?? '');
              } else if (eventType === 'complete') {
                onComplete(parsed.result as PlanTripResponse);
              }
            } catch {
              // ignore malformed JSON lines
            }
            eventType = 'message'; // reset
          }
        }
      }
    } catch (err: unknown) {
      if ((err as { name?: string }).name !== 'AbortError') {
        onError(err instanceof Error ? err.message : 'Streaming error');
      }
    }
  })();

  return () => controller.abort();
}
