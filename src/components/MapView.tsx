import { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useApp } from '@/contexts/AppContext';
import { DialysisCenter } from '@/data/mockCenters';
import { supabase } from '@/integrations/supabase/client';

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

// SVG marker as data URL
const markerIcon = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0077b6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#00b4d8;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="18" fill="url(#grad)" stroke="white" stroke-width="3"/>
    <path d="M20 12 L20 28 M12 20 L28 20" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </svg>
`);

const userMarkerIcon = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="#00b4d8" stroke="white" stroke-width="2"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
  </svg>
`);

function GoogleMapComponent({ apiKey }: { apiKey: string }) {
  const { filteredCenters, setSelectedCenter, userLocation, setUserLocation, isDarkMode } = useApp();
  const [isLocating, setIsLocating] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<DialysisCenter | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [authFailure, setAuthFailure] = useState(false);

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
          setMapCenter(newLocation);
          setIsLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setUserLocation(defaultCenter);
          setMapCenter(defaultCenter);
          setIsLocating(false);
        }
      );
    } else {
      setUserLocation(defaultCenter);
      setMapCenter(defaultCenter);
      setIsLocating(false);
    }
  }, [setUserLocation]);

  useEffect(() => {
    // Called by Google Maps when the key / APIs / billing are misconfigured.
    // https://developers.google.com/maps/documentation/javascript/events#authentication_errors
    (window as any).gm_authFailure = () => setAuthFailure(true);
    return () => {
      try {
        delete (window as any).gm_authFailure;
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    handleLocate();
  }, [handleLocate]);

  const handleMarkerClick = (center: DialysisCenter) => {
    setSelectedMarker(center);
  };

  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

  const handleViewDetails = (center: DialysisCenter) => {
    setSelectedCenter(center);
    setSelectedMarker(null);
  };

  const mapOptions = {
    styles: isDarkMode ? darkModeStyles : lightModeStyles,
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  if (authFailure) {
    return (
      <FallbackMap reason="Google Maps non è stata caricata: abilita la Maps JavaScript API e verifica billing/restrizioni della chiave." />
    );
  }

  if (loadError) {
    return <FallbackMap reason="Errore di rete nel caricamento di Google Maps." />;
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
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={6}
        options={mapOptions}
      >
        {/* Center markers */}
        {filteredCenters.map((center) => (
          <MarkerF
            key={`${center.id}-${center.coordinates.lat}-${center.coordinates.lng}`}
            position={{ lat: center.coordinates.lat, lng: center.coordinates.lng }}
            onClick={() => handleMarkerClick(center)}
            icon={{
              url: markerIcon,
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 20),
            }}
          />
        ))}

        {/* User location marker */}
        {userLocation && (
          <MarkerF
            position={userLocation}
            icon={{
              url: userMarkerIcon,
              scaledSize: new google.maps.Size(24, 24),
              anchor: new google.maps.Point(12, 12),
            }}
          />
        )}

        {/* Info window for selected marker */}
        {selectedMarker && (
          <InfoWindowF
            position={{ lat: selectedMarker.coordinates.lat, lng: selectedMarker.coordinates.lng }}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-bold text-sm text-gray-900 mb-1">{selectedMarker.name}</h3>
              <p className="text-xs text-gray-600 mb-2">{selectedMarker.city}, {selectedMarker.province}</p>
              <button
                onClick={() => handleViewDetails(selectedMarker)}
                className="w-full px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90 transition-opacity"
              >
                Vedi dettagli
              </button>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* Locate button */}
      <motion.button
        className="absolute bottom-28 right-4 z-30 w-12 h-12 rounded-full glass-card flex items-center justify-center shadow-lg"
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

export function MapView() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);

  // Fetch Google Maps API key from edge function
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
      } finally {
        setIsLoadingKey(false);
      }
    };
    fetchApiKey();
  }, []);

  // Show loading state while fetching API key
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

  // Fallback to simple map if API key is not available
  if (!apiKey) {
    return <FallbackMap reason="API key mancante o non recuperabile." />;
  }

  return <GoogleMapComponent apiKey={apiKey} />;
}

// Fallback map component when API key is not available or Google Maps fails
function FallbackMap({ reason }: { reason?: string }) {
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
                <div className="relative w-6 h-6 rounded-full gradient-bg flex items-center justify-center shadow-lg">
                  <MapPin className="w-3 h-3 text-primary-foreground" />
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

      <motion.div
        className="absolute top-4 left-4 z-30 glass-card px-4 py-2 rounded-full"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-sm font-medium text-foreground">
          {filteredCenters.length} centri • {reason ?? 'Mappa semplificata attiva'}
        </span>
      </motion.div>
    </div>
  );
}
