import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { memo } from "react";

const TopBrands = memo(() => {
  // ✅ ONLY uses data seeded by useHomepageData — NO direct DB query
  const { data: brands } = useQuery<any[]>({
    queryKey: ["top-brands"],
    queryFn: () => [],
    enabled: false,
    staleTime: 10 * 60 * 1000,
  });

  if (!brands || brands.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x pb-0.5">
      {brands.map((brand: any) => (
        <Link
          key={brand.name}
          to="/companies"
          className="snap-start shrink-0 flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full bg-muted/40 border border-border hover:border-primary/20 hover:bg-primary/5 transition-all"
        >
          <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center">
            <span className="text-primary text-[10px] font-bold">{brand.name.charAt(0)}</span>
          </div>
          <span className="text-[11px] font-medium text-foreground/80 whitespace-nowrap">{brand.name}</span>
        </Link>
      ))}
    </div>
  );
});
TopBrands.displayName = "TopBrands";

export default TopBrands;
