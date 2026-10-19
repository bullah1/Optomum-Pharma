
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to send webhook notification
CREATE OR REPLACE FUNCTION public.send_zapier_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
  event_type TEXT;
  status_label TEXT;
  user_phone TEXT;
  user_name TEXT;
  user_email TEXT;
  ref_number TEXT;
BEGIN
  -- Get webhook URL from site_settings
  SELECT value INTO webhook_url FROM public.site_settings WHERE key = 'zapier_webhook_url';
  
  -- If no webhook configured, skip
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RETURN NEW;
  END IF;

  -- Get user info
  SELECT p.name, p.phone, p.email INTO user_name, user_phone, user_email
  FROM public.profiles p WHERE p.id = NEW.user_id;

  -- Determine event type and build payload
  IF TG_TABLE_NAME = 'orders' THEN
    event_type := 'order_status_change';
    ref_number := LEFT(NEW.id::text, 8);
    CASE NEW.status
      WHEN 'confirmed' THEN status_label := 'কনফার্ম হয়েছে ✅';
      WHEN 'processing' THEN status_label := 'প্রসেস হচ্ছে 📦';
      WHEN 'shipped' THEN status_label := 'শিপ করা হয়েছে 🚚';
      WHEN 'delivered' THEN status_label := 'ডেলিভারি সম্পন্ন ✅';
      WHEN 'cancelled' THEN status_label := 'বাতিল হয়েছে ❌';
      ELSE status_label := NEW.status;
    END CASE;
  ELSIF TG_TABLE_NAME = 'lab_bookings' THEN
    event_type := 'lab_booking_status_change';
    ref_number := NEW.booking_number;
    CASE NEW.status
      WHEN 'confirmed' THEN status_label := 'কনফার্ম হয়েছে ✅';
      WHEN 'sample_collected' THEN status_label := 'স্যাম্পল সংগ্রহ হয়েছে 🧪';
      WHEN 'processing' THEN status_label := 'প্রসেস হচ্ছে ⏳';
      WHEN 'completed' THEN status_label := 'রিপোর্ট তৈরি ✅';
      WHEN 'cancelled' THEN status_label := 'বাতিল হয়েছে ❌';
      ELSE status_label := NEW.status;
    END CASE;
    -- Check if report just uploaded
    IF NEW.status = 'completed' AND NEW.report_url IS NOT NULL AND (OLD.report_url IS NULL OR OLD.report_url = '') THEN
      event_type := 'lab_report_ready';
    END IF;
  ELSIF TG_TABLE_NAME = 'doctor_appointments' THEN
    event_type := 'appointment_status_change';
    ref_number := NEW.appointment_number;
    CASE NEW.status
      WHEN 'confirmed' THEN status_label := 'কনফার্ম হয়েছে ✅';
      WHEN 'in_progress' THEN status_label := 'চলমান 🩺';
      WHEN 'completed' THEN status_label := 'সম্পন্ন ✅';
      WHEN 'cancelled' THEN status_label := 'বাতিল হয়েছে ❌';
      ELSE status_label := NEW.status;
    END CASE;
    -- Check if prescription/report just uploaded
    IF NEW.report_url IS NOT NULL AND (OLD.report_url IS NULL OR OLD.report_url = '') THEN
      event_type := 'prescription_ready';
    END IF;
  END IF;

  payload := jsonb_build_object(
    'event_type', event_type,
    'reference_number', ref_number,
    'status', NEW.status,
    'status_label', status_label,
    'user_name', COALESCE(user_name, ''),
    'user_phone', COALESCE(user_phone, ''),
    'user_email', COALESCE(user_email, ''),
    'timestamp', now()::text
  );

  -- Send webhook via pg_net
  PERFORM extensions.http_post(
    url := webhook_url,
    body := payload::text,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN NEW;
END;
$$;

-- Create triggers for webhook on status changes
CREATE TRIGGER webhook_order_status
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.send_zapier_webhook();

CREATE TRIGGER webhook_lab_booking_status
AFTER UPDATE OF status, report_url ON public.lab_bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.report_url IS DISTINCT FROM NEW.report_url)
EXECUTE FUNCTION public.send_zapier_webhook();

CREATE TRIGGER webhook_appointment_status
AFTER UPDATE OF status, report_url ON public.doctor_appointments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.report_url IS DISTINCT FROM NEW.report_url)
EXECUTE FUNCTION public.send_zapier_webhook();
