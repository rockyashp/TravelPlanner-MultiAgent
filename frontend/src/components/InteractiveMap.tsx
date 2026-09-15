import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DayPlan, MapPin, TransitData } from '../types/travel';
import { useMapSync } from '../context/MapSyncContext';
import { MapFilterBar } from './MapFilterBar';

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Vibrant Day Colors
const DAY_COLORS = [
  '#4f46e5', // Day 1: Indigo
  '#db2777', // Day 2: Pink
  '#059669', // Day 3: Emerald
  '#d97706', // Day 4: Amber
  '#0284c7', // Day 5: Sky
  '#7c3aed', // Day 6: Violet
  '#dc2626', // Day 7: Rose
];

function createPinIcon(
  type: 'attraction' | 'restaurant' | 'transit',
  day: number,
  stopOrder?: number,
  isSelected: boolean = false,
  isHovered: boolean = false
) {
  const dayColor = DAY_COLORS[(day - 1) % DAY_COLORS.length];
  const typeEmoji = type === 'restaurant' ? '🍽️' : type === 'transit' ? '🚆' : '🏛️';
  const size = isSelected ? 38 : isHovered ? 34 : 30;
  const ringStyle = isSelected
    ? 'ring-4 ring-indigo-400 ring-offset-2 ring-offset-white animate-bounce'
    : isHovered
    ? 'ring-2 ring-violet-400 ring-offset-1 ring-offset-white scale-110'
    : 'shadow-md';

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div class="relative flex items-center justify-center transition-all duration-300">
        <div style="
          background: ${type === 'restaurant' ? '#d97706' : type === 'transit' ? '#4f46e5' : '#059669'};
          width: ${size}px; height: ${size}px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        " class="${ringStyle}">
          <span style="transform: rotate(45deg); font-size: ${isSelected ? 14 : 12}px;">
            ${typeEmoji}
          </span>
        </div>
        ${
          stopOrder !== undefined
            ? `
          <div style="
            position: absolute; top: -6px; right: -6px;
            background: ${dayColor}; color: white;
            font-size: 9px; font-weight: 800;
            width: 16px; height: 16px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          ">
            ${stopOrder}
          </div>`
            : ''
        }
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function extractAllPins(days: DayPlan[]): MapPin[] {
  const pins: MapPin[] = [];

  days.forEach((day) => {
    let stopCount = 1;
    const slots = ['morning', 'afternoon', 'evening'] as const;

    slots.forEach((slot) => {
      const s = day[slot];
      if (s && s.lat && s.lon) {
        pins.push({
          id: `day-${day.day}-${slot}`,
          lat: s.lat,
          lon: s.lon,
          label: s.place || s.activity,
          title: s.activity,
          description: s.description,
          tips: s.tips,
          cost: s.estimated_cost_inr || 'Free',
          time: s.time || (slot === 'morning' ? '09:00 AM' : slot === 'afternoon' ? '02:00 PM' : '06:00 PM'),
          type: 'attraction',
          day: day.day,
          slot,
          stopOrder: stopCount++,
        });
      }
    });

    (day.meals || []).forEach((meal, mIdx) => {
      if (meal.lat && meal.lon) {
        pins.push({
          id: `day-${day.day}-meal-${mIdx}`,
          lat: meal.lat,
          lon: meal.lon,
          label: meal.place,
          title: `${meal.meal.toUpperCase()}: ${meal.place}`,
          description: `Cuisine: ${meal.cuisine || 'Regional'}`,
          cost: meal.budget_note || (meal.estimated_cost_inr ? `₹${meal.estimated_cost_inr}` : '₹350/person'),
          time: meal.meal === 'breakfast' ? '08:30 AM' : meal.meal === 'lunch' ? '01:30 PM' : '08:00 PM',
          type: 'restaurant',
          day: day.day,
          slot: 'meal',
          stopOrder: stopCount++,
        });
      }
    });
  });

  return pins;
}

interface Props {
  days: DayPlan[];
  transit?: TransitData;
  centerLat?: number;
  centerLon?: number;
  activeDay?: number | 'all';
  focusPin?: { lat: number; lon: number } | null;
  className?: string;
  onSelectMarker?: (pin: MapPin) => void;
}

export function InteractiveMap({
  days,
  centerLat = 15.2993,
  centerLon = 74.1240,
  className = '',
  onSelectMarker,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);

  const {
    selectedPoiId,
    hoveredPoiId,
    activeDayFilter,
    activeCategoryFilter,
    focusLocation,
    scrollToCard,
  } = useMapSync();

  const allPins = useMemo(() => extractAllPins(days), [days]);

  const filteredPins = useMemo(() => {
    return allPins.filter((pin) => {
      const matchDay = activeDayFilter === 'all' || pin.day === activeDayFilter;
      const matchCat = activeCategoryFilter === 'all' || pin.type === activeCategoryFilter;
      return matchDay && matchCat;
    });
  }, [allPins, activeDayFilter, activeCategoryFilter]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat || 15.2993, centerLon || 74.1240],
      zoom: 12,
      zoomControl: false,
    });

    // Add clean zoom controls at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap Raster Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Markers & Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    if (polylineLayerRef.current) {
      map.removeLayer(polylineLayerRef.current);
      polylineLayerRef.current = null;
    }

    const bounds: [number, number][] = [];
    const routeCoords: [number, number][] = [];

    filteredPins.forEach((pin) => {
      const isSelected = selectedPoiId === pin.id;
      const isHovered = hoveredPoiId === pin.id;
      const icon = createPinIcon(pin.type, pin.day, pin.stopOrder, isSelected, isHovered);

      const marker = L.marker([pin.lat, pin.lon], { icon, zIndexOffset: isSelected ? 1000 : 100 });

      // Interactive Popup
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="
              background: ${DAY_COLORS[(pin.day - 1) % DAY_COLORS.length]};
              color: white; font-size: 10px; font-weight: 800;
              padding: 2px 8px; border-radius: 999px;
            ">
              Day ${pin.day} • Stop ${pin.stopOrder || 1}
            </span>
            <span style="font-size: 11px; font-weight: 700; color: #059669;">${pin.cost || 'Free'}</span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #0f172a;">${pin.title || pin.label}</h4>
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #475569; line-height: 1.4;">${pin.description || ''}</p>
          <div style="display: flex; gap: 6px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <a href="https://www.openstreetmap.org/search?query=${encodeURIComponent(pin.label)}" target="_blank" style="
              font-size: 10px; font-weight: 700; color: #4f46e5; text-decoration: none;
            ">
              🗺️ Open in OSM ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260 });

      marker.on('click', () => {
        if (onSelectMarker) {
          onSelectMarker(pin);
        }
        scrollToCard(pin.id);
      });

      markersLayerRef.current?.addLayer(marker);
      bounds.push([pin.lat, pin.lon]);

      // Collect polyline coordinates if filtered by specific day
      if (activeDayFilter !== 'all' && pin.day === activeDayFilter) {
        routeCoords.push([pin.lat, pin.lon]);
      }
    });

    // Draw route polyline for single day view
    if (routeCoords.length > 1) {
      const activeColor = typeof activeDayFilter === 'number'
        ? DAY_COLORS[(activeDayFilter - 1) % DAY_COLORS.length]
        : '#4f46e5';

      const polyline = L.polyline(routeCoords, {
        color: activeColor,
        weight: 3.5,
        opacity: 0.75,
        dashArray: '6, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineLayerRef.current = polyline;
    }

    // Fit map view smoothly to marker bounds
    if (bounds.length > 1 && !focusLocation) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 15 });
    } else if (bounds.length === 1 && !focusLocation) {
      map.setView(bounds[0], 14);
    }
  }, [filteredPins, selectedPoiId, hoveredPoiId, activeDayFilter, activeCategoryFilter]);

  // 3. Handle smooth Map FlyTo when card is hovered or clicked
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (focusLocation && map) {
      map.flyTo([focusLocation.lat, focusLocation.lon], focusLocation.zoom || 15, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [focusLocation]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Floating Filter Pill Bar */}
      <MapFilterBar totalDays={days.length} />

      {/* Leaflet Map DOM Root */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Live Map Badge */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/60 shadow-md text-[11px] font-extrabold text-slate-700 flex items-center space-x-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Live OSM Route Tracker</span>
        <span className="text-[10px] text-slate-500 font-normal">({filteredPins.length} stops)</span>
      </div>
    </div>
  );
}
