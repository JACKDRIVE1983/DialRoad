import { motion } from 'framer-motion';
import { Map, List, User, Moon, Sun } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import bottomNavBg from '@/assets/bottom-nav-bg.png';

type TabType = 'map' | 'list' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { isDarkMode, toggleDarkMode } = useApp();

  const tabs = [
    { id: 'map' as TabType, icon: Map, label: 'Mappa' },
    { id: 'list' as TabType, icon: List, label: 'Lista' },
    { id: 'profile' as TabType, icon: User, label: 'Profilo' },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-safe-area-bottom"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
    >
      <div 
        className="rounded-2xl mb-2 overflow-hidden relative"
        style={{
          boxShadow: '0 -4px 32px rgba(16, 185, 129, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}
      >
        {/* Background image */}
        <img
          src={bottomNavBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay for better icon visibility */}
        <div className="absolute inset-0 bg-white/60 dark:bg-black/50 backdrop-blur-sm" />
        
        <div className="relative flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className="relative flex flex-col items-center py-2 px-6 transition-colors"
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-primary/15"
                      layoutId="activeTab"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon 
                    className={`relative z-10 w-6 h-6 mb-1 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`} 
                  />
                  <span 
                    className={`relative z-10 text-xs font-medium transition-colors ${
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
            className="relative flex flex-col items-center py-2 px-4 transition-colors"
          >
            <motion.div
              initial={false}
              animate={{ rotate: isDarkMode ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isDarkMode ? (
                <Sun className="w-6 h-6 text-muted-foreground" />
              ) : (
                <Moon className="w-6 h-6 text-muted-foreground" />
              )}
            </motion.div>
            <span className="text-xs font-medium text-muted-foreground mt-1">
              {isDarkMode ? 'Chiaro' : 'Scuro'}
            </span>
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
