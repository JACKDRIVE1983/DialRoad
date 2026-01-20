import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function useDeepLinks() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasHandledLaunchUrl = useRef(false);

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const processDeepLink = (url: string) => {
      console.log('[DeepLink] Processing URL:', url);
      
      try {
        const parsedUrl = new URL(url);
        const token = parsedUrl.searchParams.get('token');
        const type = parsedUrl.searchParams.get('type');
        
        console.log('[DeepLink] Parsed:', { 
          pathname: parsedUrl.pathname, 
          token: token ? 'present' : 'missing', 
          type 
        });

        // If we have token and type, it's a password reset - navigate immediately
        if (token && type === 'recovery') {
          const targetPath = `/reset-password?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`;
          console.log('[DeepLink] Navigating to reset-password');
          navigate(targetPath, { replace: true });
          return true;
        }

        // Handle explicit /reset-password path
        if (parsedUrl.pathname === '/reset-password' || parsedUrl.pathname.includes('/reset-password')) {
          const qs = new URLSearchParams();
          if (token) qs.set('token', token);
          if (type) qs.set('type', type);
          navigate(`/reset-password?${qs.toString()}`, { replace: true });
          return true;
        }

        // Handle /auth path
        if (parsedUrl.pathname === '/auth' || parsedUrl.pathname.includes('/auth')) {
          navigate('/auth', { replace: true });
          return true;
        }

        // Handle other paths
        const slug = parsedUrl.pathname;
        if (slug && slug !== '/') {
          navigate(slug + parsedUrl.search, { replace: true });
          return true;
        }
      } catch (e) {
        console.error('[DeepLink] Error parsing URL:', e);
      }
      
      return false;
    };

    const handleAppUrlOpen = (event: URLOpenListenerEvent) => {
      console.log('[DeepLink] appUrlOpen event:', event.url);
      processDeepLink(event.url);
    };

    // Listen for app URL open events (deep links while app is running)
    CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen);

    // Check if app was opened with a URL (cold start) - only once
    if (!hasHandledLaunchUrl.current) {
      hasHandledLaunchUrl.current = true;
      
      CapacitorApp.getLaunchUrl().then((result) => {
        if (result?.url) {
          console.log('[DeepLink] Launch URL detected:', result.url);
          // Small delay to ensure router is ready
          setTimeout(() => {
            processDeepLink(result.url);
          }, 100);
        }
      });
    }

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [navigate, location]);
}
