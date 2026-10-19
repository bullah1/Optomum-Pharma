import { Star, Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";


const CustomerTestimonials = memo(() => {
  // ✅ ONLY uses data seeded by useHomepageData — NO direct DB query
  const { data: reviews } = useQuery<any[]>({
    queryKey: ["homepage-testimonials"],
    queryFn: () => [],
    enabled: false,
    staleTime: 10 * 60 * 1000,
  });

  const testimonials = reviews && reviews.length > 0
    ? reviews.map((r: any) => ({ id: r.id, rating: r.rating, comment: r.comment, user: r.profiles?.name || "Customer" }))
    : [];

  // Only real customer reviews are shown — hide the block until there are some
  if (testimonials.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <h2 className="text-sm font-bold text-foreground px-0.5">Customer Reviews</h2>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide snap-x pb-0.5">
        {testimonials.slice(0, 4).map((t: any) => (
          <div key={t.id} className="snap-start shrink-0 w-[210px] rounded-xl bg-muted/20 p-3.5 space-y-2 relative">
            <Quote className="w-4 h-4 text-primary/15 absolute top-3 right-3" />
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < t.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
              ))}
            </div>
            <p className="text-[11px] text-foreground/70 line-clamp-2 leading-relaxed">{t.comment}</p>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-[8px] font-bold">{t.user.charAt(0)}</span>
              </div>
              <p className="text-[10px] font-semibold text-foreground/60">{t.user}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
CustomerTestimonials.displayName = "CustomerTestimonials";

export default CustomerTestimonials;
