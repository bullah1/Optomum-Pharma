import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, TrendingUp, Users, ShoppingCart, Target, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-primary/10 text-primary border-primary/20",
};

const categoryIcons: Record<string, any> = {
  revenue: TrendingUp,
  acquisition: Users,
  retention: ShoppingCart,
  optimization: Target,
  growth: ArrowUpRight,
};

interface Insight {
  title: string;
  insight: string;
  action: string;
  priority: "high" | "medium" | "low";
  category: string;
}

export const AIInsightsTab = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["ai-marketing-insights", refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("marketing-insights");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { insights: Insight[]; summary: Record<string, number> };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    toast.info("Generating new insights...");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="relative">
          <Sparkles size={32} className="text-primary animate-pulse" />
          <Loader2 size={16} className="animate-spin text-primary absolute -bottom-1 -right-1" />
        </div>
        <p className="text-sm text-muted-foreground">AI analysis in progress...</p>
        <p className="text-[10px] text-muted-foreground">This may take 20-30 seconds</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl shadow-ios p-6 text-center space-y-3">
        <p className="text-sm text-destructive font-medium">Failed to load AI Insights</p>
        <p className="text-xs text-muted-foreground">{(error as Error).message}</p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl">
           Try Again
        </button>
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">AI Business Insights</h3>
        </div>
        <button onClick={handleRefresh} disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-secondary text-muted-foreground hover:bg-muted disabled:opacity-50">
          <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Summary KPIs with comparison */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Revenue", value: `৳${summary.revenue?.toLocaleString()}`,
              prev: summary.prevRevenue, change: summary.prevRevenue > 0 ? ((summary.revenue - summary.prevRevenue) / summary.prevRevenue) * 100 : 0
            },
            {
              label: "Orders", value: summary.orders?.toLocaleString(),
              prev: summary.prevOrders, change: summary.prevOrders > 0 ? ((summary.orders - summary.prevOrders) / summary.prevOrders) * 100 : 0
            },
            { label: "ROAS", value: `${(summary.roas || 0).toFixed(1)}x` },
            { label: "Repeat Rate", value: `${(summary.repeatRate || 0).toFixed(1)}%`, sub: `${summary.repeatCustomers}/${summary.totalCustomers}` },
          ].map((kpi, i) => (
            <div key={i} className="bg-card rounded-2xl shadow-ios p-3.5 space-y-1">
              <p className="text-lg font-bold text-foreground leading-none">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              {kpi.change !== undefined && kpi.change !== 0 && (
                <span className={`flex items-center gap-0.5 text-[10px] font-bold ${kpi.change >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                  {kpi.change >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {Math.abs(kpi.change).toFixed(1)}% vs prev 30d
                </span>
              )}
              {kpi.sub && <p className="text-[10px] text-muted-foreground/70">{kpi.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Insights Cards */}
      <div className="space-y-3">
        {data?.insights?.map((insight, i) => {
          const Icon = categoryIcons[insight.category] || Target;
          const colors = priorityColors[insight.priority] || priorityColors.medium;
          return (
            <div key={i} className={`bg-card rounded-2xl shadow-ios p-4 border-l-4 ${colors.split(" ")[2] || "border-primary/20"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${colors.split(" ")[0]} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon size={16} className={colors.split(" ")[1]} />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground">{insight.title}</h4>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${colors}`}>
                      {insight.priority === "high" ? "🔴 HIGH" : insight.priority === "medium" ? "🟡 MEDIUM" : "🟢 LOW"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.insight}</p>
                  <div className="bg-secondary/50 rounded-lg p-2.5 mt-2">
                    <p className="text-[10px] font-semibold text-foreground mb-0.5">💡 Action:</p>
                    <p className="text-xs text-foreground/80">{insight.action}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(!data?.insights || data.insights.length === 0) && (
        <div className="bg-card rounded-2xl shadow-ios p-8 text-center">
          <Sparkles size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No insights found. Try again when more data is available.</p>
        </div>
      )}
    </div>
  );
};
