// App Context - Global state management for DialRoad with persistence
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode, useRef } from 'react';
import { DialysisCenter, mockCenters } from '@/data/mockCenters';
import { useAppLifecycle, persistState, restoreState } from '@/hooks/useAppLifecycle';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  favorites: string[];
  likedCenters: string[];
}

interface AppContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  user: User | null;
  centers: DialysisCenter[];
  selectedCenter: DialysisCenter | null;
  setSelectedCenter: (center: DialysisCenter | null) => void;
  toggleFavorite: (centerId: string) => void;
  toggleLike: (centerId: string) => void;
  addComment: (centerId: string, text: string) => void;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  selectedServices: string[];
  setSelectedServices: (services: string[]) => void;
  filteredCenters: DialysisCenter[];
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  showSplash: boolean;
  setShowSplash: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// State persistence keys
const PERSISTENCE_KEYS = {
  selectedCenterId: 'selected-center-id',
  searchQuery: 'search-query',
  selectedRegion: 'selected-region',
  activeTab: 'active-tab',
  userLocation: 'user-location'
} as const;

export function AppProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dialroad-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  const [user] = useState<User>({
    id: 'demo-user',
    name: 'Utente Demo',
    email: 'demo@dialroad.it',
    favorites: [],
    likedCenters: []
  });

  const [centers, setCenters] = useState<DialysisCenter[]>(mockCenters);
  
  // Restore selected center from persistence
  const [selectedCenter, setSelectedCenterRaw] = useState<DialysisCenter | null>(() => {
    const savedId = restoreState<string | null>(PERSISTENCE_KEYS.selectedCenterId, null);
    if (savedId) {
      return mockCenters.find(c => c.id === savedId) || null;
    }
    return null;
  });
  
  // Restore user location from persistence
  const [userLocation, setUserLocationRaw] = useState<{ lat: number; lng: number } | null>(() => {
    return restoreState<{ lat: number; lng: number } | null>(PERSISTENCE_KEYS.userLocation, null);
  });
  
  // Restore search/filter state
  const [searchQuery, setSearchQueryRaw] = useState(() => {
    return restoreState<string>(PERSISTENCE_KEYS.searchQuery, '');
  });
  
  const [selectedRegion, setSelectedRegionRaw] = useState(() => {
    return restoreState<string>(PERSISTENCE_KEYS.selectedRegion, 'Tutte le Regioni');
  });
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('dialroad-onboarding-seen');
    }
    return true;
  });
  
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('dialroad-splash-seen');
    }
    return true;
  });

  // Wrapped setters with persistence
  const setSelectedCenter = useCallback((center: DialysisCenter | null) => {
    setSelectedCenterRaw(center);
    persistState(PERSISTENCE_KEYS.selectedCenterId, center?.id || null);
  }, []);
  
  const setUserLocation = useCallback((location: { lat: number; lng: number } | null) => {
    setUserLocationRaw(location);
    if (location) {
      persistState(PERSISTENCE_KEYS.userLocation, location);
    }
  }, []);
  
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryRaw(query);
    persistState(PERSISTENCE_KEYS.searchQuery, query);
  }, []);
  
  const setSelectedRegion = useCallback((region: string) => {
    setSelectedRegionRaw(region);
    persistState(PERSISTENCE_KEYS.selectedRegion, region);
  }, []);

  // App lifecycle handling - persist on background, restore on foreground
  useAppLifecycle({
    onPause: () => {
      // Persist current state when app goes to background
      persistState(PERSISTENCE_KEYS.selectedCenterId, selectedCenter?.id || null);
      persistState(PERSISTENCE_KEYS.searchQuery, searchQuery);
      persistState(PERSISTENCE_KEYS.selectedRegion, selectedRegion);
      if (userLocation) {
        persistState(PERSISTENCE_KEYS.userLocation, userLocation);
      }
    },
    onResume: () => {
      // State is already restored from initialization
      console.log('App resumed');
    }
  });

  // Persist splash completion to sessionStorage
  useEffect(() => {
    if (!showSplash && typeof window !== 'undefined') {
      sessionStorage.setItem('dialroad-splash-seen', 'true');
    }
  }, [showSplash]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dialroad-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => setIsDarkMode(prev => !prev), []);

  const toggleFavorite = useCallback((centerId: string) => {
    console.log('Toggle favorite:', centerId);
  }, []);

  const toggleLike = useCallback((centerId: string) => {
    setCenters(prev => prev.map(center => {
      if (center.id === centerId) {
        return { ...center, likes: center.likes + 1 };
      }
      return center;
    }));
  }, []);

  const addComment = useCallback((centerId: string, text: string) => {
    setCenters(prev => prev.map(center => {
      if (center.id === centerId) {
        const newComment = {
          id: `c-${Date.now()}`,
          userId: user?.id || 'anonymous',
          userName: user?.name || 'Anonimo',
          text,
          createdAt: new Date().toISOString().split('T')[0],
          likes: 0
        };
        return { ...center, comments: [newComment, ...center.comments] };
      }
      return center;
    }));
  }, [user]);

  // Memoized filtered centers to prevent recalculation
  const filteredCenters = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    // First, filter by region and services
    const baseFiltered = centers.filter(center => {
      const matchesRegion = selectedRegion === 'Tutte le Regioni' || center.region === selectedRegion;
      const matchesServices = selectedServices.length === 0 ||
        selectedServices.some(service => center.services.includes(service));
      return matchesRegion && matchesServices;
    });
    
    if (!query) return baseFiltered;
    
    const hasExactCityMatch = baseFiltered.some(center => center.city.toLowerCase() === query);
    const hasStartsWithCityMatch = baseFiltered.some(center => center.city.toLowerCase().startsWith(query));
    const hasContainsCityMatch = baseFiltered.some(center => center.city.toLowerCase().includes(query));

    if (hasExactCityMatch) {
      return baseFiltered
        .filter(center => center.city.toLowerCase() === query)
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    if (hasStartsWithCityMatch) {
      return baseFiltered
        .filter(center => center.city.toLowerCase().startsWith(query))
        .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
    }

    if (hasContainsCityMatch) {
      return baseFiltered
        .filter(center =>
          center.city.toLowerCase().includes(query) ||
          center.name.toLowerCase().includes(query)
        )
        .sort((a, b) => {
          const aCity = a.city.toLowerCase().includes(query);
          const bCity = b.city.toLowerCase().includes(query);
          if (aCity && !bCity) return -1;
          if (!aCity && bCity) return 1;
          return a.name.localeCompare(b.name);
        });
    }
    
    return baseFiltered
      .filter(center => 
        center.name.toLowerCase().includes(query) ||
        center.address.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        const aNameContains = a.name.toLowerCase().includes(query);
        const bNameContains = b.name.toLowerCase().includes(query);
        if (aNameContains && !bNameContains) return -1;
        if (!aNameContains && bNameContains) return 1;
        return 0;
      });
  }, [centers, searchQuery, selectedRegion, selectedServices]);

  return (
    <AppContext.Provider value={{
      isDarkMode,
      toggleDarkMode,
      user,
      centers,
      selectedCenter,
      setSelectedCenter,
      toggleFavorite,
      toggleLike,
      addComment,
      userLocation,
      setUserLocation,
      searchQuery,
      setSearchQuery,
      selectedRegion,
      setSelectedRegion,
      selectedServices,
      setSelectedServices,
      filteredCenters,
      showOnboarding,
      setShowOnboarding,
      showSplash,
      setShowSplash
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
