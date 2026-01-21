// MapView component - NUCLEAR RESET v3
import { useEffect, useCallback, useState, useRef, useMemo, memo } from 'react';
import { Navigation, Loader2, AlertTriangle } from 'lucide-react';
import { GoogleMap, OverlayView } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useApp } from '@/contexts/AppContext';
import { DialysisCenter } from '@/data/mockCenters';
import { getRegionColor, createRegionMarkerIcon } from '@/lib/regionColors';

declare global {
  interface Window {
    google: any;
  }
}

declare const google: any;

const defaultCenter = { lat: 41.9028, lng: 12.4964 };

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

// Simple check for Google Maps availability
function useGoogleMapsReady() {
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    const check = () => {
      if (window.google?.maps?.Map) {
        setReady(true);
        return true;
      }
      return false;
    };
    
    if (check()) return;
    
    const interval = setInterval(() => {
      if (check()) clearInterval(interval);
    }, 50);
    
    const timeout = setTimeout(() => clearInterval(interval), 8000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);
  
  return ready;
}

// Main exported MapView
export function MapView() {
  const ready = useGoogleMapsReady();
  const [showFallback, setShowFallback] = useState(false);
  
  useEffect(() => {
    console.log('[MapView] ready:', ready);
  }, [ready]);

  // Timeout to fallback
  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => {
      if (!ready) setShowFallback(true);
    }, 10000);
    return () => clearTimeout(t);
  }, [ready]);

  if (showFallback) {
    return <FallbackMap />;
  }

  if (!ready) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
        <Loader2 style={{ width: 40, height: 40, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return <ActualGoogleMap onError={() => setShowFallback(true)} />;
}

// Actual Google Map component
const ActualGoogleMap = memo(function ActualGoogleMap({ onError }: { onError: () => void }) {
  const { filteredCenters, setSelectedCenter, userLocation, setUserLocation, isDarkMode } = useApp();
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const infoWindowRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Geolocation
  const handleLocate = useCallback(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        () => {
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

  useEffect(() => {
    if (!userLocation) handleLocate();
  }, [handleLocate, userLocation]);

  // Auth failure detection
  useEffect(() => {
    (window as any).gm_authFailure = () => {
      console.error('[MapView] Google Maps auth failure');
      onError();
    };
    return () => {
      try { delete (window as any).gm_authFailure; } catch {}
    };
  }, [onError]);

  // Map load handler - CRITICAL: trigger resize after load
  const onMapLoad = useCallback((map: any) => {
    console.log('[MapView] Map loaded, triggering resize');
    mapRef.current = map;
    
    // Force resize after a small delay to ensure container is fully rendered
    setTimeout(() => {
      if (map && window.google?.maps?.event) {
        window.google.maps.event.trigger(map, 'resize');
        map.setCenter(defaultCenter);
        map.setZoom(6);
        console.log('[MapView] Resize triggered');
      }
    }, 100);
  }, []);

  // Handle marker click
  const handleMarkerClick = useCallback((center: DialysisCenter, marker: any) => {
    if (infoWindowRef.current) infoWindowRef.current.close();
    
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

  // Listen for view details events
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const center = filteredCenters.find(c => c.id === e.detail);
      if (center) {
        setSelectedCenter(center);
        if (infoWindowRef.current) infoWindowRef.current.close();
      }
    };
    window.addEventListener('viewCenterDetails', handler as EventListener);
    return () => window.removeEventListener('viewCenterDetails', handler as EventListener);
  }, [filteredCenters, setSelectedCenter]);

  // Create markers with clustering
  useEffect(() => {
    if (!mapRef.current) return;

    // Cleanup
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (clustererRef.current) clustererRef.current.clearMarkers();

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

    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map: mapRef.current,
        markers,
        renderer: {
          render: ({ count, position }) => new google.maps.Marker({
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
            zIndex: 1000 + count,
          }),
        },
      });
    } else {
      clustererRef.current.clearMarkers();
      clustererRef.current.addMarkers(markers);
    }

    return () => {
      markersRef.current.forEach(m => {
        google.maps.event.clearInstanceListeners(m);
      });
    };
  }, [filteredCenters, handleMarkerClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (infoWindowRef.current) infoWindowRef.current.close();
      if (clustererRef.current) clustererRef.current.clearMarkers();
      markersRef.current.forEach(m => {
        google.maps.event.clearInstanceListeners(m);
        m.setMap(null);
      });
    };
  }, []);

  // Map options
  const mapOptions = useMemo(() => ({
    styles: isDarkMode ? darkModeStyles : lightModeStyles,
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControlOptions: window.google?.maps?.ControlPosition ? {
      position: window.google.maps.ControlPosition.LEFT_CENTER,
    } : undefined,
  }), [isDarkMode]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        width: '100%', 
        height: '100%',
        minHeight: '300px'
      }}
    >
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={defaultCenter}
        zoom={6}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {userLocation && (
          <OverlayView
            position={userLocation}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div style={{ transform: 'translate(-20px, -100%)' }}>
              <svg viewBox="0 0 40 60" width="40" height="60">
                <defs>
                  <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#fbbf24' }} />
                    <stop offset="100%" style={{ stopColor: '#f59e0b' }} />
                  </linearGradient>
                </defs>
                <path d="M20 55 C20 55 38 35 38 20 C38 10 30 2 20 2 C10 2 2 10 2 20 C2 35 20 55 20 55 Z" 
                      fill="url(#pinGrad)" stroke="white" strokeWidth="2"/>
                <circle cx="20" cy="20" r="8" fill="white"/>
              </svg>
              <span style={{ 
                whiteSpace: 'nowrap',
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#1a1a2e',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                La tua posizione
              </span>
            </div>
          </OverlayView>
        )}
      </GoogleMap>

      {/* Locate button */}
      <button
        onClick={handleLocate}
        disabled={isLocating}
        style={{
          position: 'absolute',
          bottom: 144,
          right: 16,
          zIndex: 30,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.9)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Navigation style={{ width: 20, height: 20, color: '#0d9488' }} />
      </button>

      {/* Centers count */}
      <div style={{
        position: 'absolute',
        bottom: 144,
        left: 16,
        zIndex: 30,
        background: 'rgba(255,255,255,0.9)',
        padding: '8px 16px',
        borderRadius: 20,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontSize: 14,
        fontWeight: 500
      }}>
        {filteredCenters.length} centri trovati
      </div>
    </div>
  );
});

