import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Package, Wallet, ArrowLeft, Loader2, Menu, X, ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";

const navItems = [
  { title: "Dashboard", url: "/rider", icon: LayoutDashboard },
  { title: "My Deliveries", url: "/rider/deliveries", icon: Package },
  { title: "Wallet", url: "/rider/wallet", icon: Wallet },
  { title: "Deposit Requests", url: "/rider/deposits", icon: ArrowDownToLine },
];

const RiderLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRider, setIsRider] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { toast.error("Please login"); navigate("/auth", { replace: true }); return; }

    const checkRole = async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: "rider" });
      if (error || !data) {
        // Also check admin
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
        if (!isAdmin) { toast.error("You don't have rider access"); navigate("/", { replace: true }); return; }
      }
      setIsRider(true);
    };
    checkRole();
  }, [user, authLoading, navigate]);

  if (authLoading || isRider === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card shadow-ios-lg flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/rider" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-ios">🛵</div>
            <span className="font-bold text-primary text-sm">Rider Panel</span>
          </Link>
          <button className="lg:hidden p-1.5 rounded-2xl bg-secondary hover:bg-muted active:scale-95 transition-all" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.url;
            return (
              <Link key={item.url} to={item.url} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all ${active ? "bg-primary text-primary-foreground shadow-ios" : "text-foreground hover:bg-secondary active:scale-[0.98]"}`}>
                <item.icon size={16} />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Link to="/" className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-[0.98]">
            <ArrowLeft size={16} />
            Back to Site
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 glass border-b border-border px-4 py-3 flex items-center gap-3 lg:px-6">
          <button className="lg:hidden p-1.5 rounded-2xl bg-secondary hover:bg-muted active:scale-95 transition-all" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <h2 className="text-lg font-bold text-foreground">
            {navItems.find((n) => n.url === location.pathname)?.title || "Rider"}
          </h2>
        </header>
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RiderLayout;
