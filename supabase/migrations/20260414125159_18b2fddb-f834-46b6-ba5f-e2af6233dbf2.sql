
-- Composite index for category band queries (covers WHERE category_id IN(...) AND stock > 0 ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_medicines_cat_stock_created 
ON public.medicines (category_id, created_at DESC) 
WHERE stock > 0;

-- Function: get category band products in ONE query using window functions
CREATE OR REPLACE FUNCTION public.get_category_band_products(cat_names text[])
RETURNS TABLE(
  category_id uuid,
  category_name text,
  product_id uuid,
  name text,
  price numeric,
  original_price numeric,
  b2b_price numeric,
  image_url text,
  company text,
  requires_prescription boolean,
  stock integer,
  slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH ranked AS (
    SELECT
      c.id AS category_id,
      c.name AS category_name,
      m.id AS product_id,
      m.name,
      m.price,
      m.original_price,
      m.b2b_price,
      m.image_url,
      m.company,
      m.requires_prescription,
      m.stock,
      m.slug,
      ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY m.created_at DESC) AS rn
    FROM categories c
    JOIN medicines m ON m.category_id = c.id AND m.stock > 0
    WHERE c.name = ANY(cat_names)
  )
  SELECT category_id, category_name, product_id, name, price, original_price, b2b_price, image_url, company, requires_prescription, stock, slug
  FROM ranked
  WHERE rn <= 6;
$$;

-- Function: get homepage summary stats as JSON
CREATE OR REPLACE FUNCTION public.get_homepage_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'total_products', (SELECT COUNT(*) FROM medicines WHERE stock > 0),
    'total_categories', (SELECT COUNT(*) FROM categories),
    'total_companies', (SELECT COUNT(DISTINCT company) FROM medicines WHERE company IS NOT NULL AND stock > 0)
  );
$$;
