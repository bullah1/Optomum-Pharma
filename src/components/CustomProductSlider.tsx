import { memo, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductBandSkeleton } from "@/components/product/ProductCardSkeleton";
import ProductCard from "@/components/product/ProductCard";

interface CustomProductSliderProps {
  title: string;
  subtitle?: string | null;
  productIds: string[];
  onlyDiscounted?: boolean;
  autoCategoryId?: string | null;
}

const CustomProductSlider = memo(({ title, subtitle, productIds, onlyDiscounted, autoCategoryId }: CustomProductSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["custom-slider-products", productIds, onlyDiscounted, autoCategoryId],
    queryFn: async () => {
      let items: any[] = [];

      if (autoCategoryId) {
        let query = supabase
          .from("medicines")
          .select("id,name,name_bn,price,original_price,b2b_price,image_url,company,slug,requires_prescription")
          .eq("category_id", autoCategoryId)
          .order("created_at", { ascending: false })
          .limit(20);
        const { data, error } = await query;
        if (error) throw error;
        items = data || [];
      } else {
        if (!productIds.length) return [];
        const { data, error } = await supabase
          .from("medicines")
          .select("id,name,name_bn,price,original_price,b2b_price,image_url,company,slug,requires_prescription")
          .in("id", productIds);
        if (error) throw error;
        const map = new Map(data.map((p) => [p.id, p]));
        items = productIds.map((id) => map.get(id)).filter(Boolean) as any[];
      }

      if (onlyDiscounted) {
        items = items.filter((p: any) => p.original_price && p.original_price > p.price);
      }
      return items;
    },
    enabled: !!autoCategoryId || productIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <ProductBandSkeleton bandIndex={0} />;
  if (!products.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="relative group/band">
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
          {products.map((product: any) => (
            <div key={product.id} className="snap-start">
              <ProductCard product={product} fixedWidth />
            </div>
          ))}
        </div>
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card border border-border items-center justify-center text-foreground opacity-0 group-hover/band:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </section>
  );
});

CustomProductSlider.displayName = "CustomProductSlider";
export default CustomProductSlider;
