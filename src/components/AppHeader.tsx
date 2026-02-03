import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, HelpCircle, Crown, Mail, Map, List, Settings, Moon, Sun, Search, SlidersHorizontal, MapPin, User, LogIn } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { regions } from '@/data/mockCenters';
import { Button } from '@/components/ui/button';
import logoIcon from '@/assets/dialroad-logo-new-icon.png';
import { useDebounce } from '@/hooks/useDebounce';
import { showInterstitialAd, canShowInterstitial } from '@/lib/admob';
import { Capacitor } from '@capacitor/core';
import { REGION_COLORS } from '@/lib/regionColors';

type TabType = 'map' | 'list' | 'settings';

interface AppHeaderProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
  isSearchFocused?: boolean;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

export function AppHeader({ activeTab = 'map', onTabChange }: AppHeaderProps) {
  const navigate = useNavigate();
  const { 
    isPremium, 
    isDarkMode,
    toggleDarkMode,
    searchQuery,
    setSearchQuery,
    selectedRegion,
    setSelectedRegion,
    setIsSearchFocused,
    trySearch
  } = useApp();
  const { user, profile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'help' | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const searchTimeoutRef = useRef<number | null>(null);

  // Handle search with limit checking
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }
    
    // Empty value - always allow
    if (!value.trim()) {
      setSearchQuery('');
      return;
    }
    
    // Debounced search with limit check
    searchTimeoutRef.current = window.setTimeout(() => {
      // For non-premium, only count as "search" if there's meaningful input
      if (value.trim().length >= 2) {
        const allowed = trySearch(value);
        if (!allowed) {
          // Revert to previous query if blocked
          setLocalSearchQuery(searchQuery);
        }
      } else {
        setSearchQuery(value);
      }
    }, 300);
  }, [setSearchQuery, trySearch, searchQuery]);

  const handleMenuItemClick = (modal: 'privacy' | 'help') => {
    setIsMenuOpen(false);
    setActiveModal(modal);
  };

  const tabs = [
    { id: 'map' as TabType, icon: Map, label: 'Mappa' },
    { id: 'list' as TabType, icon: List, label: 'Lista' },
    { id: 'settings' as TabType, icon: Settings, label: 'Impostazioni' },
  ];

  const hasActiveFilters = selectedRegion !== 'Tutte le Regioni';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('Tutte le Regioni');
  };

  return (
    <>
      {/* Fixed Top Header */}
      <div className="fixed top-0 left-0 right-0 z-[1000] safe-area-top">
        {/* Primary Bar */}
        <motion.div
          className="bg-white/95 dark:bg-card/95 backdrop-blur-xl border-b border-border/50"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="flex items-center justify-between px-4 py-2">
            {/* Left: Logo + Menu */}
            <div className="flex items-center gap-3">
              <img
                src={logoIcon}
                alt="DialRoad"
                className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
              />
              <span className="font-display font-bold text-sm text-foreground hidden sm:inline">
                DialRoad
              </span>
              
              {/* Menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-muted ml-1 flex-shrink-0"
                aria-label="Menu"
              >
                <AnimatePresence mode="wait">
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-4 h-4 text-foreground" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-4 h-4 text-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {/* Center: Tabs */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      // Show interstitial when clicking "Lista" tab (if not premium)
                      if (tab.id === 'list' && !isPremium && Capacitor.isNativePlatform()) {
                        if (canShowInterstitial()) {
                          console.log('[AppHeader] Lista tab clicked - showing interstitial');
                          showInterstitialAd();
                        }
                      }
                      onTabChange?.(tab.id);
                    }}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Theme + Premium Toggle + Profile/Login */}
            <div className="flex items-center gap-0.5 ml-auto">
              {/* Theme toggle */}
              <button
                onClick={toggleDarkMode}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-muted"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: isDarkMode ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isDarkMode ? (
                    <Sun className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </motion.div>
              </button>

              {/* Premium toggle (dev) */}
              <button
                onClick={() => {
                  const newValue = !isPremium;
                  localStorage.setItem('dialroad-premium-override', newValue ? 'true' : 'false');
                  window.location.reload();
                }}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-lg transition-all duration-200 ${
                  isPremium 
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30' 
                    : 'bg-muted/50 hover:bg-muted border border-border'
                }`}
                title={isPremium ? 'Premium attivo (clicca per disattivare)' : 'Attiva Premium'}
              >
                <Crown className="w-3.5 h-3.5 text-orange-500" />
                <span className={`text-[10px] font-semibold ${isPremium ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                  {isPremium ? 'Pro' : 'Pro'}
                </span>
              </button>

              {/* Profile/Login button */}
              {user ? (
                <button
                  onClick={() => onTabChange?.('settings')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 ${
                    isPremium
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                  ) : (
                    <User className={`w-3 h-3 ${isPremium ? 'text-white' : 'text-primary'}`} />
                  )}
                  {isPremium && (
                    <Crown className="w-2.5 h-2.5 text-white" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 bg-primary/10 hover:bg-primary/20 text-primary"
                >
                  <LogIn className="w-3 h-3" />
                  <span className="font-semibold text-[10px]">Accedi</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Secondary Search Bar - hidden on settings tab */}
        <AnimatePresence>
          {activeTab !== 'settings' && (
            <motion.div
              className="bg-white/90 dark:bg-card/90 backdrop-blur-xl border-b border-border/30 px-4 py-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 bg-muted/50 dark:bg-muted/30 rounded-xl px-3 py-2.5">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Cerca centro o città..."
                  value={localSearchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm min-w-0"
                />
                {localSearchQuery && (
                  <button 
                    onClick={() => {
                      setLocalSearchQuery('');
                      setSearchQuery('');
                    }}
                    className="p-1 hover:bg-muted rounded-full transition-colors flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1.5 rounded-lg transition-colors flex-shrink-0 relative ${
                    hasActiveFilters 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {hasActiveFilters && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute left-4 top-14 z-50"
            >
              <div 
                className="rounded-xl overflow-hidden backdrop-blur-xl min-w-[180px] bg-white dark:bg-card border border-border"
                style={{
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                }}
              >
                <button
                  onClick={() => handleMenuItemClick('privacy')}
                  className="w-full px-4 py-3 flex items-center gap-3 text-foreground hover:bg-muted transition-colors text-left"
                >
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-sm">Privacy</span>
                </button>
                <div className="h-px bg-border" />
                <button
                  onClick={() => handleMenuItemClick('help')}
                  className="w-full px-4 py-3 flex items-center gap-3 text-foreground hover:bg-muted transition-colors text-left"
                >
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">Aiuto & Supporto</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Backdrop for closing menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[1000] bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
            />

            {/* Filter panel */}
            <motion.div
              className="fixed top-28 left-4 right-4 z-[1001] bg-background dark:bg-card backdrop-blur-2xl rounded-2xl p-4 max-h-[70vh] overflow-y-auto border border-border"
              style={{
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
              }}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-display font-bold text-foreground">Filtra per Regione</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-primary text-xs h-7"
                  >
                    Resetta
                  </Button>
                )}
              </div>

              {/* Region filter */}
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  Seleziona Regione
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {regions.map((region) => {
                    const regionColor = region !== 'Tutte le Regioni' ? REGION_COLORS[region] : undefined;
                    return (
                      <button
                        key={region}
                        onClick={() => setSelectedRegion(region)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                          selectedRegion === region
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {regionColor && (
                          <span 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: regionColor }}
                          />
                        )}
                        {region}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Region Legend */}
              <div className="mb-4 pt-3 border-t border-border">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Legenda Colori Regioni
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(REGION_COLORS)
                    .filter(([key]) => !key.includes('-') || key === key.charAt(0).toUpperCase() + key.slice(1))
                    .filter(([key], idx, arr) => arr.findIndex(([k]) => k.toLowerCase() === key.toLowerCase()) === idx)
                    .slice(0, 20)
                    .map(([region, color]) => (
                      <div key={region} className="flex items-center gap-1.5">
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[10px] text-muted-foreground truncate">{region}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Apply button */}
              <Button
                onClick={() => setShowFilters(false)}
                className="w-full h-10 rounded-full bg-primary text-primary-foreground font-semibold"
              >
                Applica
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Privacy Modal */}
      <AnimatePresence>
        {activeModal === 'privacy' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setActiveModal(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-background rounded-2xl shadow-2xl"
            >
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm px-6 py-4 border-b border-border flex items-center justify-between z-10">
                <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  Privacy Policy
                </h2>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-6 text-sm">
                <section>
                  <h3 className="font-bold text-foreground mb-2">1) Titolare del trattamento</h3>
                  <p className="text-muted-foreground">
                    Email: <a href="mailto:giacomo748@gmail.com" className="text-primary hover:underline">giacomo748@gmail.com</a>
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-2">2) Scopo dell'app</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    DialRoad permette di individuare su mappa i centri dialisi in Italia, consultare informazioni utili (indirizzo, contatti e dettagli della struttura) e lasciare recensioni anonime per aiutare le persone in dialisi a organizzare spostamenti e vacanze.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-2">3) Uso senza registrazione</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    L'app è completamente utilizzabile senza registrazione o login. Tutte le funzionalità, incluse la mappa, la consultazione dei centri e la possibilità di lasciare recensioni, sono disponibili a tutti senza creare un account.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-2">4) Dati raccolti</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">A) Posizione GPS (facoltativa)</p>
                      <p className="leading-relaxed">Se l'utente concede il permesso, la posizione viene usata esclusivamente per mostrare i centri più vicini. La posizione non viene salvata sui nostri server. In alternativa la ricerca resta manuale.</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">B) Recensioni e commenti</p>
                      <p className="leading-relaxed">Per lasciare una recensione è sufficiente inserire un nome (a scelta dell'utente), un commento e una valutazione. Questi dati sono pubblici e visibili agli altri utenti. Non raccogliamo email, password o altri dati personali.</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">C) Dati tecnici minimi</p>
                      <p className="leading-relaxed">Utilizziamo localStorage del dispositivo per ricordare preferenze locali (es. centri già recensiti). Questi dati restano solo sul dispositivo e non vengono trasmessi.</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">D) Dati sanitari</p>
                      <p className="leading-relaxed">DialRoad non raccoglie dati sanitari o clinici. Ti invitiamo a non condividere informazioni mediche sensibili nelle recensioni.</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">E) Cookie e Identificatori di Pubblicità (Terze Parti)</p>
                      <p className="leading-relaxed">L'app utilizza identificatori univoci del dispositivo per personalizzare gli annunci pubblicitari tramite il servizio Google AdMob. Questi dati possono includere il tuo ID pubblicitario (IDFA su iOS o AAID su Android) per mostrare inserzioni pertinenti.</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">F) Link di Affiliazione</p>
                      <p className="leading-relaxed">L'app partecipa al programma di affiliazione di Booking.com. Cliccando sul tasto "Hotel nelle vicinanze", verrai reindirizzato al sito di Booking.com. Questo servizio può utilizzare cookie per tracciare la provenienza della prenotazione e attribuire una commissione al titolare dell'app.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-2">5) Finalità del trattamento</h3>
                  <ul className="text-muted-foreground list-disc list-inside space-y-1">
                    <li>Visualizzazione mappa e ricerca centri dialisi</li>
                    <li>Geolocalizzazione per trovare centri vicini (solo se autorizzata)</li>
                    <li>Pubblicazione di recensioni anonime</li>
                    <li>Sicurezza e prevenzione abusi/spam</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-2">6) Base giuridica</h3>
                  <ul className="text-muted-foreground list-disc list-inside space-y-1">
                    <li>Consenso esplicito per la geolocalizzazione</li>
                    <li>Esecuzione del servizio per la pubblicazione di recensioni</li>
                    <li>Legittimo interesse per sicurezza e moderazione</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-2">7) Condivisione dei dati</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    I dati delle recensioni sono pubblici nell'app. I servizi tecnici (es. mappe, hosting) possono trattare dati necessari al funzionamento. DialRoad non vende dati a terzi.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">Partner pubblicitari e di affiliazione:</span> I dati tecnici e pubblicitari possono essere condivisi con:
                  </p>
                  <ul className="text-muted-foreground list-disc list-inside space-y-1 mt-2">
                    <li><strong>Google AdMob:</strong> Per l'erogazione di banner e annunci pubblicitari (si rimanda alla Privacy Policy di Google).</li>
                    <li><strong>Booking.com:</strong> Per la gestione delle ricerche hotel e dell'affiliazione.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-2">8) Diritti dell'utente</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Per richiedere la rimozione di una recensione o esercitare altri diritti ai sensi del GDPR, contatta: <a href="mailto:giacomo748@gmail.com" className="text-primary hover:underline">giacomo748@gmail.com</a>
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-2">9) Modifiche</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    La presente informativa può essere aggiornata. La data di aggiornamento è indicata in alto.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-2">10) Gestione del consenso pubblicitario</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Gli utenti possono limitare il tracciamento pubblicitario direttamente dalle impostazioni del proprio sistema operativo (Android o iOS) resettando o disattivando l'ID pubblicitario. Per gli utenti Premium, la raccolta di dati a fini pubblicitari viene interrotta in quanto la pubblicità viene rimossa.
                  </p>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help & Support Modal */}
      <AnimatePresence>
        {activeModal === 'help' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setActiveModal(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Aiuto & Supporto
                </h2>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <section>
                  <h3 className="font-bold text-foreground mb-2">Cos'è DialRoad?</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    DialRoad è l'assistente indispensabile per le persone in dialisi che desiderano spostarsi o pianificare una vacanza in Italia con la massima serenità. Grazie a una mappa interattiva aggiornata, trovi in pochi secondi i centri dialisi più vicini alla tua destinazione.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-2">Cosa puoi fare con l'app:</h3>
                  <ul className="text-muted-foreground space-y-2">
                    <li><strong>Mappa Interattiva:</strong> Individua i centri dialisi su tutto il territorio nazionale.</li>
                    <li><strong>Info Dettagliate:</strong> Consulta indirizzi, numeri di telefono e dettagli logistici di ogni struttura.</li>
                    <li><strong>Organizza il tuo Soggiorno:</strong> Grazie all'integrazione con Booking.com, puoi cercare hotel e alloggi nelle immediate vicinanze del centro dialisi scelto.</li>
                    <li><strong>Recensioni Anonime:</strong> Condividi la tua esperienza o leggi i consigli degli altri utenti. Non serve registrazione: basta un nickname per lasciare una valutazione.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-2">Privacy e Trasparenza:</h3>
                  <ul className="text-muted-foreground space-y-2">
                    <li><strong>Nessun Account:</strong> L'app si usa senza email o password. La tua privacy è garantita.</li>
                    <li><strong>GPS Facoltativo:</strong> Usiamo la tua posizione solo per mostrarti i centri intorno a te. Non salviamo i tuoi spostamenti.</li>
                    <li><strong>Contenuti Pubblicitari:</strong> Per mantenere il servizio gratuito, l'app include banner pubblicitari gestiti da Google AdMob.</li>
                  </ul>
                </section>
                
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
