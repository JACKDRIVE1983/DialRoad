import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import centerPlaceholder from '@/assets/center-placeholder.jpg';

// Simple in-memory cache to avoid re-fetching during session
const imageCache = new Map<string, string | null>();

export function useCenterImage(
  centerId: string,
  name: string,
  address: string,
  city: string,
  lat?: number,
  lng?: number
): string {
  const [imageUrl, setImageUrl] = useState<string>(centerPlaceholder);

  useEffect(() => {
    let isMounted = true;

    async function fetchImage() {
      // Check memory cache first
      if (imageCache.has(centerId)) {
        const cached = imageCache.get(centerId);
        if (isMounted) {
          setImageUrl(cached || centerPlaceholder);
        }
        return;
      }

      try {
        // First, check if we have a cached URL in database (with actual image)
        const { data: cachedData } = await supabase
          .from('center_images')
          .select('image_url')
          .eq('center_id', centerId)
          .maybeSingle();

        // If we have a cached image URL, use it
        if (cachedData?.image_url) {
          imageCache.set(centerId, cachedData.image_url);
          if (isMounted) {
            setImageUrl(cachedData.image_url);
          }
          return;
        }

        // No cached image - call edge function to fetch from Google
        // This will try Place Photo first, then Street View as fallback
        const { data, error } = await supabase.functions.invoke('get-center-image', {
          body: { center_id: centerId, name, address, city, lat, lng }
        });

        if (error) {
          console.error('Error fetching center image:', error);
          imageCache.set(centerId, null);
          return;
        }

        const url = data?.image_url;
        imageCache.set(centerId, url);
        
        if (isMounted) {
          setImageUrl(url || centerPlaceholder);
        }
      } catch (err) {
        console.error('Error in useCenterImage:', err);
        imageCache.set(centerId, null);
      }
    }

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [centerId, name, address, city, lat, lng]);

  return imageUrl;
}
