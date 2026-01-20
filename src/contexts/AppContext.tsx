// App Context - Global state management for DialRoad
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DialysisCenter, mockCenters } from '@/data/mockCenters';

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
  const [selectedCenter, setSelectedCenter] = useState<DialysisCenter | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Tutte le Regioni');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('dialroad-onboarding-seen');
    }
    return true;
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dialroad-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const toggleFavorite = (centerId: string) => {
    // In a real app, this would update the backend
    console.log('Toggle favorite:', centerId);
  };

  const toggleLike = (centerId: string) => {
    setCenters(prev => prev.map(center => {
      if (center.id === centerId) {
        return { ...center, likes: center.likes + 1 };
      }
      return center;
    }));
  };

  const addComment = (centerId: string, text: string) => {
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
  };

  const filteredCenters = (() => {
    const query = searchQuery.toLowerCase().trim();
    
    // First, filter by region and services
    const baseFiltered = centers.filter(center => {
      const matchesRegion = selectedRegion === 'Tutte le Regioni' || center.region === selectedRegion;
      const matchesServices = selectedServices.length === 0 ||
        selectedServices.some(service => center.services.includes(service));
      return matchesRegion && matchesServices;
    });
    
    if (!query) return baseFiltered;
    
    // Check if query matches any city name
    const hasCityMatch = baseFiltered.some(center => 
      center.city.toLowerCase().includes(query)
    );
    
    // If query matches a city, only show results from that city (exclude address-only matches)
    if (hasCityMatch) {
      return baseFiltered
        .filter(center => 
          center.city.toLowerCase().includes(query) ||
          center.name.toLowerCase().includes(query)
        )
        .sort((a, b) => {
          // Priority 1: Exact city match
          const aCityExact = a.city.toLowerCase() === query;
          const bCityExact = b.city.toLowerCase() === query;
          if (aCityExact && !bCityExact) return -1;
          if (!aCityExact && bCityExact) return 1;
          
          // Priority 2: City starts with query
          const aCityStarts = a.city.toLowerCase().startsWith(query);
          const bCityStarts = b.city.toLowerCase().startsWith(query);
          if (aCityStarts && !bCityStarts) return -1;
          if (!aCityStarts && bCityStarts) return 1;
          
          // Priority 3: City contains query
          const aCityContains = a.city.toLowerCase().includes(query);
          const bCityContains = b.city.toLowerCase().includes(query);
          if (aCityContains && !bCityContains) return -1;
          if (!aCityContains && bCityContains) return 1;
          
          return 0;
        });
    }
    
    // No city match found - search in name and address too
    return baseFiltered
      .filter(center => 
        center.name.toLowerCase().includes(query) ||
        center.city.toLowerCase().includes(query) ||
        center.address.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        // Priority: Name matches first
        const aNameContains = a.name.toLowerCase().includes(query);
        const bNameContains = b.name.toLowerCase().includes(query);
        if (aNameContains && !bNameContains) return -1;
        if (!aNameContains && bNameContains) return 1;
        return 0;
      });
  })();

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
