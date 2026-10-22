import { memo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronRight, ChevronDown, Pill, Sparkles, Heart, Baby, Layers, Leaf, Home, Apple, FlaskConical, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ProductBandSkeleton } from "@/components/product/ProductCardSkeleton";
import ProductCard from "@/components/product/ProductCard";

/* ── Health-concern band styles (keyed by category name) ── */
type BandConfig = { categoryName: string; title: string; icon: any; accent: string; bg: string };
const BAND_STYLES: Record<string, Omit<BandConfig, "categoryName">> = {
  "Diabetes & Heart": { title: "Diabetes & Heart", icon: Heart, accent: "#e11d48", bg: "" },
  "Digestion & Liver": { title: "Digestion & Liver", icon: Leaf, accent: "#16a34a", bg: "" },
  "Brain & Energy": { title: "Brain & Energy", icon: Sparkles, accent: "#F8931D", bg: "" },
  "Immunity & Nutrition": { title: "Immunity & Nutrition", icon: Apple, accent: "#01AEF2", bg: "" },
  "Men's Health": { title: "Men's Health", icon: Stethoscope, accent: "#2563eb", bg: "" },
  "Women's Health": { title: "Women's Health", icon: Baby, accent: "#ec4899", bg: "" },
  "Joint & Bone": { title: "Joint & Bone", icon: Layers, accent: "#7c3aed", bg: "" },
  "Cough & Respiratory": { title: "Cough & Respiratory", icon: FlaskConical, accent: "#0891b2", bg: "" },
  "Kidney, Skin & Blood": { title: "Kidney, Skin & Blood", icon: Pill, accent: "#0d9488", bg: "" },
  "Personal Care": { title: "Personal Care", icon: Home, accent: "#84cc16", bg: "" },
};
const bandConfigFor = (name: string): BandConfig => ({
  categoryName: name,
  ...(BAND_STYLES[name] || { title: name, icon: Leaf, accent: "#F8931D", bg: "" }),
});

const INITIAL_VISIBLE = 10;

/* ── Single Category Band ── */
const CategoryBandView = memo(({ config, products, categoryId, isMobile }: { config: BandConfig; products: any[]; categoryId: string; isMobile: boolean }) => {
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

  const bandData = ((data as any[]) || [])
    .map((d: any) => ({
      band: bandConfigFor(d.categoryName),
      products: (d.products || []).slice(0, 8),
      categoryId: d.categoryId as string,
    }))
    .filter((b) => b.products.length > 0);

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
