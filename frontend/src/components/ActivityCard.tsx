import React from 'react';
import type { TimeSlot } from '../types/travel';
import { useMapSync } from '../context/MapSyncContext';
import { Sun, Sunset, Moon, MapPin, ExternalLink, Clock, Sparkles } from 'lucide-react';

interface Props {
  slot: 'morning' | 'afternoon' | 'evening';
  data: TimeSlot;
  day: number;
  stopOrder: number;
}

const SLOT_CONFIG = {
  morning: {
    label: 'Morning',
    icon: Sun,
    bg: 'bg-amber-50/80',
    border: 'border-amber-200/70',
    text: 'text-amber-800',
    iconColor: 'text-amber-500',
  },
  afternoon: {
    label: 'Afternoon',
    icon: Sunset,
    bg: 'bg-orange-50/80',
    border: 'border-orange-200/70',
    text: 'text-orange-800',
    iconColor: 'text-orange-500',
  },
  evening: {
    label: 'Evening',
    icon: Moon,
    bg: 'bg-indigo-50/80',
    border: 'border-indigo-200/70',
    text: 'text-indigo-800',
    iconColor: 'text-indigo-500',
  },
};

export const ActivityCard: React.FC<Props> = ({ slot, data, day, stopOrder }) => {
  const { selectedPoiId, hoveredPoiId, selectAndFocusPoi, setHoveredPoiId } = useMapSync();

  const id = `day-${day}-${slot}`;
  const isSelected = selectedPoiId === id;
  const isHovered = hoveredPoiId === id;
  const config = SLOT_CONFIG[slot];
  const Icon = config.icon;

  const handleClick = () => {
    if (data.lat && data.lon) {
      selectAndFocusPoi({ id, lat: data.lat, lon: data.lon });
    }
  };

  const getOsmMapUrl = (placeName: string) => {
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(placeName)}`;
  };

  return (
    <div
      id={`activity-card-${id}`}
      onClick={handleClick}
      onMouseEnter={() => {
        setHoveredPoiId(id);
        if (data.lat && data.lon) {
          selectAndFocusPoi({ id, lat: data.lat, lon: data.lon });
        }
      }}
      onMouseLeave={() => setHoveredPoiId(null)}
      className={`
        relative rounded-3xl p-5 border transition-all duration-300 cursor-pointer flex flex-col justify-between
        ${
          isSelected
            ? 'bg-white/90 border-indigo-400 shadow-2xl ring-2 ring-indigo-400 scale-[1.01]'
            : isHovered
            ? 'bg-white/80 border-indigo-300 shadow-xl scale-[1.005]'
            : 'bg-white/40 hover:bg-white/60 border-white/50 shadow-md'
        }
      `}
    >
      <div>
        {/* Header Strip: Time badge, slot icon & entry fee in ₹ */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center space-x-1 text-[11px] font-extrabold px-2.5 py-1 rounded-xl border ${config.bg} ${config.border} ${config.text}`}
            >
              <Icon className={`w-3.5 h-3.5 ${config.iconColor} mr-1`} />
              <span>{data.time || config.label}</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-white/60 px-2 py-0.5 rounded-lg border border-white/60">
              Stop #{stopOrder}
            </span>
          </div>

          {data.estimated_cost_inr && (
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-emerald-100/90 border border-emerald-200 text-emerald-900 shadow-sm">
              {data.estimated_cost_inr}
            </span>
          )}
        </div>

        {/* Activity Title */}
        <h4 className="text-base font-extrabold text-slate-900 leading-snug mb-1.5 group-hover:text-indigo-600 transition-colors">
          {data.activity}
        </h4>

        {/* Place Subtitle with Map Icon */}
        <div className="flex items-center space-x-1.5 mb-3 text-xs font-bold text-indigo-700">
          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="truncate">{data.place || data.activity}</span>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          {data.description}
        </p>
      </div>

      {/* Footer Details: Practical Tips & OSM Link */}
      <div className="pt-3 border-t border-white/40 space-y-2">
        {data.tips && (
          <p className="text-[11px] text-slate-500 leading-normal flex items-start space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span><strong>Tip:</strong> {data.tips}</span>
          </p>
        )}

        <div className="flex items-center justify-between text-[11px] pt-1">
          {data.duration_hours && (
            <span className="text-slate-500 font-medium flex items-center">
              <Clock className="w-3 h-3 mr-1 text-slate-400" /> ~{data.duration_hours}h dwell
            </span>
          )}
          <a
            href={getOsmMapUrl(data.place || data.activity)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center font-bold text-indigo-600 hover:text-indigo-800 group"
          >
            <span>View on OSM</span>
            <ExternalLink className="w-3 h-3 ml-1 opacity-70 group-hover:opacity-100" />
          </a>
        </div>
      </div>
    </div>
  );
};
