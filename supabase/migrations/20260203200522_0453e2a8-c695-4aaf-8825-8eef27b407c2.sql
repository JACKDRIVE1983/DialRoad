-- Drop the existing view
DROP VIEW IF EXISTS public.reviews_with_author;

-- Create new view WITHOUT user_id to prevent identity exposure
CREATE VIEW public.reviews_with_author
WITH (security_invoker=on) AS
SELECT 
  r.id,
  r.center_id,
  r.rating,
  r.text,
  r.created_at,
  r.updated_at,
  p.display_name as author_name,
  p.avatar_url as author_avatar
FROM public.reviews r
LEFT JOIN public.profiles p ON r.user_id = p.user_id;

-- Update the base reviews table policy to restrict public SELECT
-- Only allow users to see their own reviews directly
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

CREATE POLICY "Users can view their own reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = user_id);

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.reviews_with_author TO anon, authenticated;