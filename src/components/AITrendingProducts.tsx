import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/product/ProductCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface TrendingProduct {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  slug?: string | null;
  company?: string | null;
  stock?: number;
}

const AITrendingProducts = () => {
  const isMobile = useIsMobile();
  const { data, isLoading } = useQuery({
    queryKey: ["ai-trending-products"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("trending-products");
      if (error) throw error;
      return (data?.trending || []) as TrendingProduct[];
    },
    staleTime: 1000 * 60 * 15,
    retry: 1,
  });

  const uniqueData = data ? Array.from(new Map(data.map(p => [p.id, p])).values()) : [];

  if (!isLoading && uniqueData.length === 0) return null;

  return (
    <div className="py-1">
      <div className="flex items-center gap-2 px-1 mb-3">
        <Sparkles size={16} className="text-primary" />
        <h2 className="text-[15px] font-bold text-foreground">Trending Now</h2>
        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">AI Picks</span>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[148px]">
              <Skeleton className="aspect-[4/3] rounded-t-xl" />
              <Skeleton className="h-4 mt-2 w-3/4" />
              <Skeleton className="h-4 mt-1 w-1/2" />
            </div>
          ))}
        </div>
      ) : isMobile ? (
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {uniqueData.map((p) => (
            <ProductCard key={p.id} product={p} fixedWidth />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {uniqueData.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AITrendingProducts;
