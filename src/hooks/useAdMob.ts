import { useEffect, useRef } from 'react';
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

// Interstitial auto-show interval (1 minute 20 seconds = 80000ms)
const INTERSTITIAL_INTERVAL_MS = 80_000;

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

    let bannerRefreshId: number | undefined;
    let interstitialIntervalId: number | undefined;

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

        // Refresh banner every 90 seconds
        bannerRefreshId = window.setInterval(async () => {
          try {
            await showBannerAd();
          } catch (e) {
            console.error('[AdMob] banner refresh error:', e);
          }
        }, 90_000);
        
        // Preload interstitial for later use
        await prepareInterstitialAd();

        // Auto-show interstitial every 1 minute 20 seconds
        interstitialIntervalId = window.setInterval(async () => {
          try {
            console.log('[AdMob] Auto-showing interstitial...');
            await showInterstitialAd();
          } catch (e) {
            console.error('[AdMob] auto interstitial error:', e);
          }
        }, INTERSTITIAL_INTERVAL_MS);
      } catch (error) {
        console.error('AdMob hook init error:', error);
      }
    };

    init();

    return () => {
      if (bannerRefreshId) window.clearInterval(bannerRefreshId);
      if (interstitialIntervalId) window.clearInterval(interstitialIntervalId);
      appStateSub
        .then((sub) => sub.remove())
        .catch(() => {
          /* ignore */
        });
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
