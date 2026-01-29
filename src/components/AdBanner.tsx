import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { showBannerAd, hideBannerAd } from '@/lib/admob';

interface AdBannerProps {
  show?: boolean;
}

export function AdBanner({ show = true }: AdBannerProps) {
  const [isNative] = useState(() => Capacitor.isNativePlatform());

  useEffect(() => {
    // On native platforms the real banner is rendered by the AdMob plugin.
    // IMPORTANT: do not call hideBannerAd() in a React cleanup here.
    // In React 18 (dev/StrictMode) effects are mounted/unmounted twice, which can
    // accidentally hide the native banner a few seconds after startup.
    if (!isNative) return;

    if (show) showBannerAd();
    else hideBannerAd();

    // No cleanup on purpose.
  }, [show, isNative]);

  // On native platforms, AdMob renders natively above the WebView
  // We just need to add spacing for the banner
  if (!isNative) {
    // Show placeholder on web for development/preview
    return (
      <div className="w-full h-14 bg-muted/50 border border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Banner Ad Placeholder</span>
      </div>
    );
  }

  // Native banner is rendered by AdMob plugin, we provide spacing
  return <div className="w-full h-14" />;
}
