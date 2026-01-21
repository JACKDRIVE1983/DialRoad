import { useEffect, useCallback, useState, useRef, Component, ReactNode, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Loader2, AlertTriangle } from 'lucide-react';
import { GoogleMap, useLoadScript, OverlayView } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
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

const GoogleMapComponent = memo(function GoogleMapComponent({ apiKey, onError }: { apiKey: string; onError: () => void }) {
  const { filteredCenters, setSelectedCenter, userLocation, setUserLocation, isDarkMode } = useApp();
  const [isLocating, setIsLocating] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<DialysisCenter | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Debug: Log component mount and API key status
  useEffect(() => {
    console.log('[GoogleMapComponent] Mounted with apiKey:', apiKey ? 'present' : 'missing');
  }, [apiKey]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
  });

  // Memoized locate handler
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

  // Detect Google Maps auth failures - run once
  useEffect(() => {
    (window as any).gm_authFailure = () => {
      console.log('Google Maps auth failure detected');
      onError();
    };

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

  // Initial location fetch
  useEffect(() => {
    if (!userLocation) {
      handleLocate();
    }
  }, [handleLocate, userLocation]);

  // Map load callback
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Handle marker click
  const handleMarkerClick = useCallback((center: DialysisCenter, marker: google.maps.Marker) => {
    setSelectedMarker(center);
    
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
    
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; max-width: 200px;">
          <h3 style="font-weight: bold; font-size: 14px; color: #1a1a2e; margin-bottom: 4px;">${center.name}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${center.city}, ${center.province}</p>
          <button 
            onclick="window.dispatchEvent(new CustomEvent('viewCenterDetails', { detail: '${center.id}' }))"
            style="width: 100%; padding: 6px 12px; background: #0077b6; color: white; font-size: 12px; font-weight: 500; border-radius: 6px; border: none; cursor: pointer;"
          >
            Vedi dettagli
          </button>
        </div>
      `,
    });
    
    infoWindow.open(mapRef.current, marker);
    infoWindowRef.current = infoWindow;
  }, []);

  // Listen for view details events from InfoWindow
  useEffect(() => {
    const handleViewDetails = (e: CustomEvent) => {
      const centerId = e.detail;
      const center = filteredCenters.find(c => c.id === centerId);
      if (center) {
        setSelectedCenter(center);
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
      }
    };

    window.addEventListener('viewCenterDetails', handleViewDetails as EventListener);
    return () => {
      window.removeEventListener('viewCenterDetails', handleViewDetails as EventListener);
    };
  }, [filteredCenters, setSelectedCenter]);

  // Create/update markers with clustering
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // Clean up previous markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    // Create new markers
    const markers = filteredCenters.map((center) => {
      const regionColor = getRegionColor(center.region);
      const iconUrl = createRegionMarkerIcon(regionColor);
      
      const marker = new google.maps.Marker({
        position: { lat: center.coordinates.lat, lng: center.coordinates.lng },
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        },
        optimized: true,
      });

      marker.addListener('click', () => handleMarkerClick(center, marker));
      
      return marker;
    });

    markersRef.current = markers;

    // Create or update clusterer
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map: mapRef.current,
        markers,
        renderer: {
          render: ({ count, position }) => {
            return new google.maps.Marker({
              position,
              icon: {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50" height="50">
                    <circle cx="25" cy="25" r="22" fill="#0077b6" stroke="white" stroke-width="3"/>
                    <text x="25" y="30" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${count}</text>
                  </svg>
                `)}`,
                scaledSize: new google.maps.Size(50, 50),
                anchor: new google.maps.Point(25, 25),
              },
              label: '',
              zIndex: 1000 + count,
            });
          },
        },
      });
    } else {
      clustererRef.current.clearMarkers();
      clustererRef.current.addMarkers(markers);
    }

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => {
        google.maps.event.clearInstanceListeners(marker);
      });
    };
  }, [filteredCenters, isLoaded, handleMarkerClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      markersRef.current.forEach(marker => {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      });
    };
  }, []);

  // Memoized map options
  const mapOptions = useMemo(() => {
    const options: google.maps.MapOptions = {
      styles: isDarkMode ? darkModeStyles : lightModeStyles,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    };
    
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
          onLoad={onMapLoad}
        >
          {/* User location overlay */}
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
        </GoogleMap>
      </MapErrorBoundary>

      {/* Locate button */}
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

      {/* Centers count */}
      <motion.div
        className="absolute bottom-36 left-4 z-30 glass-card px-4 py-2 rounded-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-sm font-medium text-foreground">
          {filteredCenters.length} centri trovati
        </span>
      </motion.div>
    </div>
  );
});

// Main MapView component with API key fetching
export function MapView() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  // Debug: Log component mount
  useEffect(() => {
    console.log('[MapView] Component mounted');
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const fetchApiKey = async () => {
      try {
        console.log('[MapView] Fetching API key...');
        const { data, error } = await supabase.functions.invoke('get-maps-key');
        if (!mounted) return;
        if (error) {
          console.error('[MapView] API key fetch error:', error);
          throw error;
        }
        if (data?.apiKey) {
          console.log('[MapView] API key received successfully');
          setApiKey(data.apiKey);
        } else {
          console.warn('[MapView] No API key in response');
          setUseFallback(true);
        }
      } catch (error) {
        console.error('[MapView] Failed to fetch Google Maps API key:', error);
        if (mounted) setUseFallback(true);
      } finally {
        if (mounted) setIsLoadingKey(false);
      }
    };
    
    fetchApiKey();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleGoogleMapsError = useCallback(() => {
    console.log('[MapView] Switching to fallback map due to Google Maps error');
    setUseFallback(true);
  }, []);

  if (isLoadingKey) {
    return (
      <div className="absolute inset-0 w-full h-full bg-secondary flex items-center justify-center">
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
    return (
      <div className="absolute inset-0 w-full h-full">
        <FallbackMap />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <GoogleMapComponent apiKey={apiKey} onError={handleGoogleMapsError} />
    </div>
  );
}

// Fallback map for when Google Maps is unavailable
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
    if (!userLocation) {
      handleLocate();
    }
  }, [handleLocate, userLocation]);

  // Memoize center markers to prevent re-renders
  const centerMarkers = useMemo(() => {
    return filteredCenters.slice(0, 50).map((center, index) => {
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
          transition={{ delay: Math.min(index * 0.01, 0.5), type: 'spring' }}
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
    });
  }, [filteredCenters, setSelectedCenter]);

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
          {centerMarkers}

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
          {filteredCenters.length} centri • Mappa semplificata
        </span>
      </motion.div>
    </div>
  );
});
