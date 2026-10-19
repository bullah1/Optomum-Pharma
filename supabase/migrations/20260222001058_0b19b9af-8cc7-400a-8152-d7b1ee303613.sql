
-- Create lab_bookings table
CREATE TABLE public.lab_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  booking_number text NOT NULL DEFAULT 'LB-' || LEFT(gen_random_uuid()::text, 8),
  patient_name text NOT NULL,
  patient_phone text NOT NULL,
  patient_age integer,
  patient_gender text,
  address text NOT NULL,
  preferred_date date NOT NULL,
  preferred_time_slot text NOT NULL DEFAULT 'Morning (8AM-12PM)',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cod',
  payment_status text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users view own lab bookings"
ON public.lab_bookings FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own bookings
CREATE POLICY "Users create own lab bookings"
ON public.lab_bookings FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own pending bookings
CREATE POLICY "Users update own lab bookings"
ON public.lab_bookings FOR UPDATE
USING (user_id = auth.uid());

-- Admins manage all bookings
CREATE POLICY "Admins manage lab bookings"
ON public.lab_bookings FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Auto-update updated_at
CREATE TRIGGER update_lab_bookings_updated_at
BEFORE UPDATE ON public.lab_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Generate unique booking number
CREATE OR REPLACE FUNCTION public.generate_lab_booking_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.booking_number := 'LB-' || UPPER(LEFT(NEW.id::text, 8));
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_lab_booking_number
BEFORE INSERT ON public.lab_bookings
FOR EACH ROW
EXECUTE FUNCTION public.generate_lab_booking_number();
