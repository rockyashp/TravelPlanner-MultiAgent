"""
Test LangGraph's native execution to verify parallelism.
"""
import asyncio
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY", "placeholder")

from app.models import TripState
from app.graph import _compiled_graph


async def test_langgraph_parallelism():
    """
    Test whether LangGraph executes the parallel branches concurrently.
    We'll add timestamps to see the exact execution flow.
    """
    print("="*70)
    print("LANGGRAPH NATIVE EXECUTION TRACE")
    print("="*70)

    # Instrument the agent functions with precise timestamps
    import app.agents.attractions_agent as attractions_module
    import app.agents.culinary_agent as culinary_module
    import app.agents.intent_parser as intent_module
    import app.agents.synthesizer_agent as synth_module

    timeline = []

    def log_event(name, event_type):
        t = time.time()
        timeline.append((t, name, event_type))
        print(f"[{t:.3f}] {name.upper()}: {event_type}")

    # Wrap each node
    orig_intent = intent_module.intent_parser_node
    orig_attr = attractions_module.attractions_node
    orig_cul = culinary_module.culinary_node
    orig_synth = synth_module.synthesizer_node

    async def logged_intent(s):
        log_event("intent_parser", "START")
        # Mock quick intent parse to avoid Gemini call
        s.city = "Panaji"
        s.country = "India"
        s.duration_days = 2
        s.vibe = "beaches, seafood"
        s.budget = "low"
        await asyncio.sleep(0.1)
        log_event("intent_parser", "END")
        return s

    async def logged_attr(s):
        log_event("attractions", "START")
        # Mock 2-second delay to simulate Overpass call
        await asyncio.sleep(2.0)
        s.attractions = [{"name": "Calangute Beach", "type": "beach"}]
        log_event("attractions", "END")
        return s

    async def logged_cul(s):
        log_event("culinary", "START")
        # Mock 2-second delay to simulate Overpass call
        await asyncio.sleep(2.0)
        s.food_spots = [{"name": "Fisherman's Wharf", "tags": {"cuisine": "seafood"}}]
        log_event("culinary", "END")
        return s

    async def logged_synth(s):
        log_event("synthesizer", "START")
        await asyncio.sleep(0.1)
        s.itinerary = {"destination": "Goa", "days": []}
        log_event("synthesizer", "END")
        return s

    # Build a fresh test graph
    from langgraph.graph import StateGraph, END

    builder = StateGraph(TripState)
    builder.add_node("intent_parser", logged_intent)
    builder.add_node("attractions", logged_attr)
    builder.add_node("culinary", logged_cul)
    builder.add_node("synthesizer", logged_synth)

    builder.set_entry_point("intent_parser")
    builder.add_edge("intent_parser", "attractions")
    builder.add_edge("intent_parser", "culinary")
    builder.add_edge("attractions", "synthesizer")
    builder.add_edge("culinary", "synthesizer")
    builder.add_edge("synthesizer", END)

    test_graph = builder.compile()

    print("\nExecuting graph...")
    start_time = time.time()

    initial_state = TripState(raw_query="Goa 2 days")
    result = await test_graph.ainvoke(initial_state)

    total_time = time.time() - start_time
    print(f"\nTotal graph execution time: {total_time:.3f}s\n")

    print("="*70)
    print("EXECUTION TIMELINE ANALYSIS")
    print("="*70)

    # Find start and end times for attractions and culinary
    attr_start = next(t for t, n, e in timeline if n == "attractions" and e == "START")
    attr_end = next(t for t, n, e in timeline if n == "attractions" and e == "END")
    cul_start = next(t for t, n, e in timeline if n == "culinary" and e == "START")
    cul_end = next(t for t, n, e in timeline if n == "culinary" and e == "END")

    print(f"Attractions: start={attr_start:.3f}, end={attr_end:.3f} (duration: {attr_end-attr_start:.3f}s)")
    print(f"Culinary:    start={cul_start:.3f}, end={cul_end:.3f} (duration: {cul_end-cul_start:.3f}s)")

    # Check for overlap
    overlap_start = max(attr_start, cul_start)
    overlap_end = min(attr_end, cul_end)
    overlap = max(0, overlap_end - overlap_start)

    print(f"\nOverlap duration: {overlap:.3f}s")

    if overlap > 1.5:
        print("\n✅ VERIFIED: LangGraph executes Attractions and Culinary IN PARALLEL!")
        print(f"   Both ran simultaneously for {overlap:.2f}s out of ~2.0s duration.")
    elif overlap > 0.1:
        print("\n⚠️  PARTIAL OVERLAP: Agents overlapped partially.")
    else:
        print("\n❌ SEQUENTIAL: LangGraph executed agents one after the other.")

    print("="*70)


if __name__ == "__main__":
    asyncio.run(test_langgraph_parallelism())
