import { useEffect, useCallback, useState, useRef, Component, ReactNode, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Loader2, AlertTriangle } from 'lucide-react';
import { GoogleMap, useLoadScript, MarkerF, OverlayView } from '@react-google-maps/api';
import { useApp } from '@/contexts/AppContext';
import { DialysisCenter } from '@/data/mockCenters';
import { supabase } from '@/integrations/supabase/client';
import { getRegionColor, createRegionMarkerIcon } from '@/lib/regionColors';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 41.9028,
  lng: 12.4964
};

const darkModeStyles = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8aa3" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d44" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e4d6b" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#2d2d44" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1e3a2f" }] },
];

const lightModeStyles = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#666666" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9e8f5" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#c8e6c9" }] },
];

// Default marker icon (kept for reference, but we now use region-specific colors)
const markerIcon = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <circle cx="20" cy="20" r="18" fill="#0077b6" stroke="white" stroke-width="3" filter="url(#shadow)"/>
    <path d="M20 12 L20 28 M12 20 L28 20" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </svg>
`);

const userMarkerIcon = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 60" width="40" height="60">
    <defs>
      <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
      </linearGradient>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <path d="M20 55 C20 55 38 35 38 20 C38 10 30 2 20 2 C10 2 2 10 2 20 C2 35 20 55 20 55 Z" 
          fill="url(#pinGrad)" stroke="white" stroke-width="2" filter="url(#shadow)"/>
    <circle cx="20" cy="20" r="8" fill="white"/>
  </svg>
`);

// Error Boundary to catch Google Maps rendering errors
class MapErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function GoogleMapComponent({ apiKey, onError }: { apiKey: string; onError: () => void }) {
  const { filteredCenters, setSelectedCenter, userLocation, setUserLocation, isDarkMode } = useApp();
  const [isLocating, setIsLocating] = useState(false);
  
  const [showUserPopup, setShowUserPopup] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
  });

  const handleLocate = useCallback(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          setShowUserPopup(true);
          setIsLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setUserLocation(defaultCenter);
          setIsLocating(false);
        }
      );
    } else {
      setUserLocation(defaultCenter);
      setIsLocating(false);
    }
  }, [setUserLocation]);

  // Detect Google Maps auth failures
  useEffect(() => {
    (window as any).gm_authFailure = () => {
      console.log('Google Maps auth failure detected');
      onError();
    };

    // Check for error overlays in the DOM periodically
    const checkForErrors = () => {
      if (mapContainerRef.current) {
        const errorElement = mapContainerRef.current.querySelector('.gm-err-container, .dismissButton');
        if (errorElement) {
          console.log('Google Maps error element detected in DOM');
          onError();
        }
      }
    };

    const intervalId = setInterval(checkForErrors, 500);
    const timeoutId = setTimeout(() => clearInterval(intervalId), 5000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      try {
        delete (window as any).gm_authFailure;
      } catch {
        // ignore
      }
    };
  }, [onError]);

  useEffect(() => {
    handleLocate();
  }, [handleLocate]);

  // Direct marker click opens bottom sheet
  const handleMarkerClick = (center: DialysisCenter) => {
    setSelectedCenter(center);
  };

  const mapOptions = useMemo(() => {
    const options: google.maps.MapOptions = {
      styles: isDarkMode ? darkModeStyles : lightModeStyles,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    };
    
    // Only add zoomControlOptions if google.maps is fully loaded
    if (isLoaded && window.google?.maps?.ControlPosition) {
      options.zoomControlOptions = {
        position: window.google.maps.ControlPosition.LEFT_CENTER,
      };
    }
    
    return options;
  }, [isDarkMode, isLoaded]);

  if (loadError) {
    onError();
    return null;
  }

  if (!isLoaded) {
    return (
      <div className="relative w-full h-full bg-secondary flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <span className="text-muted-foreground">Caricamento mappa...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={mapContainerRef} className="relative w-full h-full">
      <MapErrorBoundary onError={onError}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={6}
          options={mapOptions}
        >
          {filteredCenters.map((center) => {
            const regionColor = getRegionColor(center.region);
            const iconUrl = createRegionMarkerIcon(regionColor);
            
            return (
              <MarkerF
                key={`${center.id}-${center.coordinates.lat}-${center.coordinates.lng}`}
                position={{ lat: center.coordinates.lat, lng: center.coordinates.lng }}
                onClick={() => handleMarkerClick(center)}
                icon={{
                  url: iconUrl,
                  scaledSize: new google.maps.Size(40, 40),
                  anchor: new google.maps.Point(20, 20),
                }}
              />
            );
          })}

          {userLocation && (
            <OverlayView
              position={userLocation}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div 
                className="flex items-center gap-2"
                style={{ 
                  transform: 'translate(-20px, -100%)',
                  animation: 'bounce-slow 2s ease-in-out infinite'
                }}
              >
                <svg viewBox="0 0 40 60" width="40" height="60" className="flex-shrink-0">
                  <defs>
                    <linearGradient id="pinGradLive" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#fbbf24' }} />
                      <stop offset="100%" style={{ stopColor: '#f59e0b' }} />
                    </linearGradient>
                    <filter id="shadowLive" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  <path d="M20 55 C20 55 38 35 38 20 C38 10 30 2 20 2 C10 2 2 10 2 20 C2 35 20 55 20 55 Z" 
                        fill="url(#pinGradLive)" stroke="white" strokeWidth="2" filter="url(#shadowLive)"/>
                  <circle cx="20" cy="20" r="8" fill="white"/>
                </svg>
                <span 
                  className="whitespace-nowrap text-xs font-display font-semibold tracking-wide px-2 py-1 rounded-full shadow-lg"
                  style={{ 
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: '#1a1a2e',
                    textShadow: '0 1px 2px rgba(255,255,255,0.3)'
                  }}
                >
                  La tua posizione
                </span>
              </div>
            </OverlayView>
          )}

          {/* InfoWindow removed - using bottom sheet only */}
        </GoogleMap>
      </MapErrorBoundary>


      {/* Center count badge - bottom left above Google logo */}
      <motion.div
        className="absolute left-2 z-30 glass-card px-3 py-1.5 rounded-full"
        style={{ bottom: 24 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-xs font-medium text-foreground">
          {filteredCenters.length} centri trovati
        </span>
      </motion.div>

      {/* Locate button - bottom right */}
      <motion.button
        className="absolute right-4 z-30 w-11 h-11 rounded-full glass-card flex items-center justify-center shadow-lg"
        style={{ bottom: 16 }}
        onClick={handleLocate}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isLocating}
      >
        <Navigation 
          className={`w-5 h-5 text-primary ${isLocating ? 'animate-spin' : ''}`} 
        />
      </motion.button>
    </div>
  );
}

export function MapView() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-maps-key');
        if (error) throw error;
        if (data?.apiKey) {
          setApiKey(data.apiKey);
        }
      } catch (error) {
        console.error('Failed to fetch Google Maps API key:', error);
        setUseFallback(true);
      } finally {
        setIsLoadingKey(false);
      }
    };
    fetchApiKey();
  }, []);

  const handleGoogleMapsError = useCallback(() => {
    console.log('Switching to fallback map');
    setUseFallback(true);
  }, []);

  if (isLoadingKey) {
    return (
      <div className="relative w-full h-full bg-secondary flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <span className="text-muted-foreground">Caricamento mappa...</span>
        </motion.div>
      </div>
    );
  }

  if (!apiKey || useFallback) {
    return <FallbackMap />;
  }

  return <GoogleMapComponent apiKey={apiKey} onError={handleGoogleMapsError} />;
}

