import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useFavorites() {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('favorites')
      .select('center_id')
      .eq('user_id', user.id);

    if (!error && data) {
      setFavorites(data.map(f => f.center_id));
    }
    setIsLoading(false);
  };

  const toggleFavorite = async (centerId: string) => {
    if (!user) return { error: 'Non autenticato' };

    const isFavorite = favorites.includes(centerId);

    if (isFavorite) {
      // Remove from favorites
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('center_id', centerId);

      if (!error) {
        setFavorites(prev => prev.filter(id => id !== centerId));
      }
      return { error };
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, center_id: centerId });

      if (!error) {
        setFavorites(prev => [...prev, centerId]);
      }
      return { error };
    }
  };

  const isFavorite = (centerId: string) => favorites.includes(centerId);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites
  };
}
