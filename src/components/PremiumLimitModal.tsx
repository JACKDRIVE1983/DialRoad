import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Crown, Lock, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PremiumLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumLimitModal({ open, onOpenChange }: PremiumLimitModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleUpgrade = () => {
    if (!user) {
      // Not logged in - redirect to auth page
      onOpenChange(false);
      navigate('/auth');
      return;
    }
    // TODO: Implement actual in-app purchase for logged in users
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-display">
            Limite Giornaliero Raggiunto
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground pt-2">
            {user 
              ? 'Passa alla versione Premium per sbloccare tutti i 967 centri e navigare senza limiti!'
              : 'Accedi o registrati per sbloccare tutte le funzionalità e rimuovere i limiti giornalieri.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          {/* Premium benefits */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/30">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Vantaggi Premium
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Accesso illimitato a tutti i 967 centri
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Ricerche senza limiti
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Nessuna pubblicità
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Possibilità di scrivere recensioni
              </li>
            </ul>
          </div>

          {/* Upgrade/Login button */}
          <button
            onClick={handleUpgrade}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-base shadow-lg shadow-amber-500/30 hover:shadow-xl hover:from-amber-400 hover:to-orange-400 transition-all duration-200 active:scale-[0.98]"
          >
            {user ? (
              <>
                <Crown className="w-5 h-5" />
                <span>Passa a Premium</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Accedi o Registrati</span>
              </>
            )}
          </button>

          {/* Later button */}
          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Magari più tardi
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
