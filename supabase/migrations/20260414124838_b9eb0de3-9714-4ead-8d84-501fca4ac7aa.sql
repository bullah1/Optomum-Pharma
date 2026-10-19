
CREATE OR REPLACE FUNCTION public.get_top_brands(lim integer DEFAULT 10)
RETURNS TABLE(name text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT company AS name, COUNT(*) AS count
  FROM public.medicines
  WHERE company IS NOT NULL AND stock > 0
  GROUP BY company
  ORDER BY count DESC
  LIMIT lim;
$$;
