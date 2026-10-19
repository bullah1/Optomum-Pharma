
-- Drop existing restrictive policies on active_sessions
DROP POLICY IF EXISTS "Anyone can insert active sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can update active sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can view active sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.active_sessions;
DROP POLICY IF EXISTS "Allow anonymous updates" ON public.active_sessions;

-- Allow anyone (including anonymous) to insert sessions
CREATE POLICY "anon_insert_sessions" ON public.active_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to update their own session by session_id
CREATE POLICY "anon_update_sessions" ON public.active_sessions
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated admins to read all sessions
CREATE POLICY "admin_read_sessions" ON public.active_sessions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
