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
    allowMixedContent: true,
    // Preserve WebView state during external activities
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: 'automatic'
  },
  server: {
    // Enable hardware back button handling
    androidScheme: 'https',
    // Allow navigation to external domains when opened from inside the WebView
    // (useful for <a target="_blank"> links on native)
    allowNavigation: [
      'www.booking.com',
      'booking.com',
      'www.google.com',
      'google.com'
    ]
  }
};

export default config;
