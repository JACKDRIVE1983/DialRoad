import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  centerId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12'
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
};

function FavoriteButtonComponent({ centerId, size = 'md', className }: FavoriteButtonProps) {
  const { toggleFavorite, isFavorite, isLoggedIn } = useFavorites();
  const favorite = isFavorite(centerId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(centerId);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        sizeClasses[size],
        "flex items-center justify-center rounded-full transition-all active:scale-90",
        favorite 
          ? "bg-red-500/20 text-red-500" 
          : "bg-muted/80 text-muted-foreground hover:bg-muted",
        className
      )}
      aria-label={favorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          "transition-all",
          favorite && "fill-current"
        )} 
      />
    </button>
  );
}

export const FavoriteButton = React.memo(FavoriteButtonComponent);
