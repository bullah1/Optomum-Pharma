-- Auto-generate SEO fields (slug, meta_title, meta_description) for new/updated products
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

-- Drop existing trigger if it exists to allow safe re-runs
DROP TRIGGER IF EXISTS trigger_auto_seo_on_medicines ON public.medicines;

-- Create trigger that runs BEFORE insert/update
CREATE TRIGGER trigger_auto_seo_on_medicines
BEFORE INSERT OR UPDATE ON public.medicines
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_product_seo();