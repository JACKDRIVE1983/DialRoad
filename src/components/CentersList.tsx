import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { DialysisCenter, regions } from '@/data/mockCenters';
import { calculateDistance } from '@/lib/distance';
import { CenterCard } from './CenterCard';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';

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
  const { filteredCenters, setSearchQuery, selectedRegion, setSelectedRegion, userLocation } = useApp();
  
  // Local search input state for immediate UI feedback
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Debounce the search query to avoid filtering on every keystroke
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);
  
  // Update the global search query when debounced value changes
  useEffect(() => {
    setSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery, setSearchQuery]);
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      setSearchQuery('');
    };
  }, [setSearchQuery]);

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
      {/* Search and Filter Row */}
      <div className="mb-4 flex gap-2">
        {/* Search Bar */}
        <div 
          className="flex-1 relative rounded-2xl overflow-hidden bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-white/50 dark:border-white/10"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)' }}
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cerca centro per nome o città..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3.5 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          {localSearchQuery && (
            <button 
              onClick={() => setLocalSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        
        {/* Filter Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={`relative rounded-2xl h-[52px] w-[52px] border-white/50 dark:border-white/10 bg-white/80 dark:bg-card/80 backdrop-blur-xl ${hasActiveFilters ? 'text-primary border-primary/50' : 'text-muted-foreground'}`}
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)' }}
        >
          <SlidersHorizontal className="w-5 h-5" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary border-2 border-white dark:border-card" />
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div 
              className="p-4 rounded-2xl bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-white/50 dark:border-white/10"
              style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Filtra per Regione
                </label>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Resetta
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto scrollbar-hide">
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => {
                      setSelectedRegion(region);
                      setShowFilters(false);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      selectedRegion === region
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
