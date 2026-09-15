import type { BudgetBreakdownINR } from '../types/travel';
import { IndianRupee, TrendingDown, Sparkles } from 'lucide-react';

interface Props {
  budget: BudgetBreakdownINR;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  accommodation: { label: 'Accommodation', icon: '🏨' },
  intercity_transit: { label: 'Intercity Travel (Flight/Train/Bus)', icon: '✈️' },
  local_transport: { label: 'Local Commute (Metro/Autos/Cabs)', icon: '🛺' },
  meals_dining: { label: 'Food & Regional Dining', icon: '🍛' },
  sightseeing_tickets: { label: 'Sightseeing & Entry Tickets', icon: '🎟️' },
  emergency_buffer: { label: 'Emergency Fund & Buffer', icon: '🛡️' },
};

export function BudgetBreakdown({ budget }: Props) {
  if (!budget || !budget.breakdown) {
    return null;
  }

  const { breakdown, total_estimated_inr, per_day_average_inr, money_saving_tips } = budget;

  return (
    <div className="rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 p-5 sm:p-7 shadow-xl space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/40">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-white/80 rounded-[14px] flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-emerald-700" />
            </div>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50/80 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Financial Breakdown (INR)
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              Cost & Budget Architecture
            </h3>
          </div>
        </div>

        {total_estimated_inr && (
          <div className="text-right bg-emerald-50/80 border border-emerald-200/70 px-4 py-2 rounded-2xl shadow-sm">
            <p className="text-xs text-emerald-800 font-semibold">Total Estimated Trip</p>
            <p className="text-base sm:text-lg font-extrabold text-emerald-900">{total_estimated_inr}</p>
            {per_day_average_inr && (
              <p className="text-[10px] text-emerald-700 font-medium">Avg: {per_day_average_inr}</p>
            )}
          </div>
        )}
      </div>

      {/* Categorized Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {Object.entries(breakdown).map(([key, val]) => {
          const meta = CATEGORY_LABELS[key] || { label: key.replace('_', ' ').toUpperCase(), icon: '💳' };
          const range = typeof val === 'object' && val.total ? val.total : (val as any)?.amount || (val as any)?.low || '₹0';
          const rate = typeof val === 'object' && val.low ? `${val.low} – ${val.mid}` : '';
          const note = (val as any)?.note || '';

          return (
            <div
              key={key}
              className="p-4 rounded-2xl bg-white/40 hover:bg-white/60 border border-white/50 shadow-sm flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-base">{meta.icon}</span>
                  <span className="text-xs font-bold text-slate-800 leading-tight">{meta.label}</span>
                </div>
                <p className="text-sm font-extrabold text-emerald-900">{range}</p>
                {rate && <p className="text-[11px] text-slate-500 font-medium mt-0.5">{rate}</p>}
              </div>
              {note && <p className="text-[10px] text-slate-400 mt-2 pt-1 border-t border-white/40">{note}</p>}
            </div>
          );
        })}
      </div>

      {/* Money-Saving Insights */}
      {money_saving_tips?.length ? (
        <div className="pt-3 border-t border-white/40">
          <div className="flex items-center space-x-2 mb-2.5">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Pro Budget Saving Tips (India Edition)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {money_saving_tips.map((tip, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-700 flex items-start space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
