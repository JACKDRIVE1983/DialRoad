import { useEffect } from 'react';
import { motion } from 'framer-motion';
import logo from '@/assets/dialmap-logo-new.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4500); // Increased from 2500ms to 4500ms

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Light background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-accent/10" />
      
      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="absolute w-64 h-64 rounded-full border border-primary/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.2, 1.5], opacity: [0, 0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
        />
        <motion.div
          className="absolute w-48 h-48 rounded-full border border-accent/30"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.3, 1.6], opacity: [0, 0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5, delay: 0.3 }}
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.2
        }}
        className="relative z-10"
      >
        <motion.div
          className="w-60 h-60 overflow-hidden"
          animate={{ 
            filter: [
              "drop-shadow(0 20px 30px rgba(0, 180, 216, 0.2))",
              "drop-shadow(0 20px 40px rgba(0, 180, 216, 0.4))",
              "drop-shadow(0 20px 30px rgba(0, 180, 216, 0.2))"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <img 
            src={logo} 
            alt="DialMap Logo" 
            className="w-full h-full object-contain scale-125"
          />
        </motion.div>
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
