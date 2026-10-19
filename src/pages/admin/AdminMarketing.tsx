import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Plus, Copy, TrendingUp, Target, Megaphone, DollarSign,
  Trash2, BarChart3, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight,
  ShoppingCart, Eye, MousePointerClick, Percent, Users, Activity,
  Sparkles, UserCheck, LineChart, Radio, ChevronDown, Info
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { CustomerInsightsTab } from "./marketing/CustomerInsightsTab";
import { AIInsightsTab } from "./marketing/AIInsightsTab";
import { SalesAnalyticsTab } from "./marketing/SalesAnalyticsTab";
import { LiveVisitorsTab } from "./marketing/LiveVisitorsTab";
import { exportToCSV, ExportButton } from "./marketing/ExportUtils";

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all";

// ========== DATE RANGE PICKER ==========
const DateRangePicker = ({ from, to, onChange }: { from: Date; to: Date; onChange: (from: Date, to: Date) => void }) => {
  const presets = [
    { label: "Today", days: 1 },
    { label: "7D", days: 7 },
    { label: "30D", days: 30 },
    { label: "90D", days: 90 },
    { label: "All", days: 365 },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {presets.map(p => {
        const isActive = Math.round((to.getTime() - from.getTime()) / 86400000) === p.days;
        return (
          <button key={p.label} onClick={() => onChange(subDays(new Date(), p.days), new Date())}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:bg-muted"}`}>
            {p.label}
          </button>
        );
      })}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary text-muted-foreground hover:bg-muted">
            <CalendarIcon size={12} />
            {format(from, "dd MMM")} – {format(to, "dd MMM")}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={{ from, to }}
            onSelect={(range: any) => { if (range?.from) onChange(range.from, range.to || range.from); }}
            numberOfMonths={1}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

// ========== KPI CARD ==========
const KPICard = ({ icon: Icon, label, value, subValue, trend, color = "primary", highlight }: {
  icon: any; label: string; value: string; subValue?: string; trend?: number; color?: string; highlight?: boolean;
}) => (
  <div className={`rounded-2xl shadow-ios p-4 space-y-2 transition-all ${highlight ? "bg-primary/5 border border-primary/20" : "bg-card"}`}>
    <div className="flex items-center justify-between">
      <div className={`w-9 h-9 rounded-xl bg-${color}/10 flex items-center justify-center`}>
        <Icon size={16} className={`text-${color}`} />
      </div>
      {trend !== undefined && trend !== 0 && (
        <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? "text-emerald-600 bg-emerald-500/10" : "text-destructive bg-destructive/10"}`}>
          {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {Math.abs(trend).toFixed(0)}%
        </span>
      )}
    </div>
    <p className="text-xl font-black text-foreground leading-none tracking-tight">{value}</p>
    <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
    {subValue && <p className="text-[10px] text-muted-foreground/70">{subValue}</p>}
  </div>
);

// ========== QUICK INSIGHT BANNER ==========
const QuickInsightBanner = ({ insights }: { insights: string[] }) => {
  if (!insights.length) return null;
  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/10">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={14} className="text-primary" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground">📊 Quick Analysis</p>
          {insights.map((insight, i) => (
            <p key={i} className="text-[11px] text-foreground/80 leading-relaxed">• {insight}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

// ========== MAIN COMPONENT ==========
const AdminMarketing = () => {
  const [tab, setTab] = useState<string>("overview");

  const tabs = [
    { key: "live", label: "Live", icon: Radio, badge: "🔴" },
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "ai", label: "AI Insights", icon: Sparkles },
    { key: "customers", label: "Customers", icon: UserCheck },
    { key: "sales", label: "Sales", icon: LineChart },
    { key: "campaigns", label: "Campaigns", icon: Megaphone },
    { key: "funnel", label: "Funnel", icon: Target },
  ];

  return (
    <div className="space-y-5">
      {/* Tab Navigation - Scrollable pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              tab === t.key
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-muted-foreground hover:bg-secondary border border-border"
            }`}>
            {t.badge && <span className="text-[10px]">{t.badge}</span>}
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "live" && <LiveVisitorsTab />}
      {tab === "overview" && <OverviewTab />}
      {tab === "ai" && <AIInsightsTab />}
      {tab === "customers" && <CustomerInsightsTab />}
      {tab === "sales" && <SalesAnalyticsTab />}
      {tab === "campaigns" && <CampaignsTab />}
      {tab === "funnel" && <FunnelTab />}
    </div>
  );
};

