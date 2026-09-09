import React, { useState } from 'react';
import { Send, Sparkles, MapPin, Compass, DollarSign, Calendar, Zap, Palmtree } from 'lucide-react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS = [
  {
    label: "Goa (2 Days, Seafood & Beaches)",
    text: "I want to go to Goa for 2 days, low budget, want to eat seafood and see quiet beaches.",
    icon: Palmtree,
    badge: "Recommended Test",
  },
  {
    label: "Tokyo (3 Days, Street Food & Neon)",
    text: "3 days in Tokyo, medium budget, focusing on authentic ramen, anime culture, and historic shrines.",
    icon: Compass,
    badge: "Culture & Food",
  },
  {
    label: "Paris (4 Days, Art & Cafes)",
    text: "4 days in Paris on a romantic vibe, moderate budget, hidden art museums, bakery crawls, and evening walks.",
    icon: MapPin,
    badge: "Romantic",
  },
  {
    label: "Kerala (5 Days, Backwaters & Tea)",
    text: "5 days relaxed backpacking in Kerala, low budget, peaceful backwaters, spice plantations, and vegan food.",
    icon: Zap,
    badge: "Nature",
  },
];

export const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSubmit(query.trim());
  };

  const handleSelectExample = (text: string) => {
    setQuery(text);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 my-6">
      {/* Main Glassmorphic Container */}
      <div className="relative rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-2xl p-6 sm:p-8 transition-all duration-300 hover:border-white/60">
        {/* Glow Accent Top Corner */}
        <div className="absolute top-0 right-10 w-48 h-20 bg-gradient-to-r from-pink-300/30 to-purple-300/30 blur-2xl pointer-events-none" />

        {/* Hero Section Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 text-xs font-semibold text-slate-700 mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
            <span>Multi-Agent Swarm • Gemini + Overpass OSM</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-3 leading-tight">
            Where does your next story begin?
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Describe your ideal trip in natural language. Our parallel agents scour live attractions, local culinary spots, and craft a bespoke day-by-day itinerary.
          </p>
        </div>

        {/* Text Area Form */}
        <form onSubmit={handleSubmit} className="relative mt-4">
          <div className="relative rounded-2xl overflow-hidden bg-white/40 backdrop-blur-md border border-white/50 focus-within:border-indigo-300 focus-within:bg-white/60 focus-within:ring-4 focus-within:ring-indigo-100/50 shadow-inner transition-all duration-300">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              placeholder="e.g., I want to go to Goa for 2 days, low budget, want to eat seafood and see quiet beaches..."
              rows={4}
              className="w-full p-4 sm:p-5 bg-transparent resize-none border-none outline-none text-slate-800 placeholder-slate-400 text-base sm:text-lg leading-relaxed focus:ring-0 disabled:opacity-50"
            />

            {/* Bottom Form Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-5 sm:py-3 bg-white/30 backdrop-blur-sm border-t border-white/40">
              {/* Feature Chips */}
              <div className="flex items-center space-x-2 sm:space-x-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 bg-white/50 px-2.5 py-1 rounded-lg border border-white/60">
                  <Calendar className="w-3 h-3 text-sky-500" />
                  Auto Duration
                </span>
                <span className="inline-flex items-center gap-1 bg-white/50 px-2.5 py-1 rounded-lg border border-white/60">
                  <DollarSign className="w-3 h-3 text-emerald-500" />
                  Budget Filter
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 bg-white/50 px-2.5 py-1 rounded-lg border border-white/60">
                  <Palmtree className="w-3 h-3 text-rose-500" />
                  Vibe Search
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className={`relative inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md ${
                  isLoading || !query.trim()
                    ? 'bg-slate-200/80 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:opacity-95 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Orchestrating Agents...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Itinerary</span>
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Preset Inspirations / Quick Fill Buttons */}
        <div className="mt-6 pt-5 border-t border-white/30">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            ✨ Quick Inspirations (Click to test):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {EXAMPLE_PROMPTS.map((ex, index) => {
              const Icon = ex.icon;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectExample(ex.text)}
                  disabled={isLoading}
                  className="flex items-start space-x-3 p-3 rounded-2xl bg-white/30 hover:bg-white/60 border border-white/40 hover:border-white/70 text-left transition-all duration-200 group shadow-sm disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/70 border border-white/80 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {ex.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50/80 text-indigo-700 font-medium ml-1">
                        {ex.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {ex.text}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
