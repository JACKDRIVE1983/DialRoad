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
      // Expected format: dialroad://reset-password?token=...&type=recovery
      // or dialroad://auth?reset=true&token=...&type=recovery (legacy)
      const token = url.searchParams.get('token');
      const type = url.searchParams.get('type');
      const resetParam = url.searchParams.get('reset');
      
      // Check if this is a password reset link
      if (url.pathname === '/reset-password' || url.pathname.includes('/reset-password')) {
        const qs = new URLSearchParams();
        if (token) qs.set('token', token);
        if (type) qs.set('type', type);
        navigate(`/reset-password?${qs.toString()}`);
        return;
      }
      
      // Legacy: handle /auth with reset=true
      if ((url.pathname === '/auth' || url.pathname.includes('/auth')) && resetParam === 'true') {
        const qs = new URLSearchParams();
        if (token) qs.set('token', token);
        if (type) qs.set('type', type);
        navigate(`/reset-password?${qs.toString()}`);
        return;
      }
      
      if (url.pathname === '/auth' || url.pathname.includes('/auth')) {
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
