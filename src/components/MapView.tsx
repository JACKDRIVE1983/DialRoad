import { useEffect, useCallback, useRef, useState, useMemo, memo } from "react";
import { Navigation, Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useApp } from "@/contexts/AppContext";
import { getRegionColor } from "@/lib/regionColors";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const defaultCenter: [number, number] = [41.9028, 12.4964]; // Rome, Italy

// Cache for region icons to avoid recreating SVG on every render
const iconCache = new Map<string, L.DivIcon>();

const createRegionIcon = (color: string): L.DivIcon => {
  if (iconCache.has(color)) {
    return iconCache.get(color)!;
  }
  
  // Simplified SVG without filter for better performance
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="32" height="32"><circle cx="20" cy="20" r="16" fill="${color}" stroke="white" stroke-width="2"/><path d="M20 13 L20 27 M13 20 L27 20" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`;

  const icon = L.divIcon({
    html: svgIcon,
    className: "custom-marker-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
  
  iconCache.set(color, icon);
  return icon;
};

// User location icon - red with white cross (like logo)
const userLocationIcon = L.divIcon({
  html: `<svg viewBox="0 0 32 48" width="32" height="48"><path d="M16 44 C16 44 30 28 30 16 C30 8 24 2 16 2 C8 2 2 8 2 16 C2 28 16 44 16 44 Z" fill="#dc2626" stroke="white" stroke-width="2"/><path d="M16 10 L16 22 M10 16 L22 16" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  className: "user-location-icon",
  iconSize: [32, 48],
  iconAnchor: [16, 48],
});

// Memoized loading component
const MapLoading = memo(function MapLoading() {
  return (
    <div className="relative w-full h-full bg-secondary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-muted-foreground">Caricamento mappa...</span>
      </div>
    </div>
  );
});

// Memoized center count badge
const CenterCountBadge = memo(function CenterCountBadge({ count }: { count: number }) {
  return (
    <div
      className="absolute left-2 z-[1000] glass-card px-3 py-1.5 rounded-full"
      style={{ bottom: 24 }}
    >
      <span className="text-xs font-medium text-foreground">
        {count} centri trovati
      </span>
    </div>
  );
});

// Memoized locate button
const LocateButton = memo(function LocateButton({ 
  onClick, 
  isLocating 
}: { 
  onClick: () => void; 
  isLocating: boolean 
}) {
  return (
    <button
      className="absolute right-4 z-[1000] w-11 h-11 rounded-full glass-card flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      style={{ bottom: 16 }}
      onClick={onClick}
      disabled={isLocating}
    >
      <Navigation className={`w-5 h-5 text-primary ${isLocating ? "animate-spin" : ""}`} />
    </button>
  );
});

function MapViewComponent() {
  const { filteredCenters, trySelectCenter, selectedCenter, userLocation, setUserLocation, isDarkMode } =
    useApp();

  const [isLocating, setIsLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const centersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const handleLocate = useCallback(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setUserLocation({ lat: defaultCenter[0], lng: defaultCenter[1] });
          setIsLocating(false);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setUserLocation({ lat: defaultCenter[0], lng: defaultCenter[1] });
      setIsLocating(false);
    }
  }, [setUserLocation]);

  useEffect(() => {
    handleLocate();
  }, [handleLocate]);

  const tileUrl = useMemo(() => 
    isDarkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    [isDarkMode]
  );

  const tileAttribution = useMemo(() =>
    isDarkMode
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    [isDarkMode]
  );

  // Initialize map once with performance optimizations
  useEffect(() => {
    if (!mapDivRef.current) return;
    if (mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      zoomControl: false,
      attributionControl: true,
      // Performance optimizations
      fadeAnimation: false,
      zoomAnimation: false,
      markerZoomAnimation: false,
      preferCanvas: true, // Use Canvas renderer instead of SVG
    }).setView(defaultCenter, 6);

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 19,
      updateWhenIdle: true, // Only update tiles when map stops moving
      updateWhenZooming: false,
    }).addTo(map);

    centersLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      centersLayerRef.current = null;
      userMarkerRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update tile layer on theme change
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    tileLayerRef.current.setUrl(tileUrl);
    tileLayerRef.current.options.attribution = tileAttribution;
    mapRef.current.attributionControl?.setPrefix(false);
  }, [tileUrl, tileAttribution]);

  // Stable click handler ref
  const selectCenterRef = useRef(trySelectCenter);
  selectCenterRef.current = trySelectCenter;

  // Update center markers with diffing (only add/remove changed markers)
  useEffect(() => {
    const layer = centersLayerRef.current;
    if (!layer) return;

    const currentIds = new Set(filteredCenters.map(c => c.id));
    const existingIds = new Set(markersRef.current.keys());

    // Remove markers that are no longer in filteredCenters
    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        const marker = markersRef.current.get(id);
        if (marker) {
          layer.removeLayer(marker);
          markersRef.current.delete(id);
        }
      }
    }

    // Add new markers
    for (const center of filteredCenters) {
      if (!markersRef.current.has(center.id)) {
        const icon = createRegionIcon(getRegionColor(center.region));
        const marker = L.marker([center.coordinates.lat, center.coordinates.lng], { icon });
        marker.on("click", () => selectCenterRef.current(center));
        marker.addTo(layer);
        markersRef.current.set(center.id, marker);
      }
    }
  }, [filteredCenters]);

  // Update user marker (don't recenter - keep initial Italy view)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!userLocation) {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      return;
    }

    const pos: [number, number] = [userLocation.lat, userLocation.lng];

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(pos, {
        icon: userLocationIcon,
        zIndexOffset: 1000,
      }).addTo(map);
      userMarkerRef.current.bindPopup("La tua posizione");
    } else {
      userMarkerRef.current.setLatLng(pos);
    }
  }, [userLocation]);

  // Center map on selected center (minimal animation)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedCenter) return;

    const centerPos: [number, number] = [
      selectedCenter.coordinates.lat,
      selectedCenter.coordinates.lng,
    ];

    // Disable animation for faster response
    map.setView(centerPos, 14, { animate: false });

    // Nudge map upward
    const containerHeight = map.getContainer().clientHeight;
    const yOffset = Math.round(containerHeight * 0.22);
    map.panBy([0, -yOffset], { animate: false });
  }, [selectedCenter]);

  const centerCount = filteredCenters.length;

  if (!mapReady && centerCount === 0) {
    return <MapLoading />;
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapDivRef} className="absolute inset-0" />

      <CenterCountBadge count={centerCount} />
      <LocateButton onClick={handleLocate} isLocating={isLocating} />

      {/* Minimal styles for Leaflet */}
      <style>{`
        .custom-marker-icon,
        .user-location-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          background: hsl(var(--card));
          color: hsl(var(--card-foreground));
          border-radius: 12px;
        }
        .leaflet-popup-tip {
          background: hsl(var(--card));
        }
        .leaflet-control-attribution {
          background: hsl(var(--background) / 0.8) !important;
          color: hsl(var(--muted-foreground)) !important;
          font-size: 10px;
          padding: 2px 6px;
        }
        .leaflet-control-attribution a {
          color: hsl(var(--primary)) !important;
        }
      `}</style>
    </div>
  );
}

export const MapView = memo(MapViewComponent);
