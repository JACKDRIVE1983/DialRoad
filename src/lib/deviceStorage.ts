// Device-based storage for tracking reviews, likes, and preferences without user accounts

const REVIEWS_KEY = 'dialroad_reviews';
const LIKES_KEY = 'dialroad_likes';
const BOOKING_BROWSER_KEY = 'dialroad_booking_browser';
const DAILY_LIMITS_KEY = 'dialroad_daily_limits';

// Daily limits for free users
const MAX_DAILY_VIEWS = 5;
const MAX_DAILY_SEARCHES = 5;

interface DailyLimits {
  date: string; // YYYY-MM-DD format
  viewedCenters: string[]; // IDs of viewed centers
  searchCount: number;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getDailyLimits(): DailyLimits {
  try {
    const stored = localStorage.getItem(DAILY_LIMITS_KEY);
    if (stored) {
      const limits: DailyLimits = JSON.parse(stored);
      // Reset if it's a new day
      if (limits.date !== getTodayDate()) {
        return { date: getTodayDate(), viewedCenters: [], searchCount: 0 };
      }
      return limits;
    }
  } catch {
    // Silently fail
  }
  return { date: getTodayDate(), viewedCenters: [], searchCount: 0 };
}

function saveDailyLimits(limits: DailyLimits): void {
  try {
    localStorage.setItem(DAILY_LIMITS_KEY, JSON.stringify(limits));
  } catch {
    // Silently fail
  }
}

// Check if user can view a center (returns true if allowed)
export function canViewCenter(centerId: string): boolean {
  const limits = getDailyLimits();
  // Already viewed this center today - allow re-viewing
  if (limits.viewedCenters.includes(centerId)) {
    return true;
  }
  // Check if under limit
  return limits.viewedCenters.length < MAX_DAILY_VIEWS;
}

// Mark a center as viewed (returns false if limit reached)
export function markCenterViewed(centerId: string): boolean {
  const limits = getDailyLimits();
  // Already viewed - no need to track again
  if (limits.viewedCenters.includes(centerId)) {
    return true;
  }
  // Check limit
  if (limits.viewedCenters.length >= MAX_DAILY_VIEWS) {
    return false;
  }
  limits.viewedCenters.push(centerId);
  saveDailyLimits(limits);
  return true;
}

// Get current view count
export function getViewCount(): number {
  return getDailyLimits().viewedCenters.length;
}

// Check if user can search
export function canSearch(): boolean {
  const limits = getDailyLimits();
  return limits.searchCount < MAX_DAILY_SEARCHES;
}

// Increment search count (returns false if limit reached)
export function incrementSearchCount(): boolean {
  const limits = getDailyLimits();
  if (limits.searchCount >= MAX_DAILY_SEARCHES) {
    return false;
  }
  limits.searchCount++;
  saveDailyLimits(limits);
  return true;
}

// Get current search count
export function getSearchCount(): number {
  return getDailyLimits().searchCount;
}

// Check if daily limit is reached (views OR searches)
export function isDailyLimitReached(): boolean {
  const limits = getDailyLimits();
  return limits.viewedCenters.length >= MAX_DAILY_VIEWS || limits.searchCount >= MAX_DAILY_SEARCHES;
}

// Booking browser preference (default: true = always open in browser for coordinate search)
export function getBookingBrowserPreference(): boolean {
  try {
    const value = localStorage.getItem(BOOKING_BROWSER_KEY);
    // Default to true (browser) if not set
    return value === null ? true : value === 'true';
  } catch {
    return true;
  }
}

export function setBookingBrowserPreference(useBrowser: boolean): void {
  try {
    localStorage.setItem(BOOKING_BROWSER_KEY, useBrowser.toString());
  } catch {
    // Silently fail if localStorage is not available
  }
}

// Check if device has already reviewed a center
export function hasReviewedCenter(centerId: string): boolean {
  try {
    const reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
    return reviews.includes(centerId);
  } catch {
    return false;
  }
}

// Mark center as reviewed by this device
export function markCenterReviewed(centerId: string): void {
  try {
    const reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
    if (!reviews.includes(centerId)) {
      reviews.push(centerId);
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    }
  } catch {
    // Silently fail if localStorage is not available
  }
}

// Check if device has already liked a comment
export function hasLikedComment(commentId: string): boolean {
  try {
    const likes = JSON.parse(localStorage.getItem(LIKES_KEY) || '[]');
    return likes.includes(commentId);
  } catch {
    return false;
  }
}

// Mark comment as liked by this device
export function markCommentLiked(commentId: string): void {
  try {
    const likes = JSON.parse(localStorage.getItem(LIKES_KEY) || '[]');
    if (!likes.includes(commentId)) {
      likes.push(commentId);
      localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
    }
  } catch {
    // Silently fail if localStorage is not available
  }
}

// Remove like from comment (for unlike functionality if needed)
export function unmarkCommentLiked(commentId: string): void {
  try {
    const likes = JSON.parse(localStorage.getItem(LIKES_KEY) || '[]');
    const updated = likes.filter((id: string) => id !== commentId);
    localStorage.setItem(LIKES_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail if localStorage is not available
  }
}
