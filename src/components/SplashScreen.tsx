import { useEffect } from 'react';
import { motion } from 'framer-motion';
import splashVideo from '@/assets/splash-video.mp4';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 8000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Fullscreen video - adapted for mobile */}
      <video
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-contain"
      >
        <source src={splashVideo} type="video/mp4" />
      </video>
    </motion.div>
  );
}
