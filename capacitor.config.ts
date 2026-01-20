import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dialroad.map',
  appName: 'DialRoad',
  webDir: 'dist',
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
