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
    }, 4500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Video container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.1
        }}
        className="relative z-10 w-72 h-72 rounded-3xl overflow-hidden shadow-2xl"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 180, 216, 0.25)'
        }}
      >
        <video
          autoPlay
          muted
          playsInline
          loop
          className="w-full h-full object-cover"
        >
          <source src={splashVideo} type="video/mp4" />
        </video>
      </motion.div>

      {/* App Name */}
      <motion.h1
        className="relative z-10 mt-8 text-5xl font-display font-bold gradient-text"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        DialMap
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="relative z-10 mt-4 text-xl font-medium text-slate-700 text-center max-w-sm px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        Trova il centro dialisi più vicino a te in tutta Italia
      </motion.p>

      {/* Loading indicator */}
      <motion.div
        className="mt-12 flex space-x-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
