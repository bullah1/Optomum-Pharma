import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface HomepageSection {
  id: string;
  section_type: string;
  title: string;
  subtitle: string | null;
  config: Record<string, any>;
  sort_order: number;
  active: boolean;
}

interface CategoryBandData {
  categoryId: string;
  categoryName: string;
  products: any[];
}

interface HomepageData {
  settings: Record<string, string>;
  banners: any[];
  categories: any[];
  sections: HomepageSection[];
  categoryBands?: CategoryBandData[];
  promoCards?: any[];
  flashSale?: any[];
  healthTips?: any[];
  testimonials?: any[];
  topBrands?: any[];
}

const BAND_CATEGORY_NAMES = ["Medicine", "Women's Hygiene", "Baby & Mom Care", "Diapers & Pants", "Herbal", "Supplement", "Nutrition", "Healthcare", "Home Care"];

/** Used when the api-homepage edge function is unavailable — reads tables directly. */
async function loadHomepageDirect(): Promise<HomepageData> {
  const [settingsRes, bannersRes, categoriesRes, sectionsRes, bandRes, promoRes, flashRes, tipsRes, brandsRes] = await Promise.all([
    supabase.from("site_settings").select("key, value"),
    supabase.from("banners").select("id, title, subtitle, highlight, cta_text, cta_link, image_url, sort_order").eq("active", true).order("sort_order"),
    supabase.from("categories").select("id, name, icon, image_url, sort_order, featured").order("sort_order"),
    supabase.from("homepage_sections").select("id, section_type, title, subtitle, config, sort_order, active").eq("active", true).order("sort_order"),
    supabase.rpc("get_category_band_products", { cat_names: BAND_CATEGORY_NAMES }),
    supabase.from("promo_cards").select("id, title, detail, highlight, icon, bg_class, action_text, action_link, sort_order").eq("active", true).order("sort_order"),
    supabase.from("flash_sale_products").select("id, discount_percent, sale_price, starts_at, ends_at, medicines(id, name, price, original_price, image_url, slug, stock)").eq("active", true),
    supabase.from("health_tips").select("id, title, description, icon").eq("active", true).order("sort_order").limit(4),
    supabase.rpc("get_top_brands", { lim: 10 }),
  ]);
  const settings: Record<string, string> = {};
  (settingsRes.data || []).forEach((r: any) => { settings[r.key] = r.value ?? ""; });
  const bands: CategoryBandData[] = [];
  const seen = new Map<string, CategoryBandData>();
  for (const p of (bandRes.data as any[]) || []) {
    if (!seen.has(p.category_id)) {
      const b = { categoryId: p.category_id, categoryName: p.category_name, products: [] as any[] };
      seen.set(p.category_id, b); bands.push(b);
    }
    seen.get(p.category_id)!.products.push({ ...p, id: p.product_id });
  }
  return {
    settings,
    banners: bannersRes.data || [],
    categories: categoriesRes.data || [],
    sections: (sectionsRes.data as any[]) || [],
    categoryBands: bands,
    promoCards: promoRes.data || [],
    flashSale: (flashRes.data as any[])?.filter((f) => f.medicines) || [],
    healthTips: tipsRes.data || [],
    testimonials: [],
    topBrands: ((brandsRes.data as any[]) || []).map((b) => ({ name: b.name, count: Number(b.count) })),
  };
}

export const useHomepageData = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["homepage-bundle"],
    queryFn: async (): Promise<HomepageData> => {
      const prefetch = (window as any).__homepagePrefetch;
      if (prefetch) {
        (window as any).__homepagePrefetch = null;
        const data = await prefetch;
        if (data) return data;
      }
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/api-homepage`, {
          headers: {
            apikey: SUPABASE_KEY,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) return await res.json();
      } catch { /* edge function unreachable — fall back below */ }
      return loadHomepageDirect();
    },
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      queryClient.setQueryData(["site-settings"], query.data.settings);
      queryClient.setQueryData(["homepage-banners"], query.data.banners);
      queryClient.setQueryData(["categories-all"], query.data.categories);
      queryClient.setQueryData(["homepage-sections"], query.data.sections);
      if (query.data.categoryBands) {
        queryClient.setQueryData(["homepage-category-bands"], query.data.categoryBands);
      }
      if (query.data.promoCards) {
        queryClient.setQueryData(["homepage-promo-cards"], query.data.promoCards);
      }
      if (query.data.flashSale) {
        queryClient.setQueryData(["homepage-flash-sale"], query.data.flashSale);
      }
      if (query.data.healthTips) {
        queryClient.setQueryData(["homepage-health-tips"], query.data.healthTips);
      }
      if (query.data.testimonials) {
        queryClient.setQueryData(["homepage-testimonials"], query.data.testimonials);
      }
      if (query.data.topBrands) {
        queryClient.setQueryData(["top-brands"], query.data.topBrands);
      }
    }
  }, [query.data, queryClient]);

  return query;
};
