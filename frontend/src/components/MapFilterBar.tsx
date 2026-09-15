import React from 'react';
import { useMapSync } from '../context/MapSyncContext';
import { Landmark, Utensils, Navigation, Layers } from 'lucide-react';

interface Props {
  totalDays: number;
}

export const MapFilterBar: React.FC<Props> = ({ totalDays }) => {
  const {
    activeDayFilter,
    activeCategoryFilter,
    setActiveDayFilter,
    setActiveCategoryFilter,
  } = useMapSync();

  const daysList = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-auto">
      {/* Floating Glassmorphic Filter Pill Container */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-white/20 p-2 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-2">
        {/* Day Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 max-w-full">
          <button
            type="button"
            onClick={() => setActiveDayFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all shrink-0 ${
              activeDayFilter === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white/60 hover:bg-white text-slate-700 border border-white/60'
            }`}
          >
            All Days
          </button>
          {daysList.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setActiveDayFilter(d)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all shrink-0 ${
                activeDayFilter === d
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-white/60 hover:bg-white text-slate-700 border border-white/60'
              }`}
            >
              Day {d}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('all')}
            title="Show All POIs"
            className={`p-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1 ${
              activeCategoryFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-white/60 hover:bg-white text-slate-700 border border-white/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">All</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryFilter(activeCategoryFilter === 'attraction' ? 'all' : 'attraction')}
            title="Filter Attractions"
            className={`px-2 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1 ${
              activeCategoryFilter === 'attraction'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white/60 hover:bg-white text-emerald-800 border border-emerald-200'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sights</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryFilter(activeCategoryFilter === 'restaurant' ? 'all' : 'restaurant')}
            title="Filter Food & Dining"
            className={`px-2 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1 ${
              activeCategoryFilter === 'restaurant'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white/60 hover:bg-white text-amber-800 border border-amber-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-amber-600" />
            <span>Food</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryFilter(activeCategoryFilter === 'transit' ? 'all' : 'transit')}
            title="Filter Transit Hubs"
            className={`px-2 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1 ${
              activeCategoryFilter === 'transit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white/60 hover:bg-white text-indigo-800 border border-indigo-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-indigo-600" />
            <span>Transit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
