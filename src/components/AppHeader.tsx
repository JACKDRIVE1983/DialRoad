import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, HelpCircle, Crown, Search, SlidersHorizontal, MapPin, Mail, Map, List, Settings, Moon, Sun } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import logoIcon from '@/assets/dialroad-logo-transparent.png';
import { regions } from '@/data/mockCenters';
import { Button } from '@/components/ui/button';

type TabType = 'map' | 'list' | 'settings';

interface AppHeaderProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
  isSearchFocused?: boolean;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

export function AppHeader({ activeTab = 'map', onTabChange }: AppHeaderProps) {
  const { 
    isPremium, 
    togglePremium,
    searchQuery,
    setSearchQuery,
    selectedRegion,
    setSelectedRegion,
    setIsSearchFocused,
    isDarkMode,
    toggleDarkMode
  } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'help' | null>(null);

  const hasActiveFilters = selectedRegion !== 'Tutte le Regioni';

  const tabs = [
    { id: 'map' as TabType, icon: Map },
    { id: 'list' as TabType, icon: List },
    { id: 'settings' as TabType, icon: Settings },
  ];

  const handleMenuItemClick = (modal: 'privacy' | 'help') => {
    setIsMenuOpen(false);
    setActiveModal(modal);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('Tutte le Regioni');
  };

  // Hide search on settings tab
  const showSearch = activeTab !== 'settings';

  return (
    <>
      {/* Unified Top Header Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-40 safe-area-top"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <div 
          className="mx-3 mt-3 rounded-2xl bg-white/95 dark:bg-card/95 backdrop-blur-2xl border border-white/60 dark:border-white/10"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Single unified row */}
          <div className="flex items-center gap-2 px-2.5 py-2">
            {/* Logo */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <img
                src={logoIcon}
                alt="DialRoad"
                className="w-7 h-7 object-contain"
              />
              <span className="font-display font-bold text-xs text-foreground hidden min-[400px]:block">
                DialRoad
              </span>
            </div>

            {/* Search bar - compact, shows only on map/list */}
            {showSearch && (
              <div className="flex-1 flex items-center gap-1.5 bg-muted/50 dark:bg-muted/30 rounded-xl px-2.5 py-1.5 min-w-0">
                <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Cerca..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-xs min-w-0"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 hover:bg-muted rounded-full transition-colors flex-shrink-0"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1 rounded-lg transition-colors flex-shrink-0 relative ${
                    hasActiveFilters 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {hasActiveFilters && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
              </div>
            )}

            {/* Spacer when no search */}
            {!showSearch && <div className="flex-1" />}

            {/* Tab Navigation */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                      isActive ? 'bg-primary/15 dark:bg-primary/25' : 'hover:bg-muted/50'
                    }`}
                  >
                    <Icon 
                      className={`transition-all duration-200 ${
                        isActive 
                          ? 'w-4.5 h-4.5 text-primary' 
                          : 'w-4 h-4 text-muted-foreground'
                      }`} 
                      style={{ width: isActive ? '18px' : '16px', height: isActive ? '18px' : '16px' }}
                    />
                  </button>
                );
              })}

              {/* Theme toggle */}
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:bg-muted/50"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Moon className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-border/50 flex-shrink-0" />

            {/* PRO Button */}
            <button
              onClick={togglePremium}
              className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 flex-shrink-0 ${
                isPremium
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                  : 'bg-muted/50 hover:bg-amber-500/10'
              }`}
            >
              <Crown className={`w-3.5 h-3.5 ${isPremium ? 'text-white' : 'text-amber-500'}`} />
              <span className={`font-semibold text-[10px] ${isPremium ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
                {isPremium ? 'PRO' : 'PRO'}
              </span>
            </button>

            {/* Menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-muted/50 flex-shrink-0"
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
        </div>

        {/* Dropdown Menu - positioned right */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-3 top-[calc(100%+8px)] z-50"
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
      </motion.div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
            />

            {/* Filter panel */}
            <motion.div
              className="fixed top-20 right-4 left-4 z-50 bg-background dark:bg-card backdrop-blur-2xl rounded-2xl p-4 max-h-[60vh] overflow-y-auto border border-border"
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
                  {regions.map((region) => (
                    <button
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        selectedRegion === region
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {region}
                    </button>
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

      {/* Backdrop for closing menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

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
