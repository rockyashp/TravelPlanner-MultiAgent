import React, { useState } from 'react';
import type { DayPlan } from '../types/travel';
import { ActivityCard } from './ActivityCard';
import { useMapSync } from '../context/MapSyncContext';
import { Utensils, Navigation, ExternalLink } from 'lucide-react';

interface Props {
  days: DayPlan[];
}

export const ItineraryTimeline: React.FC<Props> = ({ days }) => {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const { setActiveDayFilter, selectAndFocusPoi } = useMapSync();

  const handleDaySelect = (day: number | 'all') => {
    setSelectedDay(day);
    setActiveDayFilter(day);
  };

  const displayedDays = selectedDay === 'all' ? days : days.filter((d) => d.day === selectedDay);

  const getOsmMapUrl = (placeName: string) => {
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(placeName)}`;
  };

  return (
    <div className="space-y-6">
      {/* Day Selector Tabs Bar */}
      {days.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => handleDaySelect('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all shadow-sm shrink-0 ${
              selectedDay === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white/40 hover:bg-white/60 text-slate-700 border border-white/50'
            }`}
          >
            All Days ({days.length})
          </button>
          {days.map((d) => (
            <button
              key={d.day}
              type="button"
              onClick={() => handleDaySelect(d.day)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all shadow-sm whitespace-nowrap shrink-0 ${
                selectedDay === d.day
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-white/40 hover:bg-white/60 text-slate-700 border border-white/50'
              }`}
            >
              Day {d.day}
            </button>
          ))}
        </div>
      )}

      {/* Day-by-Day Cards */}
      <div className="space-y-8">
        {displayedDays.map((day) => (
          <div
            key={day.day}
            className="rounded-3xl bg-white/30 backdrop-blur-xl border border-white/50 p-6 sm:p-7 shadow-xl space-y-6 transition-all"
          >
            {/* Day Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/40">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                  D{day.day}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {day.title || `Day ${day.day}`}
                  </h3>
                  {day.theme && (
                    <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                      ✨ {day.theme}
                    </p>
                  )}
                </div>
              </div>

              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-white/70 text-slate-700 border border-white/60 shadow-sm">
                Geo-Clustered Schedule
              </span>
            </div>

            {/* Activities Grid: Morning, Afternoon, Evening */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {day.morning && (
                <ActivityCard slot="morning" data={day.morning} day={day.day} stopOrder={1} />
              )}
              {day.afternoon && (
                <ActivityCard slot="afternoon" data={day.afternoon} day={day.day} stopOrder={2} />
              )}
              {day.evening && (
                <ActivityCard slot="evening" data={day.evening} day={day.day} stopOrder={3} />
              )}
            </div>

            {/* Travel & Transit Logistics Note between stops */}
            {day.travel_note && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 font-medium flex items-center space-x-2.5">
                <Navigation className="w-4 h-4 text-indigo-600 shrink-0" />
                <span><strong>Transit Guidance:</strong> {day.travel_note}</span>
              </div>
            )}

            {/* Culinary Recommendations for the Day (INR ₹) */}
            {day.meals && day.meals.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/40 border border-white/50 space-y-3">
                <div className="flex items-center space-x-2">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Curated Dining & Food Stops (Day {day.day})
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {day.meals.map((meal, mIdx) => {
                    const mealId = `day-${day.day}-meal-${mIdx}`;
                    return (
                      <div
                        key={mIdx}
                        onClick={() => {
                          if (meal.lat && meal.lon) {
                            selectAndFocusPoi({ id: mealId, lat: meal.lat, lon: meal.lon });
                          }
                        }}
                        className="p-3 rounded-2xl bg-white/60 hover:bg-white/80 border border-white/60 text-xs cursor-pointer transition-all flex flex-col justify-between shadow-sm"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-extrabold text-slate-900 capitalize">
                              {meal.meal}:
                            </span>
                            {meal.budget_note && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 font-bold text-[10px]">
                                {meal.budget_note}
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-indigo-700 truncate">{meal.place}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{meal.cuisine}</p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-white/40 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">📍 Click to pin on map</span>
                          <a
                            href={getOsmMapUrl(meal.place)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center"
                          >
                            OSM <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
