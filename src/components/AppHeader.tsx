import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, HelpCircle, Mail, Crown } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import logoIcon from '@/assets/dialroad-logo-transparent.png';

interface AppHeaderProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
  isSearchFocused?: boolean;
}

export function AppHeader({ scrollContainerRef, isSearchFocused = false }: AppHeaderProps) {
  const { isPremium, togglePremium } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'help' | null>(null);

  const handleMenuItemClick = (modal: 'privacy' | 'help') => {
    setIsMenuOpen(false);
    setActiveModal(modal);
  };

  return (
    <>
      {/* Floating Logo Container - Top Left */}
      <motion.div
        className="absolute top-4 left-4 z-30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-white/50 dark:border-white/10"
          style={{
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)'
          }}
        >
          <img
            src={logoIcon}
            alt="DialRoad"
            className="w-8 h-8 object-contain"
          />
          <span className="font-display font-bold text-sm text-foreground">
            DialRoad
          </span>
          
          {/* Menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="ml-1 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10"
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

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 top-14 z-50 pointer-events-auto"
            >
              <div 
                className="rounded-xl overflow-hidden backdrop-blur-xl min-w-[180px] bg-white/90 dark:bg-card/90 border border-white/50 dark:border-white/10"
                style={{
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                }}
              >
                <button
                  onClick={() => handleMenuItemClick('privacy')}
                  className="w-full px-4 py-3 flex items-center gap-3 text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
                >
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-sm">Privacy</span>
                </button>
                <div className="h-px bg-border/50" />
                <button
                  onClick={() => handleMenuItemClick('help')}
                  className="w-full px-4 py-3 flex items-center gap-3 text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
                >
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">Aiuto & Supporto</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Premium Button - Top Right (hides when searching) */}
      <AnimatePresence>
        {!isSearchFocused && (
          <motion.div
            className="absolute top-4 right-4 z-30"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
          >
            <button
              onClick={togglePremium}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl backdrop-blur-xl border transition-all duration-200 ${
                isPremium
                  ? 'bg-gradient-to-r from-amber-500/90 to-orange-500/90 border-amber-400/50 text-white shadow-lg shadow-amber-500/25'
                  : 'bg-white/70 dark:bg-card/70 border-white/50 dark:border-white/10 hover:border-amber-500/50'
              }`}
              style={{
                boxShadow: isPremium 
                  ? '0 4px 24px rgba(245, 158, 11, 0.3)' 
                  : '0 4px 24px rgba(0, 0, 0, 0.08)'
              }}
            >
              <Crown className={`w-4 h-4 ${isPremium ? 'text-white' : 'text-amber-500'}`} />
              <span className={`font-semibold text-xs ${isPremium ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
                {isPremium ? 'Premium' : 'PRO'}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for closing menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-20 pointer-events-auto"
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
                  <p className="text-muted-foreground leading-relaxed">
                    I dati delle recensioni sono pubblici nell'app. I servizi tecnici (es. mappe, hosting) possono trattare dati necessari al funzionamento. DialRoad non vende dati a terzi.
                  </p>
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

              <div className="p-6 space-y-4">
                <p className="text-foreground leading-relaxed">
                  DialRoad ti aiuta a trovare rapidamente i centri dialisi in tutta Italia tramite una mappa interattiva. Puoi cercare per zona o località e consultare informazioni utili come indirizzo, contatti e dettagli principali della struttura.
                </p>
                <p className="text-foreground leading-relaxed">
                  È pensata per le persone in dialisi che vogliono organizzare una vacanza o uno spostamento con più serenità: ti permette di individuare in anticipo i centri disponibili vicino alla tua destinazione.
                </p>
                <p className="text-foreground leading-relaxed">
                  <strong>Recensioni senza registrazione:</strong> Puoi lasciare recensioni e valutazioni per ogni centro dialisi visitato, semplicemente inserendo un nome a tua scelta. Non è richiesta nessuna registrazione, email o password.
                </p>
                <p className="text-foreground leading-relaxed">
                  <strong>Privacy:</strong> L'app utilizza solo la tua posizione GPS (se autorizzata) per mostrarti i centri più vicini. Non raccogliamo dati personali, email o informazioni di contatto.
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
