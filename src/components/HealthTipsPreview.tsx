import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { memo } from "react";

const HealthTipsPreview = memo(() => {
  // ✅ ONLY uses data seeded by useHomepageData — NO direct DB query
  const { data: tips } = useQuery<any[]>({
    queryKey: ["homepage-health-tips"],
    queryFn: () => [],
    enabled: false,
    staleTime: 10 * 60 * 1000,
  });

  if (!tips || tips.length === 0) return null;

  const tipColors = [
    { bg: "bg-emerald-50/60", border: "border-emerald-200/30", text: "text-emerald-700" },
    { bg: "bg-rose-50/60", border: "border-rose-200/30", text: "text-rose-700" },
    { bg: "bg-blue-50/60", border: "border-blue-200/30", text: "text-blue-700" },
    { bg: "bg-amber-50/60", border: "border-amber-200/30", text: "text-amber-700" },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <span className="text-sm">💡</span> Health Tips
        </h2>
        <Link to="/health-tips" className="text-[10px] font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-full">View All</Link>
      </div>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide snap-x pb-0.5">
        {tips.map((tip: any, i: number) => {
          const color = tipColors[i % tipColors.length];
          return (
            <Link
              key={tip.id}
              to="/health-tips"
              className={`snap-start shrink-0 w-[180px] rounded-xl border ${color.border} ${color.bg} p-3.5 space-y-1 hover:scale-[1.02] transition-transform`}
            >
              <p className={`text-xs font-semibold ${color.text} line-clamp-1`}>{tip.title}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{tip.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
});
HealthTipsPreview.displayName = "HealthTipsPreview";

export default HealthTipsPreview;
