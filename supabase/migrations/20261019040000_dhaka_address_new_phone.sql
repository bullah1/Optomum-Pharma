-- New company address & phone; remove Faridpur from stored data and SEO generators
-- Address: 6th Floor, Colombia Super Market, 31 Mohakhali C/A, Dhaka 1213 | Phone: +8801306383938

INSERT INTO public.site_settings (key, value) VALUES
  ('contact_phone', '+8801306383938'),
  ('contact_address', '6th Floor, Colombia Super Market, 31 Mohakhali C/A, Dhaka 1213, Bangladesh')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Any other setting still holding the old number / Faridpur address
UPDATE public.site_settings
SET value = replace(replace(replace(value, '8801822719502', '8801306383938'), '01822719502', '01306383938'), '+880 1822-719502', '+880 1306-383938')
WHERE value LIKE '%1822719502%' OR value LIKE '%1822-719502%';

UPDATE public.promo_cards
SET detail = replace(replace(detail, '8801822719502', '8801306383938'), '01822719502', '01306383938'),
    action_link = replace(replace(action_link, '8801822719502', '8801306383938'), '01822719502', '01306383938')
WHERE detail LIKE '%1822719502%' OR action_link LIKE '%1822719502%';

UPDATE public.banners
SET cta_link = replace(replace(cta_link, '8801822719502', '8801306383938'), '01822719502', '01306383938')
WHERE cta_link LIKE '%1822719502%';

CREATE OR REPLACE FUNCTION public.auto_generate_product_seo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug_base TEXT;
  v_slug_final TEXT;
  v_counter INT := 0;
BEGIN
  -- 1. Auto-generate slug if missing
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Lowercase, replace spaces with hyphens, strip special chars
    v_slug_base := lower(
      regexp_replace(
        regexp_replace(NEW.name, '[^a-zA-Z0-9\s\u0980-\u09FF-]', '', 'g'),
        '\s+', '-', 'g'
      )
    );
    v_slug_base := substring(v_slug_base FROM 1 FOR 80);
    v_slug_base := trim(both '-' FROM v_slug_base);
    v_slug_final := v_slug_base;

    -- Ensure unique slug
    WHILE EXISTS (SELECT 1 FROM medicines WHERE slug = v_slug_final AND id != COALESCE(NEW.id, gen_random_uuid())) LOOP
      v_counter := v_counter + 1;
      v_slug_final := v_slug_base || '-' || v_counter;
    END LOOP;

    NEW.slug := v_slug_final;
  END IF;

  -- 2. Auto-generate meta_title if missing
  IF NEW.meta_title IS NULL OR NEW.meta_title = '' THEN
    NEW.meta_title := LEFT(
      TRIM(NEW.name) ||
      COALESCE(' ' || NULLIF(TRIM(NEW.strength), ''), '') ||
      COALESCE(' - ' || NULLIF(TRIM(NEW.company), ''), '') ||
      ' | Optimum Pharmaceuticals HLB',
      60
    );
  END IF;

  -- 3. Auto-generate meta_description if missing
  IF NEW.meta_description IS NULL OR NEW.meta_description = '' THEN
    NEW.meta_description := LEFT(
      'Order ' || NEW.name ||
      COALESCE(' ' || NULLIF(TRIM(NEW.strength), ''), '') ||
      COALESCE(' (' || NULLIF(TRIM(NEW.dosage_form), '') || ')', '') ||
      COALESCE(' by ' || NULLIF(TRIM(NEW.company), ''), '') ||
      ' online at ৳' || NEW.price ||
      '. Fast home delivery across Bangladesh. সারা বাংলাদেশে দ্রুত হোম ডেলিভারি।',
      160
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_doctor_seo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug_base TEXT;
  v_slug_final TEXT;
  v_counter INT := 0;
BEGIN
  -- Generate slug if missing
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    v_slug_base := lower(
      regexp_replace(
        regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    );
    v_slug_base := trim(both '-' FROM v_slug_base);
    IF v_slug_base = '' THEN
      v_slug_base := 'doctor';
    END IF;
    v_slug_base := substring(v_slug_base FROM 1 FOR 80);
    v_slug_final := v_slug_base;
    WHILE EXISTS (SELECT 1 FROM doctors WHERE slug = v_slug_final AND id != COALESCE(NEW.id, gen_random_uuid())) LOOP
      v_counter := v_counter + 1;
      v_slug_final := v_slug_base || '-' || v_counter;
    END LOOP;
    NEW.slug := v_slug_final;
  END IF;

  -- Auto meta title
  IF NEW.meta_title IS NULL OR NEW.meta_title = '' THEN
    NEW.meta_title := LEFT(
      NEW.name ||
      COALESCE(' - ' || NULLIF(TRIM(NEW.specialization), ''), '') ||
      ' | Optimum Pharmaceuticals HLB',
      60
    );
  END IF;

  -- Auto meta description
  IF NEW.meta_description IS NULL OR NEW.meta_description = '' THEN
    NEW.meta_description := LEFT(
      'Book online consultation with ' || NEW.name ||
      COALESCE(' (' || NULLIF(TRIM(NEW.specialization), '') || ')', '') ||
      '. Consultation fee ৳' || NEW.fee || '.' ||
      COALESCE(' Schedule: ' || NULLIF(TRIM(NEW.schedule), '') || '.', '') ||
      ' অনলাইনে অ্যাপয়েন্টমেন্ট বুক করুন।',
      160
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Regenerate auto SEO text that mentioned Faridpur (trigger refills NULLs on update)
UPDATE public.medicines SET meta_title = NULL WHERE meta_title ILIKE '%faridpur%';
UPDATE public.medicines SET meta_description = NULL WHERE meta_description ILIKE '%faridpur%' OR meta_description LIKE '%ফরিদপুর%';
UPDATE public.doctors SET meta_title = NULL WHERE meta_title ILIKE '%faridpur%';
UPDATE public.doctors SET meta_description = NULL WHERE meta_description ILIKE '%faridpur%' OR meta_description LIKE '%ফরিদপুর%';
