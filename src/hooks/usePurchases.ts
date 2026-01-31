import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// RevenueCat types
interface CustomerInfo {
  entitlements: {
    active: Record<string, unknown>;
  };
}

interface Package {
  identifier: string;
  product: {
    priceString: string;
    title: string;
    description: string;
  };
}

interface Offering {
  identifier: string;
  availablePackages: Package[];
}

// Lazy load RevenueCat only on native platforms
let Purchases: any = null;

const loadPurchases = async () => {
  if (Capacitor.isNativePlatform() && !Purchases) {
    const module = await import('@revenuecat/purchases-capacitor');
    Purchases = module.Purchases;
  }
  return Purchases;
};

// RevenueCat API Keys
const REVENUECAT_API_KEY_ANDROID = 'test_gQALiNRvyVpDkWFIjhOeIPMCKbq';
const REVENUECAT_API_KEY_IOS = 'YOUR_REVENUECAT_IOS_API_KEY'; // Da configurare quando disponibile

// Premium entitlement identifier (configure in RevenueCat dashboard)
const PREMIUM_ENTITLEMENT_ID = 'premium';

export function usePurchases() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize RevenueCat
  useEffect(() => {
    const initPurchases = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.log('Purchases: Not running on native platform, skipping initialization');
        return;
      }

      try {
        const PurchasesModule = await loadPurchases();
        if (!PurchasesModule) return;

        const platform = Capacitor.getPlatform();
        const apiKey = platform === 'android' ? REVENUECAT_API_KEY_ANDROID : REVENUECAT_API_KEY_IOS;

        await PurchasesModule.configure({
          apiKey,
        });

        setIsInitialized(true);
        console.log('RevenueCat initialized successfully');

        // Check initial premium status
        await checkPremiumStatus();
        
        // Load offerings
        await loadOfferings();
      } catch (err) {
        console.error('Failed to initialize RevenueCat:', err);
        setError('Failed to initialize purchases');
      }
    };

    initPurchases();
  }, []);

  // Sync premium status to Supabase
  const syncPremiumToSupabase = useCallback(async (hasPremium: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user, skipping Supabase sync');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: hasPremium, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to sync premium status to Supabase:', error);
      } else {
        console.log('Premium status synced to Supabase:', hasPremium);
      }
    } catch (err) {
      console.error('Error syncing premium to Supabase:', err);
    }
  }, []);

  // Check if user has premium entitlement
  const checkPremiumStatus = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const PurchasesModule = await loadPurchases();
      if (!PurchasesModule) return false;

      const { customerInfo } = await PurchasesModule.getCustomerInfo();
      const hasPremium = PREMIUM_ENTITLEMENT_ID in (customerInfo?.entitlements?.active || {});
      setIsPremium(hasPremium);
      
      // Sync to Supabase
      await syncPremiumToSupabase(hasPremium);
      
      return hasPremium;
    } catch (err) {
      console.error('Failed to check premium status:', err);
      return false;
    }
  }, [syncPremiumToSupabase]);

  // Load available offerings/packages
  const loadOfferings = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const PurchasesModule = await loadPurchases();
      if (!PurchasesModule) return;

      const { offerings: offeringsData } = await PurchasesModule.getOfferings();
      if (offeringsData?.all) {
        setOfferings(Object.values(offeringsData.all) as Offering[]);
      }
    } catch (err) {
      console.error('Failed to load offerings:', err);
    }
  }, []);

  // Purchase a package
  const purchasePackage = useCallback(async (packageToPurchase: Package) => {
    if (!Capacitor.isNativePlatform()) {
      setError('Purchases only available on mobile devices');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const PurchasesModule = await loadPurchases();
      if (!PurchasesModule) {
        setError('Purchases not initialized');
        return false;
      }

      const { customerInfo } = await PurchasesModule.purchasePackage({
        aPackage: packageToPurchase,
      });

      const hasPremium = PREMIUM_ENTITLEMENT_ID in (customerInfo?.entitlements?.active || {});
      setIsPremium(hasPremium);
      
      // Sync to Supabase after successful purchase
      if (hasPremium) {
        await syncPremiumToSupabase(true);
      }
      
      return hasPremium;
    } catch (err: any) {
      // User cancelled is not an error
      if (err?.code === 'PURCHASE_CANCELLED') {
        console.log('Purchase cancelled by user');
        return false;
      }
      console.error('Purchase failed:', err);
      setError(err?.message || 'Purchase failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [syncPremiumToSupabase]);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setError('Purchases only available on mobile devices');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const PurchasesModule = await loadPurchases();
      if (!PurchasesModule) {
        setError('Purchases not initialized');
        return false;
      }

      const { customerInfo } = await PurchasesModule.restorePurchases();
      const hasPremium = PREMIUM_ENTITLEMENT_ID in (customerInfo?.entitlements?.active || {});
      setIsPremium(hasPremium);
      
      // Sync to Supabase after restore
      await syncPremiumToSupabase(hasPremium);
      
      return hasPremium;
    } catch (err: any) {
      console.error('Restore failed:', err);
      setError(err?.message || 'Restore failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [syncPremiumToSupabase]);

  // Identify user (link RevenueCat with your user system)
  const identifyUser = useCallback(async (userId: string) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const PurchasesModule = await loadPurchases();
      if (!PurchasesModule) return;

      await PurchasesModule.logIn({ appUserID: userId });
      await checkPremiumStatus();
    } catch (err) {
      console.error('Failed to identify user:', err);
    }
  }, [checkPremiumStatus]);

  // Logout user
  const logoutUser = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const PurchasesModule = await loadPurchases();
      if (!PurchasesModule) return;

      await PurchasesModule.logOut();
      setIsPremium(false);
    } catch (err) {
      console.error('Failed to logout user:', err);
    }
  }, []);

  return {
    isInitialized,
    isPremium,
    offerings,
    isLoading,
    error,
    purchasePackage,
    restorePurchases,
    checkPremiumStatus,
    identifyUser,
    logoutUser,
  };
}
