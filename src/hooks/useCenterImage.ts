import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import centerPlaceholder from '@/assets/center-placeholder.jpg';

export function useCenterImage(
  centerId: string,
  _name: string,
  _address: string,
  _city: string,
  _lat?: number,
  _lng?: number
): string {
  const [imageUrl, setImageUrl] = useState<string>(centerPlaceholder);

  useEffect(() => {
    if (!centerId) return;

    const fetchImage = async () => {
      const { data, error } = await supabase
        .from('center_images')
        .select('image_url')
        .eq('center_id', centerId)
        .maybeSingle();

      if (!error && data?.image_url) {
        setImageUrl(data.image_url);
      }
    };

    fetchImage();
  }, [centerId]);

  return imageUrl;
}
