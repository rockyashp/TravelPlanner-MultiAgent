import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Utensils,
  Sun,
  Sunset,
  Moon,
  DollarSign,
  Lightbulb,
  Copy,
  Check,
  Palmtree,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Itinerary, AgentMeta } from '../types/travel';

interface ItineraryViewProps {
  itinerary: Itinerary;
  meta?: AgentMeta;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({ itinerary, meta }) => {
  const [copied, setCopied] = useState(false);
  const [activeDay, setActiveDay] = useState<number | 'all'>('all');

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffd1dc', '#cbf3f0', '#d0e8f2', '#e2d4f0', '#ffccd5']
    });
  };

  const handleCopy = () => {
    const text = JSON.stringify(itinerary, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getOsmMapUrl = (placeName: string) => {
    const query = encodeURIComponent(`${placeName} ${itinerary.destination}`);
    return `https://www.openstreetmap.org/search?query=${query}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-8 animate-fade-in">
      {/* ── Top Itinerary Summary Header Card ── */}
      <div className="rounded-3xl bg-white/30 backdrop-blur-xl border border-white/50 p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
        {/* Soft Decorative Gradient Orb */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-pink-200/40 via-purple-200/30 to-sky-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            {/* Title & Badge */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-300 via-purple-300 to-indigo-300 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-white/80 rounded-[14px] flex items-center justify-center">
                  <Palmtree className="w-6 h-6 text-indigo-700" />
                </div>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                  Custom Itinerary
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                  {itinerary.destination}
                </h2>
              </div>
            </div>

            {/* Actions: Copy & Celebrate */}
            <div className="flex items-center space-x-2">
              <button
                onClick={triggerConfetti}
                className="p-2.5 rounded-xl bg-white/60 hover:bg-white/80 border border-white/60 text-slate-700 hover:text-indigo-600 transition-all shadow-sm"
                title="Celebrate Trip"
              >
                <Sparkles className="w-4 h-4 text-pink-500" />
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/60 hover:bg-white/80 border border-white/60 text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-all shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied JSON' : 'Export Plan'}</span>
              </button>
            </div>
          </div>

          {/* Overview summary text */}
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl mb-6">
            {itinerary.summary}
          </p>

          {/* Metadata Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/40">
            <div className="flex items-center space-x-2 p-2.5 rounded-2xl bg-white/40 border border-white/50">
              <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-medium">Duration</p>
                <p className="text-xs font-bold text-slate-800 truncate">{itinerary.duration_days} Day(s)</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-2.5 rounded-2xl bg-white/40 border border-white/50">
              <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-medium">Budget Style</p>
                <p className="text-xs font-bold text-slate-800 capitalize truncate">{itinerary.budget} Budget</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-2.5 rounded-2xl bg-white/40 border border-white/50">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-medium">Vibe</p>
                <p className="text-xs font-bold text-slate-800 truncate">{itinerary.vibe || 'Curated'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-2.5 rounded-2xl bg-white/40 border border-white/50">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-medium">Est. Daily Budget</p>
                <p className="text-xs font-bold text-slate-800 truncate">{itinerary.estimated_daily_budget || 'Budget friendly'}</p>
              </div>
            </div>
          </div>

          {/* Multi-Agent Meta Counter */}
          {meta && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="bg-white/50 px-2 py-0.5 rounded-md border border-white/60">
                📍 {meta.attractions_found ?? 0} OSM Attractions Analyzed
              </span>
              <span className="bg-white/50 px-2 py-0.5 rounded-md border border-white/60">
                🍴 {meta.food_spots_found ?? 0} OSM Culinary Spots Filtered
              </span>
              {meta.city && (
                <span className="bg-white/50 px-2 py-0.5 rounded-md border border-white/60">
                  🏙️ Target Area: {meta.city}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Day Filter Selector ── */}
      {itinerary.days.length > 1 && (
        <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveDay('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm ${
              activeDay === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white/40 hover:bg-white/60 text-slate-700 border border-white/50'
            }`}
          >
            All Days ({itinerary.days.length})
          </button>
          {itinerary.days.map((d) => (
            <button
              key={d.day}
              onClick={() => setActiveDay(d.day)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm whitespace-nowrap ${
                activeDay === d.day
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-white/40 hover:bg-white/60 text-slate-700 border border-white/50'
              }`}
            >
              Day {d.day}: {d.title || `Day ${d.day}`}
            </button>
          ))}
        </div>
      )}

      {/* ── Day-by-Day Cards ── */}
      <div className="space-y-6">
        {itinerary.days
          .filter((d) => activeDay === 'all' || activeDay === d.day)
          .map((day) => (
            <div
              key={day.day}
              className="rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/40 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                    D{day.day}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {day.title || `Day ${day.day}`}
                    </h3>
                    {day.theme && (
                      <p className="text-xs text-indigo-700 font-medium mt-0.5">
                        ✨ Theme: {day.theme}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/60 text-slate-700 border border-white/60 shadow-sm">
                  Full Day Schedule
                </span>
              </div>

              {/* Time Slots Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Morning */}
                {day.morning && (
                  <div className="p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                          <Sun className="w-3 h-3 text-amber-500 mr-1" />
                          Morning
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">
                        {day.morning.activity}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {day.morning.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/40 flex items-center justify-between text-xs">
                      <a
                        href={getOsmMapUrl(day.morning.place || day.morning.activity)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] group"
                      >
                        <MapPin className="w-3 h-3 mr-1 text-rose-500" />
                        <span className="truncate max-w-[140px]">{day.morning.place}</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-60 group-hover:opacity-100" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Afternoon */}
                {day.afternoon && (
                  <div className="p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center space-x-1 text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
                          <Sunset className="w-3 h-3 text-orange-500 mr-1" />
                          Afternoon
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">
                        {day.afternoon.activity}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {day.afternoon.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/40 flex items-center justify-between text-xs">
                      <a
                        href={getOsmMapUrl(day.afternoon.place || day.afternoon.activity)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] group"
                      >
                        <MapPin className="w-3 h-3 mr-1 text-rose-500" />
                        <span className="truncate max-w-[140px]">{day.afternoon.place}</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-60 group-hover:opacity-100" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Evening */}
                {day.evening && (
                  <div className="p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                          <Moon className="w-3 h-3 text-indigo-500 mr-1" />
                          Evening
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">
                        {day.evening.activity}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {day.evening.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/40 flex items-center justify-between text-xs">
                      <a
                        href={getOsmMapUrl(day.evening.place || day.evening.activity)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] group"
                      >
                        <MapPin className="w-3 h-3 mr-1 text-rose-500" />
                        <span className="truncate max-w-[140px]">{day.evening.place}</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-60 group-hover:opacity-100" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Culinary & Meal Recommendations (Curated by Culinary Agent) */}
              {day.meals && day.meals.length > 0 && (
                <div className="p-4 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/40">
                  <div className="flex items-center space-x-2 mb-3">
                    <Utensils className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Culinary Spots Curated for Day {day.day}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {day.meals.map((meal, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 border border-white/60 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-800 capitalize">
                              {meal.meal}:
                            </span>
                            <a
                              href={getOsmMapUrl(meal.place)}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-indigo-600 hover:underline truncate inline-flex items-center"
                            >
                              {meal.place}
                              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                            </a>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Cuisine: {meal.cuisine || 'Local Specialties'}
                          </p>
                        </div>
                        {meal.budget_note && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 font-semibold text-[10px] ml-2 shrink-0">
                            {meal.budget_note}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* ── Practical Tips Section ── */}
      {itinerary.practical_tips && itinerary.practical_tips.length > 0 && (
        <div className="mt-8 rounded-3xl bg-white/30 backdrop-blur-xl border border-white/50 p-6 sm:p-8 shadow-xl">
          <div className="flex items-center space-x-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              Smart Tips from Synthesizer Agent
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {itinerary.practical_tips.map((tip, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white/40 border border-white/50 text-xs text-slate-700 leading-relaxed flex items-start space-x-2"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                  {idx + 1}
                </span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
