import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { showBannerAd, hideBannerAd } from '@/lib/admob';

interface AdBannerProps {
  show?: boolean;
}

export function AdBanner({ show = true }: AdBannerProps) {
  const [isNative] = useState(() => Capacitor.isNativePlatform());

  useEffect(() => {
    if (!isNative) return;

    if (show) {
      showBannerAd();
    } else {
      hideBannerAd();
    }

    return () => {
      hideBannerAd();
    };
  }, [show, isNative]);

  // Container wrapper styling
  const containerClasses = "w-full min-h-[50px] h-[50px] z-50 relative";

  // On native platforms, AdMob renders natively above the WebView
  // We just need to add spacing for the banner
  if (!isNative) {
    // Show placeholder on web for development/preview
    return (
      <div className={`${containerClasses} bg-muted/50 border border-dashed border-muted-foreground/30 flex items-center justify-center rounded-lg`}>
        <span className="text-xs text-muted-foreground">Banner Ad Placeholder</span>
      </div>
    );
  }

  // Native banner is rendered by AdMob plugin, we provide spacing
  return <div className={containerClasses} />;
}
