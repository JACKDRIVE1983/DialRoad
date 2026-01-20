import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Heart, Star, Settings, ChevronRight, LogOut, Camera, Loader2, LogIn, MapPin, X, Info, UserCog, Trash2, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useReviews } from '@/hooks/useReviews';
import { toast } from 'sonner';
import logo from '@/assets/dialroad-logo-transparent.png';

export function ProfileView() {
  const navigate = useNavigate();
  const { centers, setSelectedCenter } = useApp();
  const { user, profile, isAuthenticated, isLoading, signOut, uploadAvatar, updatePassword, deleteAccount } = useAuth();
  const { favorites, isLoading: favoritesLoading } = useFavorites();
  const { userReviewsCount } = useReviews();
  
  const [isUploading, setIsUploading] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const favoriteCenters = centers.filter(c => favorites.includes(c.id));

  const handleAvatarClick = () => {
    if (isAuthenticated) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Seleziona un file immagine');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'immagine deve essere inferiore a 5MB');
      return;
    }

    setIsUploading(true);
    const { error } = await uploadAvatar(file);
    setIsUploading(false);

    if (error) {
      toast.error('Errore nel caricamento dell\'avatar');
    } else {
      toast.success('Avatar aggiornato!');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Disconnesso');
  };

  const handleOpenCenter = (centerId: string) => {
    const center = centers.find(c => c.id === centerId);
    if (center) {
      setSelectedCenter(center);
      setShowFavorites(false);
    }
  };

  const menuItems = [
    { 
      icon: Heart, 
      label: 'Centri Preferiti', 
      value: isAuthenticated ? favorites.length.toString() : '0', 
      color: 'text-red-500',
      onClick: () => isAuthenticated ? setShowFavorites(true) : navigate('/auth')
    },
    { 
      icon: Star, 
      label: 'Le Mie Recensioni', 
      value: isAuthenticated ? userReviewsCount.toString() : '0', 
      color: 'text-yellow-500',
      onClick: () => !isAuthenticated && navigate('/auth')
    },
    { 
      icon: Settings, 
      label: 'Impostazioni', 
      value: '', 
      color: 'text-muted-foreground', 
      onClick: () => setShowSettings(true) 
    },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Settings View
  if (showSettings) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            Impostazioni
          </h2>
          <button
            onClick={() => setShowSettings(false)}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Account Management */}
          {isAuthenticated && (
            <motion.div
              className="glass-card rounded-xl p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Gestione Account</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Lock className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Cambia Password</span>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground ml-auto transition-transform ${showPasswordForm ? 'rotate-90' : ''}`} />
                </button>

                {showPasswordForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl bg-muted/50 space-y-3"
                  >
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Nuova password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Conferma password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <button
                      onClick={async () => {
                        const next = newPassword.trim();
                        const confirm = confirmPassword.trim();

                        if (next.length < 6) {
                          toast.error('La password deve essere di almeno 6 caratteri');
                          return;
                        }
                        if (next !== confirm) {
                          toast.error('Le password non corrispondono');
                          return;
                        }

                        setIsUpdatingPassword(true);
                        const { error } = await updatePassword(next);
                        setIsUpdatingPassword(false);

                        if (error) {
                          const msg = error.message || '';
                          if (msg.includes('different from the old password') || msg.includes('same_password')) {
                            toast.error('La nuova password deve essere diversa da quella attuale');
                          } else if (msg.includes('Not authenticated')) {
                            toast.error('Sessione scaduta: fai logout e login e riprova');
                          } else {
                            toast.error('Errore nel cambio password', { description: msg });
                          }
                        } else {
                          toast.success('Password aggiornata con successo!');
                          setNewPassword('');
                          setConfirmPassword('');
                          setShowPasswordForm(false);
                        }
                      }}
                      disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUpdatingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Aggiornamento...
                        </>
                      ) : (
                        'Aggiorna Password'
                      )}
                    </button>
                  </motion.div>
                )}

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="font-medium">Elimina account</span>
                </button>

                {/* Delete confirmation dialog */}
                {showDeleteConfirm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-background rounded-2xl p-6 max-w-sm w-full shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-lg font-bold text-foreground mb-2">Elimina account</h3>
                      <p className="text-muted-foreground text-sm mb-6">
                        Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile e tutti i tuoi dati (preferiti, recensioni, profilo) saranno eliminati permanentemente.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
                        >
                          Annulla
                        </button>
                        <button
                          onClick={async () => {
                            setIsDeletingAccount(true);
                            const { error } = await deleteAccount();
                            setIsDeletingAccount(false);
                            setShowDeleteConfirm(false);
                            if (error) {
                              toast.error('Errore durante l\'eliminazione dell\'account');
                            } else {
                              toast.success('Account eliminato con successo');
                              navigate('/');
                            }
                          }}
                          disabled={isDeletingAccount}
                          className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isDeletingAccount ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Eliminazione...
                            </>
                          ) : (
                            'Elimina'
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* App Info */}
          <motion.div
            className="glass-card rounded-xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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
        </div>
      </div>
    );
  }

  // Favorites Modal
  if (showFavorites) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            Centri Preferiti
          </h2>
          <button
            onClick={() => setShowFavorites(false)}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {favoriteCenters.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nessun centro salvato</p>
            <p className="text-sm text-muted-foreground mt-2">
              Tocca il cuore su un centro per salvarlo
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favoriteCenters.map((center) => (
              <motion.button
                key={center.id}
                onClick={() => handleOpenCenter(center.id)}
                className="w-full glass-card rounded-xl p-4 flex items-center gap-4 text-left hover:scale-[1.02] transition-transform"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{center.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="truncate">{center.city}, {center.region}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
      {/* Hidden file input - gallery only, no camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <motion.div
        className="glass-card rounded-3xl p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar */}
          <div className="relative">
            <button
              onClick={handleAvatarClick}
              disabled={isUploading || !isAuthenticated}
              className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center glow-effect overflow-hidden relative group disabled:cursor-default"
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-primary-foreground" />
              )}
              
              {isAuthenticated && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              )}
            </button>
            {isAuthenticated && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-background" />
            )}
          </div>

          {/* User info */}
          <div className="flex-1">
            {isAuthenticated ? (
              <>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">
                  {profile?.display_name || 'Utente'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {user?.email || 'email@example.com'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">
                  Ospite
                </h2>
                <button
                  onClick={() => navigate('/auth')}
                  className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                >
                  <LogIn className="w-4 h-4" />
                  Accedi o registrati
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{centers.length}</p>
            <p className="text-xs text-muted-foreground">Centri</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{isAuthenticated ? favorites.length : 0}</p>
            <p className="text-xs text-muted-foreground">Preferiti</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{isAuthenticated ? userReviewsCount : 0}</p>
            <p className="text-xs text-muted-foreground">Recensioni</p>
          </div>
        </div>
      </motion.div>

      {/* Menu */}
      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              onClick={item.onClick}
              className="w-full glass-card rounded-xl p-4 flex items-center justify-between group hover:scale-[1.02] transition-transform"
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0 }
              }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.value && (
                  <span className="text-sm text-muted-foreground">{item.value}</span>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Logout button or Login button */}
      {isAuthenticated ? (
        <motion.button
          onClick={handleSignOut}
          className="w-full mt-6 glass-card rounded-xl p-4 flex items-center gap-4 text-destructive hover:bg-destructive/10 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="font-medium">Esci</span>
        </motion.button>
      ) : (
        <motion.button
          onClick={() => navigate('/auth')}
          className="w-full mt-6 glass-card rounded-xl p-4 flex items-center gap-4 text-primary hover:bg-primary/10 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LogIn className="w-5 h-5" />
          </div>
          <span className="font-medium">Accedi</span>
        </motion.button>
      )}

      {/* App info */}
      <motion.div
        className="mt-8 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <img src={logo} alt="DialRoad" className="w-24 h-24 object-contain mb-3" />
        <p className="text-sm font-display font-semibold gradient-text">DialRoad</p>
        <p className="text-xs text-muted-foreground mt-1">Versione 1.0.0</p>
      </motion.div>
    </div>
  );
}
