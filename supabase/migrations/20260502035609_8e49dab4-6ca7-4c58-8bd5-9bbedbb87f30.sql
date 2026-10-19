-- 1. Campaigns table
CREATE TABLE public.notification_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  segment_type TEXT NOT NULL DEFAULT 'all',
  segment_filter JSONB DEFAULT '{}'::jsonb,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaigns"
ON public.notification_campaigns
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add campaign_id + clicked_at to notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.notification_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;

-- 3. Index for analytics
CREATE INDEX IF NOT EXISTS idx_notifications_campaign_id
  ON public.notifications(campaign_id)
  WHERE campaign_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_created_at
  ON public.notification_campaigns(created_at DESC);