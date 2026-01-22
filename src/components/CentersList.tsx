import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { DialysisCenter } from '@/data/mockCenters';
import { calculateDistance } from '@/lib/distance';
import { CenterCard } from './CenterCard';
import { useDebounce } from '@/hooks/useDebounce';

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
  const { filteredCenters, setSearchQuery, userLocation } = useApp();
  
  // Local search input state for immediate UI feedback
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  // Debounce the search query to avoid filtering on every keystroke
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);
  
  // Update the global search query when debounced value changes
  useEffect(() => {
    setSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery, setSearchQuery]);
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      // Reset search on unmount
      setSearchQuery('');
    };
  }, [setSearchQuery]);

  // Memoized handler for selecting a center
  const handleSelectCenter = useCallback((center: DialysisCenter) => {
    onSelectCenter(center);
  }, [onSelectCenter]);

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
      {/* Search Bar with debounced input */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cerca centro per nome o città..."
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl glass-card border-0 bg-background/60 backdrop-blur-sm text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
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
