import { useEffect, useCallback, useState, useRef, Component, ReactNode, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Loader2, AlertTriangle } from 'lucide-react';
import { GoogleMap, useLoadScript, InfoWindowF, OverlayView } from '@react-google-maps/api';
import { useApp } from '@/contexts/AppContext';
import { DialysisCenter } from '@/data/mockCenters';
import { supabase } from '@/integrations/supabase/client';
import { getRegionColor } from '@/lib/regionColors';
import { OptimizedMarker, ClusterMarker } from './OptimizedMarker';
import { 
  useCameraIdle, 
  useViewportCulling, 
  useSimpleClustering,
  useViewportState 
} from '@/hooks/useMapPerformance';
import { preWarmIconCache, clearIconCache } from '@/lib/markerIconCache';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 41.9028,
  lng: 12.4964
};

// Simplified map styles for better performance
const darkModeStyles: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8aa3" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d44" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e4d6b" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] }, // Hide POIs for performance
];

const lightModeStyles: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#666666" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9e8f5" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] }, // Hide POIs for performance
];

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

// Memoized user location overlay to prevent re-renders
const UserLocationOverlay = memo(function UserLocationOverlay({ 
  userLocation, 
  showPopup 
}: { 
  userLocation: { lat: number; lng: number }; 
  showPopup: boolean;
}) {
  return (
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
        {showPopup && (
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
        )}
      </div>
    </OverlayView>
  );
});

// Memoized InfoWindow content
const InfoWindowContent = memo(function InfoWindowContent({ 
  center, 
  onViewDetails 
}: { 
  center: DialysisCenter; 
  onViewDetails: () => void;
}) {
  return (
    <div className="p-2 max-w-xs">
      <h3 className="font-bold text-sm text-gray-900 mb-1">{center.name}</h3>
      <p className="text-xs text-gray-600 mb-2">{center.city}, {center.province}</p>
      <button
        onClick={onViewDetails}
        className="w-full px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90 transition-opacity"
      >
        Vedi dettagli
      </button>
    </div>
  );
});

