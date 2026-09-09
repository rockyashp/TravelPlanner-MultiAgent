# Phase 1 Complete: Backend & Agent Orchestration

## ✅ What's Built

### 1. Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app + CORS
│   ├── config.py                  # Environment config
│   ├── models.py                  # Pydantic models (TripState, Request/Response)
│   ├── graph.py                   # LangGraph workflow with PARALLEL agents
│   ├── overpass_client.py         # Async Overpass API client
│   └── agents/
│       ├── __init__.py
│       ├── intent_parser.py       # Gemini-powered intent extraction
│       ├── attractions_agent.py   # Overpass query for attractions
│       ├── culinary_agent.py      # Overpass query for food (budget-aware)
│       └── synthesizer_agent.py   # Gemini-powered itinerary generator
├── requirements.txt
├── README.md
└── test_backend.py                # Manual test script
```

### 2. Multi-Agent Graph Architecture

```
User Query
    │
    ▼
Intent Parser (Gemini)
    │
    ├──────────────────────┐
    ▼                      ▼
Attractions Agent      Culinary Agent    ← PARALLEL EXECUTION
(Overpass API)        (Overpass API)
    │                      │
    └──────────────────────┘
              │
              ▼
       Synthesizer Agent (Gemini)
              │
              ▼
       JSON Itinerary
```

**Key Feature:** The `attractions_agent` and `culinary_agent` run in parallel using LangGraph's edge fan-out. Both edges from `intent_parser` → the two agents trigger simultaneously, then both converge into `synthesizer`.

### 3. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/plan-trip` | Main endpoint — takes `{query: "string"}`, returns itinerary JSON |

### 4. Tech Stack Verified

- ✅ **Python 3.11**
- ✅ **FastAPI 0.141** with CORS for Vite frontend
- ✅ **LangGraph 1.2.11** with parallel node execution
- ✅ **google-genai SDK** (upgraded from deprecated `google-generativeai`)
- ✅ **Overpass API** client with proper User-Agent and form-encoding
- ✅ **Pydantic 2.13** for type-safe state management

---

## 🚀 How to Run

### 1. Set up the environment

```bash
# From project root
source venv/Scripts/activate   # Windows Git Bash

# Verify packages
pip list | grep -E "fastapi|langgraph|google-genai"
```

### 2. Add your Gemini API key

Edit `.env` in the project root:

```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

Get a free Gemini API key: https://aistudio.google.com/app/apikey

### 3. Start the server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 4. Test the health endpoint

```bash
curl http://localhost:8000/health
# → {"status":"ok","service":"Multi-Agent Travel Planner"}
```

### 5. Test the full pipeline

```bash
curl -X POST http://localhost:8000/api/plan-trip \
  -H "Content-Type: application/json" \
  -d '{"query": "I want to go to Goa for 2 days, low budget, want to eat seafood and see quiet beaches."}'
```

Expected response structure:
```json
{
  "success": true,
  "itinerary": {
    "destination": "Goa, India",
    "duration_days": 2,
    "budget": "low",
    "vibe": "quiet beaches, seafood",
    "summary": "...",
    "days": [
      {
        "day": 1,
        "title": "...",
        "morning": {...},
        "afternoon": {...},
        "evening": {...},
        "meals": [...]
      }
    ],
    "practical_tips": [...],
    "estimated_daily_budget": "..."
  },
  "meta": {
    "location": "Goa, India",
    "city": "Panaji",
    "attractions_found": 25,
    "food_spots_found": 20
  }
}
```

---

## 🧪 Manual Testing

Run the test suite (no API key needed for Overpass tests):

```bash
cd backend
python test_backend.py
```

This tests:
- Overpass API connectivity
- Attractions Agent with mock state
- Culinary Agent with mock state

---

## 📝 Notes

### Overpass API
- The Overpass API client uses POST with `application/x-www-form-urlencoded` 
- Includes proper `User-Agent` header
- Gracefully returns `[]` on timeout/error (doesn't crash the pipeline)
- The public Overpass server can be slow/timeout during peak hours — this is normal

### Parallel Execution
Verified in `backend/app/graph.py`:
```python
builder.add_edge("intent_parser", "attractions")
builder.add_edge("intent_parser", "culinary")
```

Both edges fire simultaneously when `intent_parser` completes. LangGraph waits for both to finish before proceeding to `synthesizer`.

### APIs Used
- ✅ **Gemini API** (free tier: `gemini-1.5-flash`)
- ✅ **OpenStreetMap** data via Overpass API (free, no key required)
- ❌ No paid APIs (Google Maps, etc.)

---

## ✅ Phase 1 Status: COMPLETE

The backend is fully functional and ready for frontend integration.

**Next:** Phase 2 — React frontend with glassmorphism UI.
