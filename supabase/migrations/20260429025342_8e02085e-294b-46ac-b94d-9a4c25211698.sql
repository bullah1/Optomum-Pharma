INSERT INTO public.categories (id, name, sort_order, featured, icon)
VALUES (gen_random_uuid(), 'Sexual Wellness', 50, false, '💜')
ON CONFLICT DO NOTHING;