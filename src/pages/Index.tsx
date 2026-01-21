import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { SplashScreen } from '@/components/SplashScreen';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { MapView } from '@/components/MapView';
import { SearchBar } from '@/components/SearchBar';
import { AppHeader } from '@/components/AppHeader';
import { CenterBottomSheet } from '@/components/CenterBottomSheet';
import { CentersList } from '@/components/CentersList';
import { SettingsView } from '@/components/SettingsView';
import { BottomNav } from '@/components/BottomNav';

type TabType = 'map' | 'list' | 'settings';

function AppContent() {
  const { showSplash, setShowSplash, showOnboarding, setShowOnboarding, setSelectedCenter } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('map');

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
        {activeTab === 'map' && (
          <div className="relative h-screen">
            <AppHeader />
            <SearchBar />
            <MapView />
          </div>
        )}

        {activeTab === 'list' && (
          <div className="flex flex-col h-screen">
            <div className="pt-4 px-4">
              <h1 className="text-2xl font-display font-bold text-foreground mb-1">
                Centri Dialisi
              </h1>
              <p className="text-sm text-muted-foreground">
                Trova il centro più adatto alle tue esigenze
              </p>
            </div>
            <CentersList onSelectCenter={setSelectedCenter} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col h-screen">
            <div className="pt-4 px-4">
              <h1 className="text-2xl font-display font-bold text-foreground mb-1">
                Impostazioni
              </h1>
            </div>
            <SettingsView />
          </div>
        )}
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
