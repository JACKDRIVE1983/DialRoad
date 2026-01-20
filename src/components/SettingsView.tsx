import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import logo from '@/assets/dialroad-logo-transparent.png';

declare const __BUILD_ID__: string;

export function SettingsView() {
  const { centers } = useApp();

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
      {/* App Info */}
      <motion.div
        className="glass-card rounded-xl p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Info className="w-5 h-5 text-blue-500" />
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
