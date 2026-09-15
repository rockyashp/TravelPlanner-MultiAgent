import React, { useState } from 'react';
import { Send, Sparkles, MapPin, Calendar, IndianRupee, Users, Compass } from 'lucide-react';

interface Props {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

const SAMPLE_PROMPTS = [
  'Trip from Mumbai to Goa for 3 days for a couple, budget ₹25,000, seafood & beach sunsets',
  'Solo backpacker 4-day trip from Delhi to Manali, budget ₹12,000, trekking & local cafes',
  'Family vacation from Bangalore to Kerala for 5 days, moderate budget, backwaters & ayurveda',
  'Weekend road trip from Pune to Mahabaleshwar for friends, scenic viewpoints & strawberry farms',
];

export function PromptInput({ onSubmit, isLoading }: Props) {
  const [query, setQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Structured fields for quick builder
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('3');
  const [budgetInr, setBudgetInr] = useState('₹25,000');
  const [party, setParty] = useState('Couple');
  const [vibe, setVibe] = useState('Beaches & Local Cuisine');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
    }
  };

  const handleBuildQuery = () => {
    const orig = origin.trim() || 'Mumbai';
    const dest = destination.trim() || 'Goa';
    const constructed = `Plan a ${days}-day trip from ${orig} to ${dest} for a ${party.toLowerCase()}, budget ${budgetInr}, focusing on ${vibe}.`;
    setQuery(constructed);
    onSubmit(constructed);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 my-4 sm:my-6 animate-fade-in">
      <div className="rounded-3xl bg-white/30 backdrop-blur-xl border border-white/50 p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Soft Background Accent Orb */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/30 via-purple-200/20 to-pink-200/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                AI Travel Query Prompt (INR ₹ Standard)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 px-2.5 py-1 rounded-xl border border-indigo-200/60 transition-all"
            >
              {showAdvanced ? 'Simple Input' : '⚡ Trip Builder Form'}
            </button>
          </div>

          {/* Structured Trip Builder Form */}
          {showAdvanced ? (
            <div className="space-y-4 mb-4 pt-2 border-t border-white/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 flex items-center mb-1">
                    <MapPin className="w-3 h-3 mr-1 text-sky-600" /> Origin City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Delhi, Bangalore"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl bg-white/60 border border-white/60 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 flex items-center mb-1">
                    <Compass className="w-3 h-3 mr-1 text-rose-600" /> Destination
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Goa, Manali, Kerala, Jaipur"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl bg-white/60 border border-white/60 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 flex items-center mb-1">
                    <Calendar className="w-3 h-3 mr-1 text-indigo-600" /> Duration
                  </label>
                  <select
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-white/60 border border-white/60 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="2">2 Days (Weekend)</option>
                    <option value="3">3 Days (Short Trip)</option>
                    <option value="4">4 Days (Standard)</option>
                    <option value="5">5 Days (Extended)</option>
                    <option value="7">7 Days (Full Week)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 flex items-center mb-1">
                    <IndianRupee className="w-3 h-3 mr-1 text-emerald-600" /> Total Budget
                  </label>
                  <select
                    value={budgetInr}
                    onChange={(e) => setBudgetInr(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-white/60 border border-white/60 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="₹12,000">Budget (₹12,000)</option>
                    <option value="₹25,000">Moderate (₹25,000)</option>
                    <option value="₹45,000">Comfort (₹45,000)</option>
                    <option value="₹75,000">Luxury (₹75,000+)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 flex items-center mb-1">
                    <Users className="w-3 h-3 mr-1 text-purple-600" /> Party Type
                  </label>
                  <select
                    value={party}
                    onChange={(e) => setParty(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-white/60 border border-white/60 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="Solo">Solo Traveler</option>
                    <option value="Couple">Couple</option>
                    <option value="Friends">Friends Group</option>
                    <option value="Family">Family with Kids</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 flex items-center mb-1">
                    ✨ Travel Vibe
                  </label>
                  <input
                    type="text"
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value)}
                    placeholder="e.g. Food, Temples, Sunsets"
                    className="w-full px-3 py-2 rounded-2xl bg-white/60 border border-white/60 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleBuildQuery}
                disabled={isLoading}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all"
              >
                {isLoading ? 'Generating Multi-Agent Plan...' : '🚀 Launch Multi-Agent Plan (INR ₹)'}
              </button>
            </div>
          ) : null}

          {/* Natural Language Prompt Input */}
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Plan a 3-day trip from Delhi to Goa for a couple, budget ₹25,000, seafood & sunsets..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 sm:py-3.5 rounded-2xl bg-white/60 backdrop-blur-md border border-white/60 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 shadow-inner"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-xs sm:text-sm flex items-center space-x-1.5 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <span>{isLoading ? 'Planning...' : 'Plan Trip'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Clickable Suggestions */}
          <div className="mt-3 flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] text-slate-600">
            <span className="font-bold text-slate-500 shrink-0">Try:</span>
            {SAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(prompt);
                  onSubmit(prompt);
                }}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-white/50 hover:bg-white/80 border border-white/60 text-slate-700 hover:text-indigo-700 transition-all truncate max-w-[280px]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
