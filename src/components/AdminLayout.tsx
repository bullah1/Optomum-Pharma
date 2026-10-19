import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Package, ShoppingBag, FolderTree, ArrowLeft, Menu, X,
  FlaskConical, Stethoscope, FileText, Users, Tag, Warehouse, Settings,
  Home, Bell, PackageCheck, ClipboardList, CalendarCheck, Building2, Lightbulb,
  LayoutGrid, BarChart3, ChevronDown, Sparkles, LogOut, Search, ImageIcon,
  MapPin, Star, CreditCard, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: string;
  badgeKey?: string;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  color: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "text-blue-500",
    items: [
      { title: "Overview", url: "/admin", icon: LayoutDashboard },
      { title: "Marketing", url: "/admin/marketing", icon: BarChart3 },
    ],
  },
  {
    label: "Commerce",
    icon: ShoppingBag,
    color: "text-emerald-500",
    items: [
      { title: "Orders", url: "/admin/orders", icon: ShoppingBag, badgeKey: "orders" },
      { title: "Products", url: "/admin/products", icon: Package },
      { title: "Sexual Wellness Images", url: "/admin/sexual-wellness-images", icon: ImageIcon },
      { title: "Categories", url: "/admin/categories", icon: FolderTree },
      { title: "Companies", url: "/admin/companies", icon: Building2 },
      { title: "Inventory", url: "/admin/inventory", icon: Warehouse },
      { title: "Coupons", url: "/admin/coupons", icon: Tag },
      { title: "Prescriptions", url: "/admin/prescriptions", icon: FileText, badgeKey: "prescriptions" },
      { title: "Reviews", url: "/admin/reviews", icon: Star },
    ],
  },
  {
    label: "Logistics",
    icon: MapPin,
    color: "text-orange-500",
    items: [
      { title: "Courier Dashboard", url: "/admin/courier", icon: Package },
      { title: "Delivery Zones", url: "/admin/delivery-zones", icon: MapPin },
    ],
  },
  {
    label: "Content",
    icon: Home,
    color: "text-amber-500",
    items: [
      { title: "Homepage", url: "/admin/homepage", icon: Home },
      { title: "Banners", url: "/admin/banners", icon: ImageIcon },
      { title: "Flash Sale", url: "/admin/flash-sale", icon: Tag },
      { title: "Promo Cards", url: "/admin/promo-cards", icon: LayoutGrid },
      { title: "Category Layouts", url: "/admin/category-layouts", icon: LayoutGrid },
      { title: "Blog Posts", url: "/admin/blog", icon: BookOpen },
      { title: "Health Tips", url: "/admin/health-tips", icon: Lightbulb },
      { title: "Notifications", url: "/admin/notifications", icon: Bell },
    ],
  },
  {
    label: "Finance",
    icon: CreditCard,
    color: "text-teal-500",
    items: [
      { title: "Payments", url: "/admin/payments", icon: CreditCard },
    ],
  },
  {
    label: "System",
    icon: Settings,
    color: "text-slate-500",
    items: [
      { title: "Customers", url: "/admin/users", icon: Users },
      { title: "Team Members", url: "/admin/team", icon: Users },
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ],
  },
];

const allItems = navGroups.flatMap((g) => g.items);

const SidebarNavGroup = ({
  group,
  currentPath,
  onNavigate,
  badgeCounts,
}: {
  group: NavGroup;
  currentPath: string;
  onNavigate: () => void;
  badgeCounts?: Record<string, number>;
}) => {
  const hasActive = group.items.some((i) => i.url === currentPath);
  const [open, setOpen] = useState(hasActive);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all",
          hasActive
            ? "text-foreground bg-secondary/60"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
        )}
      >
        <group.icon size={14} className={group.color} />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          size={12}
          className={cn(
            "transition-transform text-muted-foreground/60",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border pl-2">
          {group.items.map((item) => {
            const active = currentPath === item.url;
            return (
              <Link
                key={item.url}
                to={item.url}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/70 hover:bg-secondary/60 hover:text-foreground active:scale-[0.98]"
                )}
              >
                <item.icon size={13} />
                <span className="flex-1">{item.title}</span>
                {item.badgeKey && badgeCounts?.[item.badgeKey] ? (
                  <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1">
                    {badgeCounts[item.badgeKey]}
                  </span>
                ) : item.badge ? (
                  <span className="text-[9px]">{item.badge}</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Quick action shortcuts for the header
const quickActions = [
  { label: "Orders", url: "/admin/orders", icon: ShoppingBag, color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" },
  { label: "Products", url: "/admin/products", icon: Package, color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20" },
  { label: "Lab Bookings", url: "/admin/lab-bookings", icon: ClipboardList, color: "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20" },
];

const AdminLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch pending counts for sidebar badges
  const { data: badgeCounts = {} } = useQuery({
    queryKey: ["admin-sidebar-badge-counts"],
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    queryFn: async () => {
      const [orders, prescriptions] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ["pending", "confirmed", "processing"]),
        supabase.from("prescriptions").select("*", { count: "exact", head: true }).eq("verified", false),
      ]);
      const counts: Record<string, number> = {};
      if (orders.count) counts.orders = orders.count;
      if (prescriptions.count) counts.prescriptions = prescriptions.count;
      return counts;
    },
  });

  useEffect(() => {
    const verified = localStorage.getItem("admin_code_verified");
    if (!verified) {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  const currentTitle = allItems.find((n) => n.url === location.pathname)?.title || "Admin";

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-[220px] bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="px-3 py-3 border-b border-border flex items-center justify-between">
          <Link
            to="/admin"
            className="flex items-center gap-2"
            onClick={() => setSidebarOpen(false)}
          >
            <img src="/images/optimum-logo.jpg" alt="Optimum Pharmaceuticals HLB" className="h-8 object-contain" />
            <p className="text-[9px] text-muted-foreground leading-none">Admin Panel</p>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-lg bg-secondary hover:bg-muted active:scale-95 transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav Groups */}
        <nav
          className="flex-1 p-2 overflow-y-auto space-y-1"
          style={{ scrollbarWidth: "thin" }}
        >
          {navGroups.map((group) => (
            <SidebarNavGroup
              key={group.label}
              group={group}
              currentPath={location.pathname}
              onNavigate={() => setSidebarOpen(false)}
              badgeCounts={badgeCounts}
            />
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-border space-y-0.5">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <ArrowLeft size={14} />
            Back to Site
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("admin_code_verified");
              navigate("/admin/login");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] text-destructive hover:bg-destructive/5 transition-all"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border px-3 py-2 flex items-center gap-3 lg:px-5">
          <button
            className="lg:hidden p-1.5 rounded-lg bg-secondary hover:bg-muted active:scale-95 transition-all"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <h2 className="text-sm font-bold text-foreground">{currentTitle}</h2>

          {/* Quick actions - visible on larger screens */}
          <div className="hidden md:flex items-center gap-1.5 ml-auto">
            {quickActions.map((qa) => (
              <Link
                key={qa.url}
                to={qa.url}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                  qa.color
                )}
              >
                <qa.icon size={13} />
                {qa.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="p-3 lg:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
