import React, { useState } from 'react';
import type {
  Itinerary,
  TripMeta,
  TransitData,
  WeatherData,
  BudgetBreakdownINR,
  SafetyAndPackingData,
  MapPin,
} from '../types/travel';
import { InteractiveMap } from './InteractiveMap';
import { ItineraryTimeline } from './ItineraryTimeline';
import { TransitComparison } from './TransitComparison';
import { WeatherCard } from './WeatherCard';
import { BudgetBreakdown } from './BudgetBreakdown';
import { SafetyAndPacking } from './SafetyAndPacking';
import { ExportActions } from './ExportActions';
import { useMapSync } from '../context/MapSyncContext';
import {
  Calendar,
  IndianRupee,
  Sparkles,
  Compass,
  Map as MapIcon,
  ListOrdered,
  X,
} from 'lucide-react';

interface Props {
  itinerary: Itinerary;
  transit?: TransitData;
  weather?: WeatherData;
  budget?: BudgetBreakdownINR;
  safety?: SafetyAndPackingData;
  meta?: TripMeta;
}

export const DualPaneLayout: React.FC<Props> = ({
  itinerary,
  transit,
  weather,
  budget,
  safety,
  meta,
}) => {
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [bottomSheetPin, setBottomSheetPin] = useState<MapPin | null>(null);

  const { scrollToCard } = useMapSync();

  const centerLat = meta?.lat || (weather?.latitude ?? 15.2993);
  const centerLon = meta?.lon || (weather?.longitude ?? 74.1240);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 my-6 animate-fade-in" id="itinerary-content-root">
      {/* ── Top Master Header Bar ── */}
      <div className="rounded-3xl bg-white/30 backdrop-blur-xl border border-white/50 p-6 sm:p-7 shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-200/40 via-purple-200/30 to-pink-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          {/* Destination Title & Route Badge */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-300 via-purple-300 to-indigo-300 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white/80 rounded-[14px] flex items-center justify-center">
                <Compass className="w-6 h-6 text-indigo-700" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                {itinerary.origin || meta?.origin ? `${itinerary.origin || meta?.origin} → ` : ''}Master Travel Plan (INR ₹)
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                {itinerary.destination}
              </h1>
            </div>
          </div>

          {/* Export Actions: PDF (INR) & .ics Calendar */}
          <ExportActions itinerary={itinerary} meta={meta} weather={weather} budget={budget} />
        </div>

        {/* Overview Summary */}
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-4xl mt-4">
          {itinerary.summary}
        </p>

        {/* Quick Highlights & Metadata Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-4 border-t border-white/40">
          <div className="flex items-center space-x-2 p-2.5 rounded-2xl bg-white/40 border border-white/50">
            <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-medium">Duration</p>
              <p className="text-xs font-bold text-slate-800 truncate">{itinerary.duration_days} Day(s)</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-2.5 rounded-2xl bg-white/40 border border-white/50">
            <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-medium">Budget</p>
              <p className="text-xs font-bold text-slate-800 capitalize truncate">
                {itinerary.budget_tier || itinerary.budget || 'Medium'} Tier
              </p>
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
            <IndianRupee className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-medium">Est. Daily Budget</p>
              <p className="text-xs font-bold text-slate-800 truncate">
                {itinerary.estimated_daily_budget_inr || itinerary.estimated_daily_budget || '₹2,500/day'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Dual-Pane Split Layout (Desktop: 60% Left / 40% Sticky Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        {/* ── LEFT PANE (60% Desktop - Scrollable Timeline & Sections) ── */}
        <div
          className={`lg:col-span-7 space-y-8 ${
            mobileView === 'map' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Intercity Transit Comparison (Flights / Trains / Buses / Cabs) */}
          {transit && transit.options && transit.options.length > 0 && (
            <TransitComparison transit={transit} />
          )}

          {/* Day-by-Day Geo-Clustered Timeline */}
          <ItineraryTimeline days={itinerary.days} />

          {/* 7-Day Weather Strip */}
          {weather && weather.days && <WeatherCard weather={weather} />}

          {/* INR (₹) Financial Architecture */}
          {budget && budget.breakdown && <BudgetBreakdown budget={budget} />}

          {/* Safety & Interactive Packing Checklist */}
          {safety && <SafetyAndPacking safety={safety} />}

          {/* Smart AI Tips */}
          {itinerary.practical_tips && itinerary.practical_tips.length > 0 && (
            <div className="rounded-3xl bg-white/30 backdrop-blur-xl border border-white/50 p-6 shadow-xl">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                  AI Synthesizer Pro Tips
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {itinerary.practical_tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white/40 border border-white/50 text-xs text-slate-700 leading-relaxed flex items-start space-x-2"
                  >
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANE (40% Desktop - Sticky Live Map) ── */}
        <div
          className={`lg:col-span-5 ${
            mobileView === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="lg:sticky lg:top-20 w-full h-[calc(100vh-6rem)] min-h-[500px] max-h-[850px] rounded-3xl overflow-hidden border border-white/50 shadow-2xl bg-white/20 backdrop-blur-md">
            <InteractiveMap
              days={itinerary.days}
              transit={transit}
              centerLat={centerLat}
              centerLon={centerLon}
              onSelectMarker={(pin) => {
                setBottomSheetPin(pin);
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile Floating View Switcher Bar (Bottom Center) ── */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[1500] flex items-center bg-slate-900/90 backdrop-blur-xl border border-white/20 text-white p-1 rounded-full shadow-2xl">
        <button
          type="button"
          onClick={() => setMobileView('list')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-extrabold transition-all ${
            mobileView === 'list'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Timeline List</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('map')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-extrabold transition-all ${
            mobileView === 'map'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Interactive Map</span>
        </button>
      </div>

      {/* ── Mobile Marker Bottom-Sheet Preview ── */}
      {bottomSheetPin && mobileView === 'map' && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-[1600] bg-white/95 backdrop-blur-2xl p-5 rounded-3xl border border-white/80 shadow-2xl animate-fade-in">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">
              Day {bottomSheetPin.day} • Stop {bottomSheetPin.stopOrder || 1}
            </span>
            <button
              type="button"
              onClick={() => setBottomSheetPin(null)}
              className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-base font-extrabold text-slate-900">{bottomSheetPin.title || bottomSheetPin.label}</h4>
          <p className="text-xs text-slate-600 line-clamp-2 mt-1">{bottomSheetPin.description}</p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
            <span className="font-extrabold text-emerald-700">{bottomSheetPin.cost}</span>
            <button
              type="button"
              onClick={() => {
                setMobileView('list');
                scrollToCard(bottomSheetPin.id);
                setBottomSheetPin(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold shadow-md"
            >
              View in Timeline 📋
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
