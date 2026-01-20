import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CenterStats {
  avgRating: number;
  reviewsCount: number;
  favoritesCount: number;
}

const fetchAllStats = async (): Promise<Record<string, CenterStats>> => {
  // Fetch reviews and favorites in parallel
  const [reviewsResult, favoritesResult] = await Promise.all([
    supabase.from('reviews').select('center_id, rating'),
    supabase.from('favorites').select('center_id')
  ]);

  if (reviewsResult.error) {
    console.error('Error fetching reviews:', reviewsResult.error);
  }
  if (favoritesResult.error) {
    console.error('Error fetching favorites:', favoritesResult.error);
  }

  // Aggregate reviews by center
  const reviewsStats: Record<string, { total: number; count: number }> = {};
  if (reviewsResult.data) {
    reviewsResult.data.forEach((review) => {
      if (!reviewsStats[review.center_id]) {
        reviewsStats[review.center_id] = { total: 0, count: 0 };
      }
      reviewsStats[review.center_id].total += review.rating;
      reviewsStats[review.center_id].count += 1;
    });
  }

  // Aggregate favorites by center
  const favoritesStats: Record<string, number> = {};
  if (favoritesResult.data) {
    favoritesResult.data.forEach((fav) => {
      favoritesStats[fav.center_id] = (favoritesStats[fav.center_id] || 0) + 1;
    });
  }

  // Combine into final stats
  const allCenterIds = new Set([
    ...Object.keys(reviewsStats),
    ...Object.keys(favoritesStats)
  ]);

  const combinedStats: Record<string, CenterStats> = {};
  allCenterIds.forEach((centerId) => {
    const reviewStat = reviewsStats[centerId];
    combinedStats[centerId] = {
      avgRating: reviewStat ? Math.round((reviewStat.total / reviewStat.count) * 10) / 10 : 0,
      reviewsCount: reviewStat?.count || 0,
      favoritesCount: favoritesStats[centerId] || 0
    };
  });

  return combinedStats;
};

export function useCenterStats() {
  const { data: stats = {}, isLoading, refetch } = useQuery({
    queryKey: ['centerStats'],
    queryFn: fetchAllStats,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });

  const getStats = (centerId: string): CenterStats => {
    return stats[centerId] || { avgRating: 0, reviewsCount: 0, favoritesCount: 0 };
  };

  return {
    stats,
    isLoading,
    getStats,
    refetch
  };
}