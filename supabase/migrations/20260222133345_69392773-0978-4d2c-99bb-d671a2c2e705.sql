
-- Rider applications table for approval system
CREATE TABLE public.rider_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rider_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage rider applications" ON public.rider_applications FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own application" ON public.rider_applications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users create own application" ON public.rider_applications FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_rider_applications_updated_at BEFORE UPDATE ON public.rider_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-assign rider role on approval
CREATE OR REPLACE FUNCTION public.approve_rider_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    NEW.reviewed_at := now();
    -- Insert rider role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'rider')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Create wallet
    INSERT INTO public.rider_wallets (rider_id)
    VALUES (NEW.user_id)
    ON CONFLICT (rider_id) DO NOTHING;
    
    -- Notify rider
    INSERT INTO public.notifications (user_id, title, body, type)
    VALUES (NEW.user_id, 'Rider Application Approved ✅', 'আপনার রাইডার আবেদন অনুমোদিত হয়েছে! এখন আপনি ডেলিভারি শুরু করতে পারবেন।', 'order');
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    NEW.reviewed_at := now();
    INSERT INTO public.notifications (user_id, title, body, type)
    VALUES (NEW.user_id, 'Rider Application Rejected ❌', 'দুঃখিত, আপনার রাইডার আবেদন প্রত্যাখ্যান করা হয়েছে।', 'order');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_approve_rider_application
BEFORE UPDATE ON public.rider_applications
FOR EACH ROW
EXECUTE FUNCTION public.approve_rider_application();
