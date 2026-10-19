
-- Stock notification requests table
CREATE TABLE public.stock_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medicine_id UUID NOT NULL,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, medicine_id)
);

ALTER TABLE public.stock_notifications
  ADD CONSTRAINT stock_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT stock_notifications_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON DELETE CASCADE;

ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own stock notifications" ON public.stock_notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own stock notifications" ON public.stock_notifications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own stock notifications" ON public.stock_notifications FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins manage stock notifications" ON public.stock_notifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger: when medicine stock goes from 0 to >0, notify subscribed users
CREATE OR REPLACE FUNCTION public.notify_stock_available()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.stock <= 0 AND NEW.stock > 0 THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    SELECT sn.user_id,
           'পণ্য স্টকে এসেছে! 🎉',
           NEW.name || ' এখন স্টকে আছে। এখনই অর্ডার করুন!',
           'order',
           '/product/' || COALESCE(NEW.slug, NEW.id::text)
    FROM public.stock_notifications sn
    WHERE sn.medicine_id = NEW.id AND sn.notified = false;

    -- Mark as notified
    UPDATE public.stock_notifications
    SET notified = true
    WHERE medicine_id = NEW.id AND notified = false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_medicine_stock_available
  AFTER UPDATE ON public.medicines
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_stock_available();
