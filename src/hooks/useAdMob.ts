import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { 
  initializeAdMob, 
  showBannerAd, 
  hideBannerAd, 
  prepareInterstitialAd, 
  showInterstitialAd 
} from '@/lib/admob';

let isInitialized = false;

// Click counter for interstitial (every 12 clicks)
const CLICKS_FOR_INTERSTITIAL = 12;
let clickCount = 0;

export function useAdMob() {
  const initRef = useRef(false);

  // Handle click-based interstitial
  const handleScreenClick = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !isInitialized) return;
    
    clickCount++;
    console.log(`[AdMob] Click count: ${clickCount}/${CLICKS_FOR_INTERSTITIAL}`);
    
    if (clickCount >= CLICKS_FOR_INTERSTITIAL) {
      clickCount = 0;
      try {
        console.log('[AdMob] Showing interstitial after 12 clicks...');
        await showInterstitialAd();
      } catch (e) {
        console.error('[AdMob] click interstitial error:', e);
      }
    }
  }, []);

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

    // Keep banner alive across app lifecycle (Android can hide overlays on resume)
    const appStateSub = CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) return;
      try {
        await showBannerAd();
      } catch (e) {
        console.error('[AdMob] resume showBanner error:', e);
      }
    });
    
    const init = async () => {
      if (isInitialized) return;
      
      try {
        await initializeAdMob();
        isInitialized = true;

        // Show banner as soon as AdMob is ready (native only)
        await showBannerAd();

        // Refresh banner every 90 seconds (requested behavior)
        const bannerRefreshId = window.setInterval(async () => {
          try {
            await showBannerAd();
          } catch (e) {
            console.error('[AdMob] banner refresh error:', e);
          }
        }, 90_000);
        
        // Preload interstitial for later use
        await prepareInterstitialAd();

        return () => {
          window.clearInterval(bannerRefreshId);
        };
      } catch (error) {
        console.error('AdMob hook init error:', error);
      }
    };

    // Add global click listener for interstitial trigger
    const clickHandler = () => {
      handleScreenClick();
    };
    document.addEventListener('click', clickHandler, { passive: true });

    let cleanup: void | (() => void);
    init().then((c) => {
      cleanup = c;
    });

    return () => {
      document.removeEventListener('click', clickHandler);
      if (typeof cleanup === 'function') cleanup();
      appStateSub
        .then((sub) => sub.remove())
        .catch(() => {
          /* ignore */
        });
    };
  }, [handleScreenClick]);

  return {
    showBanner: showBannerAd,
    hideBanner: hideBannerAd,
    showInterstitial: showInterstitialAd,
    prepareInterstitial: prepareInterstitialAd,
    isNative: Capacitor.isNativePlatform(),
  };
}
