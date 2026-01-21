// Lazy-loaded Map component wrapper
import { lazy, Suspense, memo } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Lazy load the heavy MapView component
const MapView = lazy(() => 
  import('./MapView').then(module => ({ default: module.MapView }))
);

function MapLoadingFallback() {
  return (
    <div className="relative w-full h-full bg-secondary flex items-center justify-center">
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

// Memoized wrapper to prevent unnecessary re-renders
export const LazyMapView = memo(function LazyMapView() {
  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <MapView />
    </Suspense>
  );
});
