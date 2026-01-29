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
    { id: 'map' as TabType, icon: Map },
    { id: 'list' as TabType, icon: List },
    { id: 'settings' as TabType, icon: Settings },
  ];

  return (
    <motion.nav
      className="fixed bottom-[4.5rem] left-0 right-0 z-30 p-4"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
    >
      <div 
        className="mx-auto max-w-xs rounded-[24px] overflow-hidden bg-white/90 dark:bg-card/90 backdrop-blur-2xl border border-white/60 dark:border-white/10"
        style={{
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
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
  );
}
