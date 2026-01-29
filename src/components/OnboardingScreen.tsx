import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import slide1 from '@/assets/onboarding-slide-1.png';
import slide2 from '@/assets/onboarding-slide-2.png';
import slide3 from '@/assets/onboarding-slide-3.png';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [slide1, slide2, slide3];

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

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Slides */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="absolute inset-0"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <img 
              src={slides[currentSlide]} 
              alt={`Onboarding slide ${currentSlide + 1}`}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Side controls (mid-screen) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 px-4 flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={handleComplete}
            className="glass-button text-foreground font-semibold text-base pointer-events-auto"
          >
            Salta
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="glass-button text-foreground font-semibold text-base pointer-events-auto"
          >
            Continua
          </button>
        </div>
      </div>
    </motion.div>
  );
}
