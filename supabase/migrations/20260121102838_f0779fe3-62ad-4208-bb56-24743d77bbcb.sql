-- Add rating and likes columns to anonymous_comments
ALTER TABLE public.anonymous_comments 
ADD COLUMN rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN likes INTEGER NOT NULL DEFAULT 0;