// Lazy-loaded Map component wrapper - hard reset boundary
import { lazy, Suspense, memo, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load the heavy MapView component
const MapViewLazy = lazy(() => 
  import('./MapView').then(module => ({ default: module.MapView }))
);

function MapLoadingFallback() {
  return (
    <div className="absolute inset-0 bg-secondary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-muted-foreground">Caricamento mappa...</span>
      </div>
    </div>
  );
}

// Memoized wrapper to prevent unnecessary re-renders
export const LazyMapView = memo(function LazyMapView() {
  // Force a remount of the heavy map when the page/tab becomes visible again
  // (Google Maps frequently breaks after being hidden via tab switch / WebView pause).
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    const bump = () => setMapKey((k) => k + 1);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') bump();
    };

    window.addEventListener('focus', bump);
    window.addEventListener('orientationchange', bump);
    window.addEventListener('resize', bump);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', bump);
      window.removeEventListener('orientationchange', bump);
      window.removeEventListener('resize', bump);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Suspense fallback={<MapLoadingFallback />}>
        <MapViewLazy key={mapKey} />
      </Suspense>
    </div>
  );
});