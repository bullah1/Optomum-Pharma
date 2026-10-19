
-- Hero slider banners
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  highlight text DEFAULT '',
  cta_text text DEFAULT 'Order Now',
  cta_link text DEFAULT '/',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Promo cards
CREATE TABLE public.promo_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  highlight text DEFAULT '',
  detail text DEFAULT '',
  action_text text DEFAULT '',
  action_link text DEFAULT '/',
  icon text DEFAULT '🎁',
  bg_class text DEFAULT 'bg-gradient-to-br from-primary/6 to-primary/12',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read promo cards" ON public.promo_cards FOR SELECT USING (true);
CREATE POLICY "Admins manage promo cards" ON public.promo_cards FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Featured categories on homepage (which category bands to show)
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Flash sale products
CREATE TABLE public.flash_sale_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  discount_percent numeric NOT NULL DEFAULT 0,
  sale_price numeric,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(medicine_id)
);

ALTER TABLE public.flash_sale_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read flash sales" ON public.flash_sale_products FOR SELECT USING (true);
CREATE POLICY "Admins manage flash sales" ON public.flash_sale_products FOR ALL USING (has_role(auth.uid(), 'admin'));
