import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Phone, Upload, Zap, ChevronRight, Pill, Loader2 } from "lucide-react";

// Spot color styles per category position
const catStyles = [
  { bg: "bg-red-50", border: "border-red-200/60", hover: "hover:bg-red-50/50", text: "group-hover:text-red-600" },
  { bg: "bg-purple-50", border: "border-purple-200/60", hover: "hover:bg-purple-50/50", text: "group-hover:text-purple-600" },
  { bg: "bg-pink-50", border: "border-pink-200/60", hover: "hover:bg-pink-50/50", text: "group-hover:text-pink-600" },
  { bg: "bg-fuchsia-50", border: "border-fuchsia-200/60", hover: "hover:bg-fuchsia-50/50", text: "group-hover:text-fuchsia-600" },
  { bg: "bg-rose-50", border: "border-rose-200/60", hover: "hover:bg-rose-50/50", text: "group-hover:text-rose-600" },
  { bg: "bg-emerald-50", border: "border-emerald-200/60", hover: "hover:bg-emerald-50/50", text: "group-hover:text-emerald-600" },
  { bg: "bg-sky-50", border: "border-sky-200/60", hover: "hover:bg-sky-50/50", text: "group-hover:text-sky-600" },
  { bg: "bg-orange-50", border: "border-orange-200/60", hover: "hover:bg-orange-50/50", text: "group-hover:text-orange-600" },
  { bg: "bg-blue-50", border: "border-blue-200/60", hover: "hover:bg-blue-50/50", text: "group-hover:text-blue-600" },
  { bg: "bg-amber-50", border: "border-amber-200/60", hover: "hover:bg-amber-50/50", text: "group-hover:text-amber-600" },
  { bg: "bg-teal-50", border: "border-teal-200/60", hover: "hover:bg-teal-50/50", text: "group-hover:text-teal-600" },
  { bg: "bg-indigo-50", border: "border-indigo-200/60", hover: "hover:bg-indigo-50/50", text: "group-hover:text-indigo-600" },
];

const SidebarNav = memo(() => {
  // ✅ Uses data seeded by useHomepageData — NO direct DB query
  const { data: categories, isLoading } = useQuery<any[]>({
    queryKey: ["categories-all"],
    queryFn: () => [],
    enabled: false,
    staleTime: 5 * 60_000,
  });

  // ✅ Uses data seeded by useHomepageData
  const { data: flashSale } = useQuery<any[]>({
    queryKey: ["homepage-flash-sale"],
    queryFn: () => [],
    enabled: false,
    staleTime: 5 * 60_000,
  });
  const flashSaleCount = flashSale?.length ?? 0;

  return (
    <div className="space-y-2">
      {/* Call & Rx Upload - top */}
      <div className="flex gap-2">
        <a href="tel:+8801306383938"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border-2 border-destructive/60 text-destructive text-[11px] font-bold hover:bg-destructive/5 transition-colors active:scale-[0.97]">
          <Phone size={13} /> Call for Order
        </a>
        <Link to="/prescription-upload"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border-2 border-primary/60 text-primary text-[11px] font-bold hover:bg-primary/5 transition-colors active:scale-[0.97]">
          <Upload size={13} /> Upload Prescription
        </Link>
      </div>

      {/* Flash Sale — only when a sale is running */}
      {flashSaleCount > 0 && (
      <Link to="/" className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-secondary/50 transition-colors">
        <Zap size={16} className="text-accent fill-accent shrink-0" />
        <span className="text-[13px] font-black text-foreground tracking-wide italic">
          FL<span className="text-accent">⚡</span>SH SALE
        </span>
        <span className="text-[9px] font-bold text-foreground border border-foreground/20 rounded px-1.5 py-0.5">
          {flashSaleCount}
        </span>
        <ChevronRight size={14} className="text-muted-foreground ml-auto" />
      </Link>
      )}

      {/* Categories */}
      {isLoading || !categories ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="animate-spin text-primary" size={20} />
        </div>
      ) : (
        <nav className="divide-y divide-border/50">
          {categories.map((cat, idx) => {
            const style = catStyles[idx % catStyles.length];
            return (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 ${style.hover} transition-all group`}
              >
                <div className={`w-9 h-9 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform`}>
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover rounded-xl" loading="lazy" />
                  ) : (
                    <Pill size={16} className="text-foreground/70" strokeWidth={1.6} />
                  )}
                </div>
                <span className={`text-[13px] font-medium text-foreground flex-1 transition-colors ${style.text}`}>{cat.name}</span>
                <ChevronRight size={14} className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
});

SidebarNav.displayName = "SidebarNav";
export default SidebarNav;
