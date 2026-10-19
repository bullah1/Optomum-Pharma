
-- Add report_url column to lab_bookings
ALTER TABLE public.lab_bookings ADD COLUMN IF NOT EXISTS report_url text;

-- Create storage bucket for lab reports
INSERT INTO storage.buckets (id, name, public) VALUES ('lab-reports', 'lab-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read their own reports
CREATE POLICY "Users can read own lab reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'lab-reports' AND auth.role() = 'authenticated');

-- Allow admins to upload lab reports
CREATE POLICY "Admins can upload lab reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lab-reports' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Allow admins to update lab reports
CREATE POLICY "Admins can update lab reports"
ON storage.objects FOR UPDATE
USING (bucket_id = 'lab-reports' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Allow admins to delete lab reports
CREATE POLICY "Admins can delete lab reports"
ON storage.objects FOR DELETE
USING (bucket_id = 'lab-reports' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