// Fallback map
const FallbackMap = memo(function FallbackMap() {
  const { filteredCenters, setSelectedCenter, userLocation, setUserLocation } = useApp();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = useCallback(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        () => {
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

  useEffect(() => {
    if (!userLocation) handleLocate();
  }, [handleLocate, userLocation]);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#e8ecef', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 400, height: '70%' }}>
          {filteredCenters.slice(0, 50).map((center) => {
            const y = ((center.coordinates.lat - 36) / 11) * 100;
            const x = ((center.coordinates.lng - 6) / 13) * 100;
            const color = getRegionColor(center.region);
            return (
              <button
                key={center.id}
                onClick={() => setSelectedCenter(center)}
                style={{
                  position: 'absolute',
                  bottom: `${y}%`,
                  left: `${x}%`,
                  transform: 'translate(-50%, 50%)',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: color,
                  border: '2px solid white',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              />
            );
          })}
        </div>
      </div>

      <button
        onClick={handleLocate}
        disabled={isLocating}
        style={{
          position: 'absolute',
          bottom: 144,
          right: 16,
          zIndex: 30,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.9)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Navigation style={{ width: 20, height: 20, color: '#0d9488' }} />
      </button>

      <div style={{
        position: 'absolute',
        bottom: 144,
        left: 16,
        zIndex: 30,
        background: 'rgba(255,255,255,0.9)',
        padding: '8px 16px',
        borderRadius: 20,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontSize: 14,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <AlertTriangle style={{ width: 16, height: 16, color: '#eab308' }} />
        {filteredCenters.length} centri • Mappa semplificata
      </div>
    </div>
  );
});
