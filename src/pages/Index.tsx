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

// Memoized tab content components to prevent unnecessary re-renders
const MapTabContent = memo(function MapTabContent() {
  return (
    <div className="relative h-screen">
      <AppHeader />
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
      <div className="pt-4 px-4">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Centri Dialisi
        </h1>
        <p className="text-sm text-muted-foreground">
          Trova il centro più adatto alle tue esigenze
        </p>
      </div>
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
      <AnimatePresence mode="wait">
        {activeTab === 'map' && <MapTabContent key="map" />}
        {activeTab === 'list' && (
          <ListTabContent key="list" onSelectCenter={setSelectedCenter} />
        )}
        {activeTab === 'settings' && <SettingsTabContent key="settings" />}
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
