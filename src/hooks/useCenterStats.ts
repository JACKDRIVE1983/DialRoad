import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CenterStats {
  avgRating: number;
  reviewsCount: number;
  favoritesCount: number;
}

export function useCenterStats() {
  const [stats, setStats] = useState<Record<string, CenterStats>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    setIsLoading(true);
    
    try {
      // Fetch reviews stats (average rating and count per center)
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('center_id, rating');

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      }

      // Fetch favorites count per center
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('center_id');

      if (favoritesError) {
        console.error('Error fetching favorites:', favoritesError);
      }

      // Aggregate reviews by center
      const reviewsStats: Record<string, { total: number; count: number }> = {};
      if (reviewsData) {
        reviewsData.forEach((review) => {
          if (!reviewsStats[review.center_id]) {
            reviewsStats[review.center_id] = { total: 0, count: 0 };
          }
          reviewsStats[review.center_id].total += review.rating;
          reviewsStats[review.center_id].count += 1;
        });
      }

      // Aggregate favorites by center
      const favoritesStats: Record<string, number> = {};
      if (favoritesData) {
        favoritesData.forEach((fav) => {
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

      setStats(combinedStats);
    } catch (error) {
      console.error('Error fetching center stats:', error);
    }
    
    setIsLoading(false);
  };

  const getStats = (centerId: string): CenterStats => {
    return stats[centerId] || { avgRating: 0, reviewsCount: 0, favoritesCount: 0 };
  };

  return {
    stats,
    isLoading,
    getStats,
    refetch: fetchAllStats
  };
}
