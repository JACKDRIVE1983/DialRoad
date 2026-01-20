import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function useDeepLinks() {
  const navigate = useNavigate();
  const hasHandledLaunchUrl = useRef(false);

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const processDeepLink = (url: string) => {
      console.log('[DeepLink] Processing URL:', url);
      try {
        localStorage.setItem('last_deeplink_url', url);
        localStorage.setItem('last_deeplink_at', new Date().toISOString());
      } catch {
        // ignore
      }
      
      try {
        const parsedUrl = new URL(url);
        // Supabase may send recovery data as query params OR hash fragment.
        // Also, for custom schemes (dialroad://reset-password) the "path" may appear
        // in the hostname, not pathname.
        const mergedParams = new URLSearchParams(parsedUrl.searchParams);
        if (parsedUrl.hash?.startsWith('#')) {
          const hashParams = new URLSearchParams(parsedUrl.hash.slice(1));
          for (const [k, v] of hashParams.entries()) {
            if (!mergedParams.has(k)) mergedParams.set(k, v);
          }
        }

        const token = mergedParams.get('token') || mergedParams.get('token_hash');
        const type = mergedParams.get('type');
        const host = parsedUrl.hostname;
        const pathname = parsedUrl.pathname;

        // Normalize route: dialroad://reset-password?... => hostname="reset-password", pathname="/"
        const looksLikeResetRoute =
          pathname === '/reset-password' ||
          pathname.includes('/reset-password') ||
          host === 'reset-password';

        const looksLikeAuthRoute =
          pathname === '/auth' || pathname.includes('/auth') || host === 'auth';
        
        const parsedDebug = {
          pathname,
          host,
          token: token ? 'present' : 'missing', 
          type 
        };
        console.log('[DeepLink] Parsed:', parsedDebug);
        try {
          localStorage.setItem('last_deeplink_parsed', JSON.stringify(parsedDebug));
        } catch {
          // ignore
        }

        // Password reset: navigate even if token is missing (so user sees the reset page + error state).
        if (looksLikeResetRoute || (token && type === 'recovery')) {
          const qs = new URLSearchParams();
          for (const [k, v] of mergedParams.entries()) qs.set(k, v);
          console.log('[DeepLink] Navigating to /reset-password');
          navigate(`/reset-password?${qs.toString()}`, { replace: true });
          return true;
        }

        // Auth
        if (looksLikeAuthRoute) {
          navigate('/auth', { replace: true });
          return true;
        }

        // Handle other paths
        const slug = pathname;
        if (slug && slug !== '/') {
          navigate(slug + (mergedParams.toString() ? `?${mergedParams.toString()}` : ''), { replace: true });
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
         console.log('[DeepLink] getLaunchUrl result:', result?.url || null);
         try {
           localStorage.setItem('last_launch_url', result?.url || '');
           localStorage.setItem('last_launch_at', new Date().toISOString());
         } catch {
           // ignore
         }

         if (result?.url) {
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
  }, [navigate]);
}
