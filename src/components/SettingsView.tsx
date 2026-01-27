import { motion } from 'framer-motion';
import { Info, Sun, Moon, Smartphone } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useApp } from '@/contexts/AppContext';
import logo from '@/assets/dialroad-logo-transparent.png';

declare const __BUILD_ID__: string;

type ThemeOption = 'light' | 'dark' | 'system';

export function SettingsView() {
  const { centers } = useApp();
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: ThemeOption; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Chiaro', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Scuro', icon: <Moon className="w-4 h-4" /> },
    { value: 'system', label: 'Sistema', icon: <Smartphone className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
      {/* Theme Selector */}
      <motion.div
        className="glass-card rounded-xl p-4 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sun className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Tema</h3>
            <p className="text-sm text-muted-foreground">Personalizza l'aspetto dell'app</p>
          </div>
        </div>
        <div className="flex gap-2">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all duration-200 ${
                theme === option.value
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {option.icon}
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* App Info */}
      <motion.div
        className="glass-card rounded-xl p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Info className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Informazioni App</h3>
            <p className="text-sm text-muted-foreground">Dettagli su DialRoad</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Versione</span>
            <span className="text-foreground font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Centri dialisi</span>
            <span className="text-foreground font-medium">{centers.length}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Contatto</span>
            <a href="mailto:giacomo748@gmail.com" className="text-primary font-medium">
              giacomo748@gmail.com
            </a>
          </div>
        </div>
      </motion.div>

      {/* App logo */}
      <motion.div
        className="mt-8 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <img src={logo} alt="DialRoad" className="w-24 h-24 object-contain mb-3" />
        <p className="text-sm font-display font-semibold gradient-text">DialRoad</p>
        <p className="text-xs text-muted-foreground mt-1">Versione 1.0.0</p>
        <p className="text-[11px] text-muted-foreground mt-1">build {__BUILD_ID__}</p>
      </motion.div>
    </div>
  );
}
