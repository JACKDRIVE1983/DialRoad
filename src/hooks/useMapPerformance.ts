// Map Performance Hooks - Optimizations for smooth pinch/pan/zoom
// These hooks implement camera idle detection, viewport culling, and throttling

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { DialysisCenter } from '@/data/mockCenters';

interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface ViewportState {
  bounds: Bounds | null;
  zoom: number;
  isIdle: boolean;
}

/**
 * Hook to detect when camera movement has stopped (idle state)
 * Updates are only triggered after the user finishes gestures
 */
export function useCameraIdle(idleDelay: number = 150) {
  const [isIdle, setIsIdle] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const handleCameraStart = useCallback(() => {
    setIsIdle(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleCameraEnd = useCallback(() => {
    // Debounce the idle state
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      lastUpdateRef.current = Date.now();
    }, idleDelay);
  }, [idleDelay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isIdle,
    handleCameraStart,
    handleCameraEnd,
    lastUpdate: lastUpdateRef.current
  };
}

/**
 * Filter centers to only those visible in viewport + buffer
 * This prevents rendering thousands of markers outside the visible area
 */
export function useViewportCulling(
  centers: DialysisCenter[],
  bounds: Bounds | null,
  zoom: number,
  isIdle: boolean
): DialysisCenter[] {
  // Cache the last valid result to avoid flickering during pan
  const lastResultRef = useRef<DialysisCenter[]>(centers);
  
  const visibleCenters = useMemo(() => {
    // During active gestures, return cached result for smooth rendering
    if (!isIdle && lastResultRef.current.length > 0) {
      return lastResultRef.current;
    }
    
    // No bounds yet, return all (but limit for initial load)
    if (!bounds) {
      const limited = centers.slice(0, 200);
      lastResultRef.current = limited;
      return limited;
    }
    
    // Calculate buffer based on zoom level (larger buffer at higher zoom)
    const latBuffer = (bounds.north - bounds.south) * 0.3;
    const lngBuffer = (bounds.east - bounds.west) * 0.3;
    
    const bufferedBounds = {
      north: bounds.north + latBuffer,
      south: bounds.south - latBuffer,
      east: bounds.east + lngBuffer,
      west: bounds.west - lngBuffer
    };
    
    // Filter to viewport + buffer
    const filtered = centers.filter(center => {
      const { lat, lng } = center.coordinates;
      return (
        lat >= bufferedBounds.south &&
        lat <= bufferedBounds.north &&
        lng >= bufferedBounds.west &&
        lng <= bufferedBounds.east
      );
    });
    
    // Limit markers based on zoom level
    const maxMarkers = zoom >= 10 ? 500 : zoom >= 7 ? 200 : 100;
    const result = filtered.slice(0, maxMarkers);
    
    lastResultRef.current = result;
    return result;
  }, [centers, bounds, zoom, isIdle]);
  
  return visibleCenters;
}

/**
 * Simple grid-based clustering for markers
 * Groups nearby markers at lower zoom levels
 */
interface Cluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  centers: DialysisCenter[];
  region: string;
}

export function useSimpleClustering(
  centers: DialysisCenter[],
  zoom: number,
  isIdle: boolean
): { clusters: Cluster[]; showIndividualMarkers: boolean } {
  const lastClustersRef = useRef<Cluster[]>([]);
  
  const result = useMemo(() => {
    // At zoom 9+, show individual markers (no clustering)
    if (zoom >= 9) {
      return { 
        clusters: [], 
        showIndividualMarkers: true 
      };
    }
    
    // During active gestures, return cached clusters
    if (!isIdle && lastClustersRef.current.length > 0) {
      return { 
        clusters: lastClustersRef.current, 
        showIndividualMarkers: false 
      };
    }
    
    // Grid size based on zoom (larger grid = more clustering at lower zoom)
    const gridSize = zoom <= 5 ? 2.0 : zoom <= 7 ? 1.0 : 0.5;
    
    const grid = new Map<string, DialysisCenter[]>();
    
    centers.forEach(center => {
      const gridLat = Math.floor(center.coordinates.lat / gridSize);
      const gridLng = Math.floor(center.coordinates.lng / gridSize);
      const key = `${gridLat},${gridLng}`;
      
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(center);
    });
    
    const clusters: Cluster[] = [];
    
    grid.forEach((clusterCenters, key) => {
      if (clusterCenters.length === 0) return;
      
      // Calculate centroid
      const avgLat = clusterCenters.reduce((sum, c) => sum + c.coordinates.lat, 0) / clusterCenters.length;
      const avgLng = clusterCenters.reduce((sum, c) => sum + c.coordinates.lng, 0) / clusterCenters.length;
      
      // Use most common region for color
      const regionCounts = new Map<string, number>();
      clusterCenters.forEach(c => {
        const count = regionCounts.get(c.region) || 0;
        regionCounts.set(c.region, count + 1);
      });
      const dominantRegion = [...regionCounts.entries()]
        .sort((a, b) => b[1] - a[1])[0][0];
      
      clusters.push({
        id: key,
        lat: avgLat,
        lng: avgLng,
        count: clusterCenters.length,
        centers: clusterCenters,
        region: dominantRegion
      });
    });
    
    lastClustersRef.current = clusters;
    
    return { 
      clusters, 
      showIndividualMarkers: false 
    };
  }, [centers, zoom, isIdle]);
  
  return result;
}

/**
 * Hook to manage viewport state with throttled updates
 */
export function useViewportState() {
  const [viewport, setViewport] = useState<ViewportState>({
    bounds: null,
    zoom: 6,
    isIdle: true
  });
  
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdateRef = useRef<Partial<ViewportState> | null>(null);

  const updateViewport = useCallback((updates: Partial<ViewportState>) => {
    // For isIdle changes, update immediately
    if ('isIdle' in updates) {
      setViewport(prev => ({ ...prev, ...updates }));
      return;
    }
    
    // For bounds/zoom, throttle updates during gestures
    pendingUpdateRef.current = { ...pendingUpdateRef.current, ...updates };
    
    if (!updateTimeoutRef.current) {
      updateTimeoutRef.current = setTimeout(() => {
        if (pendingUpdateRef.current) {
          setViewport(prev => ({ ...prev, ...pendingUpdateRef.current! }));
          pendingUpdateRef.current = null;
        }
        updateTimeoutRef.current = null;
      }, 100);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return { viewport, updateViewport };
}
