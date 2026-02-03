import React from 'react';
import { Heart, MapPin, ArrowLeft, LogIn } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { CenterCard } from './CenterCard';
import { Button } from '@/components/ui/button';
import { calculateDistance } from '@/lib/distance';
import { useNavigate } from 'react-router-dom';

interface FavoritesViewProps {
  onBack: () => void;
}

function FavoritesViewComponent({ onBack }: FavoritesViewProps) {
  const { favorites, isLoading } = useFavorites();
  const { centers, userLocation, trySelectCenter } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filter centers that are in favorites
  const favoriteCenters = centers.filter(c => favorites.includes(c.id));

  // Calculate distances
  const centersWithDistance = favoriteCenters.map(center => ({
    center,
    distance: userLocation 
      ? calculateDistance(
          userLocation.lat,
          userLocation.lng,
          center.coordinates.lat,
          center.coordinates.lng
        )
      : null
  })).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

  if (!user) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground mb-4 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Indietro</span>
        </button>

        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">
            Accedi per vedere i preferiti
          </h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Effettua il login per salvare e visualizzare i tuoi centri preferiti
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            className="gap-2"
          >
            <LogIn className="w-4 h-4" />
            Accedi o Registrati
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground mb-4 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Indietro</span>
      </button>

      <div className="mb-4">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          I miei Preferiti
        </h1>
        <p className="text-sm text-muted-foreground">
          {favoriteCenters.length} {favoriteCenters.length === 1 ? 'centro salvato' : 'centri salvati'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : favoriteCenters.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">
            Nessun preferito
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Tocca il cuore su un centro per aggiungerlo ai preferiti
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {centersWithDistance.map(({ center, distance }) => (
            <CenterCard
              key={center.id}
              center={center}
              distance={distance}
              onSelect={trySelectCenter}
              showFavorite
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const FavoritesView = React.memo(FavoritesViewComponent);
