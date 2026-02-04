import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { 
  initializeAdMob, 
  showBannerAd, 
  hideBannerAd, 
  prepareInterstitialAd, 
  showInterstitialAd,
  disableAds,
  enableAds,
  canShowInterstitial
} from '@/lib/admob';

// Interstitial auto-show interval (1 minute 20 seconds = 80000ms)
const INTERSTITIAL_INTERVAL_MS = 80_000;
// Preload retry interval (20 seconds - more aggressive)
const PRELOAD_RETRY_INTERVAL_MS = 20_000;

// Global initialization state - persists across hook instances
let globalInitialized = false;
let globalTimersActive = false;
let bannerRefreshId: number | undefined;
let interstitialIntervalId: number | undefined;
let preloadRetryId: number | undefined;
let appStateSubscription: { remove: () => void } | null = null;

// Track premium ref globally so timers can check it
// Initialize from localStorage to prevent ad flash on startup
// PRIORITY: override (highest) > stored status
let globalIsPremiumRef = (() => {
  try {
    // Check override FIRST (highest priority - never gets reset by RevenueCat)
    const override = localStorage.getItem('dialroad-premium-override');
    if (override === 'true') return true;
    // Then check stored status
    const stored = localStorage.getItem('dialroad-premium-status');
    if (stored === 'true') return true;
  } catch {}
  return false;
})();

function clearAllTimers() {
  if (bannerRefreshId) {
    window.clearInterval(bannerRefreshId);
    bannerRefreshId = undefined;
  }
  if (interstitialIntervalId) {
    window.clearInterval(interstitialIntervalId);
    interstitialIntervalId = undefined;
  }
  if (preloadRetryId) {
    window.clearInterval(preloadRetryId);
    preloadRetryId = undefined;
  }
  globalTimersActive = false;
  console.log('[AdMob] All timers cleared');
}

async function startAdTimers() {
  if (globalTimersActive) {
    console.log('[AdMob] Timers already active, skipping');
    return;
  }
  
  globalTimersActive = true;
  console.log('[AdMob] Starting ad timers...');

  // Show banner immediately
  if (!globalIsPremiumRef) {
    await showBannerAd();
  }

  // Refresh banner every 90 seconds
  bannerRefreshId = window.setInterval(async () => {
    if (globalIsPremiumRef) return;
    try {
      console.log('[AdMob] Banner refresh tick');
      await showBannerAd();
    } catch (e) {
      console.error('[AdMob] banner refresh error:', e);
    }
  }, 90_000);

  // Preload first interstitial
  await prepareInterstitialAd();

  // Continuous preload retry - more aggressive (20 seconds)
  preloadRetryId = window.setInterval(async () => {
    if (globalIsPremiumRef) return;
    try {
      console.log('[AdMob] Preload retry check...');
      await prepareInterstitialAd();
    } catch (e) {
      console.error('[AdMob] preload retry error:', e);
    }
  }, PRELOAD_RETRY_INTERVAL_MS);

  // Auto-show interstitial every 80 seconds (timer-based)
  interstitialIntervalId = window.setInterval(async () => {
    if (globalIsPremiumRef) {
      console.log('[AdMob] Premium user - skipping auto interstitial');
      return;
    }
    try {
      console.log('[AdMob] Auto-showing interstitial (80s timer)...');
      const shown = await showInterstitialAd();
      if (!shown) {
        console.log('[AdMob] Interstitial not shown (cooldown or not loaded), will retry on next interval');
      } else {
        console.log('[AdMob] Interstitial shown successfully');
      }
    } catch (e) {
      console.error('[AdMob] auto interstitial error:', e);
    }
  }, INTERSTITIAL_INTERVAL_MS);
  
  console.log('[AdMob] All timers started - Banner: 90s, Interstitial: 80s, Preload: 20s');
}

export function useAdMob(isPremium: boolean = false) {
  const mountedRef = useRef(false);

  // Update global premium ref in an effect to avoid hook ordering issues during HMR
  useEffect(() => {
    globalIsPremiumRef = isPremium;
  }, [isPremium]);

  useEffect(() => {
    // Only run on native platforms; skip AdMob on iOS (evita crash se plugin non configurato)
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'ios') {
      return;
    }

    // Handle premium status change
    if (isPremium) {
      console.log('[AdMob] Premium user detected - disabling all ads');
      disableAds();
      clearAllTimers();
      return;
    } else {
      console.log('[AdMob] Non-premium user - enabling ads');
      enableAds();
    }

    // Initialize only once globally
    const init = async () => {
      if (globalInitialized) {
        // Already initialized, just ensure timers are running
        if (!globalTimersActive && !isPremium) {
          await startAdTimers();
        }
        return;
      }
      
      try {
        console.log('[AdMob] Initializing...');
        await initializeAdMob();
        globalInitialized = true;
        console.log('[AdMob] Initialization complete');

        // Setup app state listener once
        if (!appStateSubscription) {
          const sub = await CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
            if (!isActive) return;
            if (globalIsPremiumRef) return;
            console.log('[AdMob] App resumed - refreshing banner');
            try {
              await showBannerAd();
            } catch (e) {
              console.error('[AdMob] resume showBanner error:', e);
            }
          });
          appStateSubscription = sub;
        }

        // Start timers for non-premium users
        if (!isPremium) {
          await startAdTimers();
        }
      } catch (error) {
        console.error('[AdMob] Initialization error:', error);
      }
    };

    if (!mountedRef.current) {
      mountedRef.current = true;
      init();
    } else if (!globalTimersActive && !isPremium) {
      // Re-enable timers if premium was turned off
      startAdTimers();
    }

    // No cleanup - timers are global and should persist
  }, [isPremium]);

  // Manual trigger for showing interstitial (e.g., on center close)
  const triggerInterstitial = useCallback(async () => {
    if (globalIsPremiumRef) return false;
    return await showInterstitialAd();
  }, []);

  return {
    showBanner: showBannerAd,
    hideBanner: hideBannerAd,
    showInterstitial: showInterstitialAd,
    prepareInterstitial: prepareInterstitialAd,
    triggerInterstitial,
    isNative: Capacitor.isNativePlatform(),
  };
}
