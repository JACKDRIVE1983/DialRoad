import { useState, useCallback, lazy, Suspense, memo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { SplashScreen } from '@/components/SplashScreen';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { AppHeader } from '@/components/AppHeader';
import { CenterBottomSheet } from '@/components/CenterBottomSheet';
import { BottomNav } from '@/components/BottomNav';
import { persistState, restoreState } from '@/hooks/useAppLifecycle';

// Lazy-loaded components for code splitting
const LazyMapView = lazy(() => import('@/components/LazyMapView').then(m => ({ default: m.LazyMapView })));
const SearchBar = lazy(() => import('@/components/SearchBar').then(m => ({ default: m.SearchBar })));
const CentersList = lazy(() => import('@/components/CentersList').then(m => ({ default: m.CentersList })));
const SettingsView = lazy(() => import('@/components/SettingsView').then(m => ({ default: m.SettingsView })));

type TabType = 'map' | 'list' | 'settings';

// Loading fallback component
const TabLoadingFallback = memo(function TabLoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
});

// Memoized tab content components
const MapTab = memo(function MapTab() {
  return (
    <div className="relative h-screen">
      <AppHeader />
      <Suspense fallback={<TabLoadingFallback />}>
        <SearchBar />
        <LazyMapView />
      </Suspense>
    </div>
  );
});

const ListTab = memo(function ListTab({ onSelectCenter }: { onSelectCenter: (center: any) => void }) {
  return (
    <div className="flex flex-col h-screen">
      <div className="pt-4 px-4">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Centri Dialisi
        </h1>
        <p className="text-sm text-muted-foreground">
          Trova il centro più adatto alle tue esigenze
        </p>
      </div>
      <Suspense fallback={<TabLoadingFallback />}>
        <CentersList onSelectCenter={onSelectCenter} />
      </Suspense>
    </div>
  );
});

const SettingsTab = memo(function SettingsTab() {
  return (
    <div className="flex flex-col h-screen">
      <div className="pt-4 px-4">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Impostazioni
        </h1>
      </div>
      <Suspense fallback={<TabLoadingFallback />}>
        <SettingsView />
      </Suspense>
    </div>
  );
});

function AppContent() {
  const { showSplash, setShowSplash, showOnboarding, setShowOnboarding, setSelectedCenter } = useApp();
  
  // Restore active tab from persistence
  const [activeTab, setActiveTabRaw] = useState<TabType>(() => {
    return restoreState<TabType>('active-tab', 'map');
  });

  // Persist tab changes
  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabRaw(tab);
    persistState('active-tab', tab);
  }, []);

  // Memoized center selection handler
  const handleSelectCenter = useCallback((center: any) => {
    setSelectedCenter(center);
  }, [setSelectedCenter]);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Show onboarding after splash
  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen bg-background safe-area-top">
      <AnimatePresence mode="wait">
        {activeTab === 'map' && <MapTab key="map" />}
        {activeTab === 'list' && <ListTab key="list" onSelectCenter={handleSelectCenter} />}
        {activeTab === 'settings' && <SettingsTab key="settings" />}
      </AnimatePresence>

      <CenterBottomSheet />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

function Index() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default Index;
