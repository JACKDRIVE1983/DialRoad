-- Add first_name and last_name columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Create RLS policies for avatars bucket if not exists
DO $$
BEGIN
  -- Policy: Users can upload their own avatar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload avatar' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can upload avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Policy: Users can update their own avatar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update avatar' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can update avatar"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Policy: Users can delete their own avatar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete avatar' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can delete avatar"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Policy: Anyone can view avatars (public bucket)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public avatar access' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public avatar access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Allow users to delete their own profile (for account deletion)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own profile' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Users can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;