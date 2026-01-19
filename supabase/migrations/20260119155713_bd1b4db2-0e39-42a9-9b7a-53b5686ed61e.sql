-- Create a public view that excludes user_id for public access
-- This view uses the profile 'id' as the public identifier instead of user_id
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
  SELECT id, display_name, avatar_url, bio, created_at, updated_at
  FROM public.profiles;

-- Drop existing permissive SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new SELECT policy that only allows users to view their own profile
-- Other users must use the profiles_public view
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant SELECT on the public view to anon and authenticated roles
GRANT SELECT ON public.profiles_public TO anon, authenticated;