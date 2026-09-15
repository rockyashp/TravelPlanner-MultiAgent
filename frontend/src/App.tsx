import { useState, useEffect } from 'react';
import { BackgroundGradients } from './components/BackgroundGradients';
import { Header } from './components/Header';
import { PromptInput } from './components/PromptInput';
import { AgentFlowVisualizer } from './components/AgentFlowVisualizer';
import { ItineraryView } from './components/ItineraryView';
import { EmptyState } from './components/EmptyState';
import { generateItinerary, streamItinerary, checkBackendHealth } from './services/api';
import type {
  Itinerary,
  TripMeta,
  TransitData,
  WeatherData,
  BudgetBreakdownINR,
  SafetyAndPackingData,
  AgentPipelineProgress,
} from './types/travel';
import { AlertCircle } from 'lucide-react';

const INITIAL_PROGRESS: AgentPipelineProgress = {
  intent_agent: 'idle',
  attractions: 'idle',
  culinary: 'idle',
  weather: 'idle',
  transit: 'idle',
  budget_safety: 'idle',
  synthesizer: 'idle',
};

export function App() {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [transit, setTransit] = useState<TransitData | undefined>(undefined);
  const [meta, setMeta] = useState<TripMeta | undefined>(undefined);
  const [weather, setWeather] = useState<WeatherData | undefined>(undefined);
  const [budget, setBudget] = useState<BudgetBreakdownINR | undefined>(undefined);
  const [safety, setSafety] = useState<SafetyAndPackingData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const [agentProgress, setAgentProgress] = useState<AgentPipelineProgress>(INITIAL_PROGRESS);

  // Check backend health periodically
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
    setTransit(undefined);
    setMeta(undefined);
    setWeather(undefined);
    setBudget(undefined);
    setSafety(undefined);
    setAgentProgress(INITIAL_PROGRESS);

    let streamCleanedUp = false;

    // Launch SSE Streaming client
    const stopStream = streamItinerary(
      query,
      // onAgentUpdate
      (node, status) => {
        setAgentProgress((prev) => ({
          ...prev,
          [node]: status === 'started' ? 'running' : status === 'completed' ? 'completed' : 'error',
        }));
      },
      // onComplete
      (res) => {
        streamCleanedUp = true;
        setAgentProgress({
          intent_agent: 'completed',
          attractions: 'completed',
          culinary: 'completed',
          weather: 'completed',
          transit: 'completed',
          budget_safety: 'completed',
          synthesizer: 'completed',
        });
        if (res.success && res.itinerary) {
          setItinerary(res.itinerary);
          setTransit(res.transit);
          setMeta(res.meta);
          setWeather(res.weather);
          setBudget(res.budget_breakdown);
          setSafety(res.safety);
        } else {
          setError(res.error || 'Failed to generate itinerary. Please try again.');
        }
        setIsLoading(false);
      },
      // onError — Graceful fallback to blocking POST
      async () => {
        if (streamCleanedUp) return;
        try {
          const res = await generateItinerary(query);
          setAgentProgress({
            intent_agent: 'completed',
            attractions: 'completed',
            culinary: 'completed',
            weather: 'completed',
            transit: 'completed',
            budget_safety: 'completed',
            synthesizer: 'completed',
          });
          if (res.success && res.itinerary) {
            setItinerary(res.itinerary);
            setTransit(res.transit);
            setMeta(res.meta);
            setWeather(res.weather);
            setBudget(res.budget_breakdown);
            setSafety(res.safety);
          } else {
            setError(res.error || 'Failed to generate itinerary.');
          }
        } catch (err: any) {
          setError(err.message || 'Unable to connect to the backend server.');
          setAgentProgress({
            intent_agent: 'error',
            attractions: 'error',
            culinary: 'error',
            weather: 'error',
            transit: 'error',
            budget_safety: 'error',
            synthesizer: 'error',
          });
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => stopStream();
  };

  return (
    <div className="min-h-screen flex flex-col relative text-slate-800 font-sans">
      {/* Fluid animated pastel background mesh */}
      <BackgroundGradients />

      {/* Header */}
      <Header backendOnline={backendOnline} />

      {/* Main Container */}
      <main className="flex-1 flex flex-col">
        {/* Dynamic Prompt / Trip Builder Input */}
        <PromptInput onSubmit={handlePlanTrip} isLoading={isLoading} />

        {/* Live LangGraph 7-Agent Architecture Radar */}
        <AgentFlowVisualizer progress={agentProgress} isLoading={isLoading} />

        {/* Error Notice */}
        {error && (
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 my-4 animate-fade-in">
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/80 backdrop-blur-md border border-rose-200 text-rose-800 shadow-lg flex items-start space-x-3">
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

        {/* Master Itinerary Results View */}
        {itinerary && !isLoading && (
          <ItineraryView
            itinerary={itinerary}
            transit={transit}
            meta={meta}
            weather={weather}
            budget={budget}
            safety={safety}
          />
        )}

        {/* Empty State / Pillars */}
        {!itinerary && !isLoading && !error && <EmptyState />}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 inline-flex flex-wrap items-center justify-center gap-3 shadow-sm">
          <span>✨ <strong>SAFAR-AI</strong> &bull; Multi-Agent Travel Planner</span>
          <span>&bull;</span>
          <span>INR (₹) Standardized &bull; Flights, Trains, Buses & Cabs</span>
          <span>&bull;</span>
          <span>LangGraph + Gemini + OpenStreetMap</span>
          <span>&bull;</span>
          <span className="text-emerald-700 font-bold">100% Free & Open APIs</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
