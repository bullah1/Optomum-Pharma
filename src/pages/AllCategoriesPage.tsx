import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useSEO } from "@/hooks/useSEO";

/* ── Neuro-Marketing Color Map ── */
const neuroStyles: Record<string, { bg: string; accent: string; border: string }> = {
  "Medicine":        { bg: "bg-white",           accent: "text-emerald-600", border: "border-emerald-100" },
  "Healthcare":      { bg: "bg-white",           accent: "text-emerald-600", border: "border-emerald-100" },
  "Herbal":          { bg: "bg-white",           accent: "text-green-600",   border: "border-green-100" },
  "Baby & Mom Care": { bg: "bg-[#F8FBFF]",      accent: "text-blue-500",    border: "border-blue-100" },
  "Diapers & Pants": { bg: "bg-[#F8FBFF]",      accent: "text-blue-400",    border: "border-blue-100" },
  "Nutrition":       { bg: "bg-[#FFF8E7]",       accent: "text-orange-500",  border: "border-orange-100" },
  "Supplement":      { bg: "bg-[#FFF8E7]",       accent: "text-amber-500",   border: "border-amber-100" },
  "Women's Hygiene": { bg: "bg-[#FFF0F5]",       accent: "text-pink-500",    border: "border-pink-100" },
  "Beauty":          { bg: "bg-[#FFF0F5]",       accent: "text-pink-400",    border: "border-pink-100" },
  "Skincare":        { bg: "bg-gray-50/80",      accent: "text-violet-500",  border: "border-violet-100" },
  "Home Care":       { bg: "bg-[#F9FBE7]",       accent: "text-lime-600",    border: "border-lime-100" },
};

const fallbackCycle = [
  { bg: "bg-slate-50/60", accent: "text-slate-500", border: "border-slate-100" },
  { bg: "bg-sky-50/60",   accent: "text-sky-500",   border: "border-sky-100" },
  { bg: "bg-rose-50/60",  accent: "text-rose-500",  border: "border-rose-100" },
  { bg: "bg-teal-50/60",  accent: "text-teal-500",  border: "border-teal-100" },
];

const getStyle = (name: string, index: number) =>
  neuroStyles[name] || fallbackCycle[index % fallbackCycle.length];

const AllCategoriesPage = () => {
  const queryClient = useQueryClient();

  useSEO({
    title: "All Categories | Medicine & Healthcare — Optimum Pharmaceuticals HLB Bangladesh",
    description: "Browse all product categories — Medicine, Healthcare, Baby Care, Nutrition. Shop from trusted brands with fast home delivery.",
    canonical: "/categories",
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const cached = queryClient.getQueryData<any[]>(["categories-all"]);
      if (cached && cached.length > 0) return cached;
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="All Categories" />

      <div className="max-w-2xl mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((cat: any, index: number) => {
              const style = getStyle(cat.name, index);
              const hasImage = !!cat.image_url;

              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className={`relative flex items-center gap-3 px-3.5 py-3 rounded-2xl ${style.bg} border ${style.border} transition-all active:scale-[0.97] group`}
                >
                  {/* Icon / Image */}
                  <div className="w-11 h-11 rounded-xl bg-white/80 border border-white flex items-center justify-center shrink-0 shadow-sm">
                    {hasImage ? (
                      <img src={cat.image_url} alt={cat.name} className="w-8 h-8 object-contain" loading="lazy" />
                    ) : (
                      <span className={`text-lg ${style.accent}`}>💊</span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground leading-tight line-clamp-1">
                      {cat.name}
                    </p>
                    <p className={`text-[10px] font-medium ${style.accent} opacity-80 mt-0.5`}>
                      Shop now →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default AllCategoriesPage;
