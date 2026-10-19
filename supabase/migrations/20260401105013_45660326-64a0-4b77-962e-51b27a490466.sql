INSERT INTO public.categories (id, name, icon, sort_order, featured) VALUES
('b1000000-0000-0000-0000-000000000001', 'Skincare', '🧴', 11, true),
('b1000000-0000-0000-0000-000000000002', 'Women''s Hygiene', '🌸', 12, true),
('b1000000-0000-0000-0000-000000000003', 'Diapers & Pants', '🧷', 13, true)
ON CONFLICT (id) DO NOTHING;