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
        className="mx-4 mt-4 mb-2 px-4 py-3 rounded-2xl flex flex-col items-center justify-center backdrop-blur-md"
        style={{
          background: 'rgba(255, 255, 255, 0.25)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        {/* Logo centered - sized to fit naturally without white borders */}
        <div className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center">
          <img 
            src={logo} 
            alt="DialMap" 
            className="w-[180%] h-[180%] max-w-none object-contain"
          />
        </div>
        
        {/* Brand name below - blue and green like the icon */}
        <h1 className="text-base font-display font-bold tracking-wide mt-1">
          <span style={{ color: '#0077b6' }}>Dial</span><span style={{ color: '#2ecc71' }}>Map</span>
        </h1>
      </div>
    </motion.div>
  );
}
