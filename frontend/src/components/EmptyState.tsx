import React from 'react';
import { Map, Cpu, Layers } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 my-10 animate-fade-in">
      {/* 3 Pillars Glassmorphism Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1 */}
        <div className="p-6 rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center mb-4 text-rose-600 shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">
            Parallel AI Orchestration
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Attractions and Culinary agents run simultaneously over LangGraph, cutting wait time in half with zero bottlenecks.
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-6 rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center mb-4 text-sky-600 shadow-sm">
            <Map className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">
            Real OpenStreetMap Data
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            No hallucinations. Every sight, beach, bakery, and seafood shack is queried live from global Overpass OpenStreetMap nodes.
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-6 rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600 shadow-sm">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">
            100% Free & Open APIs
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Powered purely by Google Gemini 1.5 and OpenStreetMap. No credit cards or paid Google Maps APIs required.
          </p>
        </div>
      </div>
    </div>
  );
};
