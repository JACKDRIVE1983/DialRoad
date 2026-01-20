import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function useDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleAppUrlOpen = (event: URLOpenListenerEvent) => {
      // Parse the URL
      const url = new URL(event.url);
      
      // Handle password reset deep link
      // Expected format: dialroad://auth?reset=true or https://yourdomain.com/auth?reset=true
      if (url.pathname === '/auth' || url.pathname.includes('/auth')) {
        const resetParam = url.searchParams.get('reset');
        if (resetParam === 'true') {
          navigate('/auth?reset=true');
          return;
        }
        navigate('/auth');
        return;
      }

      // Handle other deep links - navigate to the path
      const slug = url.pathname;
      if (slug) {
        navigate(slug + url.search);
      }
    };

    // Listen for app URL open events (deep links)
    CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen);

    // Check if app was opened with a URL (cold start)
    CapacitorApp.getLaunchUrl().then((result) => {
      if (result?.url) {
        handleAppUrlOpen({ url: result.url });
      }
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [navigate]);
}
