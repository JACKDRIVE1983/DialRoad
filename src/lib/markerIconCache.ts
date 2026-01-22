// Marker Icon Cache - Prevents repeated SVG generation
// This is critical for performance: createRegionMarkerIcon was being called
// on every render for every marker, generating new SVG strings each time.

import { getRegionColor, createRegionMarkerIcon } from './regionColors';

// Cache for generated marker icons (region -> icon URL)
const iconCache = new Map<string, string>();

// Cache for google.maps.Icon objects (region -> Icon)
const googleIconCache = new Map<string, google.maps.Icon>();

/**
 * Get a cached marker icon URL for a region
 * Avoids regenerating SVG data URLs on every render
 */
export function getCachedMarkerIcon(region: string): string {
  const normalizedRegion = region?.toLowerCase() || 'default';
  
  if (iconCache.has(normalizedRegion)) {
    return iconCache.get(normalizedRegion)!;
  }
  
  const color = getRegionColor(region);
  const iconUrl = createRegionMarkerIcon(color);
  iconCache.set(normalizedRegion, iconUrl);
  
  return iconUrl;
}

/**
 * Get a cached google.maps.Icon object for a region
 * Avoids creating new Size/Point objects on every render
 */
export function getCachedGoogleIcon(region: string): google.maps.Icon | null {
  if (typeof google === 'undefined' || !google.maps) {
    return null;
  }
  
  const normalizedRegion = region?.toLowerCase() || 'default';
  
  if (googleIconCache.has(normalizedRegion)) {
    return googleIconCache.get(normalizedRegion)!;
  }
  
  const iconUrl = getCachedMarkerIcon(region);
  const icon: google.maps.Icon = {
    url: iconUrl,
    scaledSize: new google.maps.Size(36, 36),
    anchor: new google.maps.Point(18, 18),
  };
  
  googleIconCache.set(normalizedRegion, icon);
  
  return icon;
}

/**
 * Pre-warm the icon cache with all Italian regions
 * Call this once when the map loads to avoid cache misses during pan/zoom
 */
export function preWarmIconCache(): void {
  const regions = [
    'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
    'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
    'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
    'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto'
  ];
  
  regions.forEach(region => {
    getCachedMarkerIcon(region);
  });
}

/**
 * Clear all caches (useful for memory management on app pause)
 */
export function clearIconCache(): void {
  iconCache.clear();
  googleIconCache.clear();
}
