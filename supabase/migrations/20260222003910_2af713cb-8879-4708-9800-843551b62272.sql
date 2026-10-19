
-- Add diagnostic_lab column to lab_bookings
ALTER TABLE public.lab_bookings ADD COLUMN diagnostic_lab text DEFAULT null;

-- Create diagnostic_labs table for admin management
CREATE TABLE public.diagnostic_labs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo text DEFAULT '🏥',
  address text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostic_labs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active diagnostic labs"
  ON public.diagnostic_labs FOR SELECT
  USING (true);

CREATE POLICY "Admins manage diagnostic labs"
  ON public.diagnostic_labs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert some default labs
INSERT INTO public.diagnostic_labs (name, logo, address, sort_order) VALUES
  ('Popular Diagnostics', '🏥', 'Dhaka', 1),
  ('Ibn Sina Diagnostics', '🔬', 'Dhaka', 2),
  ('Lab Aid', '🧪', 'Dhaka', 3),
  ('Praava Health', '💚', 'Dhaka', 4),
  ('CRL Diagnostics', '🩺', 'Dhaka', 5);
