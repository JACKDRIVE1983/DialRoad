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
        className="mx-4 mt-4 mb-2 px-4 py-3 rounded-2xl flex flex-col items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)',
          boxShadow: '0 4px 20px rgba(0, 119, 182, 0.3)'
        }}
      >
        {/* Logo centered - maximized and cropped to hide white background */}
        <div className="w-16 h-16 rounded-xl overflow-hidden">
          <img 
            src={logo} 
            alt="DialMap" 
            className="w-full h-full object-cover scale-[1.8]"
          />
        </div>
        
        {/* Brand name below */}
        <h1 className="text-base font-display font-bold text-white tracking-wide mt-1">
          Dial<span className="text-cyan-200">Map</span>
        </h1>
      </div>
    </motion.div>
  );
}
