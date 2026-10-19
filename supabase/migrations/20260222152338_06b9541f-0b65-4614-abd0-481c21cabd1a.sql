
-- Active sessions table for real-time visitor tracking
CREATE TABLE public.active_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL UNIQUE,
  user_id uuid REFERENCES public.profiles(id),
  page_url text,
  area text,
  district text,
  division text,
  device_type text DEFAULT 'desktop',
  browser text,
  os text,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for cleanup and queries
CREATE INDEX idx_active_sessions_last_seen ON public.active_sessions(last_seen_at);
CREATE INDEX idx_active_sessions_area ON public.active_sessions(area);

-- Enable RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert/update (for tracking)
CREATE POLICY "Anyone can upsert sessions"
ON public.active_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
ON public.active_sessions FOR UPDATE
USING (true);

-- Only admins can read all sessions
CREATE POLICY "Admins read all sessions"
ON public.active_sessions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Cleanup function to remove stale sessions (older than 5 minutes)
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.active_sessions WHERE last_seen_at < now() - interval '5 minutes';
$$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
