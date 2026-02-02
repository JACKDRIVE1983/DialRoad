import { memo, lazy, Suspense } from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { SplashScreen } from '@/components/SplashScreen';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { AppHeader } from '@/components/AppHeader';
import { AdBanner } from '@/components/AdBanner';
import { PremiumLimitModal } from '@/components/PremiumLimitModal';
import { useAdMob } from '@/hooks/useAdMob';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components
const MapView = lazy(() => import('@/components/MapView').then(m => ({ default: m.MapView })));
const CenterBottomSheet = lazy(() => import('@/components/CenterBottomSheet').then(m => ({ default: m.CenterBottomSheet })));
const CentersList = lazy(() => import('@/components/CentersList').then(m => ({ default: m.CentersList })));
const SettingsView = lazy(() => import('@/components/SettingsView').then(m => ({ default: m.SettingsView })));

// Minimal loading fallback
const LoadingFallback = memo(function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
});

// Memoized tab content components to prevent unnecessary re-renders
const MapTabContent = memo(function MapTabContent() {
  return (
    <div className="relative pt-24 pb-[calc(32px+env(safe-area-inset-bottom))] h-[calc(100vh-32px-env(safe-area-inset-bottom))]">
      <Suspense fallback={<LoadingFallback />}>
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
    <div className="flex flex-col pt-24 pb-[calc(32px+env(safe-area-inset-bottom))] h-[calc(100vh-32px-env(safe-area-inset-bottom))]">
      <Suspense fallback={<LoadingFallback />}>
        <CentersList onSelectCenter={onSelectCenter} />
      </Suspense>
    </div>
  );
});

const SettingsTabContent = memo(function SettingsTabContent() {
  return (
    <div className="flex flex-col pt-14 pb-[calc(32px+env(safe-area-inset-bottom))] h-[calc(100vh-32px-env(safe-area-inset-bottom))]">
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
    trySelectCenter,
    activeTab,
    setActiveTab,
    showLimitModal,
    setShowLimitModal,
    isPremium
  } = useApp();
  
  // Initialize AdMob on native platforms (pass isPremium to disable ads for premium users)
  useAdMob(isPremium);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Show onboarding after splash
  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Removed AnimatePresence for better performance on low-end devices */}
      {activeTab === 'map' && <MapTabContent />}
      {activeTab === 'list' && <ListTabContent onSelectCenter={trySelectCenter} />}
      {activeTab === 'settings' && <SettingsTabContent />}

      <Suspense fallback={null}>
        <CenterBottomSheet />
      </Suspense>
      
      {/* Premium Limit Modal */}
      <PremiumLimitModal open={showLimitModal} onOpenChange={setShowLimitModal} />
      
      {/* Ad Banner - only show for non-premium users */}
      {!isPremium && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-[env(safe-area-inset-bottom)]">
          <AdBanner />
        </div>
      )}
    </div>
  );
}

function Index() {
  return (
    <AppProvider>
      <AppErrorBoundary>
        <AppContent />
      </AppErrorBoundary>
    </AppProvider>
  );
}

export default Index;
