// Hook for Capacitor app state management to handle cold starts
import { useEffect, useRef, useCallback } from 'react';
import { App, AppState } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

interface AppStateCallbacks {
  onResume?: () => void;
  onPause?: () => void;
}

// Track if app was properly initialized this session
const APP_SESSION_KEY = 'dialroad_app_session';
const APP_STATE_KEY = 'dialroad_app_state';

export interface PersistedAppState {
  activeTab: 'map' | 'list' | 'settings';
  selectedCenterId: string | null;
  userLocation: { lat: number; lng: number } | null;
  searchQuery: string;
  selectedRegion: string;
  timestamp: number;
}

// Check if this is a fresh session or a resume
export function isResumeSession(): boolean {
  if (typeof window === 'undefined') return false;
  
  const sessionId = sessionStorage.getItem(APP_SESSION_KEY);
  const savedState = localStorage.getItem(APP_STATE_KEY);
  
  if (!sessionId && savedState) {
    // No session but saved state exists - this is a resume/cold start
    const state = JSON.parse(savedState) as PersistedAppState;
    const age = Date.now() - state.timestamp;
    // Consider it a resume if state is less than 30 minutes old
    return age < 30 * 60 * 1000;
  }
  
  return false;
}

// Mark session as initialized
export function markSessionInitialized(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(APP_SESSION_KEY, Date.now().toString());
  }
}

// Save app state for persistence
export function saveAppState(state: Omit<PersistedAppState, 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const persistedState: PersistedAppState = {
      ...state,
      timestamp: Date.now()
    };
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(persistedState));
  } catch {
    // Silently fail if localStorage is full
  }
}

// Load persisted app state
export function loadAppState(): PersistedAppState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(APP_STATE_KEY);
    if (!saved) return null;
    
    const state = JSON.parse(saved) as PersistedAppState;
    const age = Date.now() - state.timestamp;
    
    // Only return state if it's less than 30 minutes old
    if (age < 30 * 60 * 1000) {
      return state;
    }
    
    // Clear stale state
    localStorage.removeItem(APP_STATE_KEY);
    return null;
  } catch {
    return null;
  }
}

// Clear persisted app state
export function clearAppState(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(APP_STATE_KEY);
  }
}

// Hook for listening to app state changes
export function useAppState(callbacks: AppStateCallbacks = {}): void {
  const { onResume, onPause } = callbacks;
  const isActiveRef = useRef(true);

  const handleStateChange = useCallback((state: AppState) => {
    if (state.isActive && !isActiveRef.current) {
      // App resumed from background
      isActiveRef.current = true;
      onResume?.();
    } else if (!state.isActive && isActiveRef.current) {
      // App going to background
      isActiveRef.current = false;
      onPause?.();
    }
  }, [onResume, onPause]);

  useEffect(() => {
    // Only set up listeners on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let listenerHandle: { remove: () => void } | undefined;

    const setupListener = async () => {
      try {
        listenerHandle = await App.addListener('appStateChange', handleStateChange);
      } catch (error) {
        console.warn('Failed to set up app state listener:', error);
      }
    };

    setupListener();

    // Cleanup listener on unmount
    return () => {
      listenerHandle?.remove();
    };
  }, [handleStateChange]);
}

// Hook to save state before app goes to background
export function useStatePersistence(
  getState: () => Omit<PersistedAppState, 'timestamp'>
): void {
  const getStateRef = useRef(getState);
  getStateRef.current = getState;

  useEffect(() => {
    // Save state periodically (every 5 seconds when active)
    const intervalId = setInterval(() => {
      saveAppState(getStateRef.current());
    }, 5000);

    // Save on visibility change (for web and PWA)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveAppState(getStateRef.current());
      }
    };

    // Save before unload
    const handleBeforeUnload = () => {
      saveAppState(getStateRef.current());
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Also listen for Capacitor app state
  useAppState({
    onPause: () => {
      saveAppState(getStateRef.current());
    }
  });
}
