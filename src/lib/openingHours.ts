// Utility to check if a center is currently open based on opening hours

interface OpeningHoursResult {
  isOpen: boolean;
  nextChange: string | null; // e.g., "Apre alle 6:00" or "Chiude alle 20:00"
}

// Map Italian day abbreviations to JS day numbers (0 = Sunday, 1 = Monday, etc.)
const dayMap: Record<string, number> = {
  'dom': 0,
  'lun': 1,
  'mar': 2,
  'mer': 3,
  'gio': 4,
  'ven': 5,
  'sab': 6
};

const dayNames = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];

/**
 * Parse day range like "Lun-Sab" or "Lun-Ven" into array of day numbers
 */
function parseDayRange(dayRange: string): number[] {
  const normalized = dayRange.toLowerCase().trim();
  
  // Handle single day
  if (dayMap[normalized] !== undefined) {
    return [dayMap[normalized]];
  }
  
  // Handle range like "lun-sab"
  const rangeMatch = normalized.match(/^(\w+)-(\w+)$/);
  if (rangeMatch) {
    const startDay = dayMap[rangeMatch[1]];
    const endDay = dayMap[rangeMatch[2]];
    
    if (startDay !== undefined && endDay !== undefined) {
      const days: number[] = [];
      let current = startDay;
      while (current !== endDay) {
        days.push(current);
        current = (current + 1) % 7;
      }
      days.push(endDay);
      return days;
    }
  }
  
  // Default to Mon-Sat if parsing fails
  return [1, 2, 3, 4, 5, 6];
}

/**
 * Parse time string like "6:00" or "20:00" into minutes since midnight
 */
function parseTime(timeStr: string): number {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours * 60 + minutes;
  }
  return -1;
}

/**
 * Format minutes since midnight to time string
 */
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if center is currently open based on opening hours string
 * Format expected: "Lun-Sab: 6:00-20:00" or similar
 */
export function isCurrentlyOpen(openingHours: string): OpeningHoursResult {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Default result if parsing fails
  const defaultResult: OpeningHoursResult = { isOpen: true, nextChange: null };
  
  if (!openingHours) return defaultResult;
  
  // Parse format: "Lun-Sab: 6:00-20:00"
  const match = openingHours.match(/^(.+?):\s*(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
  if (!match) return defaultResult;
  
  const dayRange = match[1];
  const openTime = parseTime(match[2]);
  const closeTime = parseTime(match[3]);
  
  if (openTime === -1 || closeTime === -1) return defaultResult;
  
  const openDays = parseDayRange(dayRange);
  const isDayOpen = openDays.includes(currentDay);
  
  if (!isDayOpen) {
    // Find next open day
    let nextOpenDay = currentDay;
    for (let i = 1; i <= 7; i++) {
      nextOpenDay = (currentDay + i) % 7;
      if (openDays.includes(nextOpenDay)) break;
    }
    const nextDayName = dayNames[nextOpenDay];
    return {
      isOpen: false,
      nextChange: `Apre ${nextDayName === dayNames[(currentDay + 1) % 7] ? 'domani' : nextDayName} alle ${formatTime(openTime)}`
    };
  }
  
  // Check time
  if (currentMinutes < openTime) {
    return {
      isOpen: false,
      nextChange: `Apre alle ${formatTime(openTime)}`
    };
  }
  
  if (currentMinutes >= closeTime) {
    // Find next open day
    let nextOpenDay = (currentDay + 1) % 7;
    for (let i = 1; i <= 7; i++) {
      if (openDays.includes(nextOpenDay)) break;
      nextOpenDay = (nextOpenDay + 1) % 7;
    }
    const nextDayName = dayNames[nextOpenDay];
    return {
      isOpen: false,
      nextChange: `Apre ${nextOpenDay === (currentDay + 1) % 7 ? 'domani' : nextDayName} alle ${formatTime(openTime)}`
    };
  }
  
  // Currently open
  return {
    isOpen: true,
    nextChange: `Chiude alle ${formatTime(closeTime)}`
  };
}

/**
 * Hook-friendly version that recalculates every minute
 */
export function useIsOpen(openingHours: string): OpeningHoursResult {
  return isCurrentlyOpen(openingHours);
}
