import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { regions } from '@/data/mockCenters';
import { Button } from '@/components/ui/button';

export function SearchBar() {
  const { 
    searchQuery, 
    setSearchQuery, 
    selectedRegion, 
    setSelectedRegion
  } = useApp();
  
  const [showFilters, setShowFilters] = useState(false);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('Tutte le Regioni');
  };

  const hasActiveFilters = selectedRegion !== 'Tutte le Regioni';

  return (
    <>
      {/* Search bar - compact, right-aligned */}
      <motion.div
        className="absolute top-4 right-4 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ marginTop: '60px' }}
      >
        <div 
          className="rounded-2xl overflow-hidden bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-white/50 dark:border-white/10"
          style={{
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="flex items-center p-2 gap-1">
            <div className="flex items-center px-3">
              <Search className="w-4 h-4 text-muted-foreground mr-2" />
              <input
                type="text"
                placeholder="Cerca centro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[120px] bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={`relative rounded-xl h-9 w-9 ${hasActiveFilters ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white dark:border-card" />
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
            />

            {/* Filter panel */}
            <motion.div
              className="fixed top-32 right-4 left-4 z-50 bg-background/95 dark:bg-card/95 backdrop-blur-2xl rounded-3xl p-5 max-h-[70vh] overflow-y-auto border border-white/20 dark:border-white/10"
              style={{
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
              }}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-display font-bold text-foreground">Filtra per Regione</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-primary text-sm"
                  >
                    Resetta
                  </Button>
                )}
              </div>

              {/* Region filter */}
              <div className="mb-5">
                <label className="text-xs font-medium text-muted-foreground mb-3 block flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Seleziona Regione
                </label>
                <div className="flex flex-wrap gap-2">
                  {regions.map((region) => (
                    <button
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedRegion === region
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <Button
                onClick={() => setShowFilters(false)}
                className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25"
              >
                Applica Filtro
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
