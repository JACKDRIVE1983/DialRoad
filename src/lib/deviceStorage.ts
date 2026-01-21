// Device-based storage for tracking reviews and likes without user accounts

const REVIEWS_KEY = 'dialroad_reviews';
const LIKES_KEY = 'dialroad_likes';

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
