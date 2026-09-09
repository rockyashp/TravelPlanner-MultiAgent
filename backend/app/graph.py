"""
LangGraph workflow with verified parallel multi-agent execution.
"""
from __future__ import annotations

from typing import Any, Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, END

from app.models import TripState
from app.agents.intent_parser import intent_parser_node
from app.agents.attractions_agent import attractions_node
from app.agents.culinary_agent import culinary_node
from app.agents.synthesizer_agent import synthesizer_node


# Define state schema using TypedDict for LangGraph
class GraphState(TypedDict, total=False):
    raw_query: str
    location: str
    city: str
    country: str
    duration_days: int
    vibe: str
    budget: str
    attractions: list[dict[str, Any]]
    food_spots: list[dict[str, Any]]
    itinerary: dict[str, Any]
    error: str


# Node wrappers that return only the keys they modify (prevents parallel write conflicts)

async def _intent_parser_wrapper(state: GraphState) -> dict[str, Any]:
    """Runs intent parser and returns extracted fields."""
    pydantic_state = TripState(**state)
    result_state = await intent_parser_node(pydantic_state)
    return {
        "location": result_state.location,
        "city": result_state.city,
        "country": result_state.country,
        "duration_days": result_state.duration_days,
        "vibe": result_state.vibe,
        "budget": result_state.budget,
        "error": result_state.error,
    }


async def _attractions_wrapper(state: GraphState) -> dict[str, Any]:
    """Runs attractions agent and returns ONLY the attractions list."""
    pydantic_state = TripState(**state)
    result_state = await attractions_node(pydantic_state)
    return {"attractions": result_state.attractions}


async def _culinary_wrapper(state: GraphState) -> dict[str, Any]:
    """Runs culinary agent and returns ONLY the food_spots list."""
    pydantic_state = TripState(**state)
    result_state = await culinary_node(pydantic_state)
    return {"food_spots": result_state.food_spots}


async def _synthesizer_wrapper(state: GraphState) -> dict[str, Any]:
    """Runs synthesizer agent and returns the final itinerary."""
    pydantic_state = TripState(**state)
    result_state = await synthesizer_node(pydantic_state)
    return {
        "itinerary": result_state.itinerary,
        "error": result_state.error,
    }


def _build_graph() -> StateGraph:
    """
    Builds the multi-agent graph with PARALLEL execution of Attractions and Culinary nodes.

    Graph Topology:

         [START]
            │
            ▼
     [intent_parser]
            │
      ┌─────┴─────┐  ◄── Fan-out (concurrent execution)
      ▼           ▼
[attractions]  [culinary]
      │           │
      └─────┬─────┘  ◄── Fan-in (waits for BOTH to complete)
            ▼
      [synthesizer]
            │
            ▼
          [END]
    """
    builder = StateGraph(GraphState)

    # 1. Add all agent nodes
    builder.add_node("intent_parser", _intent_parser_wrapper)
    builder.add_node("attractions",   _attractions_wrapper)
    builder.add_node("culinary",      _culinary_wrapper)
    builder.add_node("synthesizer",   _synthesizer_wrapper)

    # 2. Set entry point
    builder.set_entry_point("intent_parser")

    # 3. PARALLEL FAN-OUT: intent_parser routes to BOTH attractions and culinary
    builder.add_edge("intent_parser", "attractions")
    builder.add_edge("intent_parser", "culinary")

    # 4. PARALLEL FAN-IN: Both branches converge into synthesizer
    # LangGraph guarantees synthesizer only runs after BOTH attractions and culinary complete
    builder.add_edge("attractions", "synthesizer")
    builder.add_edge("culinary",    "synthesizer")

    # 5. Exit
    builder.add_edge("synthesizer", END)

    return builder


# Compile the graph
_compiled_graph = _build_graph().compile()


async def run_trip_pipeline(raw_query: str) -> TripState:
    """
    Execute the multi-agent travel pipeline.
    Attractions and Culinary agents run CONCURRENTLY.
    """
    initial_state: GraphState = {
        "raw_query": raw_query,
        "attractions": [],
        "food_spots": [],
    }
    final_dict = await _compiled_graph.ainvoke(initial_state)
    return TripState(**final_dict)
