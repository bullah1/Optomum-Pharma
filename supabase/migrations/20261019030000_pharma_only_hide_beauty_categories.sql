-- Pharma-only mode: hide beauty / skincare / cosmetic (and lab/doctor placeholder) categories
-- and every product inside them from the storefront. Admins still see everything and can
-- turn a category back on from Admin → Categories (is_active toggle).

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

UPDATE public.categories
SET is_active = false
WHERE name ~* '(beauty|skin ?care|cosmetic|make ?up|hair ?care|fragrance|perfume|lab ?test|doctor)';

-- Helper: is a category visible on the storefront? (NULL category = visible)
CREATE OR REPLACE FUNCTION public.is_category_visible(cat uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT cat IS NULL OR EXISTS (SELECT 1 FROM public.categories c WHERE c.id = cat AND c.is_active);
$$;

-- Storefront read policies
DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
CREATE POLICY "Anyone can read categories"
  ON public.categories FOR SELECT
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can read medicines" ON public.medicines;
CREATE POLICY "Anyone can read medicines"
  ON public.medicines FOR SELECT
  USING (public.is_category_visible(category_id) OR public.has_role(auth.uid(), 'admin'));

-- SECURITY DEFINER functions bypass RLS, so filter them explicitly
CREATE OR REPLACE FUNCTION public.search_medicines(
  q text,
  cat_id uuid DEFAULT NULL,
  lim integer DEFAULT 20,
  off integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, name text, name_bn text, price numeric, original_price numeric,
  image_url text, company text, stock integer, requires_prescription boolean,
  delivery_time text, category_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id, m.name, m.name_bn, m.price, m.original_price,
    m.image_url, m.company, m.stock, m.requires_prescription,
    m.delivery_time, m.category_id
  FROM medicines m
  WHERE
    (m.name ILIKE '%' || q || '%'
     OR m.name_bn ILIKE '%' || q || '%'
     OR m.company ILIKE '%' || q || '%')
    AND (cat_id IS NULL OR m.category_id = cat_id)
    AND public.is_category_visible(m.category_id)
  ORDER BY
    CASE WHEN m.name ILIKE q || '%' THEN 0 ELSE 1 END,
    CASE WHEN m.name ILIKE '%' || q || '%' THEN 0 ELSE 1 END,
    m.name
  LIMIT lim OFFSET off;
$$;

CREATE OR REPLACE FUNCTION public.get_category_band_products(cat_names text[])
RETURNS TABLE(
  category_id uuid, category_name text, product_id uuid, name text, price numeric,
  original_price numeric, b2b_price numeric, image_url text, company text,
  requires_prescription boolean, stock integer, slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH ranked AS (
    SELECT
      c.id AS category_id, c.name AS category_name, m.id AS product_id, m.name,
      m.price, m.original_price, m.b2b_price, m.image_url, m.company,
      m.requires_prescription, m.stock, m.slug,
      ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY m.created_at DESC) AS rn
    FROM categories c
    JOIN medicines m ON m.category_id = c.id AND m.stock > 0
    WHERE c.name = ANY(cat_names) AND c.is_active
  )
  SELECT category_id, category_name, product_id, name, price, original_price, b2b_price, image_url, company, requires_prescription, stock, slug
  FROM ranked
  WHERE rn <= 6;
$$;

CREATE OR REPLACE FUNCTION public.get_homepage_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'total_products', (SELECT COUNT(*) FROM medicines m WHERE m.stock > 0 AND public.is_category_visible(m.category_id)),
    'total_categories', (SELECT COUNT(*) FROM categories WHERE is_active),
    'total_companies', (SELECT COUNT(DISTINCT m.company) FROM medicines m WHERE m.company IS NOT NULL AND m.stock > 0 AND public.is_category_visible(m.category_id))
  );
$$;

CREATE OR REPLACE FUNCTION public.get_top_brands(lim integer DEFAULT 10)
RETURNS TABLE(name text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT m.company AS name, COUNT(*) AS count
  FROM public.medicines m
  WHERE m.company IS NOT NULL AND m.stock > 0 AND public.is_category_visible(m.category_id)
  GROUP BY m.company
  ORDER BY count DESC
  LIMIT lim;
$$;

-- Turn off homepage sections that call slow AI functions
UPDATE public.homepage_sections SET active = false WHERE section_type = 'ai_trending';

-- Remove Lab Test promo card
UPDATE public.promo_cards SET active = false WHERE action_link ILIKE '/lab-test%' OR action_link ILIKE '/healthcare%' OR action_link ILIKE '/beauty%' OR action_link ILIKE '/doctor%';
UPDATE public.banners SET active = false WHERE cta_link ILIKE '/lab-test%' OR cta_link ILIKE '/healthcare%' OR cta_link ILIKE '/beauty%' OR cta_link ILIKE '/doctor%';
