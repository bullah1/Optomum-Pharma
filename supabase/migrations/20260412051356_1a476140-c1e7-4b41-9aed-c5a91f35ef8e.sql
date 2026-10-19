
-- Table to store Web Push subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  device_info text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users manage their own subscriptions
CREATE POLICY "Users view own subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- Admins can read all (for broadcast)
CREATE POLICY "Admins manage all subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
