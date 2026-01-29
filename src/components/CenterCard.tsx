import React from 'react';
import { MapPin, Clock, Navigation, Phone } from 'lucide-react';
import { DialysisCenter } from '@/data/mockCenters';
import { formatDistance } from '@/lib/distance';
import { useCenterImage } from '@/hooks/useCenterImage';

interface CenterCardProps {
  center: DialysisCenter;
  distance: number | null;
  onSelect: (center: DialysisCenter) => void;
}

function CenterCardComponent({ center, distance, onSelect }: CenterCardProps) {
  // Fetch real Google Places photo with caching, with Street View fallback
  const imageUrl = useCenterImage(
    center.id, 
    center.name, 
    center.address, 
    center.city,
    center.coordinates.lat,
    center.coordinates.lng
  );
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (center.phone) {
      const phoneNumber = center.phone.split('/')[0].replace(/[^\d+]/g, '');
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  return (
    <button
      className="w-full text-left transition-transform active:scale-[0.98]"
      onClick={() => onSelect(center)}
    >
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex">
          {/* Image with lazy loading */}
          <div className="w-28 h-28 flex-shrink-0 bg-muted">
            <img 
              src={imageUrl} 
              alt={center.name}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-display font-semibold text-foreground text-sm leading-tight pr-2 line-clamp-2">
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

              <div className="flex items-center text-muted-foreground text-xs mb-1">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{center.city}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {distance !== null && (
                  <div className="flex items-center text-sm font-semibold text-sky-500">
                    <Navigation className="w-3.5 h-3.5 mr-1" />
                    {formatDistance(distance)}
                  </div>
                )}
                <div className="flex items-center text-muted-foreground text-[10px]">
                  <Clock className="w-3 h-3 mr-1" />
                  {center.openingHours.split(':')[0]}
                </div>
              </div>

              {/* Phone button - large touch target */}
              {center.phone && (
                <div
                  onClick={handleCall}
                  className="w-11 h-11 -mr-1 -mb-1 flex items-center justify-center rounded-xl bg-primary/10 active:bg-primary/20 transition-colors"
                >
                  <Phone className="w-5 h-5 text-primary" />
                </div>
              )}
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
