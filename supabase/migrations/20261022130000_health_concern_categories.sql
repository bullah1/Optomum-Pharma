-- Store sells only Optimum Pharmaceuticals HLB + Index Laboratories.
-- Products are grouped by health concern (applied via SQL on 2026-10-22; see admin Categories to edit).
INSERT INTO public.categories (id,name,icon,sort_order,featured,is_active) VALUES
('c2000000-0000-0000-0000-000000000001','Diabetes & Heart','❤️',1,true,true),
('c2000000-0000-0000-0000-000000000002','Digestion & Liver','🌿',2,true,true),
('c2000000-0000-0000-0000-000000000003','Brain & Energy','⚡',3,true,true),
('c2000000-0000-0000-0000-000000000004','Immunity & Nutrition','🛡️',4,true,true),
('c2000000-0000-0000-0000-000000000005','Men''s Health','💪',5,true,true),
('c2000000-0000-0000-0000-000000000006','Women''s Health','🌸',6,true,true),
('c2000000-0000-0000-0000-000000000007','Joint & Bone','🦴',7,true,true),
('c2000000-0000-0000-0000-000000000008','Cough & Respiratory','🫁',8,true,true),
('c2000000-0000-0000-0000-000000000009','Kidney, Skin & Blood','💧',9,true,true)
ON CONFLICT (id) DO NOTHING;

-- Homepage bands: every active category, ordered by sort_order (cat_names ignored).
CREATE OR REPLACE FUNCTION public.get_category_band_products(cat_names text[])
 RETURNS TABLE(category_id uuid, category_name text, product_id uuid, name text, price numeric, original_price numeric, b2b_price numeric, image_url text, company text, requires_prescription boolean, stock integer, slug text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT category_id, category_name, product_id, name, price, original_price, b2b_price, image_url, company, requires_prescription, stock, slug
  FROM (
    SELECT c.id AS category_id, c.name AS category_name, c.sort_order AS cat_sort, m.id AS product_id, m.name, m.price, m.original_price, m.b2b_price, m.image_url, m.company, m.requires_prescription, m.stock, m.slug,
           ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY (m.image_url IS NULL), m.price DESC) AS rn
    FROM categories c JOIN medicines m ON m.category_id = c.id AND m.stock > 0
    WHERE c.is_active
  ) ranked
  WHERE rn <= 8
  ORDER BY cat_sort, rn;
$function$;
