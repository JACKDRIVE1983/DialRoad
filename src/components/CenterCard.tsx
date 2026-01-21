import React from 'react';
import { MapPin, Clock, Navigation } from 'lucide-react';
import { DialysisCenter } from '@/data/mockCenters';
import { formatDistance } from '@/lib/distance';
import centerImage from '@/assets/center-placeholder.jpg';

interface CenterCardProps {
  center: DialysisCenter;
  distance: number | null;
  onSelect: (center: DialysisCenter) => void;
}

function CenterCardComponent({ center, distance, onSelect }: CenterCardProps) {
  return (
    <button
      className="w-full text-left transition-transform active:scale-[0.98]"
      onClick={() => onSelect(center)}
    >
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex">
          {/* Image with lazy loading */}
          <div className="w-28 h-28 flex-shrink-0">
            <img 
              src={centerImage} 
              alt={center.name}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-display font-semibold text-foreground text-sm leading-tight pr-2">
                {center.name}
              </h3>
              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                center.isOpen 
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                  : 'bg-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                {center.isOpen ? 'Aperto' : 'Chiuso'}
              </span>
            </div>

            <div className="flex items-center text-muted-foreground text-xs mb-2">
              <MapPin className="w-3 h-3 mr-1" />
              {center.city}
            </div>

            <div className="flex items-center justify-between">
              {distance !== null && (
                <div className="flex items-center text-primary text-xs font-medium">
                  <Navigation className="w-3 h-3 mr-1" />
                  {formatDistance(distance)}
                </div>
              )}
              <div className="flex items-center text-muted-foreground text-[10px] ml-auto">
                <Clock className="w-3 h-3 mr-1" />
                {center.openingHours.split(':')[0]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// Memoize the component to prevent re-renders when parent state changes
export const CenterCard = React.memo(CenterCardComponent, (prevProps, nextProps) => {
  // Custom comparison: only re-render if the center ID or distance changes
  return (
    prevProps.center.id === nextProps.center.id &&
    prevProps.distance === nextProps.distance &&
    prevProps.center.isOpen === nextProps.center.isOpen
  );
});
