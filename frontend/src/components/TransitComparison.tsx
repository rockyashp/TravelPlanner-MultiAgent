import type { TransitData } from '../types/travel';
import { Plane, Train, Bus, Car, Navigation, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';

interface Props {
  transit: TransitData;
}

const MODE_ICONS: Record<string, any> = {
  Flight: Plane,
  'Train / Rail (IRCTC)': Train,
  'Intercity Bus (Volvo AC / Sleeper)': Bus,
  'Outstation Cab / Self-Drive': Car,
};

const MODE_COLORS: Record<string, string> = {
  Flight: 'from-sky-500 to-indigo-600',
  'Train / Rail (IRCTC)': 'from-emerald-500 to-teal-600',
  'Intercity Bus (Volvo AC / Sleeper)': 'from-amber-500 to-orange-600',
  'Outstation Cab / Self-Drive': 'from-violet-500 to-purple-600',
};

export function TransitComparison({ transit }: Props) {
  if (!transit || !transit.options || transit.options.length === 0) {
    return null;
  }

  const { origin, destination, distance_km, options, local_transit_recommendations, ai_advice, summary } = transit;

  return (
    <div className="rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 p-5 sm:p-7 shadow-xl space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/40">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-white/80 rounded-[14px] flex items-center justify-center">
              <Navigation className="w-5 h-5 text-indigo-700" />
            </div>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
              Intercity Logistics
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              {origin || 'Origin'} → {destination || 'Destination'}
              {distance_km ? <span className="text-xs font-normal text-slate-500 ml-2">(~{distance_km} km)</span> : null}
            </h3>
          </div>
        </div>

        {ai_advice?.recommended_mode && (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Recommended: {ai_advice.recommended_mode}</span>
          </div>
        )}
      </div>

      {/* AI Logistics Rationale */}
      {(summary || ai_advice?.rationale) && (
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/40 rounded-2xl p-4 border border-white/50">
          💡 <strong>Transit Strategy:</strong> {ai_advice?.rationale || summary}
        </p>
      )}

      {/* Transit Cards Grid (Flight vs Train vs Bus vs Cab in ₹) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((opt, idx) => {
          const Icon = MODE_ICONS[opt.mode] || Car;
          const gradient = MODE_COLORS[opt.mode] || 'from-indigo-500 to-purple-600';

          return (
            <div
              key={idx}
              className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 flex flex-col justify-between ${
                opt.available
                  ? 'bg-white/40 hover:bg-white/60 border-white/60 shadow-md hover:shadow-lg'
                  : 'bg-slate-50/40 border-slate-200/40 opacity-70'
              }`}
            >
              <div>
                {/* Card Title & Icon */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${gradient} text-white flex items-center justify-center shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{opt.mode}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">⏱️ {opt.duration}</p>
                    </div>
                  </div>
                  {opt.available ? (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-100/80 text-emerald-800 text-xs font-extrabold">
                      {opt.estimated_fare_inr}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-600 text-[10px] font-semibold">
                      Not Ideal
                    </span>
                  )}
                </div>

                {/* Details & description */}
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {opt.details}
                </p>
              </div>

              {/* Booking Tip Footer */}
              {opt.booking_tip && (
                <div className="pt-2.5 border-t border-white/50 text-[11px] text-indigo-900/90 flex items-start space-x-1.5 bg-indigo-50/50 rounded-xl p-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Tip:</strong> {opt.booking_tip}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Local Transit Options (Metro, Auto-Rickshaws, Cabs, Rentals) */}
      {local_transit_recommendations && Object.keys(local_transit_recommendations).length > 0 && (
        <div className="pt-4 border-t border-white/40">
          <div className="flex items-center space-x-2 mb-3">
            <MapPin className="w-4 h-4 text-rose-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Local City Commute & Rates at {destination || 'Destination'}
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {Object.entries(local_transit_recommendations).map(([k, desc]) => {
              const label = k.replace('_', ' ').toUpperCase();
              return (
                <div key={k} className="p-3 rounded-2xl bg-white/40 border border-white/50 flex flex-col justify-between">
                  <p className="text-[10px] font-extrabold text-indigo-700 tracking-wider mb-1">
                    {label === 'AUTO RICKSHAW' ? '🛺 AUTO-RICKSHAW' : label === 'METRO' ? '🚇 METRO' : label === 'APP CABS' ? '🚕 OLA / UBER' : '🛵 SCOOTER RENT'}
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
