// App Context - Global state management for DialRoad
// HMR rebuild trigger: v2
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { DialysisCenter, mockCenters } from '@/data/mockCenters';
import { useDialysisCenters, useRegions } from '@/hooks/useDialysisCenters';
import { useAuth } from '@/contexts/AuthContext';
import { 
  loadAppState, 
  saveAppState, 
  isResumeSession, 
  markSessionInitialized,
  useStatePersistence,
  PersistedAppState 
} from '@/hooks/useAppState';
import { 
  canViewCenter, 
  markCenterViewed, 
  canSearch, 
  incrementSearchCount,
  isDailyLimitReached 
} from '@/lib/deviceStorage';

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
  centersLoading: boolean;
  centersError: Error | null;
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
  activeTab: 'map' | 'list' | 'settings';
  setActiveTab: (tab: 'map' | 'list' | 'settings') => void;
  isPremium: boolean;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  showLimitModal: boolean;
  setShowLimitModal: (show: boolean) => void;
  trySelectCenter: (center: DialysisCenter | null) => boolean;
  trySearch: (query: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initialize state from persisted data or defaults
function getInitialState() {
  const isResume = isResumeSession();
  const persistedState = loadAppState();
  
  return {
    isResume,
    persistedState,
    // Skip splash if resuming from recent state
    skipSplash: isResume && persistedState !== null
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Get auth state (isPremium now comes from database)
  const { isPremium: authIsPremium, user: authUser } = useAuth();
  
  // Get initial state once
  const [initialState] = useState(getInitialState);
  
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
  
  // Premium state: check dev override first, then auth state, then localStorage fallback
  const isPremium = useMemo(() => {
    // Dev override takes precedence (for testing)
    if (typeof window !== 'undefined') {
      const devOverride = localStorage.getItem('dialroad-premium-override');
      if (devOverride !== null) {
        return devOverride === 'true';
      }
    }
    // Use auth state if logged in
    if (authUser) {
      return authIsPremium;
    }
    // Fallback for non-logged users - use persisted premium status
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dialroad-premium-status');
      if (stored === 'true') return true;
    }
    return false;
  }, [authUser, authIsPremium]);

  // Fetch centers from Supabase with fallback to local data
  const { data: dbCenters, isLoading: centersLoading, error: centersError } = useDialysisCenters();
  const { data: dbRegions } = useRegions();
  
  // Use DB centers if available, otherwise fallback to mockCenters
  const centers = dbCenters && dbCenters.length > 0 ? dbCenters : mockCenters;
  const regions = dbRegions || ['Tutte le Regioni'];
  
  // Restore selected center from persisted state
  const [selectedCenter, setSelectedCenter] = useState<DialysisCenter | null>(() => {
    if (initialState.persistedState?.selectedCenterId) {
      return mockCenters.find(c => c.id === initialState.persistedState!.selectedCenterId) || null;
    }
    return null;
  });
  
  // Restore user location from persisted state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    () => initialState.persistedState?.userLocation || null
  );
  
  // Restore search query from persisted state
  const [searchQuery, setSearchQuery] = useState(
    () => initialState.persistedState?.searchQuery || ''
  );
  
  // Restore selected region from persisted state
  const [selectedRegion, setSelectedRegion] = useState(
    () => initialState.persistedState?.selectedRegion || 'Tutte le Regioni'
  );
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('dialroad-onboarding-seen');
    }
    return true;
  });
  
  // Skip splash if resuming from background
  const [showSplash, setShowSplash] = useState(() => {
    if (initialState.skipSplash) {
      return false;
    }
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('dialroad-splash-seen');
    }
    return true;
  });
  
  // Restore active tab from persisted state
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'settings'>(
    () => initialState.persistedState?.activeTab || 'map'
  );

  // Search focus state for hiding Premium button during search
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Premium limit modal state
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Try to select a center with limit checking
  const trySelectCenter = useCallback((center: DialysisCenter | null): boolean => {
    if (!center) {
      setSelectedCenter(null);
      return true;
    }
    // Premium users bypass limits
    if (isPremium) {
      markCenterViewed(center.id);
      setSelectedCenter(center);
      return true;
    }
    // Check if allowed
    if (!canViewCenter(center.id)) {
      setShowLimitModal(true);
      return false;
    }
    // Mark as viewed and select
    markCenterViewed(center.id);
    setSelectedCenter(center);
    return true;
  }, [isPremium]);

  // Try to search with limit checking
  const trySearch = useCallback((query: string): boolean => {
    // Empty query always allowed
    if (!query.trim()) {
      setSearchQuery(query);
      return true;
    }
    // Premium users bypass limits
    if (isPremium) {
      setSearchQuery(query);
      return true;
    }
    // Check if daily limit reached
    if (isDailyLimitReached()) {
      setShowLimitModal(true);
      return false;
    }
    // Check if can search
    if (!canSearch()) {
      setShowLimitModal(true);
      return false;
    }
    // Increment search count and set query
    incrementSearchCount();
    setSearchQuery(query);
    return true;
  }, [isPremium]);

  useEffect(() => {
    markSessionInitialized();
  }, []);

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
    // Likes are now handled via Supabase - this is a placeholder
    console.log('Toggle like:', centerId);
  }, []);

  const addComment = useCallback((centerId: string, text: string) => {
    // Comments are now handled via Supabase anonymous_comments table
    console.log('Add comment:', centerId, text);
  }, []);

  // Use state persistence hook
  const getStateForPersistence = useCallback((): Omit<PersistedAppState, 'timestamp'> => ({
    activeTab,
    selectedCenterId: selectedCenter?.id || null,
    userLocation,
    searchQuery,
    selectedRegion
  }), [activeTab, selectedCenter, userLocation, searchQuery, selectedRegion]);
  
  useStatePersistence(getStateForPersistence);

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
    
    // Check if query matches a region name (search across all centers, not just filtered)
    const hasRegionMatch = centers.some(center => center.region.toLowerCase().includes(query));
    if (hasRegionMatch) {
      // Return all centers from matching regions
      return centers
        .filter(center => {
          const matchesRegionQuery = center.region.toLowerCase().includes(query);
          const matchesServices = selectedServices.length === 0 ||
            selectedServices.some(service => center.services.includes(service));
          return matchesRegionQuery && matchesServices;
        })
        .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
    }
    
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

  const contextValue = useMemo(() => ({
    isDarkMode,
    toggleDarkMode,
    user,
    centers,
    centersLoading,
    centersError: centersError as Error | null,
    regions,
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
    setShowSplash,
    activeTab,
    setActiveTab,
    isPremium,
    isSearchFocused,
    setIsSearchFocused,
    showLimitModal,
    setShowLimitModal,
    trySelectCenter,
    trySearch
  }), [
    isDarkMode, toggleDarkMode, user, centers, centersLoading, centersError, regions,
    selectedCenter, toggleFavorite, toggleLike, addComment, userLocation, searchQuery,
    selectedRegion, selectedServices, filteredCenters, showOnboarding,
    showSplash, activeTab, isPremium, isSearchFocused,
    showLimitModal, trySelectCenter, trySearch
  ]);

  return (
    <AppContext.Provider value={contextValue}>
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
