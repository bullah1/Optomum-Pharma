
CREATE OR REPLACE FUNCTION public.notify_appointment_status_change()
 RETURNS trigger
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
      WHEN 'in_progress' THEN status_label := 'চলমান আছে 🩺';
      WHEN 'completed' THEN status_label := 'সম্পন্ন হয়েছে ✅';
      WHEN 'cancelled' THEN status_label := 'বাতিল হয়েছে ❌';
      ELSE status_label := NEW.status;
    END CASE;

    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.user_id,
      'অ্যাপয়েন্টমেন্ট আপডেট',
      'আপনার অ্যাপয়েন্টমেন্ট #' || NEW.appointment_number || ' ' || status_label,
      'appointment',
      '/account'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_lab_booking_status_change()
 RETURNS trigger
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
      WHEN 'sample_collected' THEN status_label := 'স্যাম্পল সংগ্রহ হয়েছে 🧪';
      WHEN 'processing' THEN status_label := 'প্রসেস হচ্ছে ⏳';
      WHEN 'completed' THEN status_label := 'রিপোর্ট তৈরি হয়েছে ✅';
      WHEN 'cancelled' THEN status_label := 'বাতিল হয়েছে ❌';
      ELSE status_label := NEW.status;
    END CASE;

    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.user_id,
      'ল্যাব বুকিং আপডেট',
      'আপনার ল্যাব বুকিং #' || NEW.booking_number || ' ' || status_label,
      'lab',
      '/account'
    );
  END IF;
  RETURN NEW;
END;
$$;
