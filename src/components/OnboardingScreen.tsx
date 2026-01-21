import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { MapPin, Navigation, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoIcon from '@/assets/dialroad-logo-login.png';
import mapBackground from '@/assets/onboarding-map-bg.png';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Navigation,
    title: "Benvenuto su DialRoad",
    description: "La tua guida completa per trovare centri dialisi in tutta Italia. Un'app pensata per semplificare la vita dei pazienti in dialisi e dei loro familiari.",
    color: "from-primary to-accent"
  },
  {
    icon: MapPin,
    title: "Mappa Interattiva",
    description: "Visualizza tutti i centri dialisi sulla mappa. Usa la geolocalizzazione per trovare la struttura più vicina a te. Puoi anche lasciare recensioni e valutazioni per ogni centro visitato, senza bisogno di registrarti!",
    color: "from-accent to-primary"
  }
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleComplete = useCallback(() => {
    localStorage.setItem('dialroad-onboarding-seen', 'true');
    onComplete();
  }, [onComplete]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Stylized map background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${mapBackground})` }}
      />
      
      {/* Light overlay for better readability */}
      <div className="absolute inset-0 bg-white/60" />

      {/* Logo icon at top - larger */}
      <motion.div
        className="relative z-10 flex flex-col items-center pt-12 pb-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <img 
          src={logoIcon} 
          alt="DialRoad" 
          className="w-40 h-40 object-contain"
        />
      </motion.div>

      {/* Skip button */}
      <div className="relative z-10 flex justify-end px-4">
        <Button 
          variant="ghost" 
          onClick={handleComplete}
          className="text-muted-foreground hover:text-foreground hover:bg-white/50"
        >
          Salta
        </Button>
      </div>

      {/* Slides */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {/* Icon */}
            <motion.div
              className={`w-28 h-28 rounded-full bg-gradient-to-br ${slides[currentSlide].color} flex items-center justify-center mb-8 shadow-xl`}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              style={{
                boxShadow: '0 20px 40px rgba(0, 180, 216, 0.3)'
              }}
            >
              {(() => {
                const Icon = slides[currentSlide].icon;
                return <Icon className="w-14 h-14 text-primary-foreground" strokeWidth={1.5} />;
              })()}
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-2xl font-display font-bold text-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {slides[currentSlide].title}
            </motion.h2>

            {/* Description */}
            <motion.p
              className="text-base text-muted-foreground max-w-sm leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {slides[currentSlide].description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots and button */}
      <div className="relative z-10 p-8 pb-12">
        {/* Dots */}
        <div className="flex justify-center space-x-3 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide 
                  ? 'w-8 h-2 bg-primary' 
                  : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        {/* Next/Start button */}
        <Button
          onClick={handleNext}
          className="w-full h-14 text-lg font-semibold rounded-2xl gradient-bg text-primary-foreground hover:opacity-90 transition-opacity shadow-lg"
          style={{
            boxShadow: '0 10px 30px rgba(0, 180, 216, 0.3)'
          }}
        >
          {currentSlide === slides.length - 1 ? (
            "Inizia ad Esplorare"
          ) : (
            <span className="flex items-center">
              Continua
              <ChevronRight className="ml-2 w-5 h-5" />
            </span>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
