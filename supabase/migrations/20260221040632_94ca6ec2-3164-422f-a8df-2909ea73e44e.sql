
-- Create lab_tests table
CREATE TABLE public.lab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  category TEXT DEFAULT 'general',
  sample_type TEXT,
  report_time TEXT DEFAULT '24 Hours',
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read lab tests"
  ON public.lab_tests FOR SELECT
  USING (true);

-- Admin manage
CREATE POLICY "Admins manage lab tests"
  ON public.lab_tests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert sample data
INSERT INTO public.lab_tests (name, name_bn, price, original_price, category, sample_type, report_time) VALUES
  ('Complete Blood Count (CBC)', 'কমপ্লিট ব্লাড কাউন্ট', 500, 650, 'blood', 'Blood', '24 Hours'),
  ('Lipid Profile', 'লিপিড প্রোফাইল', 800, 1000, 'blood', 'Blood', '24 Hours'),
  ('Thyroid Function Test (TSH)', 'থাইরয়েড ফাংশন টেস্ট', 1200, 1500, 'hormone', 'Blood', '48 Hours'),
  ('HbA1c (Diabetes)', 'এইচবিএওয়ানসি (ডায়াবেটিস)', 900, 1100, 'diabetes', 'Blood', '24 Hours'),
  ('Liver Function Test', 'লিভার ফাংশন টেস্ট', 700, 900, 'organ', 'Blood', '24 Hours'),
  ('Kidney Function Test', 'কিডনি ফাংশন টেস্ট', 650, 800, 'organ', 'Blood', '24 Hours'),
  ('Vitamin D Test', 'ভিটামিন ডি টেস্ট', 1500, 1800, 'vitamin', 'Blood', '48 Hours'),
  ('Urine Routine Test', 'ইউরিন রুটিন টেস্ট', 300, 400, 'general', 'Urine', '12 Hours'),
  ('Blood Sugar (Fasting)', 'ব্লাড সুগার (ফাস্টিং)', 200, 300, 'diabetes', 'Blood', '12 Hours'),
  ('Vitamin B12', 'ভিটামিন বি১২', 1400, 1700, 'vitamin', 'Blood', '48 Hours'),
  ('Iron Profile', 'আয়রন প্রোফাইল', 1000, 1200, 'blood', 'Blood', '24 Hours'),
  ('CRP (C-Reactive Protein)', 'সিআরপি', 600, 750, 'general', 'Blood', '24 Hours');
