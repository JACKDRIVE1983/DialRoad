// AdMob configuration and utilities
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdOptions, AdLoadInfo, InterstitialAdPluginEvents } from '@capacitor-community/admob';

// AdMob IDs
const APP_ID = 'ca-app-pub-1836089076727059~3797268338';
const BANNER_ID = 'ca-app-pub-1836089076727059/4591535320';
const INTERSTITIAL_ID = 'ca-app-pub-1836089076727059/6044157721';

// Interstitial rate limiting (1.5 minutes = 90000ms)
const INTERSTITIAL_COOLDOWN_MS = 1.5 * 60 * 1000;
let lastInterstitialTime = 0;
let interstitialLoaded = false;

// Initialize AdMob
export async function initializeAdMob(): Promise<void> {
  try {
    await AdMob.initialize({
      testingDevices: [],
      initializeForTesting: false,
    });
    console.log('AdMob initialized successfully');
  } catch (error) {
    console.error('AdMob initialization error:', error);
  }
}

// Show banner ad
export async function showBannerAd(): Promise<void> {
  try {
    const options: BannerAdOptions = {
      adId: BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.TOP_CENTER,
      margin: 120, // Positioned below header area
      isTesting: false,
    };
    
    await AdMob.showBanner(options);
    console.log('Banner ad displayed');
  } catch (error) {
    console.error('Banner ad error:', error);
  }
}

// Hide banner ad
export async function hideBannerAd(): Promise<void> {
  try {
    await AdMob.hideBanner();
  } catch (error) {
    console.error('Hide banner error:', error);
  }
}

// Preload interstitial ad
export async function prepareInterstitialAd(): Promise<void> {
  try {
    const options: AdOptions = {
      adId: INTERSTITIAL_ID,
      isTesting: false,
    };
    
    await AdMob.prepareInterstitial(options);
    interstitialLoaded = true;
    console.log('Interstitial ad prepared');
  } catch (error) {
    console.error('Prepare interstitial error:', error);
    interstitialLoaded = false;
  }
}

// Show interstitial ad with rate limiting (max once every 3 minutes)
export async function showInterstitialAd(): Promise<boolean> {
  const now = Date.now();
  
  // Check cooldown
  if (now - lastInterstitialTime < INTERSTITIAL_COOLDOWN_MS) {
    console.log('Interstitial on cooldown, skipping...');
    return false;
  }
  
  // Check if ad is loaded
  if (!interstitialLoaded) {
    console.log('Interstitial not loaded, preparing...');
    await prepareInterstitialAd();
    if (!interstitialLoaded) {
      return false;
    }
  }
  
  try {
    await AdMob.showInterstitial();
    lastInterstitialTime = now;
    interstitialLoaded = false;
    
    // Prepare next interstitial in background
    setTimeout(() => {
      prepareInterstitialAd();
    }, 1000);
    
    console.log('Interstitial ad shown');
    return true;
  } catch (error) {
    console.error('Show interstitial error:', error);
    interstitialLoaded = false;
    return false;
  }
}

// Check if interstitial can be shown (not on cooldown)
export function canShowInterstitial(): boolean {
  return Date.now() - lastInterstitialTime >= INTERSTITIAL_COOLDOWN_MS;
}
