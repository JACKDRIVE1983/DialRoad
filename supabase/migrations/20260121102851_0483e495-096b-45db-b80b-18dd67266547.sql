-- Allow anyone to update likes count on comments
CREATE POLICY "Anyone can update comment likes" 
ON public.anonymous_comments 
FOR UPDATE 
USING (true)
WITH CHECK (true);