import React from 'react';
import { Sparkles, MapPin, UtensilsCrossed, Compass, CheckCircle2, Loader2 } from 'lucide-react';
import type { AgentPipelineProgress } from '../types/travel';

interface AgentFlowVisualizerProps {
  progress: AgentPipelineProgress;
  isLoading: boolean;
}

export const AgentFlowVisualizer: React.FC<AgentFlowVisualizerProps> = ({ progress, isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 my-6 animate-fade-in">
      <div className="rounded-3xl bg-white/30 backdrop-blur-xl border border-white/50 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-spin-slow" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              LangGraph Multi-Agent Orchestration in Progress
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100/70 text-indigo-800 animate-pulse">
            Live Execution Flow
          </span>
        </div>

        {/* Visual Graph Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Node 1: Intent Parser */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 ${
            progress.intentParser === 'running'
              ? 'bg-indigo-50/70 border-indigo-300 shadow-md ring-2 ring-indigo-200'
              : progress.intentParser === 'completed'
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-white/20 border-white/40 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Compass className="w-4 h-4 text-indigo-600" />
              </div>
              {progress.intentParser === 'running' && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
              {progress.intentParser === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <h4 className="text-xs font-bold text-slate-800">1. Intent Parser</h4>
            <p className="text-[11px] text-slate-500 mt-1">Gemini NLP extracts location, budget & days</p>
          </div>

          {/* Parallel Nodes Container (Attractions + Culinary) */}
          <div className="md:col-span-2 relative p-2 rounded-2xl bg-white/20 border border-dashed border-indigo-200/80">
            <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded bg-indigo-600 text-[10px] font-bold text-white tracking-wider uppercase">
              ⚡ Parallel Swarm (Overpass OSM)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {/* Node 2A: Attractions Agent */}
              <div className={`p-3 rounded-xl border transition-all duration-300 ${
                progress.attractionsAgent === 'running'
                  ? 'bg-sky-50/80 border-sky-300 shadow-md ring-2 ring-sky-200'
                  : progress.attractionsAgent === 'completed'
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-white/30 border-white/40 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  {progress.attractionsAgent === 'running' && <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" />}
                  {progress.attractionsAgent === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <h5 className="text-[11px] font-bold text-slate-800">Attractions Agent</h5>
                <p className="text-[10px] text-slate-500 mt-0.5">Scouring OpenStreetMap sights & beaches</p>
              </div>

              {/* Node 2B: Culinary Agent */}
              <div className={`p-3 rounded-xl border transition-all duration-300 ${
                progress.culinaryAgent === 'running'
                  ? 'bg-amber-50/80 border-amber-300 shadow-md ring-2 ring-amber-200'
                  : progress.culinaryAgent === 'completed'
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-white/30 border-white/40 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  {progress.culinaryAgent === 'running' && <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />}
                  {progress.culinaryAgent === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <h5 className="text-[11px] font-bold text-slate-800">Culinary Agent</h5>
                <p className="text-[10px] text-slate-500 mt-0.5">Querying budget-matched seafood & food spots</p>
              </div>
            </div>
          </div>

          {/* Node 3: Synthesizer Agent */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 ${
            progress.synthesizer === 'running'
              ? 'bg-purple-50/80 border-purple-300 shadow-md ring-2 ring-purple-200'
              : progress.synthesizer === 'completed'
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-white/20 border-white/40 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              {progress.synthesizer === 'running' && <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />}
              {progress.synthesizer === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <h4 className="text-xs font-bold text-slate-800">3. Synthesizer</h4>
            <p className="text-[11px] text-slate-500 mt-1">Merging streams into structured itinerary JSON</p>
          </div>
        </div>

        {/* Informational Subtext */}
        <div className="mt-4 pt-3 border-t border-white/30 flex items-center justify-between text-[11px] text-slate-500">
          <span>Concurrency topology: Fan-Out &rarr; Fan-In (Zero blocking)</span>
          <span className="font-mono text-[10px]">Overpass QL + Gemini 1.5</span>
        </div>
      </div>
    </div>
  );
};
