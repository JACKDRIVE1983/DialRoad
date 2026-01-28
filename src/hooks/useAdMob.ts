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

        // Show banner as soon as AdMob is ready (native only)
        await showBannerAd();

        // Refresh banner every 90 seconds (requested behavior)
        const refreshId = window.setInterval(async () => {
          try {
            await hideBannerAd();
            await showBannerAd();
          } catch (e) {
            console.error('[AdMob] banner refresh error:', e);
          }
        }, 90_000);
        
        // Preload interstitial for later use
        await prepareInterstitialAd();

        return () => {
          window.clearInterval(refreshId);
          hideBannerAd();
        };
      } catch (error) {
        console.error('AdMob hook init error:', error);
      }
    };

    let cleanup: void | (() => void);
    init().then((c) => {
      cleanup = c;
    });

    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  return {
    showBanner: showBannerAd,
    hideBanner: hideBannerAd,
    showInterstitial: showInterstitialAd,
    prepareInterstitial: prepareInterstitialAd,
    isNative: Capacitor.isNativePlatform(),
  };
}
