# Aura Travel — Multi-Agent Travel Planner

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.2-FF6F00?style=flat-square)](https://github.com/langchain-ai/langgraph)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?style=flat-square&logo=google&logoColor=white)](https://aistudio.google.com)
[![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-Overpass_API-7EBC6F?style=flat-square&logo=openstreetmap&logoColor=white)](https://www.openstreetmap.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

> An autonomous multi-agent travel itinerary planning system. Built with **FastAPI**, **LangGraph**, **Google Gemini**, and the **OpenStreetMap Overpass API**, featuring a **React + Tailwind CSS** glassmorphism user interface.

---

## Overview

Aura Travel transforms natural language travel prompts into detailed, structured, day-by-day itineraries. It coordinates multiple specialized AI agents executing in parallel to discover attractions and dining options from live geographic data sources without relying on proprietary mapping APIs.

---

## Key Features

- **Parallel Multi-Agent Swarm**: LangGraph orchestrates concurrent execution of the Attractions Agent and Culinary Agent via asynchronous fan-out / fan-in graph topology.
- **Open Data & Free-Tier Integration**: Operates without paid map API dependencies by utilizing Google Gemini (Free Tier) and OpenStreetMap (Nominatim and Overpass APIs).
- **Real-Time Geodata Retrieval**: Queries live OpenStreetMap nodes to extract verified attractions, natural landmarks, viewpoints, and budget-matched eateries.
- **Modern Glassmorphism UI**: Built with React, Vite, and Tailwind CSS, utilizing `backdrop-blur` treatments, dynamic gradients, and responsive layouts.
- **Live Agent Flow Visualizer**: Provides visual feedback indicating the real-time execution state of each agent node during synthesis.
- **Structured Day-by-Day Itineraries**: Generates morning, afternoon, and evening activity slots, meal recommendations, local travel advice, and OpenStreetMap coordinate links.

---

## Architecture & Workflow

```
                             ┌───────────────────────┐
                             │   User Travel Prompt  │
                             └───────────┬───────────┘
                                         │
                                         ▼
                             ┌───────────────────────┐
                             │   Intent Parser Node  │
                             │  (Gemini 2.5 Flash)   │
                             └───────────┬───────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │          PARALLEL FAN-OUT SWARM         │
                    ▼                                         ▼
        ┌───────────────────────┐                 ┌───────────────────────┐
        │   Attractions Agent   │                 │    Culinary Agent     │
        │  (Overpass Sights/POIs)│                │  (Overpass Food Nodes)│
        └───────────┬───────────┘                 └───────────┬───────────┘
                    │                                         │
                    └────────────────────┬────────────────────┘
                                         │
                               PARALLEL FAN-IN SYNC
                                         │
                                         ▼
                             ┌───────────────────────┐
                             │   Synthesizer Node    │
                             │  (Gemini 2.5 Flash)   │
                             └───────────┬───────────┘
                                         │
                                         ▼
                             ┌───────────────────────┐
                             │  Structured JSON Plan │
                             └───────────┬───────────┘
                                         │
                                         ▼
                             ┌───────────────────────┐
                             │ React Glassmorphic UI │
                             └───────────────────────┘
```

---

## Technology Stack

| Domain | Technologies & Libraries |
|---|---|
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/), [Uvicorn](https://www.uvicorn.org/), [Pydantic v2](https://docs.pydantic.dev/) |
| **Agent Orchestration** | [LangGraph](https://github.com/langchain-ai/langgraph), [LangChain Core](https://python.langchain.com/) |
| **Language Model** | [Google Gemini 2.5 / 1.5 Flash](https://aistudio.google.com) (`google-genai` SDK) |
| **Geodata & Places** | [OpenStreetMap Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API), [Nominatim Geocoding](https://nominatim.org/) |
| **Frontend Framework** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/) |
| **Styling & UI** | [Tailwind CSS 3.4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/), [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) |
| **HTTP Clients** | [httpx](https://www.python-httpx.org/) (Async Python), [Axios](https://axios-http.com/) (Frontend) |

---

## Repository Structure

```
TravelPlanner-MultiAgent/
├── .env.example               # Template environment configuration
├── .gitignore                 # Git ignore rules for Python & Node
├── test_integration.py        # End-to-end multi-agent pipeline verification
│
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI application entrypoint & CORS middleware
│   │   ├── graph.py           # LangGraph parallel workflow graph definition
│   │   ├── config.py          # Environment settings & API configuration
│   │   ├── models.py          # Pydantic schemas for state, requests, and responses
│   │   ├── overpass_client.py # Async Nominatim geocoding & Overpass client
│   │   └── agents/
│   │       ├── intent_parser.py     # NLP destination & budget extraction
│   │       ├── attractions_agent.py # Parallel OSM sightseeing retrieval
│   │       ├── culinary_agent.py    # Parallel OSM dining & budget matching
│   │       └── synthesizer_agent.py # Final JSON day-by-day itinerary synthesis
│   ├── verify_concurrency.py  # Concurrency execution validation script
│   └── requirements.txt       # Python package dependencies
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── BackgroundGradients.tsx # Animated pastel mesh & background elements
    │   │   ├── Header.tsx              # Navigation bar with backend health indicator
    │   │   ├── PromptInput.tsx         # Natural language prompt area & quick presets
    │   │   ├── AgentFlowVisualizer.tsx # Multi-agent execution graph visualizer
    │   │   ├── ItineraryView.tsx       # Interactive day cards & OpenStreetMap links
    │   │   └── EmptyState.tsx          # Feature showcase & starter inspiration
    │   ├── services/
    │   │   └── api.ts                  # Axios backend API client
    │   ├── types/
    │   │   └── travel.ts               # TypeScript interfaces for trip models
    │   ├── App.tsx                     # Main application container
    │   └── index.css                   # Tailwind directives & glassmorphic utility classes
    ├── package.json
    └── vite.config.ts
```

---

## Getting Started

### Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher & **npm**
- **Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

### 1. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Define the required environment variables:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

---

### 2. Backend Setup

```bash
# Activate virtual environment
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# Windows (Git Bash):
source venv/Scripts/activate
# macOS/Linux:
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Start the FastAPI server
cd backend
uvicorn app.main:app --reload --port 8000
```

- API Server: `http://localhost:8000`
- Interactive OpenAPI Documentation: `http://localhost:8000/docs`

---

### 3. Frontend Setup

In a separate terminal window:

```bash
cd frontend

# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev
```

- Application UI: `http://localhost:5173`

---

## API Reference

### Health Check

`GET /health`

**Response:**
```json
{
  "status": "ok",
  "service": "Multi-Agent Travel Planner"
}
```

---

### Generate Trip Plan

`POST /api/plan-trip`

**Headers:**
`Content-Type: application/json`

**Request Body:**
```json
{
  "query": "I want to go to Goa for 2 days, low budget, want to eat seafood and see quiet beaches."
}
```

**Response:**
```json
{
  "success": true,
  "itinerary": {
    "destination": "Goa, India",
    "duration_days": 2,
    "budget": "low",
    "vibe": "quiet beaches, seafood",
    "summary": "A 2-day budget-friendly coastal getaway featuring serene sands and authentic Goan seafood.",
    "days": [
      {
        "day": 1,
        "title": "Coastal Heritage & Sunset Serenity",
        "morning": {
          "time": "09:00 AM - 12:00 PM",
          "activity": "Explore historic Chapora Fort ruins and coastal vistas",
          "location": "Chapora Fort",
          "lat": 15.605,
          "lon": 73.738,
          "notes": "Free entry, carry water and wear comfortable walking shoes."
        },
        "afternoon": {
          "time": "01:00 PM - 04:30 PM",
          "activity": "Relax at secluded Ashvem Beach",
          "location": "Ashvem Beach",
          "lat": 15.658,
          "lon": 73.717,
          "notes": "Ideal for swimming and peaceful seaside relaxation."
        },
        "evening": {
          "time": "05:30 PM - 08:00 PM",
          "activity": "Sunset stroll and fresh catch dinner by the shore",
          "location": "Morjim Coast",
          "lat": 15.632,
          "lon": 73.734,
          "notes": "Scenic sunset viewpoint with budget beach shacks."
        },
        "meals": [
          {
            "type": "Lunch",
            "name": "Local Goan Beach Shack",
            "cuisine": "Goan Seafood / Thali",
            "price_range": "$",
            "address": "Ashvem Beach Road"
          }
        ]
      }
    ],
    "practical_tips": [
      "Rent a scooter for affordable local transit.",
      "Look for local fish thali meals for authentic dining at budget prices."
    ],
    "estimated_daily_budget": "$25 - $35 USD per person"
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

## Testing & Verification

Automated test scripts are available to validate multi-agent orchestration, live geodata integration, and concurrency:

```bash
# Verify the end-to-end multi-agent pipeline
python test_integration.py

# Verify asynchronous agent concurrency and parallel execution
python backend/verify_concurrency.py
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-agent`)
3. Commit your changes (`git commit -m "Add new agent"`)
4. Push to the branch (`git push origin feature/new-agent`)
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).