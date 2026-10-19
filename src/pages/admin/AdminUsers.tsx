import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, ShieldCheck, Building2, ChevronDown, Crown, TrendingUp, Users, Download, UserCheck } from "lucide-react";

const LTV_TIERS = [
  { label: "VIP", min: 10000, color: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Crown },
  { label: "Loyal", min: 5000, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: TrendingUp },
  { label: "Regular", min: 1000, color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: UserCheck },
  { label: "New", min: 0, color: "bg-muted text-muted-foreground border-border", icon: Users },
];

const getTier = (spent: number) => LTV_TIERS.find(t => spent >= t.min) || LTV_TIERS[LTV_TIERS.length - 1];

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "b2b" | "b2c">("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "spent" | "orders">("recent");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*, user_roles(role)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: userOrderStats } = useQuery({
    queryKey: ["admin-user-order-stats"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("user_id, total_amount, status, created_at");
      if (error) throw error;
      const stats: Record<string, { count: number; total: number; cancelled: number; returned: number; lastOrder: string }> = {};
      data?.forEach(o => {
        if (!stats[o.user_id]) stats[o.user_id] = { count: 0, total: 0, cancelled: 0, returned: 0, lastOrder: "" };
        stats[o.user_id].count++;
        stats[o.user_id].total += Number(o.total_amount);
        if (o.status === "cancelled") stats[o.user_id].cancelled++;
        if (o.status === "returned") stats[o.user_id].returned++;
        if (!stats[o.user_id].lastOrder || o.created_at > stats[o.user_id].lastOrder) {
          stats[o.user_id].lastOrder = o.created_at;
        }
      });
      return stats;
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, currentRole, targetRole }: { userId: string; currentRole: string; targetRole: string }) => {
      if (currentRole === targetRole) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", targetRole as any);
        if (error) throw error;
      } else {
        await supabase.from("user_roles").delete().eq("user_id", userId).in("role", ["admin", "b2b"] as any);
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: targetRole } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Role updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    let result = users?.filter(u => {
      const roles = (u as any).user_roles?.map((r: any) => r.role) || [];
      const isB2BUser = roles.includes("b2b");
      if (roleFilter === "b2b" && !isB2BUser) return false;
      if (roleFilter === "b2c" && isB2BUser) return false;
      if (tierFilter !== "all") {
        const spent = userOrderStats?.[u.id]?.total ?? 0;
        const tier = getTier(spent);
        if (tier.label !== tierFilter) return false;
      }
      if (!search) return true;
      const s = search.toLowerCase();
      return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.phone?.toLowerCase().includes(s);
    }) || [];

    if (sortBy === "spent") {
      result = [...result].sort((a, b) => (userOrderStats?.[b.id]?.total ?? 0) - (userOrderStats?.[a.id]?.total ?? 0));
    } else if (sortBy === "orders") {
      result = [...result].sort((a, b) => (userOrderStats?.[b.id]?.count ?? 0) - (userOrderStats?.[a.id]?.count ?? 0));
    }
    return result;
  }, [users, roleFilter, tierFilter, search, sortBy, userOrderStats]);

  const b2bCount = users?.filter(u => (u as any).user_roles?.some((r: any) => r.role === "b2b")).length ?? 0;
  const b2cCount = (users?.length ?? 0) - b2bCount;

  // Segment counts
  const segmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    LTV_TIERS.forEach(t => { counts[t.label] = 0; });
    users?.forEach(u => {
      const spent = userOrderStats?.[u.id]?.total ?? 0;
      const tier = getTier(spent);
      counts[tier.label] = (counts[tier.label] || 0) + 1;
    });
    return counts;
  }, [users, userOrderStats]);

  const exportCSV = () => {
    if (!filtered?.length) return;
    const header = "Name,Email,Phone,Orders,Total Spent,Cancelled,Tier,Joined\n";
    const rows = filtered.map(u => {
      const s = userOrderStats?.[u.id];
      const tier = getTier(s?.total ?? 0);
      return `${u.name || "—"},${u.email || "—"},${u.phone || "—"},${s?.count ?? 0},${s?.total ?? 0},${s?.cancelled ?? 0},${tier.label},${new Date(u.created_at).toLocaleDateString()}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "customers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Segment Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {LTV_TIERS.map(tier => {
          const TierIcon = tier.icon;
          const active = tierFilter === tier.label;
          return (
            <button key={tier.label} onClick={() => setTierFilter(active ? "all" : tier.label)}
              className={`bg-card rounded-xl border p-3 text-left transition-all hover:border-primary/30 ${active ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
              <div className="flex items-center gap-2 mb-1">
                <TierIcon size={14} className={tier.color.split(" ")[1]} />
                <span className="text-xs font-semibold text-foreground">{tier.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{segmentCounts[tier.label] ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">≥৳{tier.min.toLocaleString()} spent</p>
            </button>
          );
        })}
      </div>

      {/* Top bar: Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="relative">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)}
            className="appearance-none pl-4 pr-10 py-3 rounded-2xl border border-border bg-card text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
            <option value="all">All ({users?.length ?? 0})</option>
            <option value="b2b">B2B ({b2bCount})</option>
            <option value="b2c">B2C ({b2cCount})</option>
          </select>
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        <div className="relative">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none pl-4 pr-10 py-3 rounded-2xl border border-border bg-card text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
            <option value="recent">Most Recent</option>
            <option value="spent">Highest Spent</option>
            <option value="orders">Most Orders</option>
          </select>
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        <button onClick={exportCSV} className="px-4 py-2.5 rounded-2xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1.5 whitespace-nowrap">
          <Download size={14} /> Export
        </button>
      </div>

      <p className="text-sm text-muted-foreground">{filtered?.length ?? 0} customers</p>

      <div className="bg-card rounded-2xl shadow-ios overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Customer</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Contact</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs text-center">Tier</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs text-center">Orders</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs text-right">Spent</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs text-center">Cancelled</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Last Order</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Role</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={24} /></td></tr>
            ) : !filtered?.length ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No customers found</td></tr>
            ) : (
              filtered.map((u) => {
                const roles = (u as any).user_roles?.map((r: any) => r.role) || [];
                const isAdmin = roles.includes("admin");
                const isB2B = roles.includes("b2b");
                const currentRole = isAdmin ? "admin" : isB2B ? "b2b" : "user";
                const stats = userOrderStats?.[u.id];
                const tier = getTier(stats?.total ?? 0);
                const TierIcon = tier.icon;
                return (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{u.name || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-muted-foreground">{u.email || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.phone || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.color}`}>
                        <TierIcon size={10} /> {tier.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-foreground">{stats?.count ?? 0}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">৳{(stats?.total ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(stats?.cancelled ?? 0) > 0 ? "bg-destructive/10 text-destructive" : "text-muted-foreground"}`}>
                        {stats?.cancelled ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {stats?.lastOrder ? new Date(stats.lastOrder).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleRole.mutate({ userId: u.id, currentRole, targetRole: "admin" })}
                          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-xl transition-all active:scale-95 ${
                            isAdmin ? "bg-primary/15 text-primary hover:bg-primary/25" : "bg-muted text-muted-foreground hover:bg-secondary"
                          }`}>
                          <ShieldCheck size={12} /> Admin
                        </button>
                        <button
                          onClick={() => toggleRole.mutate({ userId: u.id, currentRole, targetRole: "b2b" })}
                          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-xl transition-all active:scale-95 ${
                            isB2B ? "bg-blue-500/15 text-blue-600 hover:bg-blue-500/25" : "bg-muted text-muted-foreground hover:bg-secondary"
                          }`}>
                          <Building2 size={12} /> B2B
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString("en-US")}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
