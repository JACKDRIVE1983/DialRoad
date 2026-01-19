import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { User, Heart, Star, Settings, ChevronRight, Bell, Shield, HelpCircle, LogOut, Camera, Loader2, LogIn, MapPin, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useReviews } from '@/hooks/useReviews';
import { toast } from 'sonner';
import logo from '@/assets/dialmap-logo.png';

export function ProfileView() {
  const navigate = useNavigate();
  const { centers, setSelectedCenter } = useApp();
  const { user, profile, isAuthenticated, isLoading, signOut, uploadAvatar } = useAuth();
  const { favorites, isLoading: favoritesLoading } = useFavorites();
  const { userReviewsCount } = useReviews();
  
  const [isUploading, setIsUploading] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
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
    { icon: Bell, label: 'Notifiche', value: '', color: 'text-accent', onClick: () => {} },
    { icon: Shield, label: 'Privacy', value: '', color: 'text-green-500', onClick: () => setShowPrivacy(true) },
    { icon: HelpCircle, label: 'Aiuto & Supporto', value: '', color: 'text-primary', onClick: () => setShowHelp(true) },
    { icon: Settings, label: 'Impostazioni', value: '', color: 'text-muted-foreground', onClick: () => {} },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Help & Support Modal
  if (showHelp) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Aiuto & Supporto
          </h2>
          <button
            onClick={() => setShowHelp(false)}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-4">
          <p className="text-foreground leading-relaxed">
            DialMap ti aiuta a trovare rapidamente i centri dialisi in tutta Italia tramite una mappa interattiva. Puoi cercare per zona o località e consultare informazioni utili come indirizzo, contatti e dettagli principali della struttura.
          </p>
          <p className="text-foreground leading-relaxed">
            È pensata per le persone in dialisi che vogliono organizzare una vacanza o uno spostamento con più serenità: ti permette di individuare in anticipo i centri disponibili vicino alla tua destinazione e avere a portata di mano i riferimenti necessari per richiedere informazioni e pianificare il trattamento.
          </p>
          
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">Contatto supporto:</p>
            <a 
              href="mailto:giacomo748@gmail.com"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              <Mail className="w-4 h-4" />
              giacomo748@gmail.com
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Privacy Policy Modal
  if (showPrivacy) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Privacy Policy
          </h2>
          <button
            onClick={() => setShowPrivacy(false)}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-6 text-sm">
          <section>
            <h3 className="font-bold text-foreground mb-2">1) Titolare del trattamento</h3>
            <p className="text-muted-foreground">
              Email: <a href="mailto:giacomo748@gmail.com" className="text-primary hover:underline">giacomo748@gmail.com</a>
            </p>
          </section>

          <section>
            <h3 className="font-bold text-foreground mb-2">2) Scopo dell'app</h3>
            <p className="text-muted-foreground leading-relaxed">
              DialMap permette di individuare su mappa i centri dialisi in Italia e consultare informazioni utili (indirizzo, contatti e dettagli della struttura) per aiutare le persone in dialisi a organizzare spostamenti e vacanze.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-foreground mb-2">3) Uso senza login</h3>
            <p className="text-muted-foreground leading-relaxed">
              L'app è utilizzabile anche senza registrazione: mappa e consultazione dei centri sono disponibili a tutti.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-foreground mb-2">4) Dati raccolti</h3>
            <div className="space-y-3 text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">A) Dati account (solo se l'utente vuole recensire)</p>
                <p className="leading-relaxed">Per pubblicare recensioni è necessario accedere/registrarsi. In questo caso possiamo trattare: Email (o identificativo dell'account), ID utente (tecnico), eventuale nome/alias se previsto. Le credenziali sono gestite in modo sicuro dal sistema di autenticazione utilizzato (password non salvate in chiaro).</p>
              </div>
              <div>
                <p className="font-medium text-foreground">B) Contenuti pubblicati</p>
                <p className="leading-relaxed">Recensione, valutazione, commenti e data/ora di pubblicazione. Attenzione: le recensioni possono essere visibili ad altri utenti nell'app.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">C) Dati tecnici (eventuali)</p>
                <p className="leading-relaxed">Dati tecnici minimi (es. versione app, log di errore) solo per sicurezza e funzionamento.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">D) Posizione (facoltativa)</p>
                <p className="leading-relaxed">Se l'utente concede il permesso, la posizione può essere usata solo per mostrare i centri più vicini. In alternativa la ricerca resta manuale.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">E) Dati sanitari</p>
                <p className="leading-relaxed">DialMap non raccoglie dati sanitari o clinici.</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-foreground mb-2">5) Finalità del trattamento</h3>
            <ul className="text-muted-foreground list-disc list-inside space-y-1">
              <li>Visualizzazione mappa e ricerca centri dialisi</li>
              <li>Pubblicazione e gestione recensioni (solo per utenti registrati)</li>
              <li>Moderazione e prevenzione abusi/spam nelle recensioni</li>
              <li>Sicurezza, manutenzione e miglioramento dell'app</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-foreground mb-2">6) Base giuridica</h3>
            <ul className="text-muted-foreground list-disc list-inside space-y-1">
              <li>Esecuzione del servizio (account e recensioni richieste dall'utente)</li>
              <li>Consenso per la posizione (se attivata)</li>
              <li>Legittimo interesse per sicurezza e moderazione (anti-spam, abusi)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-foreground mb-2">7) Condivisione dei dati</h3>
            <p className="text-muted-foreground leading-relaxed">
              I dati possono essere trattati da fornitori tecnici necessari al funzionamento (es. mappe, autenticazione, hosting). DialMap non vende dati personali a terzi.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-foreground mb-2">8) Conservazione</h3>
            <ul className="text-muted-foreground list-disc list-inside space-y-1">
              <li>Dati account e recensioni: finché l'account resta attivo o finché necessario per il servizio e la moderazione.</li>
              <li>Log tecnici (se presenti): per un tempo limitato e proporzionato.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-foreground mb-2">9) Eliminazione account e recensioni</h3>
            <p className="text-muted-foreground leading-relaxed">
              L'utente può richiedere la cancellazione dell'account e dei dati associati (incluse le recensioni, salvo obblighi di legge o esigenze di sicurezza) scrivendo a: <a href="mailto:giacomo748@gmail.com" className="text-primary hover:underline">giacomo748@gmail.com</a>. Se presente, è disponibile la funzione "Elimina account" nelle impostazioni dell'app.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-foreground mb-2">10) Diritti dell'utente</h3>
            <p className="text-muted-foreground leading-relaxed">
              Accesso, rettifica, cancellazione, limitazione, opposizione e portabilità (ove applicabile) ai sensi del GDPR. Contatto: <a href="mailto:giacomo748@gmail.com" className="text-primary hover:underline">giacomo748@gmail.com</a>
            </p>
          </section>

          <section>
            <h3 className="font-bold text-foreground mb-2">11) Modifiche</h3>
            <p className="text-muted-foreground leading-relaxed">
              La presente informativa può essere aggiornata. La data di aggiornamento è indicata in alto.
            </p>
          </section>
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
        <img src={logo} alt="DialMap" className="w-12 h-12 rounded-xl mb-3" />
        <p className="text-sm font-display font-semibold gradient-text">DialMap</p>
        <p className="text-xs text-muted-foreground mt-1">Versione 1.0.0</p>
      </motion.div>
    </div>
  );
}
