
CREATE TABLE public.lab_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tests text[] NOT NULL DEFAULT '{}',
  original_price numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  icon text DEFAULT 'Shield',
  gradient text DEFAULT 'from-primary/10 to-primary/5',
  border_color text DEFAULT 'border-primary/30',
  badge text DEFAULT '',
  badge_color text DEFAULT 'bg-primary text-primary-foreground',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active lab packages"
ON public.lab_packages FOR SELECT
USING (true);

CREATE POLICY "Admins manage lab packages"
ON public.lab_packages FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

INSERT INTO public.lab_packages (name, tests, original_price, price, icon, gradient, border_color, badge, badge_color, sort_order) VALUES
('Basic Health Checkup', ARRAY['CBC', 'Blood Sugar (F)', 'Urine R/M/E', 'Lipid Profile'], 2800, 1799, 'Shield', 'from-primary/10 to-primary/5', 'border-primary/30', 'Popular', 'bg-primary text-primary-foreground', 1),
('Diabetes Care Package', ARRAY['HbA1c', 'Blood Sugar (F/PP)', 'Serum Creatinine', 'Urine Micro Albumin', 'Lipid Profile'], 3500, 2299, 'Activity', 'from-blue-500/10 to-blue-500/5', 'border-blue-400/30', 'Best Value', 'bg-blue-500 text-white', 2),
('Comprehensive Package', ARRAY['CBC', 'Lipid Profile', 'LFT', 'KFT', 'Thyroid (TSH)', 'Blood Sugar', 'Urine R/M/E', 'HbA1c'], 5500, 3499, 'Sparkles', 'from-purple-500/10 to-purple-500/5', 'border-purple-400/30', '36% OFF', 'bg-purple-500 text-white', 3),
('Heart Health Package', ARRAY['Lipid Profile', 'ECG', 'Troponin-I', 'CRP', 'Blood Sugar', 'CBC'], 4200, 2799, 'Heart', 'from-red-500/10 to-red-500/5', 'border-red-400/30', '33% OFF', 'bg-destructive text-destructive-foreground', 4);
