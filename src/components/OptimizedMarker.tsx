// Optimized Marker Component - Memoized with stable icon references
// Prevents re-renders when parent state changes

import React, { memo, useCallback } from 'react';
import { MarkerF } from '@react-google-maps/api';
import { DialysisCenter } from '@/data/mockCenters';
import { getCachedGoogleIcon } from '@/lib/markerIconCache';

interface OptimizedMarkerProps {
  center: DialysisCenter;
  onClick: (center: DialysisCenter) => void;
}

function OptimizedMarkerComponent({ center, onClick }: OptimizedMarkerProps) {
  const handleClick = useCallback(() => {
    onClick(center);
  }, [center, onClick]);

  // Get cached icon to avoid creating new objects on each render
  const icon = getCachedGoogleIcon(center.region);

  return (
    <MarkerF
      position={{ lat: center.coordinates.lat, lng: center.coordinates.lng }}
      onClick={handleClick}
      icon={icon || undefined}
      // Optimization: disable animations for faster rendering
      animation={undefined}
      // Optimization: use basic shape for hit detection
      clickable={true}
    />
  );
}

// Deep comparison for memoization - only re-render if essential props change
export const OptimizedMarker = memo(OptimizedMarkerComponent, (prev, next) => {
  return (
    prev.center.id === next.center.id &&
    prev.center.coordinates.lat === next.center.coordinates.lat &&
    prev.center.coordinates.lng === next.center.coordinates.lng &&
    prev.center.region === next.center.region
  );
});

// Cluster marker component
interface ClusterMarkerProps {
  lat: number;
  lng: number;
  count: number;
  region: string;
  onClick?: () => void;
}

function ClusterMarkerComponent({ lat, lng, count, region, onClick }: ClusterMarkerProps) {
  // Create cluster icon with count
  const size = Math.min(50, 30 + Math.log10(count) * 10);
  const icon = getCachedGoogleIcon(region);
  
  return (
    <MarkerF
      position={{ lat, lng }}
      onClick={onClick}
      icon={icon || undefined}
      label={{
        text: count.toString(),
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
      }}
      clickable={true}
    />
  );
}

export const ClusterMarker = memo(ClusterMarkerComponent, (prev, next) => {
  return (
    prev.lat === next.lat &&
    prev.lng === next.lng &&
    prev.count === next.count &&
    prev.region === next.region
  );
});
