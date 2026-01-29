-- Create table to cache Google Places photo URLs for centers
CREATE TABLE public.center_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id TEXT NOT NULL UNIQUE,
  image_url TEXT,
  place_id TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.center_images ENABLE ROW LEVEL SECURITY;

-- Anyone can read cached images
CREATE POLICY "Anyone can view cached images"
ON public.center_images
FOR SELECT
USING (true);

-- Only backend (service role) can insert/update via edge function
-- No user policies needed for INSERT/UPDATE since edge function uses service role

-- Create index for fast lookups by center_id
CREATE INDEX idx_center_images_center_id ON public.center_images(center_id);