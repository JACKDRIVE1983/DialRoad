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
      const saved = localStorage.getItem('dialmap-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  const [user] = useState<User>({
    id: 'demo-user',
    name: 'Utente Demo',
    email: 'demo@dialmap.it',
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
      return !localStorage.getItem('dialmap-onboarding-seen');
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
    localStorage.setItem('dialmap-theme', isDarkMode ? 'dark' : 'light');
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

  const filteredCenters = centers.filter(center => {
    const matchesSearch = center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRegion = selectedRegion === 'Tutte le Regioni' || center.region === selectedRegion;
    
    const matchesServices = selectedServices.length === 0 ||
      selectedServices.some(service => center.services.includes(service));
    
    return matchesSearch && matchesRegion && matchesServices;
  });

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
