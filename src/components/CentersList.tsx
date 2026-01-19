import { motion } from 'framer-motion';
import { MapPin, Star, Heart, Clock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { DialysisCenter } from '@/data/mockCenters';
import centerImage from '@/assets/center-placeholder.jpg';

interface CentersListProps {
  onSelectCenter: (center: DialysisCenter) => void;
}

export function CentersList({ onSelectCenter }: CentersListProps) {
  const { filteredCenters } = useApp();

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
      <motion.div
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        {filteredCenters.map((center) => (
          <motion.button
            key={center.id}
            className="w-full text-left"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            onClick={() => onSelectCenter(center)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 mr-1" />
                        <span className="text-xs font-medium text-foreground">{center.rating}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Heart className="w-3.5 h-3.5 mr-1" />
                        <span className="text-xs">{center.likes}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-muted-foreground text-[10px]">
                      <Clock className="w-3 h-3 mr-1" />
                      {center.openingHours.split(':')[0]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.button>
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
      </motion.div>
    </div>
  );
}
