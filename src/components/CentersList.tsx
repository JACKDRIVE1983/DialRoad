import { MapPin, Clock, Search } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { DialysisCenter } from '@/data/mockCenters';
import centerImage from '@/assets/center-placeholder.jpg';

interface CentersListProps {
  onSelectCenter: (center: DialysisCenter) => void;
}

export function CentersList({ onSelectCenter }: CentersListProps) {
  const { filteredCenters, searchQuery, setSearchQuery } = useApp();

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cerca centro per nome o città..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl glass-card border-0 bg-background/60 backdrop-blur-sm text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div className="space-y-3">
        {filteredCenters.map((center) => (
          <button
            key={center.id}
            className="w-full text-left transition-transform active:scale-[0.98]"
            onClick={() => onSelectCenter(center)}
          >
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex">
                {/* Image */}
                <div className="w-28 h-28 flex-shrink-0">
                  <img 
                    src={centerImage} 
                    alt={center.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-display font-semibold text-foreground text-sm leading-tight pr-2">
                      {center.name}
                    </h3>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      center.isOpen 
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                        : 'bg-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                      {center.isOpen ? 'Aperto' : 'Chiuso'}
                    </span>
                  </div>

                  <div className="flex items-center text-muted-foreground text-xs mb-2">
                    <MapPin className="w-3 h-3 mr-1" />
                    {center.city}
                  </div>

                  <div className="flex items-center justify-end">
                    <div className="flex items-center text-muted-foreground text-[10px]">
                      <Clock className="w-3 h-3 mr-1" />
                      {center.openingHours.split(':')[0]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}

        {filteredCenters.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">
              Nessun centro trovato
            </h3>
            <p className="text-muted-foreground text-sm">
              Prova a modificare i filtri di ricerca
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
