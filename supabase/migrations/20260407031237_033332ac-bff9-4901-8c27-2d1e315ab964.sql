
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE,
  logo_url text,
  banner_url text,
  address text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active companies" ON public.companies
  FOR SELECT USING (true);

CREATE POLICY "Admins manage companies" ON public.companies
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
