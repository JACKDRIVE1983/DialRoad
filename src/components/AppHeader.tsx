import { useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, HelpCircle, Mail } from 'lucide-react';
import headerMapBg from '@/assets/header-map-bg.png';

interface AppHeaderProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

export function AppHeader({ scrollContainerRef }: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'help' | null>(null);
  
  const { scrollY } = useScroll({
    container: scrollContainerRef
  });
  
  // Transform values based on scroll
  const opacity = useTransform(scrollY, [0, 60], [1, 0]);
  const translateY = useTransform(scrollY, [0, 60], [0, -20]);
  const scale = useTransform(scrollY, [0, 60], [1, 0.95]);

  const handleMenuItemClick = (modal: 'privacy' | 'help') => {
    setIsMenuOpen(false);
    setActiveModal(modal);
  };

  return (
    <>
      <motion.div
        className="absolute top-0 left-0 right-0 z-30"
        style={{ opacity, y: translateY, scale }}
      >
        <div 
          className="mx-4 mt-4 mb-2 rounded-2xl overflow-hidden relative h-20"
          style={{
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}
        >
          {/* Stylized map background with roads and pins */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100">
            {/* Road grid pattern */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
              {/* Horizontal roads */}
              <line x1="0" y1="20" x2="100%" y2="25" stroke="#d1d5db" strokeWidth="3" />
              <line x1="0" y1="45" x2="100%" y2="40" stroke="#d1d5db" strokeWidth="4" />
              <line x1="0" y1="65" x2="100%" y2="70" stroke="#d1d5db" strokeWidth="3" />
              
              {/* Vertical roads */}
              <line x1="15%" y1="0" x2="12%" y2="100%" stroke="#d1d5db" strokeWidth="3" />
              <line x1="35%" y1="0" x2="38%" y2="100%" stroke="#d1d5db" strokeWidth="2" />
              <line x1="62%" y1="0" x2="60%" y2="100%" stroke="#d1d5db" strokeWidth="3" />
              <line x1="85%" y1="0" x2="88%" y2="100%" stroke="#d1d5db" strokeWidth="2" />
              
              {/* Curved roads */}
              <path d="M0,30 Q25%,15 50%,35 T100%,25" stroke="#e5e7eb" strokeWidth="2" fill="none" />
              <path d="M0,55 Q30%,70 60%,50 T100%,60" stroke="#e5e7eb" strokeWidth="2" fill="none" />
            </svg>
            
            {/* Red map pins */}
            <svg className="absolute left-[8%] top-[15%] w-5 h-5 drop-shadow-md" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
            <svg className="absolute left-[22%] top-[55%] w-4 h-4 drop-shadow-md" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#dc2626"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
            <svg className="absolute right-[25%] top-[20%] w-4 h-4 drop-shadow-md" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
            <svg className="absolute right-[8%] top-[50%] w-5 h-5 drop-shadow-md" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#dc2626"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
            <svg className="absolute left-[45%] top-[65%] w-3 h-3 drop-shadow-sm" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#f87171"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          </div>
          
          {/* Center logo overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src={headerMapBg} 
              alt="" 
              className="w-auto h-auto max-w-none"
              style={{
                transform: 'scale(0.15)',
                transformOrigin: 'center center'
              }}
            />
          </div>
          
          {/* Soft gradient overlay for blending */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20" />

          <div className="relative flex items-center justify-between px-4 h-full">
            {/* Menu button on the left */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-white/40 pointer-events-auto z-10 bg-white/30 backdrop-blur-sm"
              aria-label="Menu"
              style={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)'
              }}
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
                    <X className="w-5 h-5 text-emerald-800" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5 text-emerald-800" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Spacer for balance */}
            <div className="w-10 h-10" />
          </div>
        </div>


        {/* Dropdown Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute left-4 top-20 z-50 pointer-events-auto"
            >
              <div 
                className="rounded-xl overflow-hidden backdrop-blur-xl min-w-[200px]"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.5)'
                }}
              >
                <button
                  onClick={() => handleMenuItemClick('privacy')}
                  className="w-full px-4 py-3 flex items-center gap-3 text-foreground hover:bg-black/5 transition-colors text-left"
                >
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Privacy</span>
                </button>
                <div className="h-px bg-black/10" />
                <button
                  onClick={() => handleMenuItemClick('help')}
                  className="w-full px-4 py-3 flex items-center gap-3 text-foreground hover:bg-black/5 transition-colors text-left"
                >
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <span className="font-medium">Aiuto & Supporto</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backdrop for closing menu */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 z-40 pointer-events-auto"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </motion.div>

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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}