import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Crown, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface WelcomePremiumModalProps {
  isPremium: boolean;
}

export function WelcomePremiumModal({ isPremium }: WelcomePremiumModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if we should show the welcome modal
    if (isPremium) {
      const hasSeenWelcome = localStorage.getItem('dialroad-premium-welcome-shown');
      if (!hasSeenWelcome) {
        // Small delay for better UX
        const timer = setTimeout(() => {
          setOpen(true);
          localStorage.setItem('dialroad-premium-welcome-shown', 'true');
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isPremium]);

  if (!isPremium) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-md border-amber-500/30 bg-gradient-to-b from-background to-amber-50/30 dark:to-amber-950/20">
        <div className="text-center py-4">
          {/* Animated Crown */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/40"
          >
            <Crown className="w-12 h-12 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-display font-bold text-foreground mb-2"
          >
            Benvenuto nella famiglia Premium! 🎉
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-6"
          >
            Ora hai accesso a tutte le funzionalità esclusive
          </motion.p>

          {/* Benefits list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/50 dark:bg-card/50 rounded-xl p-4 mb-6 text-left"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm text-foreground">Navigazione senza pubblicità</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm text-foreground">Ricerche illimitate</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm text-foreground">Accesso a tutti i 967 centri</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm text-foreground">Scrivi e condividi recensioni</span>
              </div>
            </div>
          </motion.div>

          {/* Thank you message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-amber-600 dark:text-amber-400 mb-4"
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            Grazie per supportare DialRoad!
          </motion.p>

          {/* Close button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => setOpen(false)}
            className="w-full py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-base shadow-lg shadow-amber-500/30 hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
          >
            Inizia a esplorare
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
