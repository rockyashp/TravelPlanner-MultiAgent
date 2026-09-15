import { useState } from 'react';
import type { SafetyAndPackingData } from '../types/travel';
import { ShieldCheck, CheckSquare, Square, Globe, AlertTriangle, Phone } from 'lucide-react';

interface Props {
  safety: SafetyAndPackingData;
}

export function SafetyAndPacking({ safety }: Props) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  if (!safety) return null;

  const country = safety.country_info || {};
  const packing = safety.packing_checklist || country.packing_checklist || {};
  const safetyTips = safety.safety_tips || country.safety_tips || [];
  const etiquette = safety.cultural_etiquette || country.cultural_etiquette || [];
  const emergency = safety.emergency_contacts || country.emergency_numbers || {
    "National Emergency": "112",
    "Police": "100",
    "Ambulance": "108 / 102",
    "Fire": "101",
    "Women Helpline": "1091",
  };

  const toggleCheck = (item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div className="rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 p-5 sm:p-7 shadow-xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-2.5">
        <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">Safety, Etiquette & Packing Checklist</h3>
          <p className="text-[11px] text-slate-500">
            Emergency helpline & cultural guidelines
          </p>
        </div>
      </div>

      {/* Emergency numbers pill strip */}
      {Object.keys(emergency).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(emergency).map(([service, num]) => (
            <span
              key={service}
              className="inline-flex items-center text-[10px] sm:text-xs font-bold bg-rose-50 border border-rose-200 text-rose-800 px-3 py-1.5 rounded-xl shadow-sm"
            >
              <Phone className="w-3 h-3 mr-1.5 text-rose-600" />
              {service}: <strong className="ml-1 text-rose-900">{String(num)}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Safety Tips & Scam Alerts */}
      {safetyTips.length > 0 && (
        <div>
          <div className="flex items-center space-x-1.5 mb-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Safety & Scam Alerts</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {safetyTips.map((tip: string, i: number) => (
              <div key={i} className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-xs text-slate-700 flex items-start space-x-2">
                <span className="text-amber-500 shrink-0 mt-0.5 font-bold">⚠️</span>
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cultural Etiquette */}
      {etiquette.length > 0 && (
        <div className="pt-2 border-t border-white/40">
          <div className="flex items-center space-x-1.5 mb-2.5">
            <Globe className="w-4 h-4 text-indigo-500" />
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cultural Etiquette & Local Norms</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {etiquette.map((tip: string, i: number) => (
              <div key={i} className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-200/60 text-xs text-slate-700 flex items-start space-x-2">
                <span className="text-indigo-500 shrink-0 mt-0.5">•</span>
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Packing Checklist */}
      {Object.keys(packing).length > 0 && (
        <div className="pt-2 border-t border-white/40">
          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Interactive Packing Checklist</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(packing).map(([category, items]) => {
              if (!Array.isArray(items) || !items.length) return null;
              const catTitle = category.replace('_', ' ').toUpperCase();
              return (
                <div key={category} className="p-3.5 rounded-2xl bg-white/40 border border-white/50">
                  <p className="text-[10px] font-extrabold text-indigo-800 tracking-wider mb-2.5">
                    {catTitle}
                  </p>
                  <ul className="space-y-2">
                    {items.map((item: string, idx: number) => {
                      const checked = checkedItems[item] || false;
                      return (
                        <li
                          key={idx}
                          onClick={() => toggleCheck(item)}
                          className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none group"
                        >
                          {checked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
                          )}
                          <span className={checked ? 'line-through text-slate-400' : ''}>{item}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
