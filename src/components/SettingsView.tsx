import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Info, Sun, Moon, Smartphone, MessageSquare, Send, Crown, RotateCcw, LogIn, LogOut, User, Edit, Trash2, AlertTriangle, Loader2, Heart, ChevronRight } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchases } from '@/hooks/usePurchases';
import { useFavorites } from '@/hooks/useFavorites';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import logo from '@/assets/dialroad-logo-new-icon.png';
import { Capacitor } from '@capacitor/core';
import { ImportCentersButton } from './ImportCentersButton';
import { ProfileEditDialog } from './ProfileEditDialog';
import { supabase } from '@/integrations/supabase/client';
declare const __BUILD_ID__: string;
declare const __BUILD_TIME__: string;

type ThemeOption = 'light' | 'dark' | 'system';

interface SettingsViewProps {
  onShowFavorites?: () => void;
}

export function SettingsView({ onShowFavorites }: SettingsViewProps) {
  const navigate = useNavigate();
  const { centers, isPremium } = useApp();
  const { user, profile, signOut, isLoading: authLoading } = useAuth();
  const { offerings, purchasePackage, restorePurchases, isLoading: purchaseLoading } = usePurchases();
  const { favorites } = useFavorites();
  const { theme, setTheme } = useTheme();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Disconnesso con successo');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Errore durante l\'eliminazione');
      }

      toast.success('Account eliminato con successo');
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Errore durante l\'eliminazione dell\'account');
    } finally {
      setIsDeleting(false);
      setDeleteAccountOpen(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!user) {
      toast.info('Accedi per ripristinare gli acquisti');
      navigate('/auth');
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      toast.info('Ripristino disponibile solo sull\'app mobile');
      return;
    }
    
    setIsRestoring(true);
    
    try {
      console.log('Starting restore purchases...');
      const success = await Promise.race([
        restorePurchases(),
        new Promise<false>((resolve) => setTimeout(() => resolve(false), 30000)) // 30s timeout
      ]);
      
      console.log('Restore result:', success);
      
      if (success) {
        toast.success('🎉 Acquisti ripristinati! Stato Premium attivo.');
        window.location.reload();
      } else {
        toast.info('Nessun acquisto precedente trovato per questo account');
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      toast.error('Errore durante il ripristino. Riprova più tardi.');
    } finally {
      console.log('Restore complete, resetting state');
      setIsRestoring(false);
    }
  };

  const handlePurchasePremium = async () => {
    console.log('🛍️ handlePurchasePremium clicked');
    console.log('🛍️ User:', !!user);
    console.log('🛍️ Is native:', Capacitor.isNativePlatform());
    console.log('🛍️ Offerings:', JSON.stringify(offerings, null, 2));
    
    if (!user) {
      toast.info('Accedi per acquistare Premium');
      navigate('/auth');
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      toast.info('Acquisti disponibili solo sull\'app mobile');
      return;
    }

    // Find the default offering and annual package
    const defaultOffering = offerings.find(o => o.identifier === 'default');
    console.log('🛍️ Default offering:', JSON.stringify(defaultOffering, null, 2));
    
    // Package identifier from RevenueCat: $rc_annual
    const annualPackage = defaultOffering?.availablePackages.find(p => p.identifier === '$rc_annual');
    console.log('🛍️ Annual package:', JSON.stringify(annualPackage, null, 2));

    if (!annualPackage) {
      toast.error('Pacchetto non disponibile. Riprova più tardi.');
      console.error('🛍️ Annual package not found in offerings:', offerings);
      return;
    }

    setIsPurchasing(true);
    console.log('🛍️ Starting purchase flow...', annualPackage);
    
    try {
      const success = await Promise.race([
        purchasePackage(annualPackage),
        new Promise<false>((resolve) => setTimeout(() => resolve(false), 60000)) // 60s timeout
      ]);
      
      console.log('🛍️ Purchase result:', success);
      
      if (success) {
        toast.success('🎉 Benvenuto in Premium! Tutti i banner sono stati rimossi.');
        window.location.reload();
      } else if (!success) {
        // User cancelled or timeout - don't show error
        console.log('🛍️ Purchase not completed');
      }
    } catch (error) {
      console.error('🛍️ Purchase error:', error);
      toast.error('Errore durante l\'acquisto. Riprova.');
    } finally {
      console.log('🛍️ Purchase flow complete, resetting state');
      setIsPurchasing(false);
    }
  };

  // Get price from offerings if available
  const defaultOffering = offerings.find(o => o.identifier === 'default');
  const annualPackage = defaultOffering?.availablePackages.find(p => p.identifier === '$rc_annual');
  const priceString = annualPackage?.product?.priceString || '€12,99/anno';

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
      {/* User Profile Card */}
      <motion.div
        className="glass-card rounded-xl p-4 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile?.display_name || user.email?.split('@')[0]}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                {isPremium && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                    <Crown className="w-3 h-3" />
                    Premium
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-2"
                  onClick={() => setProfileEditOpen(true)}
                >
                  <Edit className="w-4 h-4" />
                  Modifica Profilo
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Esci
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDeleteAccountOpen(true)}
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                Elimina Account
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-4 w-full text-left"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Accedi al tuo account</h3>
              <p className="text-sm text-muted-foreground">Gestisci il tuo profilo e lo stato Premium</p>
            </div>
          </button>
        )}
      </motion.div>

      {/* Premium Card */}
      <motion.div
        className={`rounded-xl p-4 mb-4 ${
          isPremium 
            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30'
            : 'bg-gradient-to-r from-amber-500 to-orange-500'
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
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
        
        {!isPremium && (
          <div className="mt-4 space-y-2">
            {/* Price display */}
            {Capacitor.isNativePlatform() && (
              <div className="text-center py-1">
                <span className="text-lg font-bold text-white">{priceString}</span>
                <span className="text-white/70 text-xs ml-1">/ anno</span>
              </div>
            )}
            <button
              onClick={handlePurchasePremium}
              disabled={isPurchasing || purchaseLoading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-white text-amber-600 hover:bg-white/90 shadow-lg disabled:opacity-70"
            >
              {isPurchasing || purchaseLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Elaborazione...
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  Attiva Premium
                </>
              )}
            </button>
          </div>
        )}
        
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
      </motion.div>

      {/* Favorites Section */}
      <motion.div
        className="glass-card rounded-xl p-4 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <button
          onClick={onShowFavorites}
          className="flex items-center gap-4 w-full text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">I miei Preferiti</h3>
            <p className="text-sm text-muted-foreground">
              {user 
                ? `${favorites.length} ${favorites.length === 1 ? 'centro salvato' : 'centri salvati'}`
                : 'Accedi per vedere i preferiti'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Theme Selector */}
      <motion.div
        className="glass-card rounded-xl p-4 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
        transition={{ delay: 0.15 }}
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
        transition={{ delay: 0.2 }}
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
            <span className="text-foreground font-medium">1.5.0</span>
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
        transition={{ delay: 0.25 }}
      >
        <img src={logo} alt="DialRoad" className="w-24 h-24 object-contain mb-3" />
        <p className="text-sm font-display font-semibold gradient-text">DialRoad</p>
        <p className="text-xs text-muted-foreground mt-1">Versione 1.5.0</p>
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

      {/* Profile Edit Dialog */}
      <ProfileEditDialog 
        open={profileEditOpen} 
        onOpenChange={setProfileEditOpen} 
      />

      {/* Delete Account Confirmation */}
      <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Elimina Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione è irreversibile. Verranno eliminati permanentemente:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Il tuo profilo e le impostazioni</li>
                <li>I centri salvati nei preferiti</li>
                <li>Le tue recensioni</li>
                <li>La tua foto profilo</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminazione...' : 'Elimina Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
