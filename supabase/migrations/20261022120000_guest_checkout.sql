-- Guest checkout: customers can order without an account.
-- Login stays required for prescription items and B2B.

ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.payments ALTER COLUMN user_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS orders_guest_phone_created_idx ON public.orders (guest_phone, created_at DESC);

-- Status-change notifications only make sense for account holders
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE status_label TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.user_id IS NOT NULL THEN
    CASE NEW.status
      WHEN 'confirmed' THEN status_label := 'কনফার্ম হয়েছে ✅';
      WHEN 'processing' THEN status_label := 'প্রসেস হচ্ছে 📦';
      WHEN 'shipped' THEN status_label := 'শিপ করা হয়েছে 🚚';
      WHEN 'delivered' THEN status_label := 'ডেলিভারি সম্পন্ন ✅';
      WHEN 'cancelled' THEN status_label := 'বাতিল হয়েছে ❌';
      ELSE status_label := NEW.status;
    END CASE;
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (NEW.user_id, 'অর্ডার আপডেট', 'আপনার অর্ডার #' || LEFT(NEW.id::text, 8) || ' ' || status_label, 'order', '/orders');
  END IF;
  RETURN NEW;
END;
$$;

-- Server-side guest order: prices, delivery and coupon are computed here, never trusted from the browser.
CREATE OR REPLACE FUNCTION public.place_guest_order(
  p_name text, p_phone text, p_division text, p_district text, p_upazila text,
  p_address text, p_items jsonb, p_payment text DEFAULT 'cod',
  p_coupon text DEFAULT NULL, p_meta jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_phone text;
  v_name text := btrim(coalesce(p_name, ''));
  v_addr text := btrim(coalesce(p_address, ''));
  v_count int;
  v_subtotal numeric := 0;
  v_coupon record;
  v_coupon_disc numeric := 0;
  v_delivery numeric;
  v_tax numeric := 0;
  v_vat numeric := 0;
  v_total numeric;
  v_order_id uuid;
  v_full_addr text;
  it record;
BEGIN
  v_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  IF v_phone LIKE '880%' THEN v_phone := substr(v_phone, 3); END IF;
  IF v_phone !~ '^01[3-9][0-9]{8}$' THEN RAISE EXCEPTION 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)'; END IF;
  IF length(v_name) < 2 OR length(v_name) > 80 THEN RAISE EXCEPTION 'নাম লিখুন'; END IF;
  IF length(v_addr) < 5 OR length(v_addr) > 300 THEN RAISE EXCEPTION 'পূর্ণ ঠিকানা লিখুন'; END IF;
  IF coalesce(p_division, '') = '' OR coalesce(p_district, '') = '' OR length(p_division) > 50 OR length(p_district) > 50 OR length(coalesce(p_upazila, '')) > 60 THEN
    RAISE EXCEPTION 'বিভাগ ও জেলা নির্বাচন করুন';
  END IF;
  IF p_payment NOT IN ('cod', 'bkash', 'nagad', 'rocket', 'bank', 'card') THEN RAISE EXCEPTION 'Invalid payment method'; END IF;

  -- Abuse guard: max 5 guest orders per phone per hour
  SELECT count(*) INTO v_count FROM public.orders WHERE guest_phone = v_phone AND created_at > now() - interval '1 hour';
  IF v_count >= 5 THEN RAISE EXCEPTION 'অনেকগুলো অর্ডার হয়েছে, কিছুক্ষণ পর চেষ্টা করুন বা কল করুন 01306383938'; END IF;

  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 30 THEN
    RAISE EXCEPTION 'কার্ট খালি';
  END IF;

  CREATE TEMP TABLE _gi ON COMMIT DROP AS
    SELECT m.id, m.price, least(greatest((x->>'qty')::int, 1), 20) AS qty, m.requires_prescription
    FROM jsonb_array_elements(p_items) x
    JOIN public.medicines m ON m.id = (x->>'id')::uuid
    WHERE public.is_category_visible(m.category_id);

  IF (SELECT count(*) FROM _gi) <> jsonb_array_length(p_items) THEN RAISE EXCEPTION 'কিছু প্রোডাক্ট পাওয়া যায়নি, কার্ট রিফ্রেশ করুন'; END IF;
  IF EXISTS (SELECT 1 FROM _gi WHERE requires_prescription) THEN RAISE EXCEPTION 'প্রেসক্রিপশন লাগে এমন ওষুধের জন্য লগইন করুন'; END IF;

  SELECT sum(price * qty) INTO v_subtotal FROM _gi;

  IF coalesce(btrim(p_coupon), '') <> '' THEN
    SELECT * INTO v_coupon FROM public.coupons WHERE code = upper(btrim(p_coupon)) AND active FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'কুপন সঠিক নয়'; END IF;
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN RAISE EXCEPTION 'কুপনের মেয়াদ শেষ'; END IF;
    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN RAISE EXCEPTION 'কুপনের লিমিট শেষ'; END IF;
    IF v_subtotal < coalesce(v_coupon.min_order_amount, 0) THEN RAISE EXCEPTION 'এই কুপনের জন্য সর্বনিম্ন অর্ডার ৳%', v_coupon.min_order_amount; END IF;
    IF v_coupon.discount_type = 'percentage' THEN
      v_coupon_disc := v_subtotal * v_coupon.discount_value / 100;
      IF v_coupon.max_discount IS NOT NULL THEN v_coupon_disc := least(v_coupon_disc, v_coupon.max_discount); END IF;
    ELSE
      v_coupon_disc := v_coupon.discount_value;
    END IF;
    v_coupon_disc := least(v_coupon_disc, v_subtotal);
    UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
  END IF;

  v_delivery := CASE WHEN p_division = 'Dhaka' AND p_district = 'Dhaka' THEN 70 ELSE 130 END;
  SELECT coalesce(nullif(value, '')::numeric, 0) * (v_subtotal - v_coupon_disc) / 100 INTO v_tax FROM public.site_settings WHERE key = 'tax_percent';
  SELECT coalesce(nullif(value, '')::numeric, 0) * (v_subtotal - v_coupon_disc) / 100 INTO v_vat FROM public.site_settings WHERE key = 'vat_percent';
  v_total := round(v_subtotal - v_coupon_disc + coalesce(v_tax, 0) + coalesce(v_vat, 0) + v_delivery, 2);

  v_full_addr := v_addr || ', ' || CASE WHEN coalesce(p_upazila, '') <> '' THEN p_upazila || ', ' ELSE '' END || p_district || ', ' || p_division;

  INSERT INTO public.orders (user_id, guest_name, guest_phone, payment_method, delivery_address, total_amount, delivery_charge, status,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, device_type)
  VALUES (NULL, v_name, v_phone, p_payment, v_full_addr, v_total, v_delivery, 'pending',
    left(p_meta->>'utm_source', 100), left(p_meta->>'utm_medium', 100), left(p_meta->>'utm_campaign', 100),
    left(p_meta->>'utm_content', 100), left(p_meta->>'utm_term', 100), left(p_meta->>'device_type', 20))
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, medicine_id, quantity, price)
  SELECT v_order_id, id, qty, price FROM _gi;

  INSERT INTO public.payments (order_id, user_id, amount, method, status)
  VALUES (v_order_id, NULL, v_total, p_payment, 'pending');

  RETURN jsonb_build_object('order_id', v_order_id, 'total', v_total, 'delivery_charge', v_delivery, 'coupon_discount', v_coupon_disc);
END;
$$;

REVOKE ALL ON FUNCTION public.place_guest_order(text, text, text, text, text, text, jsonb, text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.place_guest_order(text, text, text, text, text, text, jsonb, text, text, jsonb) TO anon, authenticated;
