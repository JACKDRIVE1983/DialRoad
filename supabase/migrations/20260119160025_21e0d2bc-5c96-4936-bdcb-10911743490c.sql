-- Drop and recreate the view to include user_id for authenticated users only
-- This allows users to identify their own reviews for deletion
DROP VIEW IF EXISTS public.reviews_with_author;

-- Create the view that includes user_id (needed for delete functionality)
-- The profiles join still uses the security_invoker pattern
CREATE VIEW public.reviews_with_author
WITH (security_invoker = on) AS
SELECT 
  r.id,
  r.user_id, -- Include for delete functionality
  r.center_id,
  r.rating,
  r.text,
  r.created_at,
  r.updated_at,
  p.display_name as author_name,
  p.avatar_url as author_avatar
FROM public.reviews r
LEFT JOIN public.profiles p ON r.user_id = p.user_id;

-- Grant SELECT on the view
GRANT SELECT ON public.reviews_with_author TO anon, authenticated;