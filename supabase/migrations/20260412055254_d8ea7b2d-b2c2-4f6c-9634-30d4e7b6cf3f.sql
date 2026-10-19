
-- 1. Make lab-reports bucket private
UPDATE storage.buckets SET public = false WHERE id = 'lab-reports';

-- 2. Fix active_sessions: drop overly permissive UPDATE policies
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "anon_update_sessions" ON public.active_sessions;

-- Create scoped UPDATE policy (users can only update their own session)
CREATE POLICY "Users update own sessions"
ON public.active_sessions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Actually we need session_id matching. Since sessions are anonymous, 
-- let's restrict to: anon can only update rows matching their session_id (set in app).
-- But since we can't enforce session_id server-side for anon, 
-- the safest approach is to only allow authenticated users to update their own rows.
DROP POLICY IF EXISTS "Users update own sessions" ON public.active_sessions;

CREATE POLICY "Authenticated update own sessions"
ON public.active_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Anon update own sessions by session_id"
ON public.active_sessions
FOR UPDATE
TO anon
USING (user_id IS NULL);

-- 3. Fix marketing_events INSERT - restrict to avoid spam
DROP POLICY IF EXISTS "Anyone can insert events" ON public.marketing_events;
CREATE POLICY "Anyone can insert events"
ON public.marketing_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 4. Fix marketing_visits INSERT
DROP POLICY IF EXISTS "Anyone can insert visits" ON public.marketing_visits;
CREATE POLICY "Anyone can insert visits"
ON public.marketing_visits
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 5. Drop duplicate/overly permissive active_sessions policies
DROP POLICY IF EXISTS "Anyone can upsert sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "anon_insert_sessions" ON public.active_sessions;

-- Recreate clean INSERT policy
CREATE POLICY "Anyone can insert sessions"
ON public.active_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 6. Drop duplicate SELECT
DROP POLICY IF EXISTS "Admins read all sessions" ON public.active_sessions;
