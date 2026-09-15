import React from 'react';
import type {
  Itinerary,
  TripMeta,
  TransitData,
  WeatherData,
  BudgetBreakdownINR,
  SafetyAndPackingData,
} from '../types/travel';
import { DualPaneLayout } from './DualPaneLayout';
import { MapSyncProvider } from '../context/MapSyncContext';

interface Props {
  itinerary: Itinerary;
  transit?: TransitData;
  weather?: WeatherData;
  budget?: BudgetBreakdownINR;
  safety?: SafetyAndPackingData;
  meta?: TripMeta;
}

export const ItineraryView: React.FC<Props> = (props) => {
  return (
    <MapSyncProvider>
      <DualPaneLayout {...props} />
    </MapSyncProvider>
  );
};
