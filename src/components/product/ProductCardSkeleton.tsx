import { Skeleton } from "@/components/ui/skeleton";

interface ProductCardSkeletonProps {
  index?: number;
  /** "scroll" = horizontal card (fixed width), "grid" = fill column */
  layout?: "scroll" | "grid";
}

const ProductCardSkeleton = ({ index = 0, layout = "scroll" }: ProductCardSkeletonProps) => {
  const widthClass = layout === "scroll"
    ? "w-[152px] sm:w-[175px] md:w-[210px] shrink-0"
    : "w-full";

  return (
    <div className={`${widthClass} rounded-[1.25rem] border border-border overflow-hidden bg-card`}>
      {/* Image placeholder */}
      <Skeleton className="aspect-square w-full rounded-none" delay={index * 80} />

      {/* Content */}
      <div className="p-3.5 space-y-2">
        {/* Company */}
        <Skeleton className="h-2.5 w-16 rounded-md" delay={index * 80 + 40} />
        {/* Title line 1 */}
        <Skeleton className="h-3.5 w-full rounded-md" delay={index * 80 + 80} />
        {/* Title line 2 */}
        <Skeleton className="h-3 w-3/4 rounded-md" delay={index * 80 + 120} />
        {/* Stars */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-2.5 h-2.5 rounded-full" delay={index * 80 + 160} />
          ))}
          <Skeleton className="h-2.5 w-6 rounded-full ml-1" delay={index * 80 + 160} />
        </div>
        {/* Price + Button */}
        <div className="flex items-end justify-between pt-2 border-t border-border">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-8 rounded-md" delay={index * 80 + 200} />
            <Skeleton className="h-4 w-12 rounded-md" delay={index * 80 + 200} />
          </div>
          <Skeleton className="h-7 w-14 rounded-xl" delay={index * 80 + 240} />
        </div>
      </div>
    </div>
  );
};

/** Grid of skeleton cards for category / search pages */
export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} index={i} layout="grid" />
    ))}
  </div>
);

/** Horizontal row of skeleton cards for featured bands */
export const ProductBandSkeleton = ({ count = 4, bandIndex = 0 }: { count?: number; bandIndex?: number }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32 rounded-lg" delay={bandIndex * 200} />
      <Skeleton className="h-4 w-14 rounded-md" delay={bandIndex * 200 + 50} />
    </div>
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} index={bandIndex * count + i} layout="scroll" />
      ))}
    </div>
  </section>
);

export default ProductCardSkeleton;
