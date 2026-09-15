import React, { createContext, useContext, useState, useCallback } from 'react';
import type { MapPin } from '../types/travel';

export type CategoryFilter = 'all' | 'attraction' | 'restaurant' | 'transit';
export type DayFilter = 'all' | number;

interface FocusLocation {
  lat: number;
  lon: number;
  zoom?: number;
}

interface MapSyncContextType {
  selectedPoiId: string | null;
  hoveredPoiId: string | null;
  activeDayFilter: DayFilter;
  activeCategoryFilter: CategoryFilter;
  focusLocation: FocusLocation | null;
  setSelectedPoiId: (id: string | null) => void;
  setHoveredPoiId: (id: string | null) => void;
  setActiveDayFilter: (day: DayFilter) => void;
  setActiveCategoryFilter: (category: CategoryFilter) => void;
  flyToLocation: (lat: number, lon: number, zoom?: number) => void;
  selectAndFocusPoi: (poi: MapPin | { id: string; lat: number; lon: number }) => void;
  scrollToCard: (id: string) => void;
}

const MapSyncContext = createContext<MapSyncContextType | undefined>(undefined);

export const MapSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [hoveredPoiId, setHoveredPoiId] = useState<string | null>(null);
  const [activeDayFilter, setActiveDayFilter] = useState<DayFilter>('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CategoryFilter>('all');
  const [focusLocation, setFocusLocation] = useState<FocusLocation | null>(null);

  const flyToLocation = useCallback((lat: number, lon: number, zoom: number = 15) => {
    setFocusLocation({ lat, lon, zoom });
  }, []);

  const selectAndFocusPoi = useCallback(
    (poi: MapPin | { id: string; lat: number; lon: number }) => {
      setSelectedPoiId(poi.id);
      if (poi.lat && poi.lon) {
        setFocusLocation({ lat: poi.lat, lon: poi.lon, zoom: 15 });
      }
    },
    []
  );

  const scrollToCard = useCallback((id: string) => {
    setSelectedPoiId(id);
    const element = document.getElementById(`activity-card-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-4', 'ring-indigo-400', 'scale-[1.02]');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-indigo-400', 'scale-[1.02]');
      }, 2000);
    }
  }, []);

  return (
    <MapSyncContext.Provider
      value={{
        selectedPoiId,
        hoveredPoiId,
        activeDayFilter,
        activeCategoryFilter,
        focusLocation,
        setSelectedPoiId,
        setHoveredPoiId,
        setActiveDayFilter,
        setActiveCategoryFilter,
        flyToLocation,
        selectAndFocusPoi,
        scrollToCard,
      }}
    >
      {children}
    </MapSyncContext.Provider>
  );
};

export function useMapSync() {
  const context = useContext(MapSyncContext);
  if (!context) {
    throw new Error('useMapSync must be used within a MapSyncProvider');
  }
  return context;
}
