// Lazy-loaded Map component wrapper
import { lazy, Suspense, memo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Lazy load the heavy MapView component
const MapViewLazy = lazy(() => 
  import('./MapView').then(module => ({ default: module.MapView }))
);

function MapLoadingFallback() {
  return (
    <div className="absolute inset-0 bg-secondary flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-muted-foreground">Caricamento mappa...</span>
      </motion.div>
    </div>
  );
}

// Memoized wrapper with forwardRef to prevent ref warnings
export const LazyMapView = memo(forwardRef<HTMLDivElement>(function LazyMapView(_props, ref) {
  return (
    <div ref={ref} className="absolute inset-0 w-full h-full">
      <Suspense fallback={<MapLoadingFallback />}>
        <MapViewLazy />
      </Suspense>
    </div>
  );
}));
