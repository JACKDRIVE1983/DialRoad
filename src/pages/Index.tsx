import { memo, lazy, Suspense } from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { SplashScreen } from '@/components/SplashScreen';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { BottomNav } from '@/components/BottomNav';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components for faster initial load
const MapView = lazy(() => import('@/components/MapView').then(m => ({ default: m.MapView })));
const CentersList = lazy(() => import('@/components/CentersList').then(m => ({ default: m.CentersList })));
const SettingsView = lazy(() => import('@/components/SettingsView').then(m => ({ default: m.SettingsView })));
const AppHeader = lazy(() => import('@/components/AppHeader').then(m => ({ default: m.AppHeader })));
const SearchBar = lazy(() => import('@/components/SearchBar').then(m => ({ default: m.SearchBar })));
const CenterBottomSheet = lazy(() => import('@/components/CenterBottomSheet').then(m => ({ default: m.CenterBottomSheet })));

// Loading fallback for lazy components
const LoadingFallback = memo(function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
});

// Memoized tab content components to prevent unnecessary re-renders
const MapTabContent = memo(function MapTabContent() {
  return (
    <div className="relative h-screen">
      <Suspense fallback={<LoadingFallback />}>
        <AppHeader />
        <SearchBar />
        <MapView />
      </Suspense>
    </div>
  );
});

const ListTabContent = memo(function ListTabContent({ 
  onSelectCenter 
}: { 
  onSelectCenter: (center: any) => void 
}) {
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
      <Suspense fallback={<LoadingFallback />}>
        <CentersList onSelectCenter={onSelectCenter} />
      </Suspense>
    </div>
  );
});

const SettingsTabContent = memo(function SettingsTabContent() {
  return (
    <div className="flex flex-col h-screen">
      <div className="pt-4 px-4">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Impostazioni
        </h1>
      </div>
      <Suspense fallback={<LoadingFallback />}>
        <SettingsView />
      </Suspense>
    </div>
  );
});

function AppContent() {
  const { 
    showSplash, 
    setShowSplash, 
    showOnboarding, 
    setShowOnboarding, 
    setSelectedCenter,
    activeTab,
    setActiveTab
  } = useApp();

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
      {/* Remove AnimatePresence to prevent re-renders on tab switch */}
      <div style={{ display: activeTab === 'map' ? 'block' : 'none' }}>
        <MapTabContent />
      </div>
      <div style={{ display: activeTab === 'list' ? 'block' : 'none' }}>
        <ListTabContent onSelectCenter={setSelectedCenter} />
      </div>
      <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
        <SettingsTabContent />
      </div>

      <Suspense fallback={null}>
        <CenterBottomSheet />
      </Suspense>
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
