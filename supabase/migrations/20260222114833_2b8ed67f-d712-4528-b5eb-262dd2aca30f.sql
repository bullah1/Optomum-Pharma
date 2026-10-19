
-- Homepage Sections: dynamic section builder
CREATE TABLE public.homepage_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL DEFAULT 'banner',
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active homepage sections"
ON public.homepage_sections FOR SELECT USING (true);

CREATE POLICY "Admins manage homepage sections"
ON public.homepage_sections FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_homepage_sections_updated_at
BEFORE UPDATE ON public.homepage_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Category Custom Layout
CREATE TABLE public.category_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  banner_url TEXT,
  description TEXT,
  seo_text TEXT,
  default_view TEXT NOT NULL DEFAULT 'grid',
  custom_sort JSONB DEFAULT '[]'::jsonb,
  show_filters BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id)
);

ALTER TABLE public.category_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read category layouts"
ON public.category_layouts FOR SELECT USING (true);

CREATE POLICY "Admins manage category layouts"
ON public.category_layouts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_category_layouts_updated_at
BEFORE UPDATE ON public.category_layouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default homepage sections matching current layout
INSERT INTO public.homepage_sections (section_type, title, sort_order, config) VALUES
('banner', 'Hero Banner', 0, '{"source": "banners_table"}'::jsonb),
('category_grid', 'All You Need', 1, '{}'::jsonb),
('quick_actions', 'Quick Actions', 2, '{}'::jsonb),
('promo_cards', 'Promotions', 3, '{}'::jsonb),
('flash_sale', 'Flash Sale', 4, '{}'::jsonb),
('featured_products', 'Featured Products', 5, '{"mode": "auto_category"}'::jsonb);
