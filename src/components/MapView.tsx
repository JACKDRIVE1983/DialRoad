import { useEffect, useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
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

const createRegionIcon = (color: string) => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3" filter="url(#shadow)"/>
      <path d="M20 12 L20 28 M12 20 L28 20" stroke="white" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-marker-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

const userLocationIcon = L.divIcon({
  html: `
    <div class="user-marker-container" style="animation: bounce-slow 2s ease-in-out infinite;">
      <svg viewBox="0 0 40 60" width="40" height="60">
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
    </div>
  `,
  className: "user-location-icon",
  iconSize: [40, 60],
  iconAnchor: [20, 60],
});

export function MapView() {
  const { filteredCenters, trySelectCenter, userLocation, setUserLocation, isDarkMode } =
    useApp();

  const [isLocating, setIsLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const centersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

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
        }
      );
    } else {
      setUserLocation({ lat: defaultCenter[0], lng: defaultCenter[1] });
      setIsLocating(false);
    }
  }, [setUserLocation]);

  useEffect(() => {
    handleLocate();
  }, [handleLocate]);

  const tileUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const tileAttribution = isDarkMode
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  // Initialize map once
  useEffect(() => {
    if (!mapDivRef.current) return;
    if (mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView(defaultCenter, 6);

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 19,
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update tile layer on theme change
  useEffect(() => {
    if (!mapRef.current) return;
    if (!tileLayerRef.current) return;

    tileLayerRef.current.setUrl(tileUrl);
    tileLayerRef.current.options.attribution = tileAttribution;
    // Force attribution refresh
    mapRef.current.attributionControl?.setPrefix(false);
  }, [tileUrl, tileAttribution]);

  // Update center markers
  useEffect(() => {
    const layer = centersLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    for (const center of filteredCenters) {
      const icon = createRegionIcon(getRegionColor(center.region));
      const marker = L.marker([center.coordinates.lat, center.coordinates.lng], { icon });
      marker.on("click", () => trySelectCenter(center));
      marker.addTo(layer);
    }
  }, [filteredCenters, trySelectCenter]);

  // Update user marker and recenter
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

    map.setView(pos, 10, { animate: true });
  }, [userLocation]);

  if (!mapReady && filteredCenters.length === 0) {
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
      <div ref={mapDivRef} className="absolute inset-0" />

      {/* Center count badge - bottom left */}
      <motion.div
        className="absolute left-2 z-[1000] glass-card px-3 py-1.5 rounded-full"
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
        className="absolute right-4 z-[1000] w-11 h-11 rounded-full glass-card flex items-center justify-center shadow-lg"
        style={{ bottom: 16 }}
        onClick={handleLocate}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isLocating}
      >
        <Navigation className={`w-5 h-5 text-primary ${isLocating ? "animate-spin" : ""}`} />
      </motion.button>

      {/* Custom styles for Leaflet */}
      <style>{`
        .custom-marker-icon {
          background: transparent !important;
          border: none !important;
        }

        .user-location-icon {
          background: transparent !important;
          border: none !important;
        }

        .user-marker-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .leaflet-popup-content-wrapper {
          background: hsl(var(--card));
          color: hsl(var(--card-foreground));
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .leaflet-popup-tip {
          background: hsl(var(--card));
        }

        .leaflet-container {
          font-family: inherit;
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

        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
}
