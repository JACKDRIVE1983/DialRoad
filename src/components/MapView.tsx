import { useEffect, useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { DialysisCenter } from '@/data/mockCenters';

// Simple map component without Google Maps API (can be upgraded later)
export function MapView() {
  const { filteredCenters, setSelectedCenter, userLocation, setUserLocation } = useApp();
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = useCallback(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Default to Rome
          setUserLocation({ lat: 41.9028, lng: 12.4964 });
          setIsLocating(false);
        }
      );
    } else {
      setUserLocation({ lat: 41.9028, lng: 12.4964 });
      setIsLocating(false);
    }
  }, [setUserLocation]);

  useEffect(() => {
    handleLocate();
  }, [handleLocate]);

  const handleCenterClick = (center: DialysisCenter) => {
    setSelectedCenter(center);
  };

  return (
    <div ref={mapRef} className="relative w-full h-full bg-secondary overflow-hidden">
      {/* Map background with Italy silhouette effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-muted to-secondary" />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--muted-foreground) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--muted-foreground) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Interactive map area with center markers */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Italy map placeholder shape */}
        <div className="relative w-full max-w-lg h-full max-h-[80vh]">
          {/* Center markers */}
          {filteredCenters.map((center, index) => {
            // Simple positioning based on coordinates (normalized to container)
            const normalizedLat = ((center.coordinates.lat - 36) / 11) * 100;
            const normalizedLng = ((center.coordinates.lng - 6) / 13) * 100;
            
            return (
              <motion.button
                key={center.id}
                className="absolute z-10 group"
                style={{
                  bottom: `${normalizedLat}%`,
                  left: `${normalizedLng}%`,
                  transform: 'translate(-50%, 50%)'
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05, type: 'spring' }}
                onClick={() => handleCenterClick(center)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
                
                {/* Marker */}
                <div className="relative w-10 h-10 rounded-full gradient-bg flex items-center justify-center shadow-lg glow-effect">
                  <MapPin className="w-5 h-5 text-primary-foreground" />
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="glass-card px-3 py-2 text-sm font-medium whitespace-nowrap">
                    {center.name}
                  </div>
                </div>
              </motion.button>
            );
          })}

          {/* User location marker */}
          {userLocation && (
            <motion.div
              className="absolute z-20"
              style={{
                bottom: `${((userLocation.lat - 36) / 11) * 100}%`,
                left: `${((userLocation.lng - 6) / 13) * 100}%`,
                transform: 'translate(-50%, 50%)'
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.3 }}
            >
              <div className="relative">
                <span className="absolute inset-0 w-6 h-6 rounded-full bg-accent/40 animate-ping" />
                <div className="w-6 h-6 rounded-full bg-accent border-2 border-background shadow-lg" />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Locate button */}
      <motion.button
        className="absolute bottom-28 right-4 z-30 w-12 h-12 rounded-full glass-card flex items-center justify-center"
        onClick={handleLocate}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isLocating}
      >
        <Navigation 
          className={`w-5 h-5 text-primary ${isLocating ? 'animate-spin' : ''}`} 
        />
      </motion.button>

      {/* Center count badge */}
      <motion.div
        className="absolute top-4 left-4 z-30 glass-card px-4 py-2 rounded-full"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-sm font-medium text-foreground">
          {filteredCenters.length} centri trovati
        </span>
      </motion.div>
    </div>
  );
}
