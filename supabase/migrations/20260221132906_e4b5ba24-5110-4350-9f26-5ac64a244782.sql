
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'order', -- 'order', 'promo', 'system'
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

-- Users can update (mark read) their own notifications
CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

-- Admins can insert notifications for any user
CREATE POLICY "Admins insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- System/triggers can insert (service role)
CREATE POLICY "Service role insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Admins can delete
CREATE POLICY "Admins delete notifications"
ON public.notifications FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast user queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to auto-create notification on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  status_label TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'confirmed' THEN status_label := 'কনফার্ম হয়েছে ✅';
      WHEN 'processing' THEN status_label := 'প্রসেস হচ্ছে 📦';
      WHEN 'shipped' THEN status_label := 'শিপ করা হয়েছে 🚚';
      WHEN 'delivered' THEN status_label := 'ডেলিভারি সম্পন্ন ✅';
      WHEN 'cancelled' THEN status_label := 'বাতিল হয়েছে ❌';
      ELSE status_label := NEW.status;
    END CASE;

    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.user_id,
      'অর্ডার আপডেট',
      'আপনার অর্ডার #' || LEFT(NEW.id::text, 8) || ' ' || status_label,
      'order',
      '/orders'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on orders table
CREATE TRIGGER on_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();
