"""
Test to verify parallel execution of Attractions and Culinary agents.
This test adds timing instrumentation to prove concurrency.
"""
import asyncio
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY", "placeholder")

from app.models import TripState
from app.agents.attractions_agent import attractions_node
from app.agents.culinary_agent import culinary_node


async def test_sequential():
    """Run agents sequentially - baseline timing."""
    print("="*70)
    print("TEST 1: SEQUENTIAL EXECUTION")
    print("="*70)

    state = TripState(
        raw_query="Goa for 2 days",
        city="Panaji",
        location="Goa, India",
        vibe="beaches, seafood",
        budget="low"
    )

    start = time.time()

    print(f"[{time.time()-start:.2f}s] Starting Attractions agent...")
    state = await attractions_node(state)
    print(f"[{time.time()-start:.2f}s] Attractions done: {len(state.attractions)} results")

    print(f"[{time.time()-start:.2f}s] Starting Culinary agent...")
    state = await culinary_node(state)
    print(f"[{time.time()-start:.2f}s] Culinary done: {len(state.food_spots)} results")

    total = time.time() - start
    print(f"\nSequential total: {total:.2f}s\n")
    return total


async def test_parallel():
    """Run agents in parallel using asyncio.gather."""
    print("="*70)
    print("TEST 2: PARALLEL EXECUTION (asyncio.gather)")
    print("="*70)

    state = TripState(
        raw_query="Goa for 2 days",
        city="Panaji",
        location="Goa, India",
        vibe="beaches, seafood",
        budget="low"
    )

    start = time.time()

    print(f"[{time.time()-start:.2f}s] Starting BOTH agents concurrently...")

    # Run both agents in parallel
    results = await asyncio.gather(
        attractions_node(state),
        culinary_node(state)
    )

    # Merge results
    state.attractions = results[0].attractions
    state.food_spots = results[1].food_spots

    total = time.time() - start
    print(f"[{time.time()-start:.2f}s] Both agents done")
    print(f"  Attractions: {len(state.attractions)} results")
    print(f"  Culinary: {len(state.food_spots)} results")
    print(f"\nParallel total: {total:.2f}s\n")
    return total


async def main():
    print("\n" + "="*70)
    print("LangGraph Parallelism Verification Test")
    print("="*70 + "\n")

    try:
        seq_time = await test_sequential()
    except Exception as e:
        print(f"Sequential test failed: {e}\n")
        seq_time = None

    try:
        par_time = await test_parallel()
    except Exception as e:
        print(f"Parallel test failed: {e}\n")
        par_time = None

    print("="*70)
    print("ANALYSIS")
    print("="*70)

    if seq_time and par_time:
        speedup = seq_time / par_time
        print(f"Sequential time:  {seq_time:.2f}s")
        print(f"Parallel time:    {par_time:.2f}s")
        print(f"Speedup:          {speedup:.2f}x")
        print()

        if speedup > 1.5:
            print("TRUE PARALLELISM: Agents run concurrently!")
            print("This proves asyncio.gather enables parallel execution.")
        elif speedup > 1.1:
            print("PARTIAL PARALLELISM: Some overlap detected")
        else:
            print("NO PARALLELISM: Agents appear to run sequentially")
            print("This means the current LangGraph setup may not be parallel.")
    else:
        print("Could not complete timing analysis")

    print("="*70)


if __name__ == "__main__":
    asyncio.run(main())
