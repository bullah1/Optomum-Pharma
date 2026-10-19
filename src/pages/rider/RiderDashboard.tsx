import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Package, Wallet, TrendingUp, CheckCircle2 } from "lucide-react";

const RiderDashboard = () => {
  const { user } = useAuth();

  const { data: assignments, isLoading: loadingAssign } = useQuery({
    queryKey: ["rider-assignments-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rider_assignments")
        .select("id, status")
        .eq("rider_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: wallet, isLoading: loadingWallet } = useQuery({
    queryKey: ["rider-wallet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rider_wallets")
        .select("*")
        .eq("rider_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const total = assignments?.length || 0;
  const delivered = assignments?.filter(a => a.status === "delivered").length || 0;
  const pending = assignments?.filter(a => a.status === "assigned" || a.status === "picked_up").length || 0;

  if (loadingAssign || loadingWallet) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28} /></div>;
  }

  const stats = [
    { label: "Total Assigned", value: total, icon: Package, color: "text-primary" },
    { label: "Pending Delivery", value: pending, icon: TrendingUp, color: "text-amber-500" },
    { label: "Delivered", value: delivered, icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Wallet Balance", value: `৳${wallet?.balance || 0}`, icon: Wallet, color: "text-blue-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl shadow-ios p-4 space-y-2">
            <div className="flex items-center gap-2">
              <s.icon size={18} className={s.color} />
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl shadow-ios p-5">
        <h3 className="font-bold text-foreground mb-3">Quick Summary</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Total Earned: <span className="font-bold text-foreground">৳{wallet?.total_earned || 0}</span></p>
          <p>Total Deposited: <span className="font-bold text-foreground">৳{wallet?.total_deposited || 0}</span></p>
          <p>Current Balance: <span className="font-bold text-primary">৳{wallet?.balance || 0}</span></p>
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
