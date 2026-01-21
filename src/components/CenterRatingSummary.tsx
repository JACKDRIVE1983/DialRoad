import React from 'react';
import { Star } from 'lucide-react';

interface CenterRatingSummaryProps {
  averageRating: number;
  totalReviews: number;
}

function CenterRatingSummaryComponent({ averageRating, totalReviews }: CenterRatingSummaryProps) {
  if (totalReviews === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Star className="w-4 h-4" />
        <span>Nessuna recensione</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="font-semibold text-foreground">
          {averageRating.toFixed(1)}
        </span>
      </div>
      <span className="text-sm text-muted-foreground">
        ({totalReviews} {totalReviews === 1 ? 'recensione' : 'recensioni'})
      </span>
    </div>
  );
}

// Memoize to prevent re-renders when parent state changes
export const CenterRatingSummary = React.memo(CenterRatingSummaryComponent);
