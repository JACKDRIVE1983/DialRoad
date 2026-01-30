import { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, Sun, Moon, Smartphone, MessageSquare, Send, Crown, RotateCcw, Database } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import logo from '@/assets/dialroad-logo-new-icon.png';
import { Capacitor } from '@capacitor/core';
import { ImportCentersButton } from './ImportCentersButton';

declare const __BUILD_ID__: string;
declare const __BUILD_TIME__: string;

type ThemeOption = 'light' | 'dark' | 'system';

export function SettingsView() {
  const { centers, isPremium, togglePremium, setPremium } = useApp();
  const { theme, setTheme } = useTheme();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSimulatePremium = () => {
    togglePremium();
    toast.success(
      isPremium 
        ? 'Stato Premium disattivato' 
        : '🎉 Acquisto Premium simulato con successo!'
    );
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    
    try {
      // TODO: Integrate with RevenueCat or Capacitor-InAppPurchase
      // For now, simulate the restore check
      // In production, this will call the actual IAP plugin:
      // const purchases = await Purchases.restorePurchases();
      // const hasPremium = purchases.entitlements.active['premium'] !== undefined;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check localStorage for previous purchase (placeholder logic)
      const hasPreviousPurchase = localStorage.getItem('dialroad_premium_purchased') === 'true';
      
      if (hasPreviousPurchase) {
        setPremium(true);
        toast.success('Acquisto ripristinato con successo!');
      } else {
        toast.info('Nessun acquisto precedente trovato per questo account');
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      toast.error('Errore durante il ripristino. Riprova più tardi.');
    } finally {
      setIsRestoring(false);
    }
  };

  const themeOptions: { value: ThemeOption; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Chiaro', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Scuro', icon: <Moon className="w-4 h-4" /> },
    { value: 'system', label: 'Sistema', icon: <Smartphone className="w-4 h-4" /> },
  ];

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) {
      toast.error('Scrivi un messaggio prima di inviare');
      return;
    }

    const subject = encodeURIComponent('Feedback DialRoad');
    const body = encodeURIComponent(feedbackText);
    window.open(`mailto:giacomo748@gmail.com?subject=${subject}&body=${body}`, '_blank');
    
    setFeedbackText('');
    setFeedbackOpen(false);
    toast.success('App email aperta con il tuo feedback');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
      {/* Premium Card - Top Position */}
      <motion.div
        className={`rounded-xl p-4 mb-4 ${
          isPremium 
            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30'
            : 'bg-gradient-to-r from-amber-500 to-orange-500'
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isPremium ? 'bg-amber-500/30' : 'bg-white/20'
          }`}>
            <Crown className={`w-6 h-6 ${isPremium ? 'text-amber-500' : 'text-white'}`} />
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold ${isPremium ? 'text-foreground' : 'text-white'}`}>
              {isPremium ? 'Premium Attivo' : 'Passa a Premium'}
            </h3>
            <p className={`text-sm ${isPremium ? 'text-muted-foreground' : 'text-white/80'}`}>
              {isPremium ? 'Hai accesso a tutte le funzionalità' : 'Sblocca recensioni e rimuovi le pubblicità'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSimulatePremium}
          className={`w-full mt-4 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isPremium
              ? 'bg-muted/50 text-muted-foreground hover:bg-muted'
              : 'bg-white text-amber-600 hover:bg-white/90 shadow-lg'
          }`}
        >
          <Crown className="w-4 h-4" />
          {isPremium ? 'Disattiva Premium (Test)' : 'Attiva Premium'}
        </button>
        
        {/* Restore Purchases Button */}
        <button
          onClick={handleRestorePurchases}
          disabled={isRestoring}
          className={`w-full mt-2 py-2 px-4 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isPremium
              ? 'text-muted-foreground hover:text-foreground'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <RotateCcw className={`w-3 h-3 ${isRestoring ? 'animate-spin' : ''}`} />
          {isRestoring ? 'Ripristino in corso...' : 'Ripristina Acquisti'}
        </button>
        
        <p className="text-[10px] text-center mt-2 opacity-60 text-white">
          Pulsante test - v1.4
        </p>
      </motion.div>

      {/* Theme Selector */}
      <motion.div
        className="glass-card rounded-xl p-4 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
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


      {/* Send Feedback */}
      <motion.div
        className="glass-card rounded-xl p-4 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <button
          onClick={() => setFeedbackOpen(true)}
          className="flex items-center gap-4 w-full text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Invia Feedback</h3>
            <p className="text-sm text-muted-foreground">Contatta direttamente lo sviluppatore</p>
          </div>
        </button>
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
            <span className="text-foreground font-medium">1.4.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Build ID</span>
            <span className="text-foreground font-medium font-mono text-xs">{__BUILD_ID__}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Build time</span>
            <span className="text-foreground font-medium font-mono text-xs">{__BUILD_TIME__}</span>
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

        {/* Admin: Import Centers Button (dev only) */}
        {!Capacitor.isNativePlatform() && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Admin (solo sviluppo):</p>
            <ImportCentersButton />
          </div>
        )}
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
        <p className="text-xs text-muted-foreground mt-1">Versione 1.4.0</p>
        <p className="text-[11px] text-muted-foreground mt-1 font-mono">build {__BUILD_ID__}</p>
        <p className="text-[11px] text-muted-foreground mt-1 font-mono">{__BUILD_TIME__}</p>
        
      </motion.div>

      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Invia Feedback
            </DialogTitle>
            <DialogDescription>
              Scrivi i tuoi suggerimenti, segnala bug o condividi le tue impressioni sull'app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="feedback">Il tuo messaggio</Label>
              <Textarea
                id="feedback"
                placeholder="Scrivi qui il tuo feedback..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {feedbackText.length}/1000
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setFeedbackOpen(false)}
                className="flex-1"
              >
                Annulla
              </Button>
              <Button
                onClick={handleSendFeedback}
                className="flex-1 gap-2"
                disabled={!feedbackText.trim()}
              >
                <Send className="w-4 h-4" />
                Invia
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
