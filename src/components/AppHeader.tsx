import { useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, HelpCircle, Mail, MapPin } from 'lucide-react';

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

  // Pin positions for the stylized map
  const pins = [
    { left: '15%', top: '35%', delay: 0, size: 'w-3 h-3' },
    { left: '25%', top: '55%', delay: 0.1, size: 'w-2 h-2' },
    { left: '40%', top: '30%', delay: 0.2, size: 'w-4 h-4' },
    { left: '55%', top: '50%', delay: 0.3, size: 'w-3 h-3' },
    { left: '70%', top: '35%', delay: 0.4, size: 'w-2 h-2' },
    { left: '80%', top: '55%', delay: 0.5, size: 'w-3 h-3' },
    { left: '48%', top: '65%', delay: 0.15, size: 'w-2 h-2' },
  ];

  return (
    <>
      <motion.div
        className="absolute top-0 left-0 right-0 z-30"
        style={{ opacity, y: translateY, scale }}
      >
        <div 
          className="mx-4 mt-4 mb-2 rounded-2xl overflow-hidden backdrop-blur-md relative"
          style={{
            background: 'linear-gradient(135deg, rgba(167, 243, 208, 0.7) 0%, rgba(134, 239, 172, 0.6) 30%, rgba(74, 222, 128, 0.5) 60%, rgba(34, 197, 94, 0.4) 100%)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.4)'
          }}
        >
          {/* Stylized map roads/paths */}
          <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
            <path d="M0,30 Q50,20 100,35 T200,25 T300,40 T400,30" stroke="white" strokeWidth="2" fill="none" />
            <path d="M0,50 Q80,60 150,45 T280,55 T400,45" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M50,0 Q60,40 45,80" stroke="white" strokeWidth="1" fill="none" />
            <path d="M150,0 Q140,35 160,70" stroke="white" strokeWidth="1" fill="none" />
            <path d="M280,0 Q290,30 275,65" stroke="white" strokeWidth="1" fill="none" />
          </svg>

          <div className="relative flex items-center justify-between px-4 py-3">
            {/* Menu button on the left */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-white/30 pointer-events-auto z-10 bg-white/20"
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
                    <X className="w-5 h-5 text-white drop-shadow-md" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5 text-white drop-shadow-md" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Animated pins in the center area */}
            <div className="absolute inset-0 pointer-events-none">
              {pins.map((pin, index) => (
                <motion.div
                  key={index}
                  className="absolute"
                  style={{ left: pin.left, top: pin.top }}
                  initial={{ scale: 0, y: -10 }}
                  animate={{ 
                    scale: 1, 
                    y: [0, -3, 0],
                  }}
                  transition={{ 
                    scale: { delay: pin.delay, duration: 0.3 },
                    y: { delay: pin.delay + 0.3, duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  <div className={`${pin.size} relative`}>
                    <MapPin className="w-full h-full text-red-500 fill-red-500 drop-shadow-lg" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-full mt-[-2px]" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

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