// App Lifecycle Hook - Handles background/foreground transitions and state persistence
import { useEffect, useRef, useCallback } from 'react';
import { App as CapacitorApp, AppState } from '@capacitor/app';

interface AppLifecycleCallbacks {
  onPause?: () => void;
  onResume?: () => void;
  onStateChange?: (isActive: boolean) => void;
}

const APP_STATE_KEY = 'dialroad-app-state';
const STATE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// Persist state to localStorage
export function persistState<T>(key: string, state: T): void {
  try {
    const data = {
      state,
      timestamp: Date.now()
    };
    localStorage.setItem(`${APP_STATE_KEY}-${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to persist state:', e);
  }
}

// Restore state from localStorage
export function restoreState<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`${APP_STATE_KEY}-${key}`);
    if (!raw) return defaultValue;
    
    const data = JSON.parse(raw);
    
    // Check if state has expired
    if (Date.now() - data.timestamp > STATE_EXPIRY_MS) {
      localStorage.removeItem(`${APP_STATE_KEY}-${key}`);
      return defaultValue;
    }
    
    return data.state as T;
  } catch (e) {
    console.warn('Failed to restore state:', e);
    return defaultValue;
  }
}

// Clear persisted state
export function clearPersistedState(key: string): void {
  try {
    localStorage.removeItem(`${APP_STATE_KEY}-${key}`);
  } catch (e) {
    console.warn('Failed to clear state:', e);
  }
}

export function useAppLifecycle(callbacks?: AppLifecycleCallbacks) {
  const isCapacitor = useRef(false);
  const listenerRef = useRef<{ remove: () => void } | null>(null);
  const visibilityListenerRef = useRef<(() => void) | null>(null);

  const handleStateChange = useCallback((state: AppState) => {
    const isActive = state.isActive;
    callbacks?.onStateChange?.(isActive);
    
    if (isActive) {
      callbacks?.onResume?.();
    } else {
      callbacks?.onPause?.();
    }
  }, [callbacks]);

  useEffect(() => {
    // Check if running in Capacitor
    isCapacitor.current = !!(window as any).Capacitor;

    const setupListeners = async () => {
      if (isCapacitor.current) {
        // Capacitor native listener
        try {
          listenerRef.current = await CapacitorApp.addListener('appStateChange', handleStateChange);
        } catch (e) {
          console.warn('Failed to setup Capacitor listener:', e);
        }
      }
      
      // Web visibility API fallback (works in both web and Capacitor)
      const handleVisibilityChange = () => {
        const isActive = document.visibilityState === 'visible';
        callbacks?.onStateChange?.(isActive);
        
        if (isActive) {
          callbacks?.onResume?.();
        } else {
          callbacks?.onPause?.();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      visibilityListenerRef.current = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    };

    setupListeners();

    // Cleanup
    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove();
      }
      if (visibilityListenerRef.current) {
        visibilityListenerRef.current();
      }
    };
  }, [handleStateChange, callbacks]);

  return {
    isCapacitor: isCapacitor.current,
    persistState,
    restoreState,
    clearPersistedState
  };
}
