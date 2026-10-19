import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

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
      const res = await fetch(`${SUPABASE_URL}/functions/v1/api-homepage`, {
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch homepage data");
      return res.json();
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
