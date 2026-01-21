// Region color mapping for Italian regions
// Each region has a unique HEX color for consistent visual identification

export const REGION_COLORS: Record<string, string> = {
  'Abruzzo': '#6B8E23',
  'Basilicata': '#8B4513',
  'Calabria': '#8B0000',
  'Campania': '#1E90FF',
  'Emilia-Romagna': '#DAA520',
  'Emilia-romagna': '#DAA520', // Handle case variations
  'Friuli-Venezia Giulia': '#6A5ACD',
  'Friuli-venezia giulia': '#6A5ACD',
  'Lazio': '#228B22',
  'Liguria': '#20B2AA',
  'Lombardia': '#006400',
  'Marche': '#DB7093',
  'Molise': '#D2B48C',
  'Piemonte': '#B22222',
  'Puglia': '#00BFFF',
  'Sardegna': '#FF8C00',
  'Sicilia': '#FFD700',
  'Toscana': '#A52A2A',
  'Trentino-Alto Adige': '#708090',
  'Trentino-alto adige': '#708090',
  'Umbria': '#9ACD32',
  'Valle d\'Aosta': '#000080',
  'Valle d\'aosta': '#000080',
  'Veneto': '#4682B4',
};

// Default color for unknown regions
export const DEFAULT_REGION_COLOR = '#0077b6';

/**
 * Get the color for a given region
 * Handles case-insensitive matching
 */
export function getRegionColor(region: string | null | undefined): string {
  if (!region) return DEFAULT_REGION_COLOR;
  
  // Try exact match first
  if (REGION_COLORS[region]) {
    return REGION_COLORS[region];
  }
  
  // Try case-insensitive match
  const normalizedRegion = region.charAt(0).toUpperCase() + region.slice(1).toLowerCase();
  if (REGION_COLORS[normalizedRegion]) {
    return REGION_COLORS[normalizedRegion];
  }
  
  // Try to find partial match for complex names
  const regionLower = region.toLowerCase();
  for (const [key, color] of Object.entries(REGION_COLORS)) {
    if (key.toLowerCase() === regionLower) {
      return color;
    }
  }
  
  return DEFAULT_REGION_COLOR;
}

/**
 * Generate a marker icon SVG with a specific color
 * Maintains the same rounded pin shape with white medical cross
 */
export function createRegionMarkerIcon(color: string): string {
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3" filter="url(#shadow)"/>
      <path d="M20 12 L20 28 M12 20 L28 20" stroke="white" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `);
}
