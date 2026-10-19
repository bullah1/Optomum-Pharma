import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, ShoppingCart, DollarSign, TrendingUp, Repeat, Crown, Calendar as CalendarIcon } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const DateRangePicker = ({ from, to, onChange }: { from: Date; to: Date; onChange: (f: Date, t: Date) => void }) => {
  const presets = [
    { label: "30D", days: 30 },
    { label: "90D", days: 90 },
    { label: "180D", days: 180 },
    { label: "All", days: 365 },
  ];
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {presets.map(p => {
        const isActive = Math.round((to.getTime() - from.getTime()) / 86400000) === p.days;
        return (
          <button key={p.label} onClick={() => onChange(subDays(new Date(), p.days), new Date())}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-muted"}`}>
            {p.label}
          </button>
        );
      })}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-secondary text-muted-foreground hover:bg-muted">
            <CalendarIcon size={12} /> {format(from, "dd MMM")} – {format(to, "dd MMM")}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar mode="range" selected={{ from, to }} onSelect={(range: any) => { if (range?.from) onChange(range.from, range.to || range.from); }} numberOfMonths={1} className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const CustomerInsightsTab = () => {
  const [dateFrom, setDateFrom] = useState(() => subDays(new Date(), 90));
  const [dateTo, setDateTo] = useState(() => new Date());

  const { data, isLoading } = useQuery({
    queryKey: ["customer-insights", dateFrom.toISOString(), dateTo.toISOString()],
    queryFn: async () => {
      const fromISO = startOfDay(dateFrom).toISOString();
      const toISO = endOfDay(dateTo).toISOString();

      const [ordersRes, allOrdersRes] = await Promise.all([
        supabase.from("orders").select("id, user_id, total_amount, utm_source, created_at, status").gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("orders").select("id, user_id, total_amount, created_at, status"),
      ]);

      const orders = (ordersRes.data || []).filter(o => o.status !== "cancelled");
      const allOrders = (allOrdersRes.data || []).filter(o => o.status !== "cancelled");

      // Customer analysis
      const customerMap: Record<string, { orders: number; revenue: number; firstOrder: string; lastOrder: string; source: string }> = {};
      orders.forEach(o => {
        if (!customerMap[o.user_id]) {
          customerMap[o.user_id] = { orders: 0, revenue: 0, firstOrder: o.created_at, lastOrder: o.created_at, source: o.utm_source || "direct" };
        }
        customerMap[o.user_id].orders++;
        customerMap[o.user_id].revenue += Number(o.total_amount);
        if (o.created_at < customerMap[o.user_id].firstOrder) customerMap[o.user_id].firstOrder = o.created_at;
        if (o.created_at > customerMap[o.user_id].lastOrder) customerMap[o.user_id].lastOrder = o.created_at;
      });

      // All-time customer data for LTV
      const allCustomerMap: Record<string, { orders: number; revenue: number }> = {};
      allOrders.forEach(o => {
        if (!allCustomerMap[o.user_id]) allCustomerMap[o.user_id] = { orders: 0, revenue: 0 };
        allCustomerMap[o.user_id].orders++;
        allCustomerMap[o.user_id].revenue += Number(o.total_amount);
      });

      const customers = Object.entries(customerMap);
      const totalCustomers = customers.length;
      const repeatCustomers = customers.filter(([, d]) => d.orders > 1).length;
      const totalRevenue = customers.reduce((s, [, d]) => s + d.revenue, 0);
      const avgLTV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      // All-time LTV
      const allCustomers = Object.values(allCustomerMap);
      const allTimeLTV = allCustomers.length > 0 ? allCustomers.reduce((s, d) => s + d.revenue, 0) / allCustomers.length : 0;

      // LTV by source
      const sourceMap: Record<string, { customers: number; revenue: number; orders: number }> = {};
      customers.forEach(([, d]) => {
        const src = d.source;
        if (!sourceMap[src]) sourceMap[src] = { customers: 0, revenue: 0, orders: 0 };
        sourceMap[src].customers++;
        sourceMap[src].revenue += d.revenue;
        sourceMap[src].orders += d.orders;
      });

      // Cohort by month
      const cohortMap: Record<string, { newCustomers: number; revenue: number; repeatRevenue: number }> = {};
      customers.forEach(([, d]) => {
        const month = format(new Date(d.firstOrder), "yyyy-MM");
        if (!cohortMap[month]) cohortMap[month] = { newCustomers: 0, revenue: 0, repeatRevenue: 0 };
        cohortMap[month].newCustomers++;
        cohortMap[month].revenue += d.revenue;
        if (d.orders > 1) cohortMap[month].repeatRevenue += d.revenue;
      });

      // Order frequency distribution
      const freqDist: Record<number, number> = {};
      customers.forEach(([, d]) => { freqDist[d.orders] = (freqDist[d.orders] || 0) + 1; });

      // Top customers
      const topCustomers = customers
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([id, d]) => ({ id, ...d }));

      return {
        totalCustomers,
        repeatCustomers,
        repeatRate: totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0,
        avgLTV,
        allTimeLTV,
        totalRevenue,
        avgOrdersPerCustomer: totalCustomers > 0 ? orders.length / totalCustomers : 0,
        sources: Object.entries(sourceMap).sort((a, b) => b[1].revenue - a[1].revenue),
        cohorts: Object.entries(cohortMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-6),
        freqDist: Object.entries(freqDist).sort((a, b) => Number(a[0]) - Number(b[0])).slice(0, 8),
        topCustomers,
      };
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <DateRangePicker from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Total Customers", value: data.totalCustomers.toLocaleString() },
          { icon: Repeat, label: "Repeat Customers", value: data.repeatCustomers.toLocaleString(), sub: `${data.repeatRate.toFixed(1)}% repeat rate` },
          { icon: DollarSign, label: "Avg LTV (Period)", value: `৳${data.avgLTV.toFixed(0)}` },
          { icon: Crown, label: "All-time LTV", value: `৳${data.allTimeLTV.toFixed(0)}` },
          { icon: ShoppingCart, label: "Avg Orders/Customer", value: data.avgOrdersPerCustomer.toFixed(1) },
          { icon: TrendingUp, label: "Total Revenue", value: `৳${data.totalRevenue.toLocaleString()}` },
        ].map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl shadow-ios p-3.5 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <kpi.icon size={16} className="text-primary" />
            </div>
            <p className="text-lg font-bold text-foreground leading-none">{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            {kpi.sub && <p className="text-[10px] text-muted-foreground/70">{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* LTV by Source */}
      <div className="bg-card rounded-2xl shadow-ios overflow-hidden">
        <div className="px-4 py-3 border-b border-border"><h4 className="text-sm font-bold text-foreground">LTV by Source</h4></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Source</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Customers</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Orders</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Revenue</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium">Avg LTV</th>
            </tr></thead>
            <tbody>
              {data.sources.map(([source, d]) => (
                <tr key={source} className="border-b border-border">
                  <td className="px-4 py-2.5 font-semibold text-foreground capitalize">{source}</td>
                  <td className="text-right px-3 py-2.5">{d.customers}</td>
                  <td className="text-right px-3 py-2.5">{d.orders}</td>
                  <td className="text-right px-3 py-2.5 font-bold">৳{d.revenue.toLocaleString()}</td>
                  <td className="text-right px-4 py-2.5 text-primary font-semibold">৳{(d.revenue / d.customers).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Order Frequency */}
        <div className="bg-card rounded-2xl shadow-ios p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">Order Frequency Distribution</h4>
          <div className="space-y-2">
            {data.freqDist.map(([freq, count]) => {
              const maxCount = Math.max(...data.freqDist.map(([, c]) => Number(c)), 1);
              return (
                <div key={freq} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground w-20">{freq}x orders</span>
                  <div className="flex-1 bg-secondary rounded-full h-2.5">
                    <div className="bg-primary rounded-full h-2.5" style={{ width: `${(Number(count) / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-foreground w-10 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Cohort */}
        <div className="bg-card rounded-2xl shadow-ios p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">Monthly Cohorts</h4>
          <div className="space-y-2">
            {data.cohorts.map(([month, d]) => (
              <div key={month} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div>
                  <span className="text-xs font-semibold text-foreground">{format(new Date(month + "-01"), "MMM yyyy")}</span>
                  <p className="text-[10px] text-muted-foreground">{d.newCustomers} new customers</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-foreground">৳{d.revenue.toLocaleString()}</span>
                  {d.repeatRevenue > 0 && (
                    <p className="text-[10px] text-primary">৳{d.repeatRevenue.toLocaleString()} repeat</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-card rounded-2xl shadow-ios overflow-hidden">
        <div className="px-4 py-3 border-b border-border"><h4 className="text-sm font-bold text-foreground">🏆 Top Customers</h4></div>
        <div className="divide-y divide-border/10">
          {data.topCustomers.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 3 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {i + 1}
                </span>
                <div>
                  <p className="text-xs font-medium text-foreground">{c.id.slice(0, 8)}...</p>
                  <p className="text-[10px] text-muted-foreground">{c.orders} orders · via {c.source}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-primary">৳{c.revenue.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
