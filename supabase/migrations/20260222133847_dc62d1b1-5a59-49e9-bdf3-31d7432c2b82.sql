
-- Marketing campaigns table
CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source text NOT NULL DEFAULT '',
  medium text NOT NULL DEFAULT '',
  campaign text NOT NULL DEFAULT '',
  term text DEFAULT '',
  content text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  start_date date,
  end_date date,
  budget numeric DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaigns" ON public.marketing_campaigns FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ad spend entries
CREATE TABLE public.ad_spend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  platform text DEFAULT '',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_spend ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ad spend" ON public.ad_spend FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Marketing visits / UTM tracking
CREATE TABLE public.marketing_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  landing_page text,
  device_type text DEFAULT 'desktop',
  browser text,
  os text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read visits" ON public.marketing_visits FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert visits" ON public.marketing_visits FOR INSERT
  WITH CHECK (true);

-- Add UTM columns to orders for attribution
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS first_visit_id uuid REFERENCES public.marketing_visits(id),
  ADD COLUMN IF NOT EXISTS last_visit_id uuid REFERENCES public.marketing_visits(id);

-- Marketing conversion events (funnel)
CREATE TABLE public.marketing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  event_type text NOT NULL DEFAULT 'page_view',
  event_data jsonb DEFAULT '{}',
  page_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read events" ON public.marketing_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert events" ON public.marketing_events FOR INSERT
  WITH CHECK (true);
