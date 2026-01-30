// AdMob configuration and utilities
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdOptions, InterstitialAdPluginEvents } from '@capacitor-community/admob';

// AdMob IDs - TESTING MODE (use Google universal test IDs)
const APP_ID = 'ca-app-pub-3940256099942544~3347511713'; // Google test app ID
const BANNER_ID = 'ca-app-pub-3940256099942544/6300978111'; // Google test banner
const INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712'; // Google test interstitial

// Interstitial rate limiting - reduced to 60 seconds for better ad flow
const INTERSTITIAL_COOLDOWN_MS = 60 * 1000;
let lastInterstitialTime = 0;
let interstitialLoaded = false;
let isPreloading = false;

// Global ads disabled flag (for premium users)
let adsDisabled = false;

// AdMob event listeners registered flag
let listenersRegistered = false;

// Ensure we initialize AdMob exactly once, and that every ad call waits for it.
let initPromise: Promise<void> | null = null;

async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = initializeAdMob();
  }
  await initPromise;
}

// Register AdMob event listeners
async function registerListeners(): Promise<void> {
  if (listenersRegistered) return;
  
  try {
    // Listen for interstitial loaded
    await AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
      console.log('[AdMob] Interstitial loaded event received');
      interstitialLoaded = true;
      isPreloading = false;
    });
    
    // Listen for interstitial failed to load
    await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error) => {
      console.error('[AdMob] Interstitial failed to load:', error);
      interstitialLoaded = false;
      isPreloading = false;
      // Retry after 5 seconds
      setTimeout(() => {
        if (!adsDisabled) {
          prepareInterstitialAd();
        }
      }, 5000);
    });
    
    // Listen for interstitial dismissed
    await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      console.log('[AdMob] Interstitial dismissed - preloading next');
      interstitialLoaded = false;
      // Immediately preload next
      setTimeout(() => {
        if (!adsDisabled) {
          prepareInterstitialAd();
        }
      }, 500);
    });
    
    // Listen for interstitial shown
    await AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
      console.log('[AdMob] Interstitial showed');
      interstitialLoaded = false;
    });
    
    listenersRegistered = true;
    console.log('[AdMob] Event listeners registered');
  } catch (e) {
    console.error('[AdMob] Failed to register listeners:', e);
  }
}

// Disable all ads (for premium users)
export function disableAds(): void {
  adsDisabled = true;
  console.log('[AdMob] Ads disabled (premium user)');
  // Hide any existing banner
  hideBannerAd().catch(() => {});
}

// Enable ads (when premium expires or for non-premium users)
export function enableAds(): void {
  adsDisabled = false;
  console.log('[AdMob] Ads enabled');
}

// Check if ads are currently disabled
export function areAdsDisabled(): boolean {
  return adsDisabled;
}

// Initialize AdMob
export async function initializeAdMob(): Promise<void> {
  try {
    await AdMob.initialize({
      testingDevices: [],
      initializeForTesting: false,
    });
    console.log('[AdMob] initialized successfully');
    
    // Register event listeners after init
    await registerListeners();
  } catch (error) {
    console.error('[AdMob] initialization error:', error);
  }
}

// Show banner ad
export async function showBannerAd(): Promise<void> {
  // Skip if ads disabled (premium user)
  if (adsDisabled) {
    console.log('[AdMob] Banner skipped - ads disabled');
    return;
  }
  
  try {
    await ensureInitialized();
    const options: BannerAdOptions = {
      adId: BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: false,
    };
    
    await AdMob.showBanner(options);
    console.log('[AdMob] banner displayed');
  } catch (error) {
    console.error('[AdMob] banner error:', error);
  }
}

// Hide banner ad
export async function hideBannerAd(): Promise<void> {
  try {
    await ensureInitialized();
    await AdMob.hideBanner();
    console.log('[AdMob] banner hidden');
  } catch (error) {
    console.error('[AdMob] hide banner error:', error);
  }
}

// Remove banner ad completely from DOM
export async function removeBannerAd(): Promise<void> {
  try {
    await ensureInitialized();
    await AdMob.removeBanner();
    console.log('[AdMob] banner removed from DOM');
  } catch (error) {
    console.error('[AdMob] remove banner error:', error);
  }
}

// Preload interstitial ad with retry logic
export async function prepareInterstitialAd(): Promise<boolean> {
  // Skip if ads disabled (premium user)
  if (adsDisabled) {
    console.log('[AdMob] Interstitial preload skipped - ads disabled');
    return false;
  }
  
  // Skip if already loaded
  if (interstitialLoaded) {
    console.log('[AdMob] Interstitial already loaded, ready to show');
    return true;
  }
  
  // Skip if already preloading
  if (isPreloading) {
    console.log('[AdMob] Interstitial preload already in progress');
    return false;
  }
  
  isPreloading = true;
  console.log('[AdMob] Starting interstitial preload...');
  
  try {
    await ensureInitialized();
    const options: AdOptions = {
      adId: INTERSTITIAL_ID,
      isTesting: false,
    };
    
    await AdMob.prepareInterstitial(options);
    // Note: interstitialLoaded will be set by the Loaded event listener
    console.log('[AdMob] interstitial prepare called, waiting for load event');
    return true;
  } catch (error) {
    console.error('[AdMob] prepare interstitial error:', error);
    interstitialLoaded = false;
    isPreloading = false;
    return false;
  }
}

// Show interstitial ad with rate limiting and auto-preload
export async function showInterstitialAd(): Promise<boolean> {
  // Skip if ads disabled (premium user)
  if (adsDisabled) {
    console.log('[AdMob] Interstitial skipped - ads disabled');
    return false;
  }
  
  await ensureInitialized();
  const now = Date.now();
  
  // Check cooldown
  if (now - lastInterstitialTime < INTERSTITIAL_COOLDOWN_MS) {
    const remainingMs = INTERSTITIAL_COOLDOWN_MS - (now - lastInterstitialTime);
    console.log(`[AdMob] interstitial on cooldown, ${Math.ceil(remainingMs / 1000)}s remaining`);
    return false;
  }
  
  // Check if ad is loaded, try to preload if not
  if (!interstitialLoaded) {
    console.log('[AdMob] interstitial not loaded, attempting preload...');
    await prepareInterstitialAd();
    // Wait a bit for the ad to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!interstitialLoaded) {
      console.log('[AdMob] Still not loaded after wait, will retry later');
      return false;
    }
  }
  
  try {
    console.log('[AdMob] Showing interstitial...');
    await AdMob.showInterstitial();
    lastInterstitialTime = now;
    interstitialLoaded = false;
    console.log('[AdMob] interstitial shown successfully');
    return true;
  } catch (error) {
    console.error('[AdMob] show interstitial error:', error);
    interstitialLoaded = false;
    
    // Try to preload again after failure
    setTimeout(() => {
      prepareInterstitialAd();
    }, 2000);
    
    return false;
  }
}

// Check if interstitial can be shown (not on cooldown)
export function canShowInterstitial(): boolean {
  if (adsDisabled) return false;
  return Date.now() - lastInterstitialTime >= INTERSTITIAL_COOLDOWN_MS;
}

// Check if interstitial is ready to show
export function isInterstitialReady(): boolean {
  return interstitialLoaded && !adsDisabled;
}
