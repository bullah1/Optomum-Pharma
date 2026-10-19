const ProductPageSkeleton = () => {
  return (
    <div className="flex-1 min-w-0 py-3 md:py-0">
      <div className="md:grid md:grid-cols-[1fr,380px] md:gap-6">
        {/* Image skeleton */}
        <div className="px-3 md:px-0">
          <div className="relative bg-card rounded-2xl overflow-hidden">
            <div className="aspect-square bg-muted/60 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
            <div className="absolute bottom-3 left-3 h-7 w-28 bg-muted/80 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Info skeleton */}
        <div className="px-4 md:px-0 pt-2 md:pt-0 space-y-3.5">
          <div className="bg-card rounded-2xl p-5 space-y-3.5">
            {/* Title */}
            <div className="space-y-2">
              <div className="h-5 w-4/5 bg-muted/60 rounded-lg animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite_0.1s]" />
              </div>
              <div className="h-4 w-2/5 bg-muted/40 rounded-lg animate-pulse" />
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-3.5 h-3.5 rounded bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 0.05}s` }} />
              ))}
              <div className="h-3 w-20 bg-muted/40 rounded-lg animate-pulse ml-1" />
            </div>

            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-32 bg-muted/50 rounded-lg animate-pulse" />
              <div className="w-1 h-1 rounded-full bg-muted/40" />
              <div className="h-4 w-16 bg-muted/50 rounded-lg animate-pulse" />
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Price + Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-16 bg-muted/60 rounded-lg animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite_0.2s]" />
                </div>
                <div className="h-4 w-10 bg-muted/40 rounded-lg animate-pulse" />
              </div>
              <div className="h-10 w-28 bg-primary/20 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Description skeleton */}
      <div className="px-3 md:px-0 mt-2">
        <div className="bg-card rounded-2xl p-5 space-y-2.5">
          <div className="h-4 w-32 bg-muted/60 rounded-lg animate-pulse" />
          <div className="h-3 w-full bg-muted/40 rounded-lg animate-pulse" />
          <div className="h-3 w-5/6 bg-muted/40 rounded-lg animate-pulse" />
          <div className="h-3 w-3/4 bg-muted/30 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Similar products skeleton */}
      <div className="px-3 md:px-0 mt-2">
        <div className="h-4 w-32 bg-muted/60 rounded-lg animate-pulse mb-3" />
        <div className="flex gap-2.5 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[140px] min-w-[140px] bg-card rounded-[14px] overflow-hidden" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="aspect-square bg-muted/40 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" style={{ animationDelay: `${i * 0.15}s` }} />
              </div>
              <div className="p-2.5 space-y-1.5">
                <div className="h-3 w-full bg-muted/40 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-muted/30 rounded animate-pulse" />
                <div className="h-4 w-12 bg-muted/50 rounded animate-pulse mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductPageSkeleton;
