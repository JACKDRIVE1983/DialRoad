-- Create a security definer function to get public profile info from user_id
-- This hides the user_id from the caller while still allowing profile lookup
CREATE OR REPLACE FUNCTION public.get_public_profile_by_user_id(p_user_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = p_user_id;
$$;

-- Grant execute to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_user_id(uuid) TO authenticated, anon;

-- Create a view for reviews with author info that doesn't expose user_id
CREATE OR REPLACE VIEW public.reviews_with_author AS
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