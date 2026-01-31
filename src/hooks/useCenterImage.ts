import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import centerPlaceholder from '@/assets/center-placeholder.jpg';

// Cache to avoid refetching
const imageCache = new Map<string, string>();

export function useCenterImage(
  centerId: string,
  _name: string,
  _address: string,
  _city: string,
  _lat?: number,
  _lng?: number
): string {
  const [imageUrl, setImageUrl] = useState<string>(() => {
    // Check cache first for immediate return
    if (centerId && imageCache.has(centerId)) {
      return imageCache.get(centerId)!;
    }
    return centerPlaceholder;
  });
  
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Skip if no centerId
    if (!centerId) {
      setImageUrl(centerPlaceholder);
      return;
    }

    // Check cache
    if (imageCache.has(centerId)) {
      setImageUrl(imageCache.get(centerId)!);
      return;
    }

    // Fetch from database
    const fetchImage = async () => {
      try {
        const { data, error } = await supabase
          .from('center_images')
          .select('image_url')
          .eq('center_id', centerId)
          .maybeSingle();

        if (!mountedRef.current) return;

        if (!error && data?.image_url) {
          imageCache.set(centerId, data.image_url);
          setImageUrl(data.image_url);
        } else {
          setImageUrl(centerPlaceholder);
        }
      } catch (err) {
        if (mountedRef.current) {
          setImageUrl(centerPlaceholder);
        }
      }
    };

    fetchImage();
  }, [centerId]);

  return imageUrl;
}
