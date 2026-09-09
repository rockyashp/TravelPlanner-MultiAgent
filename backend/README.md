# Backend — Multi-Agent Travel Planner

FastAPI + LangGraph backend with parallel multi-agent orchestration.

## Setup

```bash
# From project root
source venv/Scripts/activate   # Windows Git Bash
# or: venv\Scripts\activate    # Windows cmd

cd backend
uvicorn app.main:app --reload --port 8000
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/plan-trip` | Generate itinerary from natural language |
| GET | `/health` | Health check |

## Agent Graph

```
User Query
    │
    ▼
Intent Parser  ──► extracts: location, duration, vibe, budget
    │
    ├──────────────────┐
    ▼                  ▼
Attractions Agent   Culinary Agent   (run in PARALLEL)
(Overpass API)      (Overpass API)
    │                  │
    └──────────────────┘
              │
              ▼
       Synthesizer Agent  ──► day-by-day JSON itinerary
```
