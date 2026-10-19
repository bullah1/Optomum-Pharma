
-- Create doctor_appointments table
CREATE TABLE public.doctor_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL DEFAULT 'Morning (10AM-1PM)',
  problem_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'cod',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  consultation_fee NUMERIC NOT NULL DEFAULT 0,
  appointment_number TEXT NOT NULL DEFAULT ('DA-' || LEFT(gen_random_uuid()::text, 8)),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_appointments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users view own appointments" ON public.doctor_appointments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users create own appointments" ON public.doctor_appointments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own appointments" ON public.doctor_appointments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins manage appointments" ON public.doctor_appointments
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_doctor_appointments_updated_at
  BEFORE UPDATE ON public.doctor_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate appointment number trigger
CREATE OR REPLACE FUNCTION public.generate_appointment_number()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = 'public'
AS $$
BEGIN
  NEW.appointment_number := 'DA-' || UPPER(LEFT(NEW.id::text, 8));
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_appointment_number
  BEFORE INSERT ON public.doctor_appointments
  FOR EACH ROW EXECUTE FUNCTION public.generate_appointment_number();
