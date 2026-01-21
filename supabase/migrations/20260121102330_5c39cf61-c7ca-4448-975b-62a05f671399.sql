-- Create anonymous comments table for dialysis centers
CREATE TABLE public.anonymous_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.anonymous_comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read comments (public)
CREATE POLICY "Anyone can view comments" 
ON public.anonymous_comments 
FOR SELECT 
USING (true);

-- Allow anyone to insert comments (no auth required)
CREATE POLICY "Anyone can create comments" 
ON public.anonymous_comments 
FOR INSERT 
WITH CHECK (true);

-- Add index for faster queries by center
CREATE INDEX idx_anonymous_comments_center_id ON public.anonymous_comments(center_id);

-- Add index for ordering by date
CREATE INDEX idx_anonymous_comments_created_at ON public.anonymous_comments(created_at DESC);