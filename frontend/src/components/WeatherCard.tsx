import type { WeatherData } from '../types/travel';
import { CloudRain, Sun, Thermometer } from 'lucide-react';

interface Props {
  weather: WeatherData;
}

// WMO code → emoji
function weatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code <= 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 65) return '🌧️';
  if (code <= 75) return '❄️';
  if (code <= 82) return '🌦️';
  return '⛈️';
}

function rainBar(pct: number) {
  const w = Math.min(100, Math.max(0, pct));
  const color = w > 70 ? '#ef4444' : w > 40 ? '#f59e0b' : '#6366f1';
  return (
    <div className="mt-1 h-1 w-full bg-slate-200/60 rounded-full overflow-hidden">
      <div style={{ width: `${w}%`, background: color }} className="h-full rounded-full transition-all" />
    </div>
  );
}

export function WeatherCard({ weather }: Props) {
  const days = weather.days ?? [];
  const insights = weather.ai_insights;

  if (!days.length) {
    return (
      <div className="rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 p-5 shadow-xl">
        <p className="text-sm text-slate-500 text-center py-4">Weather data unavailable</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 p-5 sm:p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center space-x-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
          <Sun className="w-4 h-4 text-sky-500" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">7-Day Weather Forecast</h3>
          <p className="text-[11px] text-slate-500">Open-Meteo · {weather.timezone}</p>
        </div>
      </div>

      {/* AI summary */}
      {insights?.overall_summary && (
        <p className="text-xs text-slate-600 bg-sky-50/60 rounded-xl p-3 mb-4 border border-sky-100/60 leading-relaxed">
          ☁️ {insights.overall_summary}
        </p>
      )}

      {/* Day strip */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.slice(0, 7).map((d, i) => {
          const isBestDay = insights?.best_days?.includes(d.date);
          const isRainDay = insights?.rain_risk_days?.includes(d.date);
          return (
            <div
              key={d.date}
              className={`
                flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-2xl border min-w-[72px] transition-all
                ${isBestDay ? 'bg-emerald-50/70 border-emerald-200' : isRainDay ? 'bg-rose-50/60 border-rose-200' : 'bg-white/40 border-white/50'}
              `}
            >
              <p className="text-[9px] text-slate-500 font-semibold">
                {i === 0 ? 'Today' : new Date(d.date + 'T12:00').toLocaleDateString('en', { weekday: 'short' })}
              </p>
              <div className="text-xl my-1">{weatherEmoji(d.wmo_code)}</div>
              <p className="text-[10px] font-bold text-slate-800">
                {d.temp_max_c !== null ? `${Math.round(d.temp_max_c)}°` : '--'}
              </p>
              <p className="text-[9px] text-slate-400">
                {d.temp_min_c !== null ? `${Math.round(d.temp_min_c)}°` : '--'}
              </p>
              {/* Rain bar */}
              {rainBar(d.rain_probability_pct)}
              <p className="text-[8px] text-slate-400 mt-0.5">{d.rain_probability_pct}% 💧</p>
            </div>
          );
        })}
      </div>

      {/* Indoor contingencies */}
      {insights?.indoor_contingencies?.length ? (
        <div className="mt-4">
          <div className="flex items-center space-x-1.5 mb-2">
            <CloudRain className="w-3.5 h-3.5 text-slate-500" />
            <p className="text-[11px] font-bold text-slate-700">Rainy Day Alternatives</p>
          </div>
          <ul className="space-y-1">
            {insights.indoor_contingencies.map((tip, i) => (
              <li key={i} className="text-[11px] text-slate-600 flex items-start space-x-1.5">
                <span className="text-sky-400 shrink-0">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Packing weather tips */}
      {insights?.packing_weather_tips?.length ? (
        <div className="mt-4 pt-3 border-t border-white/40">
          <div className="flex items-center space-x-1.5 mb-2">
            <Thermometer className="w-3.5 h-3.5 text-slate-500" />
            <p className="text-[11px] font-bold text-slate-700">What to Pack (weather)</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {insights.packing_weather_tips.map((tip, i) => (
              <span key={i} className="text-[10px] bg-white/60 border border-white/60 rounded-full px-2.5 py-0.5 text-slate-700">
                {tip}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
