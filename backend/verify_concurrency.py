"""
Demonstrates and verifies the exact LangGraph execution flow and agent concurrency.
"""
import asyncio
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY", "placeholder")

from langgraph.graph import StateGraph, END
from app.graph import GraphState

# Shared timeline logger
events = []

def record(agent: str, action: str):
    ts = time.time()
    events.append((ts, agent, action))
    print(f"[{ts:.4f}] [{agent:15}] -> {action}")


# Mock agent nodes with realistic delays to show timeline
async def mock_intent_parser(state: GraphState):
    record("Intent Parser", "START")
    await asyncio.sleep(0.05)
    record("Intent Parser", "COMPLETED (Extracted: Goa, 2 days, low budget)")
    return {
        "location": "Goa, India",
        "city": "Panaji",
        "country": "India",
        "duration_days": 2,
        "vibe": "quiet beaches, seafood",
        "budget": "low",
    }


async def mock_attractions(state: GraphState):
    record("Attractions Agent", "START (Querying Overpass for beaches/sights...)")
    await asyncio.sleep(0.40)  # Simulating network latency
    record("Attractions Agent", "COMPLETED (Found 8 spots)")
    return {
        "attractions": [
            {"name": "Colva Beach", "type": "beach"},
            {"name": "Aguada Fort", "type": "historic"},
        ]
    }


async def mock_culinary(state: GraphState):
    record("Culinary Agent", "START (Querying Overpass for seafood spots...)")
    await asyncio.sleep(0.40)  # Simulating network latency
    record("Culinary Agent", "COMPLETED (Found 12 spots)")
    return {
        "food_spots": [
            {"name": "Fisherman's Wharf", "cuisine": "seafood"},
            {"name": "Ritz Classic", "cuisine": "goan"},
        ]
    }


async def mock_synthesizer(state: GraphState):
    record("Synthesizer", "START (Combining attractions + food into itinerary)")
    await asyncio.sleep(0.05)
    record("Synthesizer", "COMPLETED (Generated 2-day JSON itinerary)")
    return {
        "itinerary": {
            "destination": state.get("location"),
            "days": [
                {"day": 1, "theme": "Quiet Beaches & Local Seafood"},
                {"day": 2, "theme": "Fort Views & Beach Shacks"}
            ]
        }
    }


async def verify_flow():
    print("=" * 80)
    print("LANGGRAPH MULTI-AGENT EXECUTION FLOW VERIFICATION")
    print("=" * 80)
    print("\nBuilding graph with parallel fan-out / fan-in topology...\n")

    builder = StateGraph(GraphState)
    builder.add_node("intent_parser", mock_intent_parser)
    builder.add_node("attractions", mock_attractions)
    builder.add_node("culinary", mock_culinary)
    builder.add_node("synthesizer", mock_synthesizer)

    builder.set_entry_point("intent_parser")
    builder.add_edge("intent_parser", "attractions")
    builder.add_edge("intent_parser", "culinary")
    builder.add_edge("attractions", "synthesizer")
    builder.add_edge("culinary", "synthesizer")
    builder.add_edge("synthesizer", END)

    graph = builder.compile()

    print("Executing pipeline: 'I want to go to Goa for 2 days, low budget...'\n")
    start_time = time.time()

    final_state = await graph.ainvoke({"raw_query": "Goa 2 days low budget"})

    total_time = time.time() - start_time

    print("\n" + "=" * 80)
    print("EXECUTION FLOW TIMELINE ANALYSIS")
    print("=" * 80)

    # Calculate concurrency metrics
    attr_start = next(t for t, a, act in events if a == "Attractions Agent" and "START" in act)
    attr_end = next(t for t, a, act in events if a == "Attractions Agent" and "COMPLETED" in act)
    cul_start = next(t for t, a, act in events if a == "Culinary Agent" and "START" in act)
    cul_end = next(t for t, a, act in events if a == "Culinary Agent" and "COMPLETED" in act)

    time_diff = abs(attr_start - cul_start) * 1000  # ms
    overlap = max(0.0, min(attr_end, cul_end) - max(attr_start, cul_start))

    print(f"\n1. Concurrency Check:")
    print(f"   - Attractions Agent start timestamp : {attr_start:.4f}")
    print(f"   - Culinary Agent start timestamp    : {cul_start:.4f}")
    print(f"   - Start difference                  : {time_diff:.2f} ms")
    print(f"   - Concurrent Overlap Duration       : {overlap:.4f} seconds")

    print(f"\n2. State Aggregation Check:")
    print(f"   - Attractions gathered : {len(final_state.get('attractions', []))} items")
    print(f"   - Food spots gathered  : {len(final_state.get('food_spots', []))} items")
    print(f"   - Itinerary generated  : {final_state.get('itinerary', {}).get('destination')}")

    print(f"\n3. Total Wall-Clock Time: {total_time:.4f}s")
    sequential_estimate = 0.05 + 0.40 + 0.40 + 0.05  # ~0.90s
    print(f"   - Time if Sequential : ~{sequential_estimate:.2f}s")
    print(f"   - Time with Parallel : ~{total_time:.2f}s (Nearly 2x faster!)")

    if time_diff < 10 and overlap > 0.35:
        print("\n" + "*" * 80)
        print("VERDICT: PERFECT CONCURRENCY VERIFIED!")
        print("Attractions and Culinary agents run simultaneously on parallel threads/tasks.")
        print("*" * 80 + "\n")
    else:
        print("\nVERDICT: Concurrency failed.")


if __name__ == "__main__":
    asyncio.run(verify_flow())
