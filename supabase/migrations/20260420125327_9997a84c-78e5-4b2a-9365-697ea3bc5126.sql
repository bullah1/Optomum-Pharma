-- 1. Add SEO + profile fields to doctors table
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS education TEXT,
  ADD COLUMN IF NOT EXISTS qualifications TEXT,
  ADD COLUMN IF NOT EXISTS experience_years INTEGER,
  ADD COLUMN IF NOT EXISTS chamber_address TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- 2. Auto-slug + meta generator for doctors
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

DROP TRIGGER IF EXISTS doctors_auto_seo ON public.doctors;
CREATE TRIGGER doctors_auto_seo
BEFORE INSERT OR UPDATE ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.auto_generate_doctor_seo();

-- Backfill slugs for existing doctors
UPDATE public.doctors SET slug = NULL WHERE slug IS NULL;
UPDATE public.doctors SET name = name WHERE slug IS NULL;

-- 3. Doctor reviews table
CREATE TABLE IF NOT EXISTS public.doctor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  patient_name TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_reviews_doctor ON public.doctor_reviews(doctor_id);

ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved doctor reviews"
ON public.doctor_reviews FOR SELECT
USING (approved = true);

CREATE POLICY "Users insert own doctor reviews"
ON public.doctor_reviews FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own doctor reviews"
ON public.doctor_reviews FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users delete own doctor reviews"
ON public.doctor_reviews FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins manage doctor reviews"
ON public.doctor_reviews FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));