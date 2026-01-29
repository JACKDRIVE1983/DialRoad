import { memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { SplashScreen } from '@/components/SplashScreen';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { MapView } from '@/components/MapView';

import { AppHeader } from '@/components/AppHeader';
import { CenterBottomSheet } from '@/components/CenterBottomSheet';
import { CentersList } from '@/components/CentersList';
import { SettingsView } from '@/components/SettingsView';
import { AdBanner } from '@/components/AdBanner';
import { useAdMob } from '@/hooks/useAdMob';

// Memoized tab content components to prevent unnecessary re-renders
const MapTabContent = memo(function MapTabContent() {
  return (
    <div className="relative pt-24 pb-[calc(44px+env(safe-area-inset-bottom))] h-[calc(100vh-44px-env(safe-area-inset-bottom))]">
      <MapView />
    </div>
  );
});

const ListTabContent = memo(function ListTabContent({ 
  onSelectCenter 
}: { 
  onSelectCenter: (center: any) => void 
}) {
  return (
    <div className="flex flex-col pt-24 pb-[calc(44px+env(safe-area-inset-bottom))] h-[calc(100vh-44px-env(safe-area-inset-bottom))]">
      <CentersList onSelectCenter={onSelectCenter} />
    </div>
  );
});

const SettingsTabContent = memo(function SettingsTabContent() {
  return (
    <div className="flex flex-col pt-14 pb-[calc(44px+env(safe-area-inset-bottom))] h-[calc(100vh-44px-env(safe-area-inset-bottom))]">
      <div className="pt-4 px-4">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Impostazioni
        </h1>
      </div>
      <SettingsView />
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
    setActiveTab,
    isSearchFocused
  } = useApp();
  
  // Initialize AdMob on native platforms
  useAdMob();

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
      
      <AnimatePresence mode="wait">
        {activeTab === 'map' && <MapTabContent key="map" />}
        {activeTab === 'list' && (
          <ListTabContent key="list" onSelectCenter={setSelectedCenter} />
        )}
        {activeTab === 'settings' && <SettingsTabContent key="settings" />}
      </AnimatePresence>

      <CenterBottomSheet />
      
      {/* Ad Banner - fixed at absolute bottom, always on top */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-[env(safe-area-inset-bottom)]">
        <AdBanner />
      </div>
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
