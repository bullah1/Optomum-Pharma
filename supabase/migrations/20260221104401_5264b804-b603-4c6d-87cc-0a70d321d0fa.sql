
-- Key-value site settings table
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for frontend)
CREATE POLICY "Anyone can read settings"
  ON public.site_settings FOR SELECT USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins manage settings"
  ON public.site_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'Optimum Pharmaceuticals HLB'),
  ('site_logo', ''),
  ('site_banner', ''),
  ('default_delivery_charge', '60'),
  ('free_delivery_min', '500'),
  ('tax_percent', '0'),
  ('vat_percent', '0'),
  ('payment_bkash', 'true'),
  ('payment_nagad', 'true'),
  ('payment_card', 'true'),
  ('payment_cod', 'true'),
  ('contact_phone', ''),
  ('contact_email', ''),
  ('contact_address', ''),
  ('dark_mode_default', 'false');
