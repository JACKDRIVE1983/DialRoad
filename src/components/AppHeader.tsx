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
        className="mx-4 mt-4 mb-2 px-6 py-3 rounded-2xl flex items-center justify-center gap-3 backdrop-blur-md"
        style={{
          background: 'rgba(255, 255, 255, 0.25)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        {/* "Dial" text on the left */}
        <span 
          className="text-2xl font-display font-bold tracking-wide"
          style={{ color: '#0077b6' }}
        >
          Dial
        </span>
        
        {/* Logo centered */}
        <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
          <img 
            src={logo} 
            alt="DialMap" 
            className="w-[180%] h-[180%] max-w-none object-contain"
          />
        </div>
        
        {/* "Map" text on the right */}
        <span 
          className="text-2xl font-display font-bold tracking-wide"
          style={{ color: '#2ecc71' }}
        >
          Map
        </span>
      </div>
    </motion.div>
  );
}
