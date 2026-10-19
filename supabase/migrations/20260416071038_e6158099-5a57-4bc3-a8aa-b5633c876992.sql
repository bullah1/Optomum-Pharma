
-- Reviews: frequently joined by medicine_id, filtered by user_id
CREATE INDEX IF NOT EXISTS idx_reviews_medicine_id ON public.reviews (medicine_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews (user_id);

-- Payments: queried by user_id and order_id
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (order_id);

-- Prescriptions: queried by user_id
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON public.prescriptions (user_id);

-- Inventory: queried by medicine_id
CREATE INDEX IF NOT EXISTS idx_inventory_medicine_id ON public.inventory (medicine_id);

-- Beauty appointments: queried by user_id and specialist_id
CREATE INDEX IF NOT EXISTS idx_beauty_appointments_user_id ON public.beauty_appointments (user_id);
CREATE INDEX IF NOT EXISTS idx_beauty_appointments_specialist_id ON public.beauty_appointments (specialist_id);

-- Orders: composite for user order history (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders (user_id, created_at DESC);

-- Homepage sections: active + sort_order for fast homepage load
CREATE INDEX IF NOT EXISTS idx_homepage_sections_active_sort ON public.homepage_sections (active, sort_order) WHERE active = true;

-- Flash sale: composite for active sales lookup
CREATE INDEX IF NOT EXISTS idx_flash_sale_active_dates ON public.flash_sale_products (active, starts_at, ends_at) WHERE active = true;

-- Banners: active + sort for homepage
CREATE INDEX IF NOT EXISTS idx_banners_active_sort ON public.banners (active, sort_order) WHERE active = true;
