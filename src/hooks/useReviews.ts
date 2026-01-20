import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Review {
  id: string;
  user_id: string;
  center_id: string;
  rating: number;
  text: string;
  created_at: string;
  updated_at: string;
  // Joined from profiles via view
  user_name?: string;
  user_avatar?: string;
}

// Type for the reviews_with_author view
interface ReviewWithAuthor {
  id: string;
  user_id: string;
  center_id: string;
  rating: number;
  text: string;
  created_at: string;
  updated_at: string;
  author_name: string | null;
  author_avatar: string | null;
}

export function useReviews(centerId?: string) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUserReviews, setIsLoadingUserReviews] = useState(false);
  const [userReviewsCount, setUserReviewsCount] = useState(0);

  useEffect(() => {
    if (centerId) {
      fetchReviews(centerId);
    }
  }, [centerId]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserReviewsCount();
    }
  }, [isAuthenticated, user]);

  const fetchReviews = async (centerId: string) => {
    setIsLoading(true);
    
    // Use the reviews_with_author view which includes author info
    // The view joins reviews with profiles to get display names and avatars
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews_with_author' as any)
      .select('id, user_id, center_id, rating, text, created_at, updated_at, author_name, author_avatar')
      .eq('center_id', centerId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      setIsLoading(false);
      return;
    }

    if (reviewsData && reviewsData.length > 0) {
      const enrichedReviews: Review[] = (reviewsData as unknown as ReviewWithAuthor[]).map(review => ({
        id: review.id,
        user_id: review.user_id,
        center_id: review.center_id,
        rating: review.rating,
        text: review.text,
        created_at: review.created_at,
        updated_at: review.updated_at,
        user_name: review.author_name || 'Utente',
        user_avatar: review.author_avatar || undefined
      }));

      setReviews(enrichedReviews);
    } else {
      setReviews([]);
    }
    
    setIsLoading(false);
  };

  const fetchUserReviewsCount = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    setUserReviewsCount(count || 0);
  };

  const fetchUserReviews = async () => {
    if (!user) return;
    
    setIsLoadingUserReviews(true);
    
    const { data, error } = await supabase
      .from('reviews_with_author' as any)
      .select('id, user_id, center_id, rating, text, created_at, updated_at, author_name, author_avatar')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user reviews:', error);
      setIsLoadingUserReviews(false);
      return;
    }

    if (data && data.length > 0) {
      const enrichedReviews: Review[] = (data as unknown as ReviewWithAuthor[]).map(review => ({
        id: review.id,
        user_id: review.user_id,
        center_id: review.center_id,
        rating: review.rating,
        text: review.text,
        created_at: review.created_at,
        updated_at: review.updated_at,
        user_name: review.author_name || 'Utente',
        user_avatar: review.author_avatar || undefined
      }));
      setUserReviews(enrichedReviews);
    } else {
      setUserReviews([]);
    }
    
    setIsLoadingUserReviews(false);
  };

  const addReview = async (centerId: string, rating: number, text: string) => {
    if (!user) return { error: 'Non autenticato' };

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        center_id: centerId,
        rating,
        text
      })
      .select()
      .single();

    if (!error && data) {
      // Refresh reviews
      await fetchReviews(centerId);
      await fetchUserReviewsCount();
    }

    return { error, data };
  };

  const deleteReview = async (reviewId: string, centerId: string) => {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (!error) {
      await fetchReviews(centerId);
      await fetchUserReviewsCount();
    }

    return { error };
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  };

  return {
    reviews,
    userReviews,
    isLoading,
    isLoadingUserReviews,
    addReview,
    deleteReview,
    getAverageRating,
    userReviewsCount,
    fetchUserReviews,
    refetch: centerId ? () => fetchReviews(centerId) : undefined
  };
}
