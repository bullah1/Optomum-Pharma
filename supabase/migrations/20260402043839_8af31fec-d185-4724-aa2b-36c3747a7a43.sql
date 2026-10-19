
-- Beauty Specialists table
CREATE TABLE public.beauty_specialists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT,
  fee NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  schedule TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.beauty_specialists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read beauty specialists" ON public.beauty_specialists FOR SELECT USING (true);
CREATE POLICY "Admins manage beauty specialists" ON public.beauty_specialists FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Beauty Appointments table
CREATE TABLE public.beauty_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.beauty_specialists(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL DEFAULT 'Morning (10AM-1PM)',
  problem_description TEXT,
  consultation_fee NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'pending',
  appointment_number TEXT NOT NULL DEFAULT ('BS-' || LEFT(gen_random_uuid()::text, 8)),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.beauty_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own beauty appointments" ON public.beauty_appointments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users create own beauty appointments" ON public.beauty_appointments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own beauty appointments" ON public.beauty_appointments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins manage beauty appointments" ON public.beauty_appointments FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-generate appointment number
CREATE OR REPLACE FUNCTION public.generate_beauty_appointment_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.appointment_number := 'BS-' || UPPER(LEFT(NEW.id::text, 8));
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_beauty_appointment_number
  BEFORE INSERT ON public.beauty_appointments
  FOR EACH ROW EXECUTE FUNCTION public.generate_beauty_appointment_number();
