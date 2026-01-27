import { useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface AdBannerProps {
  show?: boolean;
}

export function AdBanner({ show = true }: AdBannerProps) {
  const [isNative] = useState(() => Capacitor.isNativePlatform());

  // Container wrapper styling
  const containerClasses = "w-full min-h-[50px] h-[50px] z-50 relative";

  // IMPORTANT:
  // On native platforms, the AdMob plugin renders the banner outside the WebView.
  // This component should ONLY reserve space in the UI, otherwise multiple mounts/unmounts
  // across screens can accidentally hide the native banner.

  if (!show) return null;

  // Show placeholder on web for development/preview
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
