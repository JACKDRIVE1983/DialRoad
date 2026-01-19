import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { regions, serviceTypes } from '@/data/mockCenters';
import { Button } from '@/components/ui/button';

export function SearchBar() {
  const { 
    searchQuery, 
    setSearchQuery, 
    selectedRegion, 
    setSelectedRegion,
    selectedServices,
    setSelectedServices
  } = useApp();
  
  const [showFilters, setShowFilters] = useState(false);

  const toggleService = (service: string) => {
    setSelectedServices(
      selectedServices.includes(service)
        ? selectedServices.filter(s => s !== service)
        : [...selectedServices, service]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('Tutte le Regioni');
    setSelectedServices([]);
  };

  const hasActiveFilters = selectedRegion !== 'Tutte le Regioni' || selectedServices.length > 0;

  return (
    <>
      {/* Search bar */}
      <motion.div
        className="absolute top-4 left-4 right-4 z-40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center p-2">
            <div className="flex-1 flex items-center px-4">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                type="text"
                placeholder="Cerca per nome, città..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={`relative rounded-xl ${hasActiveFilters ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary" />
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
              className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
            />

            {/* Filter panel */}
            <motion.div
              className="fixed top-20 left-4 right-4 z-50 glass-card rounded-3xl p-6 max-h-[70vh] overflow-y-auto"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-bold text-foreground">Filtri</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-primary"
                  >
                    Cancella tutto
                  </Button>
                )}
              </div>

              {/* Region filter */}
              <div className="mb-6">
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Regione
                </label>
                <div className="flex flex-wrap gap-2">
                  {regions.slice(0, 10).map((region) => (
                    <button
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedRegion === region
                          ? 'gradient-bg text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              {/* Services filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  Servizi
                </label>
                <div className="flex flex-wrap gap-2">
                  {serviceTypes.map((service) => (
                    <button
                      key={service}
                      onClick={() => toggleService(service)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedServices.includes(service)
                          ? 'gradient-bg text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <Button
                onClick={() => setShowFilters(false)}
                className="w-full mt-6 h-12 rounded-xl gradient-bg text-primary-foreground font-semibold"
              >
                Applica Filtri
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
