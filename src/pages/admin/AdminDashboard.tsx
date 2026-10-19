import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingBag, Users, TrendingUp, TrendingDown, Clock, AlertTriangle, Star, CalendarDays, Eye, ArrowUpRight, ArrowDownRight, DollarSign, ShoppingCart, BarChart3, Percent, FlaskConical, Stethoscope, XOctagon, Activity, Timer, MousePointer } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Link } from "react-router-dom";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#f97316", "#14b8a6"];

type Period = "today" | "7d" | "30d" | "all";

const periodLabels: Record<Period, string> = { today: "Today", "7d": "Last 7 Days", "30d": "Last 30 Days", all: "All Time" };

const getDateRange = (period: Period) => {
  const now = new Date();
  if (period === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 1);
    return { start, prevStart, prevEnd: start };
  }
  if (period === "7d") {
    const start = new Date(now); start.setDate(now.getDate() - 7);
    const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 7);
    return { start, prevStart, prevEnd: start };
  }
  if (period === "30d") {
    const start = new Date(now); start.setDate(now.getDate() - 30);
    const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 30);
    return { start, prevStart, prevEnd: start };
  }
  return { start: new Date(0), prevStart: new Date(0), prevEnd: new Date(0) };
};

const calcGrowth = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const GrowthBadge = ({ value }: { value: number }) => {
  if (value === 0) return <span className="text-[10px] text-muted-foreground">—</span>;
  const positive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${positive ? "text-emerald-600" : "text-red-500"}`}>
      {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(value)}%
    </span>
  );
};

const KPICard = ({ label, value, prevValue, icon: Icon, prefix = "" }: { label: string; value: number; prevValue: number; icon: any; prefix?: string }) => {
  const growth = calcGrowth(value, prevValue);
  return (
    <div className="bg-card rounded-2xl shadow-ios p-4 space-y-2 border border-border hover:border-primary/20 transition-colors">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon size={16} className="text-primary" />
        </div>
        <GrowthBadge value={growth} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{prefix}{value.toLocaleString()}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
      <p className="text-[10px] text-muted-foreground/70">Previous: {prefix}{prevValue.toLocaleString()}</p>
    </div>
  );
};

const AdminDashboard = () => {
  const [period, setPeriod] = useState<Period>("7d");
  const stale = 2 * 60 * 1000;

  // All orders (single fetch)
  const { data: allOrders } = useQuery({
    queryKey: ["admin-all-orders-summary"],
    staleTime: stale,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("status, total_amount, delivery_charge, created_at, user_id");
      if (error) throw error;
      return data;
    },
  });

  // All lab bookings
  const { data: allLabBookings } = useQuery({
    queryKey: ["admin-all-lab-bookings-summary"],
    enabled: false, // Doctor & Lab temporarily disabled (pharma-only)
    staleTime: stale,
    queryFn: async () => {
      const { data, error } = await supabase.from("lab_bookings").select("status, total_amount, created_at");
      if (error) throw error;
      return data;
    },
  });

  // All doctor appointments
  const { data: allAppointments } = useQuery({
    queryKey: ["admin-all-appointments-summary"],
    enabled: false, // Doctor & Lab temporarily disabled (pharma-only)
    staleTime: stale,
    queryFn: async () => {
      const { data, error } = await supabase.from("doctor_appointments").select("status, consultation_fee, created_at");
      if (error) throw error;
      return data;
    },
  });

  // Low stock
  const { data: lowStock } = useQuery({
    queryKey: ["admin-low-stock"],
    staleTime: stale,
    queryFn: async () => {
      const { data, error } = await supabase.from("medicines").select("id, name, stock, price, image_url").lte("stock", 10).order("stock", { ascending: true }).limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Best selling
  const { data: bestSelling } = useQuery({
    queryKey: ["admin-best-selling"],
    staleTime: stale,
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("quantity, medicine_id, medicines(name, price, image_url)");
      if (error) throw error;
      const prodMap: Record<string, { name: string; qty: number; revenue: number; image?: string; id: string }> = {};
      const soldIds = new Set<string>();
      data?.forEach((item: any) => {
        const id = item.medicine_id;
        soldIds.add(id);
        if (!prodMap[id]) prodMap[id] = { name: item.medicines?.name || "Unknown", qty: 0, revenue: 0, image: item.medicines?.image_url, id };
        prodMap[id].qty += item.quantity;
        prodMap[id].revenue += item.quantity * Number(item.medicines?.price || 0);
      });
      return { top: Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 8), soldIds };
    },
  });

  // Never sold products
  const { data: neverSold } = useQuery({
    queryKey: ["admin-never-sold"],
    staleTime: stale,
    queryFn: async () => {
      const { data: allMeds } = await supabase.from("medicines").select("id, name, price, stock, image_url, created_at").order("created_at", { ascending: true });
      const { data: orderItems } = await supabase.from("order_items").select("medicine_id");
      const soldIds = new Set(orderItems?.map(i => i.medicine_id) || []);
      return (allMeds || []).filter(m => !soldIds.has(m.id)).slice(0, 10);
    },
  });

  // Abandoned cart data (add_to_cart events without subsequent purchases)
  const { data: cartActivity } = useQuery({
    queryKey: ["admin-cart-activity"],
    staleTime: stale,
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("marketing_events")
        .select("event_type, event_data, session_id, created_at")
        .in("event_type", ["add_to_cart", "remove_from_cart", "page_view", "page_time"])
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;

      // Cart products frequency
      const cartProducts: Record<string, { name: string; count: number; product_id: string }> = {};
      // Page time aggregation
      const pageTime: Record<string, { totalSec: number; views: number }> = {};
      // Session activity
      const sessions: Record<string, { pages: Set<string>; cartAdds: number; lastSeen: string }> = {};

      data?.forEach((e: any) => {
        const d = e.event_data || {};
        const sid = e.session_id;
        if (!sessions[sid]) sessions[sid] = { pages: new Set(), cartAdds: 0, lastSeen: e.created_at };

        if (e.event_type === "add_to_cart" && d.product_name) {
          const pid = d.product_id;
          if (!cartProducts[pid]) cartProducts[pid] = { name: d.product_name, count: 0, product_id: pid };
          cartProducts[pid].count++;
          sessions[sid].cartAdds++;
        }
        if (e.event_type === "page_view" && d.page) {
          sessions[sid].pages.add(d.page);
        }
        if (e.event_type === "page_time" && d.page && d.seconds) {
          if (!pageTime[d.page]) pageTime[d.page] = { totalSec: 0, views: 0 };
          pageTime[d.page].totalSec += d.seconds;
          pageTime[d.page].views++;
        }
      });

      const topCartProducts = Object.values(cartProducts).sort((a, b) => b.count - a.count).slice(0, 10);
      const topPages = Object.entries(pageTime)
        .map(([page, d]) => ({ page, avgTime: Math.round(d.totalSec / d.views), views: d.views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);
      const totalSessions = Object.keys(sessions).length;
      const sessionsWithCart = Object.values(sessions).filter(s => s.cartAdds > 0).length;
      const avgPagesPerSession = totalSessions ? Math.round(Object.values(sessions).reduce((s, v) => s + v.pages.size, 0) / totalSessions * 10) / 10 : 0;

      return { topCartProducts, topPages, totalSessions, sessionsWithCart, avgPagesPerSession };
    },
  });

  // Category sales
  const { data: categorySales } = useQuery({
    queryKey: ["admin-category-sales"],
    staleTime: stale,
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("quantity, price, medicines(category_id, categories(name))");
      if (error) throw error;
      const catMap: Record<string, number> = {};
      data?.forEach((item: any) => {
        const catName = item.medicines?.categories?.name || "Others";
        catMap[catName] = (catMap[catName] || 0) + item.quantity * Number(item.price);
      });
      return Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value);
    },
  });

  // Recent orders
  const { data: recentOrders } = useQuery({
    queryKey: ["admin-recent-orders"],
    staleTime: stale,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id, total_amount, status, created_at, profiles(name, phone)").order("created_at", { ascending: false }).limit(8);
      if (error) throw error;
      return data;
    },
  });

  // Recent lab bookings
  const { data: recentLabBookings } = useQuery({
    queryKey: ["admin-recent-lab-bookings"],
    enabled: false, // Doctor & Lab temporarily disabled (pharma-only)
    staleTime: stale,
    queryFn: async () => {
      const { data, error } = await supabase.from("lab_bookings").select("id, booking_number, patient_name, patient_phone, total_amount, status, created_at, preferred_date").order("created_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data;
    },
  });

  // Recent appointments
  const { data: recentAppointments } = useQuery({
    queryKey: ["admin-recent-appointments"],
    enabled: false, // Doctor & Lab temporarily disabled (pharma-only)
    staleTime: stale,
    queryFn: async () => {
      const { data, error } = await supabase.from("doctor_appointments").select("id, appointment_number, patient_name, patient_phone, consultation_fee, status, created_at, appointment_date, doctors(name)").order("created_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data;
    },
  });

  // Live visitors
  const { data: liveCount } = useQuery({
    queryKey: ["admin-live-visitors-count"],
    queryFn: async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count, error } = await supabase.from("active_sessions").select("id", { count: "exact", head: true }).gte("last_seen_at", fiveMinAgo);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 15000,
  });

  // Derived KPIs with comparison
  const kpis = useMemo(() => {
    if (!allOrders) return null;
    const { start, prevStart, prevEnd } = getDateRange(period);
    const startIso = start.toISOString();
    const prevStartIso = prevStart.toISOString();
    const prevEndIso = prevEnd.toISOString();

    const currentOrders = period === "all" ? allOrders : allOrders.filter(o => o.created_at >= startIso);
    const prevOrders = period === "all" ? [] : allOrders.filter(o => o.created_at >= prevStartIso && o.created_at < prevEndIso);

    const revenue = (orders: typeof allOrders) => orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_amount), 0);
    const orderCount = (orders: typeof allOrders) => orders.length;
    const avgOrder = (orders: typeof allOrders) => {
      const valid = orders.filter(o => o.status !== "cancelled");
      return valid.length ? Math.round(revenue(orders) / valid.length) : 0;
    };
    const conversionOrders = (orders: typeof allOrders) => {
      const total = orders.length;
      const delivered = orders.filter(o => o.status === "delivered").length;
      return total ? Math.round((delivered / total) * 100) : 0;
    };
    const uniqueCustomers = (orders: typeof allOrders) => new Set(orders.map(o => o.user_id)).size;

    // Lab booking KPIs
    const currentLab = !allLabBookings ? [] : period === "all" ? allLabBookings : allLabBookings.filter(l => l.created_at >= startIso);
    const prevLab = !allLabBookings ? [] : period === "all" ? [] : allLabBookings.filter(l => l.created_at >= prevStartIso && l.created_at < prevEndIso);
    const labRevenue = (bookings: typeof allLabBookings) => (bookings || []).filter(b => b.status !== "cancelled").reduce((s, b) => s + Number(b.total_amount), 0);

    // Appointment KPIs
    const currentAppt = !allAppointments ? [] : period === "all" ? allAppointments : allAppointments.filter(a => a.created_at >= startIso);
    const prevAppt = !allAppointments ? [] : period === "all" ? [] : allAppointments.filter(a => a.created_at >= prevStartIso && a.created_at < prevEndIso);

    return {
      revenue: revenue(currentOrders), prevRevenue: revenue(prevOrders),
      orders: orderCount(currentOrders), prevOrders: orderCount(prevOrders),
      avg: avgOrder(currentOrders), prevAvg: avgOrder(prevOrders),
      conversion: conversionOrders(currentOrders), prevConversion: conversionOrders(prevOrders),
      customers: uniqueCustomers(currentOrders), prevCustomers: uniqueCustomers(prevOrders),
      pending: currentOrders.filter(o => o.status === "pending").length,
      processing: currentOrders.filter(o => ["confirmed", "processing", "shipped"].includes(o.status)).length,
      delivered: currentOrders.filter(o => o.status === "delivered").length,
      cancelled: currentOrders.filter(o => o.status === "cancelled").length,
      labBookings: currentLab.length, prevLabBookings: prevLab.length,
      labRevenue: labRevenue(currentLab), prevLabRevenue: labRevenue(prevLab),
      appointments: currentAppt.length, prevAppointments: prevAppt.length,
    };
  }, [allOrders, allLabBookings, allAppointments, period]);

  // 30-day trend
  const trendData = useMemo(() => {
    if (!allOrders) return [];
    const days = period === "today" ? 24 : period === "7d" ? 7 : 30;
    const isHourly = period === "today";
    const result: { label: string; revenue: number; orders: number }[] = [];

    if (isHourly) {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      for (let h = 0; h < 24; h++) {
        const hourStart = new Date(todayStart); hourStart.setHours(h);
        const hourEnd = new Date(todayStart); hourEnd.setHours(h + 1);
        const hourOrders = allOrders.filter(o => {
          const d = new Date(o.created_at);
          return d >= hourStart && d < hourEnd;
        });
        result.push({
          label: `${h.toString().padStart(2, "0")}:00`,
          revenue: hourOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_amount), 0),
          orders: hourOrders.length,
        });
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
        const dayOrders = allOrders.filter(o => o.created_at.startsWith(key));
        result.push({
          label,
          revenue: dayOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_amount), 0),
          orders: dayOrders.length,
        });
      }
    }
    return result;
  }, [allOrders, period]);

  // Healthcare trend
  const healthcareTrendData = useMemo(() => {
    if (!allLabBookings && !allAppointments) return [];
    const days = period === "today" ? 24 : period === "7d" ? 7 : 30;
    const isHourly = period === "today";
    const result: { label: string; labRevenue: number; labCount: number; apptRevenue: number; apptCount: number }[] = [];

    if (isHourly) {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      for (let h = 0; h < 24; h++) {
        const hourStart = new Date(todayStart); hourStart.setHours(h);
        const hourEnd = new Date(todayStart); hourEnd.setHours(h + 1);
        const hLab = (allLabBookings || []).filter(b => { const d = new Date(b.created_at); return d >= hourStart && d < hourEnd; });
        const hAppt = (allAppointments || []).filter(a => { const d = new Date(a.created_at); return d >= hourStart && d < hourEnd; });
        result.push({
          label: `${h.toString().padStart(2, "0")}:00`,
          labRevenue: hLab.filter(b => b.status !== "cancelled").reduce((s, b) => s + Number(b.total_amount), 0),
          labCount: hLab.length,
          apptRevenue: hAppt.filter(a => a.status !== "cancelled").reduce((s, a) => s + Number(a.consultation_fee), 0),
          apptCount: hAppt.length,
        });
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
        const dayLab = (allLabBookings || []).filter(b => b.created_at.startsWith(key));
        const dayAppt = (allAppointments || []).filter(a => a.created_at.startsWith(key));
        result.push({
          label,
          labRevenue: dayLab.filter(b => b.status !== "cancelled").reduce((s, b) => s + Number(b.total_amount), 0),
          labCount: dayLab.length,
          apptRevenue: dayAppt.filter(a => a.status !== "cancelled").reduce((s, a) => s + Number(a.consultation_fee), 0),
          apptCount: dayAppt.length,
        });
      }
    }
    return result;
  }, [allLabBookings, allAppointments, period]);

  // Status dist
  const statusDist = useMemo(() => {
    if (!allOrders) return [];
    const statusMap: Record<string, number> = {};
    allOrders.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
    const labels: Record<string, string> = { pending: "Pending", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };
    return Object.entries(statusMap).map(([status, count]) => ({ name: labels[status] || status, value: count }));
  }, [allOrders]);

  const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 };
  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600", confirmed: "bg-blue-500/10 text-blue-600",
    processing: "bg-violet-500/10 text-violet-600", shipped: "bg-sky-500/10 text-sky-600",
    delivered: "bg-emerald-500/10 text-emerald-600", cancelled: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      {/* Period Selector + Live Visitors */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-card rounded-xl border border-border p-1">
          {(Object.keys(periodLabels) as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {periodLabels[p]}
            </button>
          ))}
        </div>
        <Link to="/admin/marketing" className="flex items-center gap-2 bg-card rounded-xl border border-border px-4 py-2.5 hover:border-primary/30 transition-colors">
          <div className="relative">
            <Eye size={16} className="text-red-500" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-bold text-foreground">{liveCount ?? 0}</span>
          <span className="text-xs text-muted-foreground">online now</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Total Revenue" value={kpis?.revenue ?? 0} prevValue={kpis?.prevRevenue ?? 0} icon={DollarSign} prefix="৳" />
        <KPICard label="Orders" value={kpis?.orders ?? 0} prevValue={kpis?.prevOrders ?? 0} icon={ShoppingCart} />
        <KPICard label="Avg Order" value={kpis?.avg ?? 0} prevValue={kpis?.prevAvg ?? 0} icon={BarChart3} prefix="৳" />
        <KPICard label="Customers" value={kpis?.customers ?? 0} prevValue={kpis?.prevCustomers ?? 0} icon={Users} />
      </div>

      {/* Healthcare KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Conversion" value={kpis?.conversion ?? 0} prevValue={kpis?.prevConversion ?? 0} icon={Percent} />
      </div>

      {/* Order Pipeline */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Pending", value: kpis?.pending ?? 0, color: "border-amber-500 bg-amber-500/5" },
          { label: "Processing", value: kpis?.processing ?? 0, color: "border-blue-500 bg-blue-500/5" },
          { label: "Delivered", value: kpis?.delivered ?? 0, color: "border-emerald-500 bg-emerald-500/5" },
          { label: "Cancelled", value: kpis?.cancelled ?? 0, color: "border-red-500 bg-red-500/5" },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border-l-4 p-3 ${s.color}`}>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue + Orders Trend Chart */}
      <div className="bg-card rounded-2xl shadow-ios p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Sales Overview</h3>
          <span className="text-xs text-muted-foreground">{periodLabels[period]}</span>
        </div>
        <div className="h-[280px]">
          {trendData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={period === "30d" ? 4 : period === "today" ? 3 : 0} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [name === "revenue" ? `৳${v.toLocaleString()}` : v, name === "revenue" ? "Revenue" : "Orders"]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#gRevenue)" strokeWidth={2} name="revenue" />
                <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} opacity={0.6} name="orders" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Healthcare Revenue Trend */}
      <div className="hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Stethoscope size={16} className="text-primary" />
            <h3 className="font-semibold text-foreground">Healthcare Revenue</h3>
          </div>
          <span className="text-xs text-muted-foreground">{periodLabels[period]}</span>
        </div>
        <div className="h-[260px]">
          {healthcareTrendData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthcareTrendData}>
                <defs>
                  <linearGradient id="gLab" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAppt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={period === "30d" ? 4 : period === "today" ? 3 : 0} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => {
                  const labels: Record<string, string> = { labRevenue: "Lab Revenue", apptRevenue: "Appointment Revenue" };
                  return [`৳${v.toLocaleString()}`, labels[name] || name];
                }} />
                <Area type="monotone" dataKey="labRevenue" stroke="#22c55e" fill="url(#gLab)" strokeWidth={2} name="labRevenue" />
                <Area type="monotone" dataKey="apptRevenue" stroke="#3b82f6" fill="url(#gAppt)" strokeWidth={2} name="apptRevenue" />
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value: string) => value === "labRevenue" ? "Lab Tests" : "Appointments"} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Sales */}
        <div className="bg-card rounded-2xl shadow-ios p-5">
          <h3 className="font-semibold text-foreground mb-4">Sales by Category</h3>
          <div className="h-[260px]">
            {categorySales?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categorySales} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "hsl(var(--muted-foreground))" }}>
                    {categorySales.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`৳${v.toLocaleString()}`, "Sales"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-card rounded-2xl shadow-ios p-5">
          <h3 className="font-semibold text-foreground mb-4">Order Status Distribution</h3>
          <div className="h-[260px]">
            {statusDist.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={3}
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={{ stroke: "hsl(var(--muted-foreground))" }}>
                    {statusDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>}
          </div>
        </div>
      </div>

      {/* Best Selling & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl shadow-ios overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber-500" />
              <h3 className="font-semibold text-foreground">Top Products</h3>
            </div>
            <Link to="/admin/products" className="text-[10px] text-primary font-medium hover:underline">View All →</Link>
          </div>
          <div className="divide-y divide-border/30">
            {bestSelling?.top?.length ? bestSelling.top.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-secondary/50 overflow-hidden shrink-0">
                  {p.image ? <img src={p.image} alt="" className="w-full h-full object-contain p-0.5" /> : <Package size={14} className="m-auto text-muted-foreground mt-1.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.qty} sold</p>
                </div>
                <span className="text-xs font-bold text-foreground shrink-0">৳{p.revenue.toLocaleString()}</span>
              </div>
            )) : <div className="px-4 py-6 text-center text-muted-foreground text-xs">No sales data</div>}
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-ios overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              <h3 className="font-semibold text-foreground">Low Stock Alert</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 font-bold">{lowStock?.length ?? 0} items</span>
          </div>
          <div className="divide-y divide-border/30">
            {lowStock?.length ? lowStock.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-secondary/50 overflow-hidden shrink-0">
                  {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-contain p-0.5" /> : <Package size={14} className="m-auto text-muted-foreground mt-1.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">৳{p.price}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${p.stock === 0 ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-600"}`}>
                  {p.stock === 0 ? "Out of Stock" : `${p.stock} left`}
                </span>
              </div>
            )) : <div className="px-4 py-6 text-center text-muted-foreground text-xs">All products in stock ✓</div>}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-2xl shadow-ios overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Recent Orders</h3>
          <Link to="/admin/orders" className="text-[10px] text-primary font-medium hover:underline">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2.5 text-muted-foreground font-medium">Order</th>
                <th className="px-4 py-2.5 text-muted-foreground font-medium">Customer</th>
                <th className="px-4 py-2.5 text-muted-foreground font-medium text-right">Amount</th>
                <th className="px-4 py-2.5 text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-2.5 text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders?.length ? recentOrders.map(o => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">#{o.id.slice(0, 8)}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{(o as any).profiles?.name || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-foreground">৳{o.total_amount}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusColors[o.status] || "bg-muted text-muted-foreground"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Lab Bookings & Appointments — hidden while Doctor & Lab are disabled */}
      <div className="hidden">
        {/* Recent Lab Bookings */}
        <div className="bg-card rounded-2xl shadow-ios overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical size={16} className="text-primary" />
              <h3 className="font-semibold text-foreground">Recent Lab Bookings</h3>
            </div>
            <Link to="/admin/lab-bookings" className="text-[10px] text-primary font-medium hover:underline">View All →</Link>
          </div>
          <div className="divide-y divide-border/30">
            {recentLabBookings?.length ? recentLabBookings.map(b => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FlaskConical size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{b.patient_name}</p>
                  <p className="text-[10px] text-muted-foreground">{b.booking_number} · {new Date(b.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-foreground">৳{b.total_amount}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[b.status] || "bg-muted text-muted-foreground"}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            )) : <div className="px-4 py-6 text-center text-muted-foreground text-xs">No lab bookings yet</div>}
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-card rounded-2xl shadow-ios overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope size={16} className="text-primary" />
              <h3 className="font-semibold text-foreground">Recent Appointments</h3>
            </div>
            <Link to="/admin/appointments" className="text-[10px] text-primary font-medium hover:underline">View All →</Link>
          </div>
          <div className="divide-y divide-border/30">
            {recentAppointments?.length ? recentAppointments.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Stethoscope size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{a.patient_name}</p>
                  <p className="text-[10px] text-muted-foreground">{a.appointment_number} · Dr. {(a as any).doctors?.name || "—"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-foreground">৳{a.consultation_fee}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[a.status] || "bg-muted text-muted-foreground"}`}>
                    {a.status}
                  </span>
                </div>
              </div>
            )) : <div className="px-4 py-6 text-center text-muted-foreground text-xs">No appointments yet</div>}
          </div>
        </div>
      </div>

      {/* Audience Activity Insights */}
      <div className="bg-card rounded-2xl shadow-ios overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h3 className="font-semibold text-foreground">Audience Activity</h3>
          </div>
          <span className="text-[10px] text-muted-foreground">Last 7 days</span>
        </div>
        <div className="grid grid-cols-3 gap-0 border-b border-border">
          <div className="p-4 text-center border-r border-border">
            <p className="text-xl font-bold text-foreground">{cartActivity?.totalSessions ?? 0}</p>
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1"><MousePointer size={10} /> Sessions</p>
          </div>
          <div className="p-4 text-center border-r border-border">
            <p className="text-xl font-bold text-foreground">{cartActivity?.sessionsWithCart ?? 0}</p>
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1"><ShoppingCart size={10} /> Cart Users</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xl font-bold text-foreground">{cartActivity?.avgPagesPerSession ?? 0}</p>
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1"><Eye size={10} /> Avg Pages</p>
          </div>
        </div>
        {/* Page Time Ranking */}
        <div className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1"><Timer size={10} /> Avg Time on Page</p>
          <div className="space-y-2">
            {cartActivity?.topPages?.length ? cartActivity.topPages.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground truncate">{p.page}</span>
                    <div className="flex items-center gap-3 shrink-0 text-[10px]">
                      <span className="text-muted-foreground">{p.views} views</span>
                      <span className="font-bold text-primary">{p.avgTime}s avg</span>
                    </div>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary/40" style={{ width: `${Math.min(100, (p.avgTime / Math.max(...cartActivity.topPages.map(x => x.avgTime))) * 100)}%` }} />
                  </div>
                </div>
              </div>
            )) : <p className="text-xs text-muted-foreground text-center py-3">No page time data yet</p>}
          </div>
        </div>
      </div>

      {/* Cart Products & Never Sold */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Added to Cart */}
        <div className="bg-card rounded-2xl shadow-ios overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-primary" />
              <h3 className="font-semibold text-foreground">Most Added to Cart</h3>
            </div>
            <span className="text-[10px] text-muted-foreground">7 days</span>
          </div>
          <div className="divide-y divide-border/30">
            {cartActivity?.topCartProducts?.length ? cartActivity.topCartProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-primary/10 text-primary shrink-0">{p.count}x added</span>
              </div>
            )) : <div className="px-4 py-6 text-center text-muted-foreground text-xs">No cart data yet</div>}
          </div>
        </div>

        {/* Never Sold Products */}
        <div className="bg-card rounded-2xl shadow-ios overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XOctagon size={16} className="text-destructive" />
              <h3 className="font-semibold text-foreground">Never Sold</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold">{neverSold?.length ?? 0} products</span>
          </div>
          <div className="divide-y divide-border/30">
            {neverSold?.length ? neverSold.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-secondary/50 overflow-hidden shrink-0">
                  {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-contain p-0.5" /> : <Package size={14} className="m-auto text-muted-foreground mt-1.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">৳{p.price} · Stock: {p.stock}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{new Date(p.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</span>
              </div>
            )) : <div className="px-4 py-6 text-center text-muted-foreground text-xs">All products have sales ✓</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
