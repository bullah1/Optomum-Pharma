
-- Add report_url column to doctor_appointments
ALTER TABLE public.doctor_appointments ADD COLUMN IF NOT EXISTS report_url text;

-- Enable realtime for doctor_appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_appointments;
