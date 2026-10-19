import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Package, CheckCircle2, Clock, XCircle, Search, Filter, MapPin, ArrowUpDown, Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Package },
  processing: { label: "Processing", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", icon: Package },
  shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: Truck },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

const AdminCourier = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-courier-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, total_amount, delivery_charge, delivery_address, created_at, tracking_status, user_id, delivery_zone_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: riderAssignments } = useQuery({
    queryKey: ["admin-courier-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rider_assignments")
        .select("order_id, rider_id, status, picked_up_at, delivered_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-courier-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, name, phone");
      if (error) throw error;
      return data;
    },
  });

  const assignmentMap = useMemo(() => {
    const map: Record<string, typeof riderAssignments extends (infer T)[] | null ? T : never> = {};
    riderAssignments?.forEach((a) => { map[a.order_id] = a; });
    return map;
  }, [riderAssignments]);

  const profileMap = useMemo(() => {
    const map: Record<string, { name: string; phone: string | null }> = {};
    profiles?.forEach((p) => { map[p.id] = { name: p.name, phone: p.phone }; });
    return map;
  }, [profiles]);

  const filtered = useMemo(() => {
    let list = orders || [];
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        o.id.toLowerCase().includes(q) ||
        o.delivery_address?.toLowerCase().includes(q) ||
        profileMap[o.user_id]?.name?.toLowerCase().includes(q) ||
        profileMap[o.user_id]?.phone?.includes(q)
      );
    }
    if (sortBy === "amount") list = [...list].sort((a, b) => b.total_amount - a.total_amount);
    return list;
  }, [orders, statusFilter, search, sortBy, profileMap]);

  const stats = useMemo(() => {
    const all = orders || [];
    return {
      total: all.length,
      pending: all.filter((o) => o.status === "pending" || o.status === "confirmed" || o.status === "processing").length,
      shipped: all.filter((o) => o.status === "shipped").length,
      delivered: all.filter((o) => o.status === "delivered").length,
      cancelled: all.filter((o) => o.status === "cancelled").length,
      totalDeliveryCharge: all.reduce((s, o) => s + (o.delivery_charge || 0), 0),
    };
  }, [orders]);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={28} /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Truck size={22} className="text-orange-500" />
          Courier Dashboard
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Track all shipments · Courier API integration coming soon</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Orders", value: stats.total, color: "text-foreground", bg: "bg-secondary" },
          { label: "Pending/Processing", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Shipped", value: stats.shipped, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
          { label: "Delivered", value: stats.delivered, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Cancelled", value: stats.cancelled, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
          { label: "Delivery Revenue", value: `৳${stats.totalDeliveryCharge}`, color: "text-primary", bg: "bg-primary/5" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 space-y-1`}>
            <p className="text-[10px] font-medium text-muted-foreground">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* API Integration Banner */}
      <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-200 dark:border-orange-800/30 rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
          <ExternalLink size={18} className="text-orange-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Courier API Integration</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            This dashboard is ready for courier API integration (Steadfast, Pathao, RedX, etc.). Once connected, you'll be able to create consignments, track parcels in real-time, and manage returns directly from here.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, address, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
            <Filter size={13} className="mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "amount")}>
          <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
            <ArrowUpDown size={13} className="mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Latest First</SelectItem>
            <SelectItem value="amount">Highest Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No orders found</div>
        )}
        {filtered.map((order) => {
          const sc = statusConfig[order.status] || statusConfig.pending;
          const StatusIcon = sc.icon;
          const assignment = assignmentMap[order.id];
          const rider = assignment ? profileMap[assignment.rider_id] : null;
          const customer = profileMap[order.user_id];
          const orderId = order.id.substring(0, 8).toUpperCase();

          return (
            <div key={order.id} className="bg-card border border-border rounded-xl p-3 sm:p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">#{orderId}</span>
                    <Badge className={`${sc.color} text-[10px] px-1.5 py-0 font-medium border-0`}>
                      <StatusIcon size={10} className="mr-0.5" />
                      {sc.label}
                    </Badge>
                  </div>
                  {customer && (
                    <p className="text-xs text-muted-foreground">
                      {customer.name} {customer.phone && `· ${customer.phone}`}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">৳{order.total_amount}</p>
                  <p className="text-[10px] text-muted-foreground">+৳{order.delivery_charge} delivery</p>
                </div>
              </div>

              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin size={12} className="shrink-0 mt-0.5" />
                <span className="line-clamp-1">{order.delivery_address}</span>
              </div>

              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border">
                <span className="text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                {rider ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <Truck size={10} />
                    Rider: {rider.name}
                    {assignment?.status === "delivered" && " ✅"}
                    {assignment?.status === "picked_up" && " 📦"}
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">No rider assigned</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCourier;
