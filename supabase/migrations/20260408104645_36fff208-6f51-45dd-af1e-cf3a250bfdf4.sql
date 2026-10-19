CREATE OR REPLACE FUNCTION public.search_medicines(
  q text,
  cat_id uuid DEFAULT NULL,
  lim integer DEFAULT 20,
  off integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  name text,
  name_bn text,
  price numeric,
  original_price numeric,
  image_url text,
  company text,
  stock integer,
  requires_prescription boolean,
  delivery_time text,
  category_id uuid
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
  ORDER BY
    CASE WHEN m.name ILIKE q || '%' THEN 0 ELSE 1 END,
    CASE WHEN m.name ILIKE '%' || q || '%' THEN 0 ELSE 1 END,
    m.name
  LIMIT lim OFFSET off;
$$;