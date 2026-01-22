import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
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

// Virtual list implementation for performance
const ITEM_HEIGHT = 120; // Approximate height of each card
const BUFFER_SIZE = 5; // Extra items to render above/below viewport

function CentersListComponent({ onSelectCenter }: CentersListProps) {
  const { filteredCenters, setSearchQuery, userLocation } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  
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

  // Setup scroll and resize listeners for virtualization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };

    // Initial measurement
    handleResize();
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Calculate which items to render (virtualization)
  const { startIndex, endIndex, visibleItems, totalHeight } = useMemo(() => {
    const itemCount = centersWithDistance.length;
    const totalHeight = itemCount * ITEM_HEIGHT;
    
    // If list is short, render all items
    if (itemCount <= 20) {
      return {
        startIndex: 0,
        endIndex: itemCount,
        visibleItems: centersWithDistance,
        totalHeight
      };
    }
    
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
    const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER_SIZE * 2;
    const endIndex = Math.min(itemCount, startIndex + visibleCount);
    
    return {
      startIndex,
      endIndex,
      visibleItems: centersWithDistance.slice(startIndex, endIndex),
      totalHeight
    };
  }, [centersWithDistance, scrollTop, containerHeight]);

  // Should we virtualize?
  const shouldVirtualize = centersWithDistance.length > 20;

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide"
    >
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

      {/* Virtualized list container */}
      {shouldVirtualize ? (
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div 
            className="space-y-3"
            style={{ 
              position: 'absolute',
              top: startIndex * ITEM_HEIGHT,
              left: 0,
              right: 0
            }}
          >
            {visibleItems.map(({ center, distance }) => (
              <CenterCard
                key={center.id}
                center={center}
                distance={distance}
                onSelect={handleSelectCenter}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {centersWithDistance.map(({ center, distance }) => (
            <CenterCard
              key={center.id}
              center={center}
              distance={distance}
              onSelect={handleSelectCenter}
            />
          ))}
        </div>
      )}

      {filteredCenters.length === 0 && <EmptyState />}
    </div>
  );
}

// Export memoized component
export const CentersList = React.memo(CentersListComponent);
