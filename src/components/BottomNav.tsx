import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, List, Settings, Moon, Sun, Search, SlidersHorizontal, X, MapPin } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { regions } from '@/data/mockCenters';
import { Button } from '@/components/ui/button';

type TabType = 'map' | 'list' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { 
    isDarkMode, 
    toggleDarkMode,
    searchQuery,
    setSearchQuery,
    selectedRegion,
    setSelectedRegion,
    setIsSearchFocused
  } = useApp();

  const [showFilters, setShowFilters] = useState(false);

  const tabs = [
    { id: 'map' as TabType, icon: Map },
    { id: 'list' as TabType, icon: List },
    { id: 'settings' as TabType, icon: Settings },
  ];

  const hasActiveFilters = selectedRegion !== 'Tutte le Regioni';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('Tutte le Regioni');
  };

  return (
    <>
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-30 p-4"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      >
        <div 
          className="mx-auto max-w-sm rounded-[24px] overflow-hidden bg-white/90 dark:bg-card/90 backdrop-blur-2xl border border-white/60 dark:border-white/10"
          style={{
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
        {/* Search bar row - hidden on settings tab */}
          <AnimatePresence>
            {activeTab !== 'settings' && (
              <motion.div 
                className="px-3 pt-3 pb-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2 bg-muted/50 dark:bg-muted/30 rounded-xl px-3 py-2">
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Cerca centro..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm min-w-0"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="p-1 hover:bg-muted rounded-full transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                      hasActiveFilters 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    {hasActiveFilters && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider - hidden on settings tab */}
          <AnimatePresence>
            {activeTab !== 'settings' && (
              <motion.div 
                className="mx-3 h-px bg-border/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            )}
          </AnimatePresence>

          {/* Navigation row */}
          <div className="relative flex items-center justify-around py-2 px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className="relative flex items-center justify-center w-12 h-12 transition-all duration-200"
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-1 rounded-xl bg-primary/15 dark:bg-primary/25"
                      layoutId="activeTab"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon 
                    className={`relative z-10 transition-all duration-200 ${
                      isActive 
                        ? 'w-6 h-6 text-primary' 
                        : 'w-5 h-5 text-muted-foreground'
                    }`} 
                  />
                </button>
              );
            })}

            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className="relative flex items-center justify-center w-12 h-12 transition-all duration-200 group"
            >
              <motion.div
                initial={false}
                animate={{ rotate: isDarkMode ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                ) : (
                  <Moon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </motion.div>
            </button>
          </div>
        </div>
      </motion.nav>

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
              className="fixed bottom-28 right-4 left-4 z-50 bg-background/95 dark:bg-card/95 backdrop-blur-2xl rounded-3xl p-5 max-h-[60vh] overflow-y-auto border border-white/20 dark:border-white/10"
              style={{
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
              }}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
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