// ========== OVERVIEW TAB ==========
const OverviewTab = () => {
  const [dateFrom, setDateFrom] = useState(() => subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState(() => new Date());

  const { data, isLoading } = useQuery({
    queryKey: ["marketing-overview", dateFrom.toISOString(), dateTo.toISOString()],
    queryFn: async () => {
      const fromISO = startOfDay(dateFrom).toISOString();
      const toISO = endOfDay(dateTo).toISOString();
      const days = Math.round((dateTo.getTime() - dateFrom.getTime()) / 86400000);
      const prevFromISO = startOfDay(subDays(dateFrom, days)).toISOString();

      const [visitsRes, eventsRes, ordersRes, spendRes, prevVisitsRes, prevOrdersRes] = await Promise.all([
        supabase.from("marketing_visits").select("id, utm_source, device_type, created_at").gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("marketing_events").select("event_type, session_id, event_data, created_at").gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("orders").select("id, total_amount, utm_source, utm_medium, device_type, created_at").gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("ad_spend").select("amount, clicks, impressions, date").gte("date", format(dateFrom, "yyyy-MM-dd")).lte("date", format(dateTo, "yyyy-MM-dd")),
        supabase.from("marketing_visits").select("id").gte("created_at", prevFromISO).lt("created_at", fromISO),
        supabase.from("orders").select("id, total_amount").gte("created_at", prevFromISO).lt("created_at", fromISO),
      ]);

      const visits = visitsRes.data || [];
      const events = eventsRes.data || [];
      const orders = ordersRes.data || [];
      const spends = spendRes.data || [];
      const prevVisits = prevVisitsRes.data || [];
      const prevOrders = prevOrdersRes.data || [];

      const totalSpend = spends.reduce((s, r) => s + Number(r.amount), 0);
      const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
      const prevRevenue = prevOrders.reduce((s, o) => s + Number(o.total_amount), 0);
      const totalImpressions = spends.reduce((s, r) => s + (r.impressions || 0), 0);
      const totalClicks = spends.reduce((s, r) => s + (r.clicks || 0), 0);

      const eventCounts: Record<string, number> = {};
      events.forEach(e => { eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1; });

      const sourceMap: Record<string, { visits: number; orders: number; revenue: number }> = {};
      visits.forEach(v => { const k = v.utm_source || "direct"; if (!sourceMap[k]) sourceMap[k] = { visits: 0, orders: 0, revenue: 0 }; sourceMap[k].visits++; });
      orders.forEach(o => { const k = o.utm_source || "direct"; if (!sourceMap[k]) sourceMap[k] = { visits: 0, orders: 0, revenue: 0 }; sourceMap[k].orders++; sourceMap[k].revenue += Number(o.total_amount); });

      const productMap: Record<string, { name: string; views: number; carts: number }> = {};
      events.forEach(e => {
        const d = e.event_data as any;
        if (!d?.product_id) return;
        if (!productMap[d.product_id]) productMap[d.product_id] = { name: d.product_name || d.product_id, views: 0, carts: 0 };
        if (e.event_type === "product_view") productMap[d.product_id].views++;
        if (e.event_type === "add_to_cart") productMap[d.product_id].carts++;
      });

      const dailyMap: Record<string, { visits: number; orders: number; revenue: number }> = {};
      visits.forEach(v => { const d = format(new Date(v.created_at), "dd MMM"); if (!dailyMap[d]) dailyMap[d] = { visits: 0, orders: 0, revenue: 0 }; dailyMap[d].visits++; });
      orders.forEach(o => { const d = format(new Date(o.created_at), "dd MMM"); if (!dailyMap[d]) dailyMap[d] = { visits: 0, orders: 0, revenue: 0 }; dailyMap[d].orders++; dailyMap[d].revenue += Number(o.total_amount); });

      // Device breakdown
      const deviceMap: Record<string, number> = {};
      visits.forEach(v => { const d = v.device_type || "desktop"; deviceMap[d] = (deviceMap[d] || 0) + 1; });

      return {
        totalVisits: visits.length, prevVisits: prevVisits.length,
        visitsTrend: prevVisits.length > 0 ? ((visits.length - prevVisits.length) / prevVisits.length) * 100 : 0,
        totalOrders: orders.length, prevOrders: prevOrders.length,
        ordersTrend: prevOrders.length > 0 ? ((orders.length - prevOrders.length) / prevOrders.length) * 100 : 0,
        totalRevenue, prevRevenue,
        revenueTrend: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
        totalSpend, totalImpressions, totalClicks,
        roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        cpo: orders.length > 0 ? totalSpend / orders.length : 0,
        cvr: visits.length > 0 ? (orders.length / visits.length) * 100 : 0,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        productViews: eventCounts["product_view"] || 0,
        addToCarts: eventCounts["add_to_cart"] || 0,
        sources: Object.entries(sourceMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5),
        topProducts: Object.entries(productMap).sort((a, b) => b[1].views - a[1].views).slice(0, 8),
        daily: Object.entries(dailyMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-14),
        devices: Object.entries(deviceMap).sort((a, b) => b[1] - a[1]),
      };
    },
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={28} /></div>;
  if (!data) return null;

  // Auto-generate quick insights
  const quickInsights: string[] = [];
  if (data.totalOrders > 0) {
    quickInsights.push(`Total ${data.totalOrders} orders generated ৳${data.totalRevenue.toLocaleString()} revenue`);
  }
  if (data.revenueTrend !== 0) {
    quickInsights.push(`Revenue ${data.revenueTrend >= 0 ? "increased" : "decreased"} by ${Math.abs(data.revenueTrend).toFixed(1)}% vs previous period`);
  }
  if (data.cvr > 0) {
    quickInsights.push(`1 in every ${Math.round(100 / data.cvr)} visitors places an order (CVR: ${data.cvr.toFixed(1)}%)`);
  }
  if (data.totalSpend > 0) {
    quickInsights.push(`ROAS ${data.roas.toFixed(1)}x — ${data.roas >= 1 ? "✅ Profitable" : "⚠️ Losing money, optimize ads"}`);
  }

  const chartData = data.daily.map(([date, d]) => ({ date, visits: d.visits, orders: d.orders, revenue: d.revenue }));

  const handleExport = () => {
    const rows = data.sources.map(([source, d]) => ({
      Source: source, Visits: d.visits, Orders: d.orders, Revenue: d.revenue,
      CVR: d.visits > 0 ? ((d.orders / d.visits) * 100).toFixed(1) + "%" : "0%",
    }));
    exportToCSV(rows, "marketing_overview");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <DateRangePicker from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
        <ExportButton onClick={handleExport} />
      </div>

      {/* Quick Insight Banner */}
      <QuickInsightBanner insights={quickInsights} />

      {/* Main KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard icon={Users} label="Total Visits" value={data.totalVisits.toLocaleString()} trend={data.visitsTrend} />
        <KPICard icon={ShoppingCart} label="Orders" value={data.totalOrders.toLocaleString()} trend={data.ordersTrend} />
        <KPICard icon={DollarSign} label="Revenue" value={`৳${data.totalRevenue.toLocaleString()}`} trend={data.revenueTrend} highlight />
        <KPICard icon={DollarSign} label="Ad Spend" value={`৳${data.totalSpend.toLocaleString()}`} />
        <KPICard icon={TrendingUp} label="ROAS" value={`${data.roas.toFixed(1)}x`} subValue={data.roas >= 1 ? "✅ Profitable" : "⚠️ Loss"} highlight={data.roas >= 1} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard icon={Target} label="Cost Per Order" value={`৳${data.cpo.toFixed(0)}`} />
        <KPICard icon={Percent} label="CVR (Visit→Order)" value={`${data.cvr.toFixed(1)}%`} />
        <KPICard icon={Eye} label="Product Views" value={data.productViews.toLocaleString()} />
        <KPICard icon={ShoppingCart} label="Add to Cart" value={data.addToCarts.toLocaleString()} />
      </div>

      {/* Daily Traffic Chart - Recharts */}
      {chartData.length > 1 && (
        <div className="bg-card rounded-2xl shadow-ios p-5">
          <h4 className="text-sm font-bold text-foreground mb-1">📈 Daily Traffic & Orders</h4>
          <p className="text-[10px] text-muted-foreground mb-4">Daily comparison of visits and orders</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                  labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                />
                <Area type="monotone" dataKey="visits" name="Visits" stroke="hsl(var(--primary))" fill="url(#visitGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="orders" name="Orders" stroke="hsl(142 76% 36%)" fill="url(#orderGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Ad Spend vs Revenue */}
      {data.totalSpend > 0 && (
        <div className="bg-card rounded-2xl shadow-ios p-5">
          <h4 className="text-sm font-bold text-foreground mb-3">💰 Ad Spend vs Revenue</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-medium">Ad Spend</span>
                <span className="font-bold text-destructive">৳{data.totalSpend.toLocaleString()}</span>
              </div>
              <div className="bg-secondary rounded-full h-4 overflow-hidden">
                <div className="bg-destructive/60 rounded-full h-4 transition-all" style={{ width: `${Math.min((data.totalSpend / Math.max(data.totalRevenue, data.totalSpend)) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-medium">Revenue</span>
                <span className="font-bold text-primary">৳{data.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="bg-secondary rounded-full h-4 overflow-hidden">
                <div className="bg-primary rounded-full h-4 transition-all" style={{ width: `${Math.min((data.totalRevenue / Math.max(data.totalRevenue, data.totalSpend)) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sources & Products Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Sources */}
        <div className="bg-card rounded-2xl shadow-ios overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-sm font-bold text-foreground">🔗 Traffic Sources</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Source</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-medium">Visits</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-medium">Orders</th>
                  <th className="text-right px-4 py-2 text-muted-foreground font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map(([source, d]) => (
                  <tr key={source} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-foreground capitalize">{source}</td>
                    <td className="text-right px-3 py-2.5 text-muted-foreground">{d.visits}</td>
                    <td className="text-right px-3 py-2.5">{d.orders}</td>
                    <td className="text-right px-4 py-2.5 font-bold text-primary">৳{d.revenue.toLocaleString()}</td>
                  </tr>
                ))}
                {!data.sources.length && (
                  <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">No UTM data found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-card rounded-2xl shadow-ios overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-sm font-bold text-foreground">🏆 Top Products</h4>
          </div>
          <div className="divide-y divide-border/10">
            {data.topProducts.map(([id, d]) => {
              const convRate = d.views > 0 ? ((d.carts / d.views) * 100).toFixed(0) : "0";
              return (
                <div key={id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  <span className="text-xs font-medium text-foreground truncate max-w-[55%]">{d.name}</span>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1"><Eye size={11} /> {d.views}</span>
                    <span className="flex items-center gap-1"><ShoppingCart size={11} /> {d.carts}</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded-md text-[10px] ${Number(convRate) > 0 ? "text-emerald-600 bg-emerald-500/10" : "text-muted-foreground"}`}>
                      {convRate}%
                    </span>
                  </div>
                </div>
              );
            })}
            {!data.topProducts.length && <div className="text-xs text-muted-foreground text-center py-6">No product view data</div>}
          </div>
        </div>
      </div>

      {/* Device Breakdown Mini */}
      {data.devices.length > 0 && (
        <div className="bg-card rounded-2xl shadow-ios p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">📱 Device Breakdown</h4>
          <div className="flex items-center gap-4">
            {data.devices.map(([device, count]) => {
              const pct = data.totalVisits > 0 ? ((count / data.totalVisits) * 100).toFixed(0) : "0";
              return (
                <div key={device} className="flex-1 text-center bg-secondary/50 rounded-xl p-3">
                  <p className="text-lg font-black text-foreground">{pct}%</p>
                  <p className="text-[10px] text-muted-foreground capitalize font-medium">{device} ({count})</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ========== CAMPAIGNS TAB (merged with Ad Spend) ==========
const CampaignsTab = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showSpendForm, setShowSpendForm] = useState(false);
  const [form, setForm] = useState({ name: "", source: "", medium: "", campaign: "", term: "", content: "", budget: "", start_date: "", end_date: "", notes: "" });
  const [spendForm, setSpendForm] = useState({ campaign_id: "", date: format(new Date(), "yyyy-MM-dd"), amount: "", impressions: "", clicks: "", platform: "", notes: "" });
  const baseUrl = window.location.origin;

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: perfData } = useQuery({
    queryKey: ["campaign-performance"],
    queryFn: async () => {
      const since = subDays(new Date(), 90).toISOString();
      const [visitsRes, ordersRes] = await Promise.all([
        supabase.from("marketing_visits").select("utm_campaign, id").gte("created_at", since),
        supabase.from("orders").select("utm_campaign, total_amount").gte("created_at", since),
      ]);
      const visits = visitsRes.data || [];
      const orders = ordersRes.data || [];
      const map: Record<string, { visits: number; orders: number; revenue: number }> = {};
      visits.forEach(v => { if (!v.utm_campaign) return; if (!map[v.utm_campaign]) map[v.utm_campaign] = { visits: 0, orders: 0, revenue: 0 }; map[v.utm_campaign].visits++; });
      orders.forEach(o => { if (!o.utm_campaign) return; if (!map[o.utm_campaign]) map[o.utm_campaign] = { visits: 0, orders: 0, revenue: 0 }; map[o.utm_campaign].orders++; map[o.utm_campaign].revenue += Number(o.total_amount); });
      return map;
    },
  });

  const { data: spends } = useQuery({
    queryKey: ["admin-adspend"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_spend").select("*, marketing_campaigns(name, source)").order("date", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("marketing_campaigns").insert({
        name: form.name, source: form.source, medium: form.medium,
        campaign: form.campaign || form.name.toLowerCase().replace(/\s+/g, "-"),
        term: form.term, content: form.content,
        budget: parseFloat(form.budget) || 0,
        start_date: form.start_date || null, end_date: form.end_date || null, notes: form.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      toast.success("Campaign created!");
      setShowForm(false);
      setForm({ name: "", source: "", medium: "", campaign: "", term: "", content: "", budget: "", start_date: "", end_date: "", notes: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addSpendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ad_spend").insert({
        campaign_id: spendForm.campaign_id, date: spendForm.date,
        amount: parseFloat(spendForm.amount) || 0, impressions: parseInt(spendForm.impressions) || 0,
        clicks: parseInt(spendForm.clicks) || 0, platform: spendForm.platform, notes: spendForm.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-adspend"] });
      toast.success("Ad spend added!");
      setSpendForm(f => ({ ...f, amount: "", impressions: "", clicks: "", notes: "" }));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] }); toast.success("Deleted"); },
  });

  const generateUTM = (c: any) => {
    const params = new URLSearchParams();
    if (c.source) params.set("utm_source", c.source);
    if (c.medium) params.set("utm_medium", c.medium);
    if (c.campaign) params.set("utm_campaign", c.campaign);
    if (c.term) params.set("utm_term", c.term);
    if (c.content) params.set("utm_content", c.content);
    return `${baseUrl}/?${params.toString()}`;
  };

  const handleExport = () => {
    if (!campaigns?.length) return;
    const rows = campaigns.map((c: any) => {
      const perf = perfData?.[c.campaign];
      return {
        Name: c.name, Source: c.source, Medium: c.medium, Campaign: c.campaign,
        Budget: c.budget, Status: c.status,
        Visits: perf?.visits || 0, Orders: perf?.orders || 0, Revenue: perf?.revenue || 0,
      };
    });
    exportToCSV(rows, "campaigns");
  };

  // Ad Spend totals
  const totalSpend = spends?.reduce((s: number, r: any) => s + Number(r.amount), 0) || 0;
  const totalClicks = spends?.reduce((s: number, r: any) => s + (r.clicks || 0), 0) || 0;
  const totalImpressions = spends?.reduce((s: number, r: any) => s + (r.impressions || 0), 0) || 0;

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>;

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => { setShowForm(!showForm); setShowSpendForm(false); }}
          className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5">
          <Plus size={14} /> New Campaign
        </button>
        <button onClick={() => { setShowSpendForm(!showSpendForm); setShowForm(false); }}
          className="bg-secondary text-foreground text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 border border-border">
          <DollarSign size={14} /> Add Ad Spend
        </button>
        <div className="ml-auto"><ExportButton onClick={handleExport} /></div>
      </div>

      {/* Ad Spend Summary */}
      {totalSpend > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <KPICard icon={DollarSign} label="Total Spend" value={`৳${totalSpend.toLocaleString()}`} />
          <KPICard icon={Eye} label="Impressions" value={totalImpressions.toLocaleString()} />
          <KPICard icon={MousePointerClick} label="Clicks" value={totalClicks.toLocaleString()} subValue={`CTR: ${totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : 0}%`} />
        </div>
      )}

      {/* New Campaign Form */}
      {showForm && (
        <div className="bg-card rounded-2xl shadow-ios p-5 space-y-3 border border-primary/10">
          <h4 className="text-sm font-bold text-foreground">🆕 Create New Campaign</h4>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Campaign Name *" className={inputClass} />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className={inputClass}>
              <option value="">Source *</option>
              {["facebook","google","instagram","tiktok","youtube","email","sms","referral","organic"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={form.medium} onChange={e => setForm(f => ({ ...f, medium: e.target.value }))} className={inputClass}>
              <option value="">Medium *</option>
              {["cpc","cpm","social","email","sms","referral","organic"].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <input value={form.campaign} onChange={e => setForm(f => ({ ...f, campaign: e.target.value }))} placeholder="Campaign Tag (auto if empty)" className={inputClass} />
          <div className="grid grid-cols-3 gap-2">
            <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="Budget (৳)" className={inputClass} />
            <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inputClass} />
            <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={inputClass} />
          </div>
          {form.source && (
            <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
              <p className="text-[10px] text-muted-foreground mb-1 font-medium">🔗 UTM Link:</p>
              <p className="text-xs text-primary font-mono break-all">{generateUTM(form)}</p>
            </div>
          )}
          <button onClick={() => createMutation.mutate()} disabled={!form.name || !form.source || !form.medium || createMutation.isPending}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            {createMutation.isPending ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Create Campaign"}
          </button>
        </div>
      )}

      {/* Ad Spend Form */}
      {showSpendForm && (
        <div className="bg-card rounded-2xl shadow-ios p-5 space-y-3 border border-border">
          <h4 className="text-sm font-bold text-foreground">💰 Add Ad Spend</h4>
          <select value={spendForm.campaign_id} onChange={e => setSpendForm(f => ({ ...f, campaign_id: e.target.value }))} className={inputClass}>
            <option value="">Select Campaign *</option>
            {campaigns?.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.source})</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={spendForm.date} onChange={e => setSpendForm(f => ({ ...f, date: e.target.value }))} className={inputClass} />
            <input type="number" value={spendForm.amount} onChange={e => setSpendForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount (৳) *" className={inputClass} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" value={spendForm.impressions} onChange={e => setSpendForm(f => ({ ...f, impressions: e.target.value }))} placeholder="Impressions" className={inputClass} />
            <input type="number" value={spendForm.clicks} onChange={e => setSpendForm(f => ({ ...f, clicks: e.target.value }))} placeholder="Clicks" className={inputClass} />
            <input value={spendForm.platform} onChange={e => setSpendForm(f => ({ ...f, platform: e.target.value }))} placeholder="Platform" className={inputClass} />
          </div>
          <button onClick={() => addSpendMutation.mutate()} disabled={!spendForm.campaign_id || !spendForm.amount || addSpendMutation.isPending}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            {addSpendMutation.isPending ? "Saving..." : "Add Spend"}
          </button>
        </div>
      )}

      {/* Campaigns List */}
      <div className="space-y-3">
        {campaigns?.map((c: any) => {
          const perf = perfData?.[c.campaign];
          const cvr = perf && perf.visits > 0 ? ((perf.orders / perf.visits) * 100).toFixed(1) : "0";
          return (
            <div key={c.id} className="bg-card rounded-2xl shadow-ios p-4 space-y-2.5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.source} / {c.medium} / {c.campaign}</p>
                  {c.budget > 0 && <p className="text-xs text-muted-foreground">Budget: ৳{c.budget}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(c.created_at), "dd MMM yyyy")}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => { navigator.clipboard.writeText(generateUTM(c)); toast.success("UTM link copied!"); }}
                    className="p-2 rounded-xl bg-secondary hover:bg-muted transition-colors" title="Copy UTM Link">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => { if (confirm("Delete this campaign?")) deleteMutation.mutate(c.id); }}
                    className="p-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {perf && (perf.visits > 0 || perf.orders > 0) && (
                <div className="grid grid-cols-4 gap-2 bg-secondary/30 rounded-xl p-3">
                  <div className="text-center"><p className="text-xs font-bold text-foreground">{perf.visits}</p><p className="text-[9px] text-muted-foreground">Visits</p></div>
                  <div className="text-center"><p className="text-xs font-bold text-foreground">{perf.orders}</p><p className="text-[9px] text-muted-foreground">Orders</p></div>
                  <div className="text-center"><p className="text-xs font-bold text-primary">৳{perf.revenue.toLocaleString()}</p><p className="text-[9px] text-muted-foreground">Revenue</p></div>
                  <div className="text-center"><p className="text-xs font-bold text-foreground">{cvr}%</p><p className="text-[9px] text-muted-foreground">CVR</p></div>
                </div>
              )}
            </div>
          );
        })}
        {!campaigns?.length && <div className="bg-card rounded-2xl shadow-ios p-8 text-center text-muted-foreground text-sm">No campaigns yet</div>}
      </div>

      {/* Recent Ad Spend */}
      {spends && spends.length > 0 && (
        <div className="bg-card rounded-2xl shadow-ios overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-sm font-bold text-foreground">💸 Recent Ad Spend</h4>
          </div>
          <div className="divide-y divide-border/10">
            {spends.slice(0, 10).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-foreground">{s.marketing_campaigns?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(s.date), "dd MMM yyyy")} • {s.platform || s.marketing_campaigns?.source}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">৳{Number(s.amount).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{s.impressions || 0} imp • {s.clicks || 0} clicks</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ========== FUNNEL TAB ==========
const FunnelTab = () => {
  const [dateFrom, setDateFrom] = useState(() => subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState(() => new Date());

  const { data: funnelData, isLoading } = useQuery({
    queryKey: ["marketing-funnel", dateFrom.toISOString(), dateTo.toISOString()],
    queryFn: async () => {
      const fromISO = startOfDay(dateFrom).toISOString();
      const toISO = endOfDay(dateTo).toISOString();

      const [eventsRes, ordersRes] = await Promise.all([
        supabase.from("marketing_events").select("event_type, session_id, created_at").gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("orders").select("utm_source, utm_medium, utm_campaign, total_amount, first_visit_id, last_visit_id, created_at").gte("created_at", fromISO).lte("created_at", toISO),
      ]);

      const events = eventsRes.data || [];
      const orders = ordersRes.data || [];

      const funnelStages = [
        { label: "Page Views", type: "page_view", emoji: "👁️" },
        { label: "Category Views", type: "category_view", emoji: "📂" },
        { label: "Product Views", type: "product_view", emoji: "🔍" },
        { label: "Add to Cart", type: "add_to_cart", emoji: "🛒" },
        { label: "Order Placed", type: "order_placed", emoji: "✅" },
      ];

      const eventCounts: Record<string, Set<string>> = {};
      events.forEach((e: any) => {
        if (!eventCounts[e.event_type]) eventCounts[e.event_type] = new Set();
        eventCounts[e.event_type].add(e.session_id);
      });

      const funnel = funnelStages.map(s => ({ ...s, sessions: eventCounts[s.type]?.size || 0 }));

      const firstTouchMap: Record<string, { orders: number; revenue: number }> = {};
      const lastTouchMap: Record<string, { orders: number; revenue: number }> = {};
      orders.forEach((o: any) => {
        const ft = o.utm_source || "direct";
        if (!firstTouchMap[ft]) firstTouchMap[ft] = { orders: 0, revenue: 0 };
        firstTouchMap[ft].orders++; firstTouchMap[ft].revenue += Number(o.total_amount);
        const lt = o.utm_source || "direct";
        if (!lastTouchMap[lt]) lastTouchMap[lt] = { orders: 0, revenue: 0 };
        lastTouchMap[lt].orders++; lastTouchMap[lt].revenue += Number(o.total_amount);
      });

      return {
        funnel,
        firstTouch: Object.entries(firstTouchMap).sort((a, b) => b[1].revenue - a[1].revenue),
        lastTouch: Object.entries(lastTouchMap).sort((a, b) => b[1].revenue - a[1].revenue),
      };
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>;

  const maxSessions = Math.max(...(funnelData?.funnel.map(f => f.sessions) || [1]), 1);

  const handleExport = () => {
    if (!funnelData?.funnel.length) return;
    exportToCSV(funnelData.funnel.map((s, i) => ({
      Stage: s.label, Sessions: s.sessions,
      "Drop %": i > 0 && funnelData.funnel[i - 1].sessions > 0 ? ((1 - s.sessions / funnelData.funnel[i - 1].sessions) * 100).toFixed(1) + "%" : "-",
      "Overall %": funnelData.funnel[0].sessions > 0 ? ((s.sessions / funnelData.funnel[0].sessions) * 100).toFixed(1) + "%" : "-",
    })), "funnel_report");
  };

  // Funnel bar chart data
  const funnelChartData = funnelData?.funnel.map((stage, i) => ({
    name: stage.emoji + " " + stage.label,
    sessions: stage.sessions,
    dropRate: i > 0 && funnelData.funnel[i - 1].sessions > 0
      ? ((1 - stage.sessions / funnelData.funnel[i - 1].sessions) * 100)
      : 0,
  })) || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <DateRangePicker from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
        <ExportButton onClick={handleExport} />
      </div>

      {/* Visual Funnel */}
      <div className="bg-card rounded-2xl shadow-ios p-5">
        <h4 className="text-sm font-bold text-foreground mb-1">🔻 Conversion Funnel</h4>
        <p className="text-[10px] text-muted-foreground mb-4">Users at each step and where drop-offs occur</p>
        
        {/* Funnel Bars with Trapezoid Effect */}
        <div className="space-y-1.5 max-w-lg mx-auto">
          {funnelData?.funnel.map((stage, i) => {
            const pct = maxSessions > 0 ? (stage.sessions / maxSessions) * 100 : 0;
            const prevSessions = i > 0 ? funnelData.funnel[i - 1].sessions : stage.sessions;
            const dropRate = prevSessions > 0 ? ((1 - stage.sessions / prevSessions) * 100) : 0;
            const overallRate = funnelData.funnel[0].sessions > 0 ? ((stage.sessions / funnelData.funnel[0].sessions) * 100) : 0;
            const isLast = i === funnelData.funnel.length - 1;
            const colors = [
              "bg-primary",
              "bg-primary/80",
              "bg-primary/60",
              "bg-accent",
              "bg-primary",
            ];

            return (
              <div key={stage.type}>
                <div className="flex items-center gap-3">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <span>{stage.emoji}</span> {stage.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-foreground">{stage.sessions}</span>
                        {i > 0 && <span className="text-[10px] text-muted-foreground">({overallRate.toFixed(0)}%)</span>}
                      </div>
                    </div>
                    <div className="bg-secondary rounded-full h-5 overflow-hidden" style={{ width: `${Math.max(pct, 8)}%`, minWidth: 60, transition: "width 0.5s ease" }}>
                      <div className={`${colors[i]} rounded-full h-5 w-full`} />
                    </div>
                  </div>
                </div>
                {i > 0 && dropRate > 0 && (
                  <p className="text-[10px] text-destructive font-medium ml-0 mt-0.5">
                    ↓ {dropRate.toFixed(0)}% drop
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {funnelData && funnelData.funnel[0].sessions > 0 && funnelData.funnel[funnelData.funnel.length - 1].sessions > 0 && (
          <div className="mt-4 p-3 bg-primary/10 rounded-xl border border-primary/20 text-center">
            <p className="text-xs text-foreground font-semibold">
              ✅ Overall Conversion Rate: <span className="text-primary text-sm font-black">{((funnelData.funnel[funnelData.funnel.length - 1].sessions / funnelData.funnel[0].sessions) * 100).toFixed(2)}%</span>
            </p>
          </div>
        )}
      </div>

      {/* Funnel Chart */}
      {funnelChartData.length > 0 && (
        <div className="bg-card rounded-2xl shadow-ios p-5">
          <h4 className="text-sm font-bold text-foreground mb-4">📊 Funnel Chart</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                />
                <Bar dataKey="sessions" name="Sessions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Attribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[{ title: "🎯 First Touch Attribution", sub: "Credit to the first interaction", data: funnelData?.firstTouch },
          { title: "🏁 Last Touch Attribution", sub: "Credit to the last interaction", data: funnelData?.lastTouch }].map(section => (
          <div key={section.title} className="bg-card rounded-2xl shadow-ios overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h4 className="text-sm font-bold text-foreground">{section.title}</h4>
              <p className="text-[10px] text-muted-foreground">{section.sub}</p>
            </div>
            <div className="p-3 space-y-2">
              {section.data?.map(([source, d]) => (
                <div key={source} className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/30 transition-colors">
                  <span className="text-xs font-semibold text-foreground capitalize">{source}</span>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-xs font-bold text-foreground">{d.orders} orders</span>
                    <span className="text-xs text-primary font-bold">৳{d.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {!section.data?.length && <p className="text-xs text-muted-foreground text-center py-4">No data found</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMarketing;
