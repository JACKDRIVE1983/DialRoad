import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  initializeAdMob, 
  showBannerAd, 
  hideBannerAd, 
  prepareInterstitialAd, 
  showInterstitialAd 
} from '@/lib/admob';

let isInitialized = false;

export function useAdMob() {
  const initRef = useRef(false);

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Prevent double initialization
    if (initRef.current || isInitialized) {
      return;
    }
    
    initRef.current = true;
    
    const init = async () => {
      if (isInitialized) return;
      
      try {
        await initializeAdMob();
        isInitialized = true;
        
        // Preload interstitial for later use
        await prepareInterstitialAd();
      } catch (error) {
        console.error('AdMob hook init error:', error);
      }
    };

    init();
  }, []);

  return {
    showBanner: showBannerAd,
    hideBanner: hideBannerAd,
    showInterstitial: showInterstitialAd,
    prepareInterstitial: prepareInterstitialAd,
    isNative: Capacitor.isNativePlatform(),
  };
}
