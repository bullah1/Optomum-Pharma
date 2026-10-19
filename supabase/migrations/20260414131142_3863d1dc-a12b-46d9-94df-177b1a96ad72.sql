
-- ═══════════════════════════════════════════════════════
-- 30K+ Products + 50K Traffic + 50+ Campaigns Scale
-- ═══════════════════════════════════════════════════════

-- ── Marketing Events: analytics queries need composite indexes ──
CREATE INDEX IF NOT EXISTS idx_marketing_events_type_created 
  ON marketing_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_events_user 
  ON marketing_events (user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_events_page 
  ON marketing_events (page_url, created_at DESC) WHERE page_url IS NOT NULL;

-- ── Marketing Visits: UTM campaign attribution at scale ──
CREATE INDEX IF NOT EXISTS idx_marketing_visits_utm_source 
  ON marketing_visits (utm_source, created_at DESC) WHERE utm_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_visits_utm_campaign 
  ON marketing_visits (utm_campaign, created_at DESC) WHERE utm_campaign IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_visits_user 
  ON marketing_visits (user_id, created_at DESC) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_visits_referrer 
  ON marketing_visits (referrer, created_at DESC) WHERE referrer IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_visits_device 
  ON marketing_visits (device_type, created_at DESC);

-- ── Medicines: 30K product search optimization ──
-- Trigram GIN index for fast ILIKE search across 30K+ products
CREATE INDEX IF NOT EXISTS idx_medicines_name_trgm 
  ON medicines USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_medicines_name_bn_trgm 
  ON medicines USING gin (name_bn gin_trgm_ops) WHERE name_bn IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_medicines_company_trgm 
  ON medicines USING gin (company gin_trgm_ops) WHERE company IS NOT NULL;

-- Price range queries (filtering by price)
CREATE INDEX IF NOT EXISTS idx_medicines_price 
  ON medicines (price);

-- ── Active Sessions: live visitor dashboard at scale ──
CREATE INDEX IF NOT EXISTS idx_active_sessions_division 
  ON active_sessions (division, last_seen_at DESC) WHERE division IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_active_sessions_device 
  ON active_sessions (device_type, last_seen_at DESC);

-- ── Orders: campaign attribution joins ──
CREATE INDEX IF NOT EXISTS idx_orders_utm_source 
  ON orders (utm_source) WHERE utm_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_utm_campaign 
  ON orders (utm_campaign) WHERE utm_campaign IS NOT NULL;

-- ── Auto-cleanup: prevent marketing tables from growing unbounded ──
CREATE OR REPLACE FUNCTION public.cleanup_old_marketing_data()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Delete marketing events older than 90 days
  DELETE FROM public.marketing_events 
  WHERE created_at < now() - interval '90 days';
  
  -- Delete marketing visits older than 90 days  
  DELETE FROM public.marketing_visits 
  WHERE created_at < now() - interval '90 days';
$$;
