
-- Add dosage_form and strength columns to medicines
ALTER TABLE public.medicines
ADD COLUMN dosage_form text DEFAULT NULL,
ADD COLUMN strength text DEFAULT NULL;
