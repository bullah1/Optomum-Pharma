import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "recently_viewed_products";
const MAX_ITEMS = 12;

export interface RecentProduct {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  slug?: string | null;
}

export const useRecentlyViewed = (currentProductId?: string) => {
  const [products, setProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: RecentProduct[] = JSON.parse(stored);
        // Exclude current product
        setProducts(currentProductId ? parsed.filter(p => p.id !== currentProductId) : parsed);
      }
    } catch {}
  }, [currentProductId]);

  const addProduct = useCallback((product: RecentProduct) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let list: RecentProduct[] = stored ? JSON.parse(stored) : [];
      list = list.filter(p => p.id !== product.id);
      list.unshift(product);
      if (list.length > MAX_ITEMS) list = list.slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }, []);

  return { recentProducts: products, addProduct };
};
