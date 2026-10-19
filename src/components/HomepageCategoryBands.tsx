import { memo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronRight, ChevronDown, Pill, Sparkles, Heart, Baby, Layers, Leaf, Home, Apple, FlaskConical, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ProductBandSkeleton } from "@/components/product/ProductCardSkeleton";
import ProductCard from "@/components/product/ProductCard";

/* ── Neuro-Marketing Band Config ── */
const CATEGORY_BANDS = [
  { categoryName: "Medicine", title: "Medicines", icon: Pill, accent: "#10b981", bg: "bg-white" },
  { categoryName: "Women's Hygiene", title: "Women's Hygiene", icon: Heart, accent: "#ec4899", bg: "bg-[#FFF0F5]/40" },
  { categoryName: "Baby & Mom Care", title: "Baby & Mom Care", icon: Baby, accent: "#3b82f6", bg: "bg-[#F8FBFF]/40" },
  { categoryName: "Diapers & Pants", title: "Diapers & Pants", icon: Layers, accent: "#3b82f6", bg: "bg-[#F8FBFF]/40" },
  { categoryName: "Herbal", title: "Herbal & Ayurvedic", icon: Leaf, accent: "#16a34a", bg: "bg-[#F9FBE7]/40" },
  { categoryName: "Supplement", title: "Supplements", icon: FlaskConical, accent: "#f59e0b", bg: "bg-[#FFF8E7]/40" },
  { categoryName: "Nutrition", title: "Nutrition", icon: Apple, accent: "#f97316", bg: "bg-[#FFF8E7]/40" },
  { categoryName: "Healthcare", title: "Healthcare", icon: Stethoscope, accent: "#10b981", bg: "bg-white" },
  { categoryName: "Home Care", title: "Home Care", icon: Home, accent: "#84cc16", bg: "bg-[#F9FBE7]/40" },
];

const INITIAL_VISIBLE = 5;

/* ── Single Category Band ── */
const CategoryBandView = memo(({ config, products, categoryId, isMobile }: { config: typeof CATEGORY_BANDS[0]; products: any[]; categoryId: string; isMobile: boolean }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (!products.length) return null;

  const Icon = config.icon;

  return (
    <section>
      <Link
        to={`/category/${categoryId}`}
        className="flex items-center justify-between px-1 mb-2.5 group"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${config.accent}12` }}>
            <Icon size={13} style={{ color: config.accent }} strokeWidth={2} />
          </div>
          <h3 className="text-[13px] font-bold text-foreground">{config.title}</h3>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-0.5 group-hover:text-primary transition-colors">
          View All <ChevronRight size={10} />
        </span>
      </Link>

      {isMobile ? (
        <div ref={scrollRef} className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {products.map((product: any) => (
            <div key={product.id} className="snap-start">
              <ProductCard product={product} fixedWidth />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {products.slice(0, 4).map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
});
CategoryBandView.displayName = "CategoryBandView";

/* ── Main Component ── */
const HomepageCategoryBands = () => {
  const [showAll, setShowAll] = useState(false);
  const isMobile = useIsMobile();

  // ✅ Uses data pre-seeded by useHomepageData — NO separate API call
  const { data, isLoading } = useQuery({
    queryKey: ["homepage-category-bands"],
    queryFn: () => [],
    enabled: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        {[0, 1].map(i => <ProductBandSkeleton key={i} bandIndex={i} />)}
      </div>
    );
  }

  const bandData = CATEGORY_BANDS.map(band => {
    const match = (data as any[] || []).find((d: any) =>
      d.categoryName === band.categoryName ||
      ((band as any).fallbackCategory && d.categoryName === (band as any).fallbackCategory)
    );
    return {
      band,
      products: (match?.products || []).slice(0, 6),
      categoryId: match?.categoryId || "",
    };
  }).filter(b => b.products.length > 0);

  const visibleBands = showAll ? bandData : bandData.slice(0, INITIAL_VISIBLE);
  const hasMore = bandData.length > INITIAL_VISIBLE;

  return (
    <div className="space-y-4">
      {visibleBands.map(({ band, products, categoryId }) => (
        <CategoryBandView key={band.categoryName} config={band} products={products} categoryId={categoryId} isMobile={isMobile} />
      ))}

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium text-muted-foreground border border-border rounded-xl active:scale-[0.98] transition-all hover:text-primary hover:border-primary/20"
        >
          <ChevronDown size={13} />
          Show More ({bandData.length - INITIAL_VISIBLE} more)
        </button>
      )}
    </div>
  );
};

export default HomepageCategoryBands;
