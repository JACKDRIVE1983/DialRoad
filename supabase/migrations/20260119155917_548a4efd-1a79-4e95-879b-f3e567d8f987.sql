-- Drop the old view and recreate with security_invoker
DROP VIEW IF EXISTS public.reviews_with_author;

-- Create the view with security_invoker = on
CREATE VIEW public.reviews_with_author
WITH (security_invoker = on) AS
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

-- Grant SELECT on the view
GRANT SELECT ON public.reviews_with_author TO anon, authenticated;