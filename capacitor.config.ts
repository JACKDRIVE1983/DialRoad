import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dialroad.map',
  appName: 'DialRoad',
  webDir: 'dist',
  server: {
    url: 'https://06f106cb-9fa2-4cec-abad-afaaa638c89c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    App: {
      // Enable deep linking
    }
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
