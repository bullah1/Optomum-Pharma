import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Monitor, Smartphone, Tablet, Globe, Users, Eye, Clock } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface ActiveSession {
  id: string;
  session_id: string;
  user_id: string | null;
  page_url: string | null;
  area: string | null;
  district: string | null;
  division: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  last_seen_at: string;
}

const DeviceIcon = ({ type }: { type: string | null }) => {
  if (type === "mobile") return <Smartphone size={13} className="text-blue-500" />;
  if (type === "tablet") return <Tablet size={13} className="text-purple-500" />;
  return <Monitor size={13} className="text-emerald-500" />;
};

const DIVISIONS_BD = ["Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh"];

export const LiveVisitorsTab = () => {
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["live-visitors"],
    queryFn: async () => {
      // Cleanup stale sessions first
      await supabase.rpc("cleanup_stale_sessions" as any);

      const { data, error } = await (supabase
        .from("active_sessions" as any)
        .select("*")
        .gte("last_seen_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order("last_seen_at", { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as ActiveSession[];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("active-sessions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "active_sessions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["live-visitors"] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>;

  const allSessions = sessions || [];
  const totalVisitors = allSessions.length;
  const loggedIn = allSessions.filter(s => s.user_id).length;
  const guests = totalVisitors - loggedIn;

  // Area breakdown
  const areaMap: Record<string, number> = {};
  allSessions.forEach(s => {
    const area = s.division || s.district || s.area || "Unknown";
    areaMap[area] = (areaMap[area] || 0) + 1;
  });
  const areaBreakdown = Object.entries(areaMap).sort((a, b) => b[1] - a[1]);

  // Division breakdown for map
  const divisionMap: Record<string, number> = {};
  allSessions.forEach(s => {
    if (s.division) divisionMap[s.division] = (divisionMap[s.division] || 0) + 1;
  });

  // Device breakdown
  const deviceMap: Record<string, number> = {};
  allSessions.forEach(s => {
    const d = s.device_type || "desktop";
    deviceMap[d] = (deviceMap[d] || 0) + 1;
  });

  // Page breakdown
  const pageMap: Record<string, number> = {};
  allSessions.forEach(s => {
    const p = s.page_url || "/";
    pageMap[p] = (pageMap[p] || 0) + 1;
  });
  const pageBreakdown = Object.entries(pageMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const maxArea = areaBreakdown[0]?.[1] || 1;

  return (
    <div className="space-y-4">
      {/* Live Badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">LIVE</span>
        </div>
        <span className="text-xs text-muted-foreground">Auto-refresh every 10s</span>
      </div>

      {/* Live KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-2xl shadow-ios p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Users size={20} className="text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground">{totalVisitors}</p>
          <p className="text-[10px] text-muted-foreground font-semibold">Active Now</p>
        </div>
        <div className="bg-card rounded-2xl shadow-ios p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
            <Eye size={20} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{loggedIn}</p>
          <p className="text-[10px] text-muted-foreground font-semibold">Logged In</p>
        </div>
        <div className="bg-card rounded-2xl shadow-ios p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
            <Globe size={20} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{guests}</p>
          <p className="text-[10px] text-muted-foreground font-semibold">Guests</p>
        </div>
        <div className="bg-card rounded-2xl shadow-ios p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
            <MapPin size={20} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{areaBreakdown.length}</p>
          <p className="text-[10px] text-muted-foreground font-semibold">Areas Active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Division Map */}
        <div className="bg-card rounded-2xl shadow-ios p-4">
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <MapPin size={14} className="text-primary" /> Visitors by Division
          </h4>
          <div className="space-y-2">
            {DIVISIONS_BD.map(div => {
              const count = divisionMap[div] || 0;
              const maxDivision = Math.max(...Object.values(divisionMap), 1);
              return (
                <div key={div} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground w-24">{div}</span>
                  <div className="flex-1 bg-secondary rounded-full h-3">
                    <div
                      className="bg-primary rounded-full h-3 transition-all duration-500"
                      style={{ width: count > 0 ? `${Math.max((count / maxDivision) * 100, 8)}%` : "0%" }}
                    />
                  </div>
                  <span className={`text-xs font-bold w-6 text-right ${count > 0 ? "text-primary" : "text-muted-foreground/40"}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
          {Object.keys(divisionMap).length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4 mt-2">
              No visitor area data available
            </p>
          )}
        </div>

        {/* Area Detail */}
        <div className="bg-card rounded-2xl shadow-ios p-4">
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <MapPin size={14} className="text-primary" /> Visitors by Area
          </h4>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {areaBreakdown.map(([area, count], i) => (
              <div key={area} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                <span className="text-xs font-bold text-primary/60 w-5">{i + 1}</span>
                <span className="text-xs font-medium text-foreground flex-1 truncate">{area}</span>
                <div className="w-20 bg-secondary rounded-full h-2">
                  <div className="bg-primary/60 rounded-full h-2" style={{ width: `${(count / maxArea) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground w-6 text-right">{count}</span>
              </div>
            ))}
            {!areaBreakdown.length && (
              <p className="text-xs text-muted-foreground text-center py-4">No active visitors</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Device Breakdown */}
        <div className="bg-card rounded-2xl shadow-ios p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">📱 Device Breakdown</h4>
          <div className="flex items-center justify-around">
            {Object.entries(deviceMap).map(([device, count]) => (
              <div key={device} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-1.5">
                  <DeviceIcon type={device} />
                </div>
                <p className="text-lg font-bold text-foreground">{count}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{device}</p>
              </div>
            ))}
            {Object.keys(deviceMap).length === 0 && (
              <p className="text-xs text-muted-foreground">No data</p>
            )}
          </div>
        </div>

        {/* Active Pages */}
        <div className="bg-card rounded-2xl shadow-ios p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">📄 Active Pages</h4>
          <div className="space-y-1.5">
            {pageBreakdown.map(([page, count]) => (
              <div key={page} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-xs font-mono text-foreground truncate max-w-[70%]">{page}</span>
                <span className="text-xs font-bold text-primary">{count}</span>
              </div>
            ))}
            {!pageBreakdown.length && (
              <p className="text-xs text-muted-foreground text-center py-4">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* Live Visitor List */}
      <div className="bg-card rounded-2xl shadow-ios p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Clock size={14} className="text-primary" /> All Active Visitors
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-semibold">Status</th>
                <th className="text-left py-2 text-muted-foreground font-semibold">Page</th>
                <th className="text-left py-2 text-muted-foreground font-semibold">Area</th>
                <th className="text-left py-2 text-muted-foreground font-semibold">Device</th>
                <th className="text-left py-2 text-muted-foreground font-semibold">Browser</th>
                <th className="text-right py-2 text-muted-foreground font-semibold">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {allSessions.slice(0, 50).map(s => {
                const isRecent = Date.now() - new Date(s.last_seen_at).getTime() < 60000;
                return (
                  <tr key={s.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-2">
                      <span className={`inline-flex h-2 w-2 rounded-full ${isRecent ? "bg-emerald-500" : "bg-amber-500"}`} />
                    </td>
                    <td className="py-2 font-mono text-foreground max-w-[120px] truncate">{s.page_url || "/"}</td>
                    <td className="py-2 text-foreground">{s.area || s.district || s.division || "—"}</td>
                    <td className="py-2"><DeviceIcon type={s.device_type} /></td>
                    <td className="py-2 text-muted-foreground">{s.browser || "—"}</td>
                    <td className="py-2 text-right text-muted-foreground">
                      {formatDistanceToNow(new Date(s.last_seen_at), { addSuffix: true })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!allSessions.length && (
            <p className="text-xs text-muted-foreground text-center py-6">No active visitors</p>
          )}
        </div>
      </div>
    </div>
  );
};
