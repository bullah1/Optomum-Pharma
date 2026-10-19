-- Rebrand: Medipeon -> Optimum Pharmaceuticals HLB
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
      '. Fast home delivery in Faridpur. ফরিদপুরে দ্রুত হোম ডেলিভারি।',
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
    -- Append faridpur for SEO
    IF position('faridpur' in v_slug_base) = 0 THEN
      v_slug_base := v_slug_base || '-faridpur';
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
      ' | Faridpur | Optimum Pharmaceuticals HLB',
      60
    );
  END IF;

  -- Auto meta description
  IF NEW.meta_description IS NULL OR NEW.meta_description = '' THEN
    NEW.meta_description := LEFT(
      'Book online consultation with ' || NEW.name ||
      COALESCE(' (' || NULLIF(TRIM(NEW.specialization), '') || ')', '') ||
      ' in Faridpur. Consultation fee ৳' || NEW.fee || '.' ||
      COALESCE(' Schedule: ' || NULLIF(TRIM(NEW.schedule), '') || '.', '') ||
      ' ফরিদপুরে অনলাইনে অ্যাপয়েন্টমেন্ট বুক করুন।',
      160
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Update stored settings and existing text
UPDATE public.site_settings SET value = 'Optimum Pharmaceuticals HLB' WHERE key = 'site_name';
UPDATE public.site_settings SET value = replace(replace(replace(value, 'medipeon.com', 'optimumpharmahlb.com'), 'Medipeon', 'Optimum Pharmaceuticals HLB'), 'MediPeon', 'Optimum Pharmaceuticals HLB') WHERE value ILIKE '%medipeon%';
ALTER TABLE public.blog_posts ALTER COLUMN author_name SET DEFAULT 'Optimum Pharmaceuticals HLB Team';
UPDATE public.blog_posts SET author_name = 'Optimum Pharmaceuticals HLB Team' WHERE author_name = 'Medipeon Team';
UPDATE public.medicines SET meta_title = NULL WHERE meta_title ILIKE '%medipeon%';
UPDATE public.doctors SET meta_title = NULL WHERE meta_title ILIKE '%medipeon%';
