import { motion, useScroll, useTransform } from 'framer-motion';
import logo from '@/assets/dialmap-logo-new.png';

interface AppHeaderProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

export function AppHeader({ scrollContainerRef }: AppHeaderProps) {
  const { scrollY } = useScroll({
    container: scrollContainerRef
  });
  
  // Transform values based on scroll
  const opacity = useTransform(scrollY, [0, 60], [1, 0]);
  const translateY = useTransform(scrollY, [0, 60], [0, -20]);
  const scale = useTransform(scrollY, [0, 60], [1, 0.95]);

  return (
    <motion.div
      className="absolute top-0 left-0 right-0 z-30 pointer-events-none"
      style={{ opacity, y: translateY, scale }}
    >
      <div 
        className="mx-4 mt-4 mb-2 px-4 py-2.5 rounded-2xl flex items-center gap-3"
        style={{
          background: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)',
          boxShadow: '0 4px 20px rgba(0, 119, 182, 0.3)'
        }}
      >
        {/* Logo */}
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm flex-shrink-0">
          <img 
            src={logo} 
            alt="DialMap" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Brand name */}
        <div className="flex-1">
          <h1 className="text-lg font-display font-bold text-white tracking-wide">
            Dial<span className="text-cyan-200">Map</span>
          </h1>
          <p className="text-[10px] text-white/70 font-medium -mt-0.5">
            Trova il tuo centro dialisi
          </p>
        </div>
      </div>
    </motion.div>
  );
}
