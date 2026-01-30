import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DialysisCenter } from '@/data/mockCenters';

interface DBCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string | null;
  region: string;
  phone: string | null;
  email: string | null;
  lat: number;
  lng: number;
  geocode_status: string | null;
  booking_url: string | null;
  services: string[] | null;
  opening_hours: string | null;
  is_open: boolean | null;
}

// Transform DB center to app format
function transformCenter(dbCenter: DBCenter): DialysisCenter {
  return {
    id: dbCenter.id,
    name: dbCenter.name,
    address: dbCenter.address,
    city: dbCenter.city,
    province: dbCenter.province || '',
    region: dbCenter.region,
    phone: dbCenter.phone || '',
    email: dbCenter.email,
    coordinates: {
      lat: dbCenter.lat,
      lng: dbCenter.lng
    },
    services: dbCenter.services || ['Emodialisi'],
    rating: 0,
    likes: 0,
    comments: [],
    openingHours: dbCenter.opening_hours || 'Lun-Sab: 6:00-20:00',
    isOpen: dbCenter.is_open ?? true
  };
}

export function useDialysisCenters() {
  return useQuery({
    queryKey: ['dialysis-centers'],
    queryFn: async (): Promise<DialysisCenter[]> => {
      console.log('[useDialysisCenters] Fetching centers from Supabase...');
      
      const { data, error } = await supabase
        .from('dialysis_centers')
        .select('*')
        .order('region', { ascending: true })
        .order('city', { ascending: true });

      if (error) {
        console.error('[useDialysisCenters] Error fetching centers:', error);
        throw error;
      }

      console.log(`[useDialysisCenters] Fetched ${data?.length || 0} centers`);
      
      return (data || []).map(transformCenter);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}

// Get unique regions from centers
export function useRegions() {
  return useQuery({
    queryKey: ['dialysis-regions'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('dialysis_centers')
        .select('region')
        .order('region', { ascending: true });

      if (error) {
        console.error('[useRegions] Error fetching regions:', error);
        throw error;
      }

      const uniqueRegions = [...new Set((data || []).map(r => r.region))];
      return ['Tutte le Regioni', ...uniqueRegions];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
