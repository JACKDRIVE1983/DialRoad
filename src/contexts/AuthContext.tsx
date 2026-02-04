// AuthContext - Supabase authentication with session persistence
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_premium: boolean;
  first_name: string | null;
  last_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isPremium: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Key for persisting premium status
const PREMIUM_STATUS_KEY = 'dialroad-premium-status';
const PREMIUM_ENTITLEMENT_ID = 'premium';

// Get initial premium status from localStorage
// PRIORITY: override (highest) > stored status
const getInitialPremiumFromStorage = (): boolean => {
  try {
    // Check override FIRST (highest priority - never gets reset)
    const override = localStorage.getItem('dialroad-premium-override');
    if (override === 'true') return true;
    // Then check stored status
    const stored = localStorage.getItem(PREMIUM_STATUS_KEY);
    if (stored === 'true') return true;
  } catch {}
  return false;
};

// Restore purchases from RevenueCat and sync to Supabase (skip su iOS se RevenueCat non configurato)
const restorePurchasesAndSync = async (userId: string): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  if (Capacitor.getPlatform() === 'ios') return false; // RevenueCat iOS non configurato
  try {
    console.log('🔄 Restoring purchases for user:', userId);
    
    // First, identify the user to RevenueCat
    await Purchases.logIn({ appUserID: userId });
    console.log('🔄 User identified to RevenueCat');
    
    // Then restore purchases
    const { customerInfo } = await Purchases.restorePurchases();
    console.log('🔄 Restore result:', JSON.stringify(customerInfo?.entitlements?.active, null, 2));
    
    const activeEntitlements = customerInfo?.entitlements?.active || {};
    const hasPremium = PREMIUM_ENTITLEMENT_ID in activeEntitlements || Object.keys(activeEntitlements).length > 0;
    
    console.log('🔄 Has premium after restore:', hasPremium);
    
    if (hasPremium) {
      // Persist to localStorage
      localStorage.setItem(PREMIUM_STATUS_KEY, 'true');
      
      // Sync to Supabase
      await supabase
        .from('profiles')
        .update({ is_premium: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      
      console.log('🔄 Premium status restored and synced!');
    }
    
    return hasPremium;
  } catch (err) {
    console.error('🔄 Failed to restore purchases:', err);
    return false;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Initialize premium from localStorage to prevent flash when resuming
  const [isPremiumState, setIsPremiumState] = useState(getInitialPremiumFromStorage);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      const profileData = data as UserProfile;
      // Update premium state and persist to localStorage
      const newPremium = profileData.is_premium ?? false;
      setIsPremiumState(newPremium);
      try {
        localStorage.setItem(PREMIUM_STATUS_KEY, newPremium ? 'true' : 'false');
      } catch {}
      return profileData;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  }, [user, fetchProfile]);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(async () => {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
            
            // On SIGNED_IN event, restore purchases from RevenueCat
            if (event === 'SIGNED_IN') {
              console.log('🔐 User signed in, restoring purchases...');
              const hasPremium = await restorePurchasesAndSync(session.user.id);
              if (hasPremium) {
                setIsPremiumState(true);
              }
            }
          }, 0);
        } else {
          setProfile(null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
        
        // Also restore purchases on app startup if user is already logged in
        // This handles the reinstall case
        const storedPremium = getInitialPremiumFromStorage();
        if (!storedPremium) {
          console.log('🔐 App startup: checking RevenueCat for premium...');
          const hasPremium = await restorePurchasesAndSync(session.user.id);
          if (hasPremium) {
            setIsPremiumState(true);
          }
        }
        
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    // Logout from RevenueCat as well (solo Android, iOS non ha RevenueCat configurato)
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      try {
        await Purchases.logOut();
      } catch {}
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    // Reset premium state on logout
    setIsPremiumState(false);
    try {
      localStorage.setItem(PREMIUM_STATUS_KEY, 'false');
      localStorage.removeItem('dialroad-premium-override');
    } catch {}
  }, []);

  // Use persisted premium state (not profile which can be null during loading)
  const isPremium = isPremiumState;

  const value = {
    user,
    session,
    profile,
    isLoading,
    isPremium,
    signUp,
    signIn,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
