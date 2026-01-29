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
import { BottomNav } from '@/components/BottomNav';
import { AdBanner } from '@/components/AdBanner';
import { useAdMob } from '@/hooks/useAdMob';

// Memoized tab content components to prevent unnecessary re-renders
const MapTabContent = memo(function MapTabContent({ 
  isSearchFocused 
}: { 
  isSearchFocused: boolean 
}) {
  return (
    <div className="relative h-screen">
      <AppHeader isSearchFocused={isSearchFocused} />
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
    <div className="flex flex-col h-screen">
      <CentersList onSelectCenter={onSelectCenter} />
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
    <div className="min-h-screen bg-background safe-area-top">
      <AnimatePresence mode="wait">
        {activeTab === 'map' && <MapTabContent key="map" isSearchFocused={isSearchFocused} />}
        {activeTab === 'list' && (
          <ListTabContent key="list" onSelectCenter={setSelectedCenter} />
        )}
        {activeTab === 'settings' && <SettingsTabContent key="settings" />}
      </AnimatePresence>

      <CenterBottomSheet />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Ad Banner - fixed at absolute bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-[env(safe-area-inset-bottom)]">
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