function FallbackMap() {
  const { filteredCenters, setSelectedCenter, userLocation, setUserLocation } = useApp();
  const [isLocating, setIsLocating] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);

  const handleLocate = useCallback(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setShowUserPopup(true);
          setIsLocating(false);
        },
        () => {
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

  return (
    <div className="relative w-full h-full bg-secondary overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-muted to-secondary" />
      
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

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full max-w-lg h-full max-h-[80vh]">
          {filteredCenters.slice(0, 50).map((center, index) => {
            const normalizedLat = ((center.coordinates.lat - 36) / 11) * 100;
            const normalizedLng = ((center.coordinates.lng - 6) / 13) * 100;
            const regionColor = getRegionColor(center.region);
            
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
                transition={{ delay: index * 0.02, type: 'spring' }}
                onClick={() => setSelectedCenter(center)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
              >
                <div 
                  className="relative w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: regionColor }}
                >
                  <svg viewBox="0 0 24 24" className="w-3 h-3">
                    <path d="M12 6 L12 18 M6 12 L18 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>

                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="glass-card px-3 py-2 text-xs font-medium whitespace-nowrap">
                    {center.name}
                  </div>
                </div>
              </motion.button>
            );
          })}

          {userLocation && (
            <motion.div
              className="absolute z-30 flex items-center gap-2"
              style={{
                bottom: `${((userLocation.lat - 36) / 11) * 100}%`,
                left: `${((userLocation.lng - 6) / 13) * 100}%`,
                transform: 'translate(-18px, 100%)'
              }}
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                y: [0, -8, 0]
              }}
              transition={{ 
                scale: { type: 'spring', delay: 0.3 },
                y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <svg viewBox="0 0 40 60" width="36" height="54" className="drop-shadow-lg flex-shrink-0">
                <defs>
                  <linearGradient id="pinGradFallback" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#fbbf24' }} />
                    <stop offset="100%" style={{ stopColor: '#f59e0b' }} />
                  </linearGradient>
                </defs>
                <path d="M20 55 C20 55 38 35 38 20 C38 10 30 2 20 2 C10 2 2 10 2 20 C2 35 20 55 20 55 Z" 
                      fill="url(#pinGradFallback)" stroke="white" strokeWidth="2"/>
                <circle cx="20" cy="20" r="8" fill="white"/>
              </svg>
              <span 
                className="whitespace-nowrap text-xs font-display font-semibold tracking-wide px-2 py-1 rounded-full shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: '#1a1a2e',
                  textShadow: '0 1px 2px rgba(255,255,255,0.3)'
                }}
              >
                La tua posizione
              </span>
            </motion.div>
          )}
        </div>
      </div>


      {/* Controls row - above the ad banner (also in fallback) */}
      <div
        className="absolute left-4 right-4 z-30 flex items-center justify-between"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 225px)' }}
      >
        <motion.div
          className="glass-card px-4 py-2 rounded-full flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-foreground">
            {filteredCenters.length} centri • Mappa semplificata
          </span>
        </motion.div>

        <motion.button
          className="w-12 h-12 rounded-full glass-card flex items-center justify-center"
          onClick={handleLocate}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isLocating}
        >
          <Navigation className={`w-5 h-5 text-primary ${isLocating ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>
    </div>
  );
}
