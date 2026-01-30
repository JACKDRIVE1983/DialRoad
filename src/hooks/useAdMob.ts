import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { 
  initializeAdMob, 
  showBannerAd, 
  hideBannerAd, 
  prepareInterstitialAd, 
  showInterstitialAd,
  disableAds,
  enableAds
} from '@/lib/admob';

let isInitialized = false;

// Interstitial auto-show interval (1 minute 20 seconds = 80000ms)
const INTERSTITIAL_INTERVAL_MS = 80_000;
// Preload retry interval (30 seconds)
const PRELOAD_RETRY_INTERVAL_MS = 30_000;

export function useAdMob(isPremium: boolean = false) {
  const initRef = useRef(false);
  const isPremiumRef = useRef(isPremium);

  // Keep ref in sync with prop
  isPremiumRef.current = isPremium;

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Handle premium status change - disable/enable ads
    if (isPremium) {
      console.log('[AdMob] Premium user - disabling all ads');
      disableAds();
      return;
    } else {
      enableAds();
    }

    // Prevent double initialization
    if (initRef.current || isInitialized) {
      return;
    }
    
    initRef.current = true;

    let bannerRefreshId: number | undefined;
    let interstitialIntervalId: number | undefined;
    let preloadRetryId: number | undefined;

    // Keep banner alive across app lifecycle (Android can hide overlays on resume)
    const appStateSub = CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) return;
      // Skip if premium
      if (isPremiumRef.current) return;
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
        if (!isPremiumRef.current) {
          await showBannerAd();
        }

        // Refresh banner every 90 seconds (skip if premium)
        bannerRefreshId = window.setInterval(async () => {
          if (isPremiumRef.current) return;
          try {
            await showBannerAd();
          } catch (e) {
            console.error('[AdMob] banner refresh error:', e);
          }
        }, 90_000);
        
        // Preload interstitial for later use
        await prepareInterstitialAd();

        // Continuous preload retry - ensures interstitial is always ready
        preloadRetryId = window.setInterval(async () => {
          if (isPremiumRef.current) return;
          try {
            console.log('[AdMob] Preload retry check...');
            await prepareInterstitialAd();
          } catch (e) {
            console.error('[AdMob] preload retry error:', e);
          }
        }, PRELOAD_RETRY_INTERVAL_MS);

        // Auto-show interstitial every 80 seconds (skip if premium)
        interstitialIntervalId = window.setInterval(async () => {
          if (isPremiumRef.current) {
            console.log('[AdMob] Premium user - skipping auto interstitial');
            return;
          }
          try {
            console.log('[AdMob] Auto-showing interstitial...');
            const shown = await showInterstitialAd();
            if (!shown) {
              console.log('[AdMob] Interstitial not shown, will retry on next interval');
            }
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
      if (preloadRetryId) window.clearInterval(preloadRetryId);
      appStateSub
        .then((sub) => sub.remove())
        .catch(() => {
          /* ignore */
        });
    };
  }, [isPremium]);

  return {
    showBanner: showBannerAd,
    hideBanner: hideBannerAd,
    showInterstitial: showInterstitialAd,
    prepareInterstitial: prepareInterstitialAd,
    isNative: Capacitor.isNativePlatform(),
  };
}
