import { useState, useEffect } from 'react';
import { BackgroundGradients } from './components/BackgroundGradients';
import { Header } from './components/Header';
import { PromptInput } from './components/PromptInput';
import { AgentFlowVisualizer } from './components/AgentFlowVisualizer';
import { ItineraryView } from './components/ItineraryView';
import { EmptyState } from './components/EmptyState';
import { generateItinerary, checkBackendHealth } from './services/api';
import type { Itinerary, AgentMeta, AgentPipelineProgress } from './types/travel';
import { AlertCircle } from 'lucide-react';

export function App() {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [meta, setMeta] = useState<AgentMeta | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Agent flow visualizer state
  const [agentProgress, setAgentProgress] = useState<AgentPipelineProgress>({
    intentParser: 'idle',
    attractionsAgent: 'idle',
    culinaryAgent: 'idle',
    synthesizer: 'idle',
  });

  // Check backend health on mount & periodically
  useEffect(() => {
    let mounted = true;
    const verifyHealth = async () => {
      const isUp = await checkBackendHealth();
      if (mounted) setBackendOnline(isUp);
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handlePlanTrip = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setItinerary(null);
    setMeta(undefined);

    // Initial agent visualizer state: Intent Parser starts
    setAgentProgress({
      intentParser: 'running',
      attractionsAgent: 'idle',
      culinaryAgent: 'idle',
      synthesizer: 'idle',
    });

    // Step 2 timer: Intent Parser finishes -> Attractions and Culinary run IN PARALLEL
    const parallelTimer = setTimeout(() => {
      setAgentProgress({
        intentParser: 'completed',
        attractionsAgent: 'running',
        culinaryAgent: 'running',
        synthesizer: 'idle',
      });
    }, 1800);

    // Step 3 timer: Parallel agents finish -> Synthesizer runs
    const synthTimer = setTimeout(() => {
      setAgentProgress({
        intentParser: 'completed',
        attractionsAgent: 'completed',
        culinaryAgent: 'completed',
        synthesizer: 'running',
      });
    }, 4500);

    try {
      const response = await generateItinerary(query);

      clearTimeout(parallelTimer);
      clearTimeout(synthTimer);

      setAgentProgress({
        intentParser: 'completed',
        attractionsAgent: 'completed',
        culinaryAgent: 'completed',
        synthesizer: 'completed',
      });

      if (response.success && response.itinerary) {
        setItinerary(response.itinerary);
        setMeta(response.meta);
      } else {
        setError(response.error || 'Failed to generate itinerary. Please try again.');
      }
    } catch (err: any) {
      clearTimeout(parallelTimer);
      clearTimeout(synthTimer);
      console.error('Plan trip error:', err);
      setError(
        err.message || 'Unable to connect to the backend server. Make sure FastAPI is running on port 8000.'
      );
      setAgentProgress({
        intentParser: 'error',
        attractionsAgent: 'error',
        culinaryAgent: 'error',
        synthesizer: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative text-slate-800">
      {/* Animated fluid pastel background mesh */}
      <BackgroundGradients />

      {/* Top Header */}
      <Header backendOnline={backendOnline} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Prompt Input Component */}
        <PromptInput onSubmit={handlePlanTrip} isLoading={isLoading} />

        {/* Live LangGraph Flow Visualizer (Shown during generation) */}
        <AgentFlowVisualizer progress={agentProgress} isLoading={isLoading} />

        {/* Error Banner */}
        {error && (
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 my-4 animate-fade-in">
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/80 backdrop-blur-md border border-rose-200/80 text-rose-800 shadow-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-bold">Trip Planning Notice</p>
                <p className="text-xs text-rose-700 mt-1 leading-relaxed">{error}</p>
                <p className="text-[11px] text-rose-600/90 mt-2">
                  Tip: Verify your Gemini API key in <code className="bg-rose-100/80 px-1 py-0.5 rounded">.env</code> and ensure FastAPI is running on <code className="bg-rose-100/80 px-1 py-0.5 rounded">localhost:8000</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Itinerary Results View */}
        {itinerary && !isLoading && (
          <ItineraryView itinerary={itinerary} meta={meta} />
        )}

        {/* Empty State / Pillars */}
        {!itinerary && !isLoading && !error && <EmptyState />}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 inline-flex flex-wrap items-center justify-center gap-3">
          <span>✨ <strong>Aura Travel</strong> &bull; Multi-Agent Travel Planner</span>
          <span>&bull;</span>
          <span>LangGraph + Gemini + OpenStreetMap Overpass</span>
          <span>&bull;</span>
          <span className="text-emerald-700 font-medium">100% Free & Open Source</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
