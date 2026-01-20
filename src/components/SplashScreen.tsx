import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import splashVideo from '@/assets/splash-video.mp4';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 8000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleCanPlay = () => {
    setIsVideoReady(true);
    // Ensure video plays
    videoRef.current?.play().catch(() => {
      // Autoplay might be blocked, still show video
      setIsVideoReady(true);
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Hide video until ready to prevent showing play button */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        onCanPlay={handleCanPlay}
        onLoadedData={handleCanPlay}
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${
          isVideoReady ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          // Hide native controls and poster
          WebkitAppearance: 'none',
        }}
      >
        <source src={splashVideo} type="video/mp4" />
      </video>
    </motion.div>
  );
}