function GoogleMapComponent({ apiKey, onError }: { apiKey: string; onError: () => void }) {
  const { filteredCenters, setSelectedCenter, userLocation, setUserLocation, isDarkMode } = useApp();
  const [isLocating, setIsLocating] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<DialysisCenter | null>(null);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Performance hooks
  const { viewport, updateViewport } = useViewportState();
  const { isIdle, handleCameraStart, handleCameraEnd } = useCameraIdle(200);
  
  // Viewport culling - only render markers in visible area
  const visibleCenters = useViewportCulling(
    filteredCenters, 
    viewport.bounds, 
    viewport.zoom,
    isIdle
  );
  
  // Clustering at lower zoom levels
  const { clusters, showIndividualMarkers } = useSimpleClustering(
    visibleCenters,
    viewport.zoom,
    isIdle
  );

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
  });

  // Pre-warm icon cache when map loads
  useEffect(() => {
    if (isLoaded) {
      preWarmIconCache();
    }
    
    // Cleanup on unmount
    return () => {
      clearIconCache();
    };
  }, [isLoaded]);

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
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      setUserLocation(defaultCenter);
      setIsLocating(false);
    }
  }, [setUserLocation]);

  // Map event handlers - only update state when camera is idle
  const handleBoundsChanged = useCallback(() => {
    if (!mapRef.current) return;
    
    const bounds = mapRef.current.getBounds();
    const zoom = mapRef.current.getZoom();
    
    if (bounds && zoom !== undefined) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      updateViewport({
        bounds: {
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng()
        },
        zoom
      });
    }
  }, [updateViewport]);

  const handleDragStart = useCallback(() => {
    handleCameraStart();
  }, [handleCameraStart]);

  const handleDragEnd = useCallback(() => {
    handleCameraEnd();
    handleBoundsChanged();
  }, [handleCameraEnd, handleBoundsChanged]);

  const handleZoomChanged = useCallback(() => {
    handleCameraEnd();
    handleBoundsChanged();
  }, [handleCameraEnd, handleBoundsChanged]);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    handleBoundsChanged();
  }, [handleBoundsChanged]);

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

  // Stable callback for marker clicks
  const handleMarkerClick = useCallback((center: DialysisCenter) => {
    setSelectedMarker(center);
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  const handleViewDetails = useCallback(() => {
    if (selectedMarker) {
      setSelectedCenter(selectedMarker);
      setSelectedMarker(null);
    }
  }, [selectedMarker, setSelectedCenter]);

  const mapOptions = useMemo(() => {
    const options: google.maps.MapOptions = {
      styles: isDarkMode ? darkModeStyles : lightModeStyles,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      // Performance optimizations
      gestureHandling: 'greedy',
      clickableIcons: false, // Disable POI clicks for performance
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
          onLoad={handleMapLoad}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onZoomChanged={handleZoomChanged}
        >
          {/* Render clusters at low zoom */}
          {!showIndividualMarkers && clusters.map((cluster) => (
            <ClusterMarker
              key={cluster.id}
              lat={cluster.lat}
              lng={cluster.lng}
              count={cluster.count}
              region={cluster.region}
            />
          ))}
          
          {/* Render individual markers at high zoom */}
          {showIndividualMarkers && visibleCenters.map((center) => (
            <OptimizedMarker
              key={center.id}
              center={center}
              onClick={handleMarkerClick}
            />
          ))}

          {userLocation && (
            <UserLocationOverlay 
              userLocation={userLocation} 
              showPopup={showUserPopup} 
            />
          )}

          {selectedMarker && (
            <InfoWindowF
              position={{ lat: selectedMarker.coordinates.lat, lng: selectedMarker.coordinates.lng }}
              onCloseClick={handleInfoWindowClose}
            >
              <InfoWindowContent 
                center={selectedMarker} 
                onViewDetails={handleViewDetails} 
              />
            </InfoWindowF>
          )}
        </GoogleMap>
      </MapErrorBoundary>

      <motion.button
        className="absolute bottom-36 right-4 z-30 w-12 h-12 rounded-full glass-card flex items-center justify-center shadow-lg"
        onClick={handleLocate}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isLocating}
      >
        <Navigation 
          className={`w-5 h-5 text-primary ${isLocating ? 'animate-spin' : ''}`} 
        />
      </motion.button>

      {/* Marker count indicator - shows visible markers */}
      <motion.div
        className="absolute bottom-36 left-4 z-30 glass-card px-4 py-2 rounded-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-sm font-medium text-foreground">
          {showIndividualMarkers ? visibleCenters.length : clusters.reduce((sum, c) => sum + c.count, 0)} centri
          {!isIdle && <span className="ml-1 text-muted-foreground">•••</span>}
        </span>
      </motion.div>
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

// Memoized FallbackMap to prevent re-renders
const FallbackMap = memo(function FallbackMap() {
  const { filteredCenters, setSelectedCenter, userLocation, setUserLocation } = useApp();
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
        () => {
          setUserLocation({ lat: 41.9028, lng: 12.4964 });
          setIsLocating(false);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      setUserLocation({ lat: 41.9028, lng: 12.4964 });
      setIsLocating(false);
    }
  }, [setUserLocation]);

  useEffect(() => {
    handleLocate();
  }, [handleLocate]);

  // Limit markers for fallback map performance
  const visibleCenters = useMemo(() => filteredCenters.slice(0, 50), [filteredCenters]);

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
          {visibleCenters.map((center) => {
            const normalizedLat = ((center.coordinates.lat - 36) / 11) * 100;
            const normalizedLng = ((center.coordinates.lng - 6) / 13) * 100;
            const regionColor = getRegionColor(center.region);
            
            return (
              <button
                key={center.id}
                className="absolute z-10 group transition-transform hover:scale-110 active:scale-95"
                style={{
                  bottom: `${normalizedLat}%`,
                  left: `${normalizedLng}%`,
                  transform: 'translate(-50%, 50%)'
                }}
                onClick={() => setSelectedCenter(center)}
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
              </button>
            );
          })}

          {userLocation && (
            <div
              className="absolute z-30 flex items-center gap-2"
              style={{
                bottom: `${((userLocation.lat - 36) / 11) * 100}%`,
                left: `${((userLocation.lng - 6) / 13) * 100}%`,
                transform: 'translate(-18px, 100%)',
                animation: 'bounce-slow 2s ease-in-out infinite'
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
            </div>
          )}
        </div>
      </div>

      <motion.button
        className="absolute bottom-36 right-4 z-30 w-12 h-12 rounded-full glass-card flex items-center justify-center"
        onClick={handleLocate}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isLocating}
      >
        <Navigation 
          className={`w-5 h-5 text-primary ${isLocating ? 'animate-spin' : ''}`} 
        />
      </motion.button>

      <motion.div
        className="absolute bottom-36 left-4 z-30 glass-card px-4 py-2 rounded-full flex items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AlertTriangle className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-medium text-foreground">
          {visibleCenters.length} centri • Mappa semplificata
        </span>
      </motion.div>

    </div>
  );
});
