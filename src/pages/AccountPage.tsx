import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShoppingBag, FlaskConical, Heart, MapPin, Stethoscope,
  Bell, ClipboardPlus, Gift, ShieldCheck, HelpCircle,
  ChevronRight, LogOut, Phone, Mail, Sparkles, ArrowRight
} from "lucide-react";
import MobileBottomNav from "@/components/MobileBottomNav";
import PageTopBar from "@/components/PageTopBar";

const quickLinks = [
  { label: "Orders", icon: ShoppingBag, path: "/orders", iconBg: "bg-primary/10", iconColor: "text-primary" },
  { label: "Wishlist", icon: Heart, path: "/wishlists", iconBg: "bg-rose-500/10", iconColor: "text-rose-500" },
  { label: "Upload Rx", icon: ClipboardPlus, path: "/prescription-upload", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
  { label: "Address", icon: MapPin, path: "/manage-address", iconBg: "bg-amber-500/10", iconColor: "text-amber-600" },
];

const menuGroups = [
  {
    title: "My Activity",
    items: [
      { label: "My Orders", icon: ShoppingBag, path: "/orders" },
      { label: "Upload Prescription", icon: ClipboardPlus, path: "/prescription-upload" },
      { label: "Notifications", icon: Bell, path: "/notifications" },
    ],
  },
  {
    title: "More",
    items: [
      { label: "Offers & Discounts", icon: Gift, path: "/offers" },
      { label: "Health Tips", icon: ShieldCheck, path: "/health-tips" },
      { label: "Help & Support", icon: HelpCircle, path: "/contact" },
    ],
  },
];

const AccountPage = () => {
  const { user, signOut } = useAuth();
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0];
  const userPhone = user?.user_metadata?.phone;
  const initial = userName?.[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-secondary/40 pb-24 md:pb-0">
      <PageTopBar title="My Account" showCart={false} />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
        {/* Profile Card */}
        {user ? (
          <Link
            to="/profile/edit"
            className="block relative overflow-hidden bg-gradient-to-br from-primary to-primary/85 rounded-3xl p-5 shadow-lg shadow-primary/20 active:scale-[0.99] transition-transform"
          >
            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-8 w-28 h-28 bg-primary-foreground/5 rounded-full blur-2xl" />

            <div className="relative flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-foreground text-primary flex items-center justify-center font-extrabold text-2xl shrink-0 shadow-md ring-4 ring-primary-foreground/20">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">Welcome back</span>
                </div>
                <h3 className="text-lg font-bold text-primary-foreground truncate leading-tight">{userName}</h3>
                <div className="flex items-center gap-1.5 text-xs text-primary-foreground/80 mt-1.5">
                  <Mail size={11} />
                  <span className="truncate">{user.email}</span>
                </div>
                {userPhone && (
                  <div className="flex items-center gap-1.5 text-xs text-primary-foreground/80 mt-0.5">
                    <Phone size={11} />
                    <span>{userPhone}</span>
                  </div>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-primary-foreground/15 flex items-center justify-center shrink-0">
                <ChevronRight size={16} className="text-primary-foreground" />
              </div>
            </div>
          </Link>
        ) : (
          <Link
            to="/auth"
            className="block relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 shadow-lg shadow-primary/20 active:scale-[0.99] transition-transform"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary-foreground/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary-foreground/5 rounded-full blur-2xl" />

            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center shrink-0">
                <Sparkles size={26} className="text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-primary-foreground">Sign in to Optimum Pharmaceuticals HLB</h3>
                <p className="text-xs text-primary-foreground/85 mt-0.5">Track orders, save addresses & more</p>
              </div>
              <ArrowRight size={20} className="text-primary-foreground shrink-0" />
            </div>
          </Link>
        )}

        {/* Quick Actions */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 px-1">
            Quick Access
          </h4>
          <div className="grid grid-cols-4 gap-2.5">
            {quickLinks.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="flex flex-col items-center gap-2 bg-card rounded-2xl p-3 border border-border/60 active:scale-95 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.iconBg}`}>
                  <item.icon size={22} className={item.iconColor} strokeWidth={2.2} />
                </div>
                <span className="text-[11px] font-semibold text-foreground text-center leading-tight">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Menu Groups */}
        {menuGroups.map((group) => (
          <div key={group.title}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 px-1">
              {group.title}
            </h4>
            <div className="bg-card rounded-2xl overflow-hidden border border-border/60">
              {group.items.map((item, idx) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3.5 px-4 py-3.5 active:bg-muted/60 hover:bg-muted/40 transition-colors ${
                    idx < group.items.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon size={17} className="text-primary" strokeWidth={2.2} />
                  </div>
                  <span className="text-sm font-semibold text-foreground flex-1">{item.label}</span>
                  <ChevronRight size={16} className="text-muted-foreground/50" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Sign Out */}
        {user && (
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-card rounded-2xl border border-destructive/25 hover:bg-destructive/5 active:bg-destructive/10 transition-colors"
          >
            <LogOut size={16} className="text-destructive" strokeWidth={2.3} />
            <span className="text-sm font-bold text-destructive">Sign Out</span>
          </button>
        )}

        <p className="text-[11px] text-center text-muted-foreground pt-1">
          Optimum Pharmaceuticals HLB v1.0 • Made with <span className="text-rose-500">❤</span> in Bangladesh
        </p>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default AccountPage;
