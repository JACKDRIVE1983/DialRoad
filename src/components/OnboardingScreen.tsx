import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
      </div>

      {/* Bottom navigation area - positioned above ad banner */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-24 pt-4 safe-area-bottom bg-gradient-to-t from-black/60 to-transparent">
        {/* Navigation buttons row */}
        <div className="flex justify-between items-center px-4 mb-4">
          {/* Continua button on the left - hidden on last slide */}
          {!isLastSlide ? (
            <button 
              onClick={handleNext}
              className="text-white/90 hover:text-white hover:bg-white/20 font-semibold text-base px-4 py-2 rounded-full backdrop-blur-sm bg-black/20 transition-all"
            >
              Continua
            </button>
          ) : (
            <div />
          )}
          
          {/* Inizia button on the right */}
          <button 
            onClick={handleComplete}
            className="text-white/90 hover:text-white hover:bg-white/20 font-semibold text-base px-4 py-2 rounded-full backdrop-blur-sm bg-black/20 transition-all"
          >
            Inizia
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide 
                  ? 'w-8 h-2 bg-white' 
                  : 'w-2 h-2 bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
