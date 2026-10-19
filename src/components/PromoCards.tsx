import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pill, MessageCircle, FileText } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  "💊": Pill,
  "💬": MessageCircle,
  "📋": FileText,
};

const cardStyles = [
  { color: "#8b5cf6", bg: "bg-violet-50/50", border: "border-violet-100" },
  { color: "#10b981", bg: "bg-emerald-50/50", border: "border-emerald-100" },
  { color: "#f97316", bg: "bg-orange-50/50", border: "border-orange-100" },
];

const fallbackPromos = [
  { title: "Shop", highlight: "All Medicines", detail: null, action_text: "Browse", action_link: "/categories", icon: "💊", bg_class: "" },
  { title: "Order", highlight: "Via WhatsApp", detail: "+8801306383938", action_text: "Send Message", action_link: "https://wa.me/8801306383938", icon: "💬", bg_class: "" },
  { title: "UPTO", highlight: "10% OFF", detail: "+ Cashback", action_text: "Upload Prescription", action_link: "/prescription-upload", icon: "📋", bg_class: "" },
];

const PromoCards = () => {
  // ✅ ONLY uses data seeded by useHomepageData — NO direct DB query
  const { data: dbCards } = useQuery<any[]>({
    queryKey: ["homepage-promo-cards"],
    queryFn: () => [],
    enabled: false,
    staleTime: 5 * 60 * 1000,
  });

  const promos = (dbCards && dbCards.length > 0 ? dbCards : fallbackPromos).slice(0, 3);

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {promos.map((promo: any, i: number) => {
        const IconComp = iconMap[promo.icon] || Pill;
        const style = cardStyles[i % cardStyles.length];
        return (
          <Link
            key={promo.id || i}
            to={promo.action_link || "/"}
            className={`rounded-xl ${style.bg} border ${style.border} shadow-sm p-2.5 flex flex-col gap-1.5 h-[120px] active:scale-[0.97] transition-all`}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${style.color}14` }}>
              <IconComp size={15} style={{ color: style.color }} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-muted-foreground font-medium leading-tight truncate">{promo.title}</p>
              <p className="text-[12.5px] font-bold text-foreground leading-tight truncate">{promo.highlight}</p>
              {promo.detail && <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight truncate">{promo.detail}</p>}
            </div>
            <span style={{ color: style.color }} className="text-[9.5px] font-semibold mt-auto truncate">{promo.action_text} →</span>
          </Link>
        );
      })}
    </div>
  );
};

export default PromoCards;
