import { motion } from 'framer-motion';
import { Map, List, Settings, Moon, Sun } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

type TabType = 'map' | 'list' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { isDarkMode, toggleDarkMode } = useApp();

  const tabs = [
    { id: 'map' as TabType, icon: Map, label: 'Mappa' },
    { id: 'list' as TabType, icon: List, label: 'Lista' },
    { id: 'settings' as TabType, icon: Settings, label: 'Impostazioni' },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-30 px-5 pb-safe-area-bottom"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
    >
      <div 
        className="rounded-[28px] mb-4 overflow-hidden relative bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-white/60 dark:border-white/10"
        style={{
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="relative flex items-center justify-around py-3 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center py-2 px-5 transition-all duration-200"
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-1 rounded-2xl bg-primary/10 dark:bg-primary/20"
                    layoutId="activeTab"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon 
                  className={`relative z-10 w-5 h-5 mb-1 transition-all duration-200 ${
                    isActive ? 'text-primary scale-110' : 'text-muted-foreground'
                  }`} 
                />
                <span 
                  className={`relative z-10 text-[11px] font-semibold transition-all duration-200 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            className="relative flex flex-col items-center py-2 px-4 transition-all duration-200 group"
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
            <span className="relative z-10 text-[11px] font-semibold text-muted-foreground mt-1 group-hover:text-primary transition-colors">
              {isDarkMode ? 'Chiaro' : 'Scuro'}
            </span>
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
