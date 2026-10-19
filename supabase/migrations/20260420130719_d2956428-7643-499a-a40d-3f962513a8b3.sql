-- Add SEO directory fields to doctors table
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS designation TEXT,
  ADD COLUMN IF NOT EXISTS bmdc_number TEXT,
  ADD COLUMN IF NOT EXISTS chamber_name TEXT,
  ADD COLUMN IF NOT EXISTS visit_days TEXT,
  ADD COLUMN IF NOT EXISTS visit_time TEXT,
  ADD COLUMN IF NOT EXISTS chamber_map_url TEXT;