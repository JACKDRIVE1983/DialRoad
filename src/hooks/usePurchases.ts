import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
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

// RevenueCat API Keys
const REVENUECAT_API_KEY_ANDROID = 'goog_NbbhUoXjXBlgPazVIsUOgpITUNX';
const REVENUECAT_API_KEY_IOS = 'YOUR_REVENUECAT_IOS_API_KEY'; // Da configurare quando disponibile

// Premium entitlement identifier (configure in RevenueCat dashboard)
const PREMIUM_ENTITLEMENT_ID = 'premium';

export function usePurchases() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const { customerInfo } = await Purchases.getCustomerInfo();
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
    console.log('🛒 loadOfferings called');
    if (!Capacitor.isNativePlatform()) {
      console.log('🛒 Not native, skipping offerings');
      return;
    }

    try {
      console.log('🛒 Fetching offerings from RevenueCat...');
      const result: any = await Purchases.getOfferings();
      console.log('🛒 Raw offerings result:', JSON.stringify(result, null, 2));
      
      // RevenueCat returns { offerings: PurchasesOfferings } or just PurchasesOfferings
      const offeringsData = result?.offerings || result;
      console.log('🛒 offeringsData:', JSON.stringify(offeringsData, null, 2));
      console.log('🛒 offeringsData.all:', offeringsData?.all);
      console.log('🛒 offeringsData.current:', JSON.stringify(offeringsData?.current, null, 2));
      
      if (offeringsData?.all && Object.keys(offeringsData.all).length > 0) {
        const allOfferings = Object.values(offeringsData.all) as Offering[];
        console.log('🛒 Parsed offerings count:', allOfferings.length);
        console.log('🛒 Parsed offerings:', JSON.stringify(allOfferings, null, 2));
        setOfferings(allOfferings);
      } else {
        console.warn('🛒 No offerings found! Make sure you have created an Offering in RevenueCat dashboard');
        console.warn('🛒 Go to RevenueCat > Offerings > Create a "default" offering and attach your product');
      }
    } catch (err) {
      console.error('🛒 Failed to load offerings:', err);
    }
  }, []);

  // Initialize RevenueCat
  useEffect(() => {
    const initPurchases = async () => {
      console.log('🛒 Purchases: Starting initialization...');
      console.log('🛒 Is native platform:', Capacitor.isNativePlatform());
      console.log('🛒 Platform:', Capacitor.getPlatform());
      
      if (!Capacitor.isNativePlatform()) {
        console.log('🛒 Purchases: Not running on native platform, skipping initialization');
        return;
      }

      try {
        const platform = Capacitor.getPlatform();
        const apiKey = platform === 'android' ? REVENUECAT_API_KEY_ANDROID : REVENUECAT_API_KEY_IOS;
        console.log('🛒 Using API key for platform:', platform);

        console.log('🛒 Configuring RevenueCat...');
        await Purchases.configure({
          apiKey,
        });

        setIsInitialized(true);
        console.log('🛒 RevenueCat initialized successfully!');

        // Check initial premium status
        console.log('🛒 Checking premium status...');
        await checkPremiumStatus();
        
        // Load offerings
        console.log('🛒 Loading offerings...');
        await loadOfferings();
        console.log('🛒 Initialization complete!');
      } catch (err) {
        console.error('🛒 Failed to initialize RevenueCat:', err);
        setError('Failed to initialize purchases');
      }
    };

    initPurchases();
  }, [checkPremiumStatus, loadOfferings]);

  // Purchase a package
  const purchasePackage = useCallback(async (packageToPurchase: any) => {
    console.log('🛒 purchasePackage called with:', JSON.stringify(packageToPurchase, null, 2));
    
    if (!Capacitor.isNativePlatform()) {
      console.log('🛒 Not native platform, cannot purchase');
      setError('Purchases only available on mobile devices');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🛒 Calling purchasePackage on RevenueCat...');
      const { customerInfo }: any = await Purchases.purchasePackage({
        aPackage: packageToPurchase,
      });
      
      console.log('🛒 Purchase response - customerInfo:', JSON.stringify(customerInfo, null, 2));

      const hasPremium = PREMIUM_ENTITLEMENT_ID in (customerInfo?.entitlements?.active || {});
      console.log('🛒 Has premium after purchase:', hasPremium);
      setIsPremium(hasPremium);
      
      // Sync to Supabase after successful purchase
      if (hasPremium) {
        await syncPremiumToSupabase(true);
      }
      
      return hasPremium;
    } catch (err: any) {
      // User cancelled is not an error
      if (err?.code === 'PURCHASE_CANCELLED' || err?.code === 1) {
        console.log('🛒 Purchase cancelled by user');
        return false;
      }
      console.error('🛒 Purchase failed:', err);
      console.error('🛒 Error code:', err?.code);
      console.error('🛒 Error message:', err?.message);
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
      const { customerInfo } = await Purchases.restorePurchases();
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
      await Purchases.logIn({ appUserID: userId });
      await checkPremiumStatus();
    } catch (err) {
      console.error('Failed to identify user:', err);
    }
  }, [checkPremiumStatus]);

  // Logout user
  const logoutUser = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await Purchases.logOut();
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
