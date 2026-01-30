-- Create storage bucket for center images
INSERT INTO storage.buckets (id, name, public)
VALUES ('center-images', 'center-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to center images
CREATE POLICY "Anyone can view center images"
ON storage.objects FOR SELECT
USING (bucket_id = 'center-images');

-- Allow service role to upload images (edge function uses service role)
CREATE POLICY "Service role can upload center images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'center-images');