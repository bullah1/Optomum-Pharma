import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Clock, TrendingUp, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, getDay, getHours } from "date-fns";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const DateRangePicker = ({ from, to, onChange }: { from: Date; to: Date; onChange: (f: Date, t: Date) => void }) => {
  const presets = [
    { label: "7D", days: 7 },
    { label: "30D", days: 30 },
    { label: "90D", days: 90 },
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

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hourLabels = ["12am", "2am", "4am", "6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm", "10pm"];

export const SalesAnalyticsTab = () => {
  const [dateFrom, setDateFrom] = useState(() => subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState(() => new Date());

  const { data, isLoading } = useQuery({
    queryKey: ["sales-analytics", dateFrom.toISOString(), dateTo.toISOString()],
    queryFn: async () => {
      const fromISO = startOfDay(dateFrom).toISOString();
      const toISO = endOfDay(dateTo).toISOString();

      const [ordersRes, prevOrdersRes] = await Promise.all([
        supabase.from("orders").select("id, total_amount, created_at, status, delivery_charge").gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("orders").select("id, total_amount, created_at, status").gte("created_at", subDays(dateFrom, Math.round((dateTo.getTime() - dateFrom.getTime()) / 86400000)).toISOString()).lt("created_at", fromISO),
      ]);

      const orders = (ordersRes.data || []).filter(o => o.status !== "cancelled");
      const prevOrders = (prevOrdersRes.data || []).filter(o => o.status !== "cancelled");

      const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
      const prevRevenue = prevOrders.reduce((s, o) => s + Number(o.total_amount), 0);
      const aov = orders.length > 0 ? totalRevenue / orders.length : 0;
      const prevAov = prevOrders.length > 0 ? prevRevenue / prevOrders.length : 0;

      // Hourly heatmap (7 days x 12 time slots)
      const heatmap: number[][] = Array.from({ length: 7 }, () => Array(12).fill(0));
      orders.forEach(o => {
        const d = new Date(o.created_at);
        const day = getDay(d); // 0=Sun
        const hour = Math.floor(getHours(d) / 2); // 0-11
        heatmap[day][hour] += Number(o.total_amount);
      });

      // Daily AOV trend
      const dailyMap: Record<string, { revenue: number; orders: number }> = {};
      orders.forEach(o => {
        const d = format(new Date(o.created_at), "MM/dd");
        if (!dailyMap[d]) dailyMap[d] = { revenue: 0, orders: 0 };
        dailyMap[d].revenue += Number(o.total_amount);
        dailyMap[d].orders++;
      });

      // Best selling day/hour
      let bestDay = 0, bestDayRevenue = 0;
      const dayRevenue: number[] = Array(7).fill(0);
      orders.forEach(o => {
        const d = getDay(new Date(o.created_at));
        dayRevenue[d] += Number(o.total_amount);
      });
      dayRevenue.forEach((r, i) => { if (r > bestDayRevenue) { bestDay = i; bestDayRevenue = r; } });

      let bestHour = 0, bestHourRevenue = 0;
      const hourRevenue: number[] = Array(24).fill(0);
      orders.forEach(o => {
        const h = getHours(new Date(o.created_at));
        hourRevenue[h] += Number(o.total_amount);
      });
      hourRevenue.forEach((r, i) => { if (r > bestHourRevenue) { bestHour = i; bestHourRevenue = r; } });

      // Order size distribution
      const sizeBuckets = [
        { label: "৳0-200", min: 0, max: 200 },
        { label: "৳200-500", min: 200, max: 500 },
        { label: "৳500-1K", min: 500, max: 1000 },
        { label: "৳1K-2K", min: 1000, max: 2000 },
        { label: "৳2K+", min: 2000, max: Infinity },
      ];
      const sizeDistribution = sizeBuckets.map(b => ({
        ...b,
        count: orders.filter(o => Number(o.total_amount) >= b.min && Number(o.total_amount) < b.max).length,
      }));

      return {
        totalRevenue,
        prevRevenue,
        revenueChange: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
        totalOrders: orders.length,
        prevOrders: prevOrders.length,
        ordersChange: prevOrders.length > 0 ? ((orders.length - prevOrders.length) / prevOrders.length) * 100 : 0,
        aov,
        prevAov,
        aovChange: prevAov > 0 ? ((aov - prevAov) / prevAov) * 100 : 0,
        heatmap,
        daily: Object.entries(dailyMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-14),
        bestDay: dayNames[bestDay],
        bestDayRevenue,
        bestHour: `${bestHour}:00`,
        bestHourRevenue,
        sizeDistribution,
      };
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>;
  if (!data) return null;

  const maxHeatmapVal = Math.max(...data.heatmap.flat(), 1);

  return (
    <div className="space-y-4">
      <DateRangePicker from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />

      {/* KPIs with comparison */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[
          { icon: DollarSign, label: "Revenue", value: `৳${data.totalRevenue.toLocaleString()}`, change: data.revenueChange },
          { icon: TrendingUp, label: "Orders", value: data.totalOrders.toLocaleString(), change: data.ordersChange },
          { icon: DollarSign, label: "AOV", value: `৳${data.aov.toFixed(0)}`, change: data.aovChange },
          { icon: Clock, label: "Best Day", value: data.bestDay, sub: `৳${data.bestDayRevenue.toLocaleString()}` },
        ].map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl shadow-ios p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <kpi.icon size={16} className="text-primary" />
              </div>
              {kpi.change !== undefined && kpi.change !== 0 && (
                <span className={`text-[10px] font-bold ${kpi.change >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                  {kpi.change >= 0 ? "↑" : "↓"}{Math.abs(kpi.change).toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-foreground leading-none">{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            {kpi.sub && <p className="text-[10px] text-muted-foreground/70">{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* Hourly Heatmap */}
      <div className="bg-card rounded-2xl shadow-ios p-4">
        <h4 className="text-sm font-bold text-foreground mb-1">📊 Sales Heatmap (Day × Hour)</h4>
        <p className="text-[10px] text-muted-foreground mb-3">Which day and hour generates the most orders</p>
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Hour labels */}
            <div className="flex ml-12 mb-1">
              {hourLabels.map(h => <div key={h} className="flex-1 text-[8px] text-muted-foreground text-center">{h}</div>)}
            </div>
            {/* Heatmap rows */}
            {dayNames.map((day, dayIdx) => (
              <div key={day} className="flex items-center gap-1 mb-1">
                <span className="text-[10px] text-muted-foreground w-10 text-right">{day}</span>
                <div className="flex flex-1 gap-[2px]">
                  {data.heatmap[dayIdx].map((val, hourIdx) => {
                    const intensity = maxHeatmapVal > 0 ? val / maxHeatmapVal : 0;
                    return (
                      <div
                        key={hourIdx}
                        className="flex-1 h-5 rounded-sm transition-colors"
                        style={{
                          backgroundColor: intensity === 0
                            ? "hsl(var(--secondary))"
                            : `hsl(var(--primary) / ${0.15 + intensity * 0.85})`,
                        }}
                        title={`${day} ${hourLabels[hourIdx]}: ৳${val.toLocaleString()}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-2 ml-12 mt-2">
              <span className="text-[9px] text-muted-foreground">Low</span>
              <div className="flex gap-[1px]">
                {[0, 0.25, 0.5, 0.75, 1].map(v => (
                  <div key={v} className="w-4 h-3 rounded-sm" style={{ backgroundColor: v === 0 ? "hsl(var(--secondary))" : `hsl(var(--primary) / ${0.15 + v * 0.85})` }} />
                ))}
              </div>
              <span className="text-[9px] text-muted-foreground">High</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AOV Trend */}
        <div className="bg-card rounded-2xl shadow-ios p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">AOV Trend (Daily)</h4>
          <div className="flex items-end gap-[3px] h-24">
            {data.daily.map(([date, d]) => {
              const dayAov = d.orders > 0 ? d.revenue / d.orders : 0;
              const maxAov = Math.max(...data.daily.map(([, dd]) => dd.orders > 0 ? dd.revenue / dd.orders : 0), 1);
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full bg-primary/30 rounded-t-sm" style={{ height: `${(dayAov / maxAov) * 72}px`, minHeight: 2 }} title={`AOV: ৳${dayAov.toFixed(0)}`} />
                  <span className="text-[8px] text-muted-foreground">{date.split("/")[1]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Size Distribution */}
        <div className="bg-card rounded-2xl shadow-ios p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">Order Size Distribution</h4>
          <div className="space-y-2">
            {data.sizeDistribution.map(bucket => {
              const maxCount = Math.max(...data.sizeDistribution.map(b => b.count), 1);
              return (
                <div key={bucket.label} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground w-16">{bucket.label}</span>
                  <div className="flex-1 bg-secondary rounded-full h-2.5">
                    <div className="bg-primary rounded-full h-2.5" style={{ width: `${(bucket.count / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-foreground w-8 text-right">{bucket.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Best Time Recommendation */}
      <div className="bg-card rounded-2xl shadow-ios p-4 border-l-4 border-primary">
        <h4 className="text-sm font-bold text-foreground mb-2">⏰ Best Time to Advertise</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground">Best Selling Day</p>
            <p className="text-sm font-bold text-primary">{data.bestDay}</p>
            <p className="text-xs text-muted-foreground">৳{data.bestDayRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Best Selling Hour</p>
            <p className="text-sm font-bold text-primary">{data.bestHour}</p>
            <p className="text-xs text-muted-foreground">৳{data.bestHourRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
