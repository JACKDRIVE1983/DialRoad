import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CenterRatingStats {
  centerId: string;
  averageRating: number;
  totalReviews: number;
}

async function fetchAllCenterRatings(): Promise<Map<string, CenterRatingStats>> {
  const { data, error } = await supabase
    .from('anonymous_comments')
    .select('center_id, rating');

  if (error) {
    console.error('Error fetching center ratings:', error);
    return new Map();
  }

  // Group by center_id and calculate stats
  const statsMap = new Map<string, { total: number; count: number }>();
  
  for (const comment of data || []) {
    const existing = statsMap.get(comment.center_id) || { total: 0, count: 0 };
    statsMap.set(comment.center_id, {
      total: existing.total + comment.rating,
      count: existing.count + 1
    });
  }

  // Convert to final format
  const result = new Map<string, CenterRatingStats>();
  for (const [centerId, stats] of statsMap) {
    result.set(centerId, {
      centerId,
      averageRating: stats.count > 0 ? stats.total / stats.count : 0,
      totalReviews: stats.count
    });
  }

  return result;
}

export function useCenterRatings() {
  return useQuery({
    queryKey: ['center-ratings'],
    queryFn: fetchAllCenterRatings,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useCenterRating(centerId: string) {
  const { data: ratingsMap, isLoading } = useCenterRatings();
  
  const stats = ratingsMap?.get(centerId) || {
    centerId,
    averageRating: 0,
    totalReviews: 0
  };

  return {
    ...stats,
    isLoading
  };
}
