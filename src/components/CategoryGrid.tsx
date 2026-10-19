import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Grid3X3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/* ── Neuro-Marketing Psychology Colors ── */
const neuroStyles: Record<string, { bg: string; border: string; accent: string }> = {
  "Medicine":        { bg: "bg-white",       border: "border-emerald-100", accent: "text-emerald-600" },
  "Healthcare":      { bg: "bg-white",       border: "border-emerald-100", accent: "text-emerald-600" },
  "Lab Test":        { bg: "bg-violet-50/50", border: "border-violet-100", accent: "text-violet-500" },
  "Baby & Mom Care": { bg: "bg-[#F8FBFF]",  border: "border-blue-100",    accent: "text-blue-500" },
  "Diapers & Pants": { bg: "bg-[#F8FBFF]",  border: "border-blue-100",    accent: "text-blue-400" },
  "Nutrition":       { bg: "bg-[#FFF8E7]",  border: "border-orange-100",  accent: "text-orange-500" },
  "Supplement":      { bg: "bg-[#FFF8E7]",  border: "border-amber-100",   accent: "text-amber-500" },
  "Women's Hygiene": { bg: "bg-[#FFF0F5]",  border: "border-pink-100",    accent: "text-pink-500" },
  "Beauty":          { bg: "bg-[#FFF0F5]",  border: "border-pink-100",    accent: "text-pink-400" },
  "Skincare":        { bg: "bg-gray-50/60",  border: "border-violet-100",  accent: "text-violet-500" },
  "Herbal":          { bg: "bg-[#F9FBE7]",  border: "border-green-100",   accent: "text-green-600" },
  "Home Care":       { bg: "bg-[#F9FBE7]",  border: "border-lime-100",    accent: "text-lime-600" },
  "Doctor Consultation": { bg: "bg-blue-50/50", border: "border-blue-100", accent: "text-blue-500" },
};

const fallbackStyles = [
  { bg: "bg-slate-50/40", border: "border-slate-100", accent: "text-slate-500" },
  { bg: "bg-sky-50/40",   border: "border-sky-100",   accent: "text-sky-500" },
  { bg: "bg-rose-50/40",  border: "border-rose-100",  accent: "text-rose-500" },
  { bg: "bg-teal-50/40",  border: "border-teal-100",  accent: "text-teal-500" },
];

const getStyle = (name: string, index: number) =>
  neuroStyles[name] || fallbackStyles[index % fallbackStyles.length];

const MAX_VISIBLE = 7;

const CategoryGrid = memo(() => {
  // ✅ ONLY uses data seeded by useHomepageData — NO direct DB query
  const { data: categories, isLoading } = useQuery<any[]>({
    queryKey: ["categories-all"],
    queryFn: () => [],
    enabled: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Skeleton className="w-[52px] h-[52px] rounded-2xl" delay={i * 40} />
            <Skeleton className="h-2.5 w-10 rounded" delay={i * 40 + 20} />
          </div>
        ))}
      </div>
    );
  }

  const visible = categories?.slice(0, MAX_VISIBLE) || [];
  const hasMore = (categories?.length || 0) > MAX_VISIBLE;

  return (
    <div className="grid grid-cols-4 gap-x-3 gap-y-4">
      {visible.map((cat: any, index: number) => {
        const hasImage = !!cat.image_url;
        const style = getStyle(cat.name, index);

        return (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className="flex flex-col items-center gap-2 active:scale-90 transition-transform min-w-[48px] min-h-[48px]"
            aria-label={`${cat.name} category`}
          >
            <div className={`w-[56px] h-[56px] rounded-2xl ${style.bg} border ${style.border} flex items-center justify-center overflow-hidden shadow-sm`}>
              {hasImage ? (
                <img src={cat.image_url} alt="" width={38} height={38} className="w-[38px] h-[38px] object-contain" loading="lazy" aria-hidden="true" />
              ) : (
                <span className={`text-xl ${style.accent}`}>💊</span>
              )}
            </div>
            <span className="text-[10.5px] font-medium text-foreground text-center leading-tight line-clamp-2 max-w-[72px]">
              {cat.name}
            </span>
          </Link>
        );
      })}

      {hasMore && (
        <Link
          to="/categories"
          className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
        >
          <div className="w-[56px] h-[56px] rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shadow-sm">
            <Grid3X3 size={22} className="text-primary" strokeWidth={1.8} />
          </div>
          <span className="text-[10.5px] font-medium text-primary text-center leading-tight">
            See All
          </span>
        </Link>
      )}
    </div>
  );
});

CategoryGrid.displayName = "CategoryGrid";
export default CategoryGrid;
