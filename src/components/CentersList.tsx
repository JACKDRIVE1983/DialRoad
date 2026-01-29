import React, { useMemo, useCallback } from 'react';
import { MapPin, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { DialysisCenter } from '@/data/mockCenters';
import { calculateDistance } from '@/lib/distance';
import { CenterCard } from './CenterCard';

interface CentersListProps {
  onSelectCenter: (center: DialysisCenter) => void;
}

// Memoized empty state component
const EmptyState = React.memo(function EmptyState() {
  return (
    <div className="text-center py-12">
      <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="text-lg font-display font-semibold text-foreground mb-2">
        Nessun centro trovato
      </h3>
      <p className="text-muted-foreground text-sm">
        Prova a modificare i filtri di ricerca
      </p>
    </div>
  );
});

function CentersListComponent({ onSelectCenter }: CentersListProps) {
  const { filteredCenters, selectedRegion, setSelectedRegion, userLocation } = useApp();

  // Memoized handler for selecting a center
  const handleSelectCenter = useCallback((center: DialysisCenter) => {
    onSelectCenter(center);
  }, [onSelectCenter]);

  const hasActiveFilters = selectedRegion !== 'Tutte le Regioni';

  const clearFilters = useCallback(() => {
    setSelectedRegion('Tutte le Regioni');
  }, [setSelectedRegion]);

  // Calculate distances and sort by distance if user location is available
  const centersWithDistance = useMemo(() => {
    if (!userLocation) return filteredCenters.map(c => ({ center: c, distance: null }));
    
    return filteredCenters
      .map(center => ({
        center,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          center.coordinates.lat,
          center.coordinates.lng
        )
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [filteredCenters, userLocation]);

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
      {/* Header */}
      <div className="mb-4 mt-2">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Centri Dialisi
        </h1>
        <p className="text-sm text-muted-foreground">
          Trova il centro più adatto alle tue esigenze
        </p>
      </div>

      {/* Active filter indicator */}
      {hasActiveFilters && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtro attivo:</span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            {selectedRegion}
            <button 
              onClick={clearFilters}
              className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {/* Centers List */}
      <div className="space-y-3">
        {centersWithDistance.map(({ center, distance }) => (
          <CenterCard
            key={center.id}
            center={center}
            distance={distance}
            onSelect={handleSelectCenter}
          />
        ))}

        {filteredCenters.length === 0 && <EmptyState />}
      </div>
    </div>
  );
}

// Export memoized component
export const CentersList = React.memo(CentersListComponent);
