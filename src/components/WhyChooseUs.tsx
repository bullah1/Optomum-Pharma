import { ShoppingBag, Users, Truck, Star, ShieldCheck, Headphones, Clock, MapPin, Info, Phone, HelpCircle, Package, RotateCcw, Lock, FileText, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const stats = [
  { icon: ShoppingBag, value: "5,000+", label: "Orders" },
  { icon: Users, value: "3,000+", label: "Customers" },
  { icon: MapPin, value: "50+", label: "Areas" },
  { icon: Star, value: "500+", label: "Products" },
];

const badges = [
  { icon: Truck, label: "Free Delivery" },
  { icon: ShieldCheck, label: "100% Genuine" },
  { icon: Headphones, label: "24/7 Support" },
  { icon: Clock, label: "2hr Delivery" },
];

const footerLinks = [
  { to: "/about", label: "About", icon: Info, color: "text-sky-500 bg-sky-500/10" },
  { to: "/contact", label: "Contact", icon: Phone, color: "text-foreground bg-muted/60" },
  { to: "/faq", label: "FAQ", icon: HelpCircle, color: "text-red-500 bg-red-500/10" },
  { to: "/shipping", label: "Shipping", icon: Package, color: "text-amber-500 bg-amber-500/10" },
  { to: "/refund-policy", label: "Refund", icon: RotateCcw, color: "text-primary bg-primary/10" },
  { to: "/privacy", label: "Privacy", icon: Lock, color: "text-yellow-600 bg-yellow-500/10" },
  { to: "/terms", label: "Terms", icon: FileText, color: "text-teal-500 bg-teal-500/10" },
  { to: "/offers", label: "Offers", icon: Gift, color: "text-red-500 bg-red-500/10" },
];

const WhyChooseUs = () => {
  const { data: s } = useSiteSettings();
  const siteName = s?.site_name || "Optimum Pharmaceuticals HLB";
  const siteLogo = s?.site_logo;

  return (
    <div className="space-y-3">
      {/* Stats - compact row */}
      <div className="grid grid-cols-4 gap-1.5">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-0.5 py-2 rounded-xl bg-muted/30 border border-border">
            <s.icon className="w-4 h-4 text-primary/50" strokeWidth={1.5} />
            <span className="text-[13px] font-bold text-foreground tabular-nums">{s.value}</span>
            <span className="text-[9px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Trust badges - single line */}
      <div className="flex justify-around py-0.5">
        {badges.map((b) => (
          <div key={b.label} className="flex items-center gap-1">
            <b.icon className="w-3 h-3 text-primary/50" strokeWidth={1.5} />
            <span className="text-[9px] font-medium text-muted-foreground">{b.label}</span>
          </div>
        ))}
      </div>

      {/* Footer - compact */}
      <div className="bg-muted/15 rounded-xl pt-4 pb-3 px-3 space-y-3 border border-border">
        <div className="flex flex-col items-center gap-1.5">
          <img src={siteLogo || "/images/optimum-logo.jpg"} alt={siteName} className="h-10 object-contain" />
          <p className="text-[9px] text-muted-foreground leading-none">Herbal & Ayurvedic Medicines</p>
        </div>

        {/* Links Grid - tighter */}
        <div className="grid grid-cols-4 gap-1">
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-background/80 transition-colors"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${link.color}`}>
                <link.icon className="w-3.5 h-3.5" strokeWidth={1.8} />
              </div>
              <span className="text-[9px] font-medium text-muted-foreground">{link.label}</span>
            </Link>
          ))}
        </div>

        <p className="text-[9px] text-muted-foreground/35 text-center pt-2 border-t border-border">
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default WhyChooseUs;
