-- Create dialysis_centers table
CREATE TABLE public.dialysis_centers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT,
  region TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  geocode_status TEXT DEFAULT 'OK',
  booking_url TEXT,
  services TEXT[] DEFAULT ARRAY['Emodialisi']::TEXT[],
  opening_hours TEXT DEFAULT 'Lun-Sab: 6:00-20:00',
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dialysis_centers ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (everyone can view centers)
CREATE POLICY "Anyone can view dialysis centers"
ON public.dialysis_centers
FOR SELECT
USING (true);

-- Create indexes for common queries
CREATE INDEX idx_dialysis_centers_region ON public.dialysis_centers(region);
CREATE INDEX idx_dialysis_centers_city ON public.dialysis_centers(city);
CREATE INDEX idx_dialysis_centers_coords ON public.dialysis_centers(lat, lng);

-- Create trigger for updated_at
CREATE TRIGGER update_dialysis_centers_updated_at
BEFORE UPDATE ON public.dialysis_centers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.dialysis_centers IS 'Stores all dialysis centers across Italy with their locations and contact info';