// React Query hook for fetching and caching center data
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

interface CenterRatingData {
  centerId: string;
  averageRating: number;
  totalReviews: number;
}

// Fetch ratings for all centers (batched)
export function useCenterRatings(centerIds: string[]) {
  return useQuery({
    queryKey: ['center-ratings', centerIds.slice(0, 100).join(',')],
    queryFn: async (): Promise<Map<string, CenterRatingData>> => {
      if (centerIds.length === 0) return new Map();
      
      const { data, error } = await supabase
        .from('anonymous_comments')
        .select('center_id, rating')
        .in('center_id', centerIds.slice(0, 100));
      
      if (error) {
        console.error('Error fetching ratings:', error);
        return new Map();
      }
      
      // Calculate averages per center
      const ratingsByCenter = new Map<string, number[]>();
      
      (data || []).forEach(row => {
        const existing = ratingsByCenter.get(row.center_id) || [];
        existing.push(row.rating);
        ratingsByCenter.set(row.center_id, existing);
      });
      
      const result = new Map<string, CenterRatingData>();
      
      ratingsByCenter.forEach((ratings, centerId) => {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        result.set(centerId, {
          centerId,
          averageRating: Math.round(avg * 10) / 10,
          totalReviews: ratings.length
        });
      });
      
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    enabled: centerIds.length > 0,
    refetchOnWindowFocus: false,
    retry: 1
  });
}

// Fetch comments for a specific center
export function useCenterComments(centerId: string | null) {
  return useQuery({
    queryKey: ['center-comments', centerId],
    queryFn: async () => {
      if (!centerId) return [];
      
      const { data, error } = await supabase
        .from('anonymous_comments')
        .select('*')
        .eq('center_id', centerId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }
      
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!centerId,
    refetchOnWindowFocus: false
  });
}

// Hook to prefetch comments for a center (call on hover/focus)
export function usePrefetchComments() {
  const queryClient = useQueryClient();
  
  return useCallback((centerId: string) => {
    if (!centerId) return;
    
    // Only prefetch if not already in cache
    const existing = queryClient.getQueryData(['center-comments', centerId]);
    if (existing) return;
    
    queryClient.prefetchQuery({
      queryKey: ['center-comments', centerId],
      queryFn: async () => {
        const { data } = await supabase
          .from('anonymous_comments')
          .select('*')
          .eq('center_id', centerId)
          .order('created_at', { ascending: false });
        return data || [];
      },
      staleTime: 2 * 60 * 1000
    });
  }, [queryClient]);
}
