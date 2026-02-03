import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select('center_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorites:', error);
        return [];
      }

      return data.map(f => f.center_id);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const addFavorite = useMutation({
    mutationFn: async (centerId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('favorites')
        .insert({ center_id: centerId, user_id: user.id });

      if (error) throw error;
      return centerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast({
        title: "Aggiunto ai preferiti",
        description: "Il centro è stato salvato nei tuoi preferiti",
      });
    },
    onError: (error) => {
      console.error('Error adding favorite:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile aggiungere ai preferiti",
        variant: "destructive",
      });
    }
  });

  const removeFavorite = useMutation({
    mutationFn: async (centerId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('center_id', centerId)
        .eq('user_id', user.id);

      if (error) throw error;
      return centerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast({
        title: "Rimosso dai preferiti",
        description: "Il centro è stato rimosso dai tuoi preferiti",
      });
    },
    onError: (error) => {
      console.error('Error removing favorite:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile rimuovere dai preferiti",
        variant: "destructive",
      });
    }
  });

  const toggleFavorite = (centerId: string) => {
    if (!user) {
      toast({
        title: "Accedi per salvare",
        description: "Effettua il login per salvare i centri nei preferiti",
        variant: "destructive",
      });
      return;
    }

    if (favorites.includes(centerId)) {
      removeFavorite.mutate(centerId);
    } else {
      addFavorite.mutate(centerId);
    }
  };

  const isFavorite = (centerId: string) => favorites.includes(centerId);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    isLoggedIn: !!user,
  };
}
