import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Bell, Send, Users, User, Loader2, Trash2, Smartphone,
  Briefcase, Clock, MapPin, BarChart3, Eye, MousePointerClick,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type SegmentType = "all" | "single" | "b2b" | "recent_buyers" | "area" | "district";

const AdminNotifications = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [segment, setSegment] = useState<SegmentType>("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [areaInput, setAreaInput] = useState("");
  const [districtInput, setDistrictInput] = useState("");
  const [sendPush, setSendPush] = useState(true);

  // All profiles (for single-user select + segment counting)
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, phone, address")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // B2B users (have b2b role)
  const { data: b2bUserIds = [] } = useQuery({
    queryKey: ["admin-b2b-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "b2b" as any);
      if (error) return [];
      return data.map((r: any) => r.user_id);
    },
  });

  // Recent buyers (orders in last 30 days)
  const { data: recentBuyerIds = [] } = useQuery({
    queryKey: ["admin-recent-buyers"],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("orders")
        .select("user_id")
        .gte("created_at", cutoff);
      if (error) return [];
      return Array.from(new Set(data.map((r: any) => r.user_id)));
    },
  });

  // Compute target user ids based on segment
  const targetUserIds = useMemo<string[]>(() => {
    if (segment === "single") return selectedUserId ? [selectedUserId] : [];
    if (segment === "all") return profiles.map((p: any) => p.id);
    if (segment === "b2b") return b2bUserIds;
    if (segment === "recent_buyers") return recentBuyerIds;
    if (segment === "area") {
      const q = areaInput.trim().toLowerCase();
      if (!q) return [];
      return profiles
        .filter((p: any) => (p.address || "").toLowerCase().includes(q))
        .map((p: any) => p.id);
    }
    if (segment === "district") {
      const q = districtInput.trim().toLowerCase();
      if (!q) return [];
      return profiles
        .filter((p: any) => (p.address || "").toLowerCase().includes(q))
        .map((p: any) => p.id);
    }
    return [];
  }, [segment, selectedUserId, profiles, b2bUserIds, recentBuyerIds, areaInput, districtInput]);

  // Past campaigns + analytics
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      const { data: campaignsData, error } = await supabase
        .from("notification_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;

      // Get analytics per campaign
      const ids = campaignsData.map((c: any) => c.id);
      if (ids.length === 0) return [];
      const { data: notifs } = await supabase
        .from("notifications")
        .select("campaign_id, read, clicked_at")
        .in("campaign_id", ids);

      return campaignsData.map((c: any) => {
        const items = (notifs || []).filter((n: any) => n.campaign_id === c.id);
        const reads = items.filter((n: any) => n.read).length;
        const clicks = items.filter((n: any) => n.clicked_at).length;
        return {
          ...c,
          read_count: reads,
          click_count: clicks,
          read_rate: c.recipient_count ? Math.round((reads / c.recipient_count) * 100) : 0,
          click_rate: c.recipient_count ? Math.round((clicks / c.recipient_count) * 100) : 0,
        };
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !body.trim()) throw new Error("Title and Body are required");
      if (targetUserIds.length === 0) throw new Error("No recipients matched the selected segment");

      // Create campaign record
      const { data: campaign, error: campErr } = await supabase
        .from("notification_campaigns")
        .insert({
          title: title.trim(),
          body: body.trim(),
          link: link.trim() || null,
          segment_type: segment,
          segment_filter: { area: areaInput, district: districtInput, user_id: selectedUserId },
          recipient_count: targetUserIds.length,
        })
        .select()
        .single();
      if (campErr) throw campErr;

      // Insert notifications in batches
      const rows = targetUserIds.map((uid) => ({
        user_id: uid,
        title: title.trim(),
        body: body.trim(),
        type: "promo",
        link: link.trim() || null,
        campaign_id: campaign.id,
      }));

      for (let i = 0; i < rows.length; i += 200) {
        const batch = rows.slice(i, i + 200);
        const { error } = await supabase.from("notifications").insert(batch);
        if (error) throw error;
      }

      return { count: targetUserIds.length, campaignId: campaign.id };
    },
    onSuccess: async (data) => {
      toast.success(`Sent to ${data.count} users ✅`);

      if (sendPush) {
        try {
          const pushPayload: any = {
            title: title.trim(),
            message: body.trim(),
            link: link.trim() || null,
          };
          if (segment !== "all") {
            pushPayload.user_ids = targetUserIds;
          }
          const { data: pushResult, error: pushErr } = await supabase.functions.invoke("send-push", {
            body: pushPayload,
          });
          if (pushErr) {
            toast.error("Push error: " + pushErr.message);
          } else if (pushResult) {
            toast.info(`Push: ${pushResult.sent || 0} delivered, ${pushResult.failed || 0} failed`);
          }
        } catch (e: any) {
          console.error("Push error:", e);
        }
      }

      setTitle("");
      setBody("");
      setLink("");
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      // Delete notifications first then campaign
      await supabase.from("notifications").delete().eq("campaign_id", id);
      const { error } = await supabase.from("notification_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campaign deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
    },
  });

  const segmentIcon = {
    all: <Users size={14} />,
    single: <User size={14} />,
    b2b: <Briefcase size={14} />,
    recent_buyers: <Clock size={14} />,
    area: <MapPin size={14} />,
    district: <MapPin size={14} />,
  }[segment];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Send notification form */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-ios space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          Send Notification
        </h3>

        <div className="grid gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Audience Segment</label>
            <Select value={segment} onValueChange={(v) => setSegment(v as SegmentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"><span className="flex items-center gap-2"><Users size={14} /> All Customers</span></SelectItem>
                <SelectItem value="single"><span className="flex items-center gap-2"><User size={14} /> Single User</span></SelectItem>
                <SelectItem value="b2b"><span className="flex items-center gap-2"><Briefcase size={14} /> B2B Customers</span></SelectItem>
                <SelectItem value="recent_buyers"><span className="flex items-center gap-2"><Clock size={14} /> Recent Buyers (30 days)</span></SelectItem>
                <SelectItem value="area"><span className="flex items-center gap-2"><MapPin size={14} /> By Area / Address</span></SelectItem>
                <SelectItem value="district"><span className="flex items-center gap-2"><MapPin size={14} /> By District</span></SelectItem>
              </SelectContent>
            </Select>
          </div>

          {segment === "single" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Select User</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a user" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email || u.phone || u.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {segment === "area" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Area / Keyword in address</label>
              <Input
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                placeholder="e.g. Mohakhali"
              />
            </div>
          )}

          {segment === "district" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">District name</label>
              <Input
                value={districtInput}
                onChange={(e) => setDistrictInput(e.target.value)}
                placeholder="e.g. Bangladesh"
              />
            </div>
          )}

          {/* Live recipient preview */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
            {segmentIcon}
            <span className="font-semibold text-primary">{targetUserIds.length}</span>
            <span className="text-muted-foreground">recipients matched</span>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Special Discount! 🎉"
              maxLength={100}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Message *</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. Get 20% off on all medicines until midnight!"
              maxLength={500}
              rows={3}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Link (optional)</label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g. /category/sexual-wellness"
              maxLength={200}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-primary" />
              <div>
                <p className="text-xs font-semibold text-foreground">Also send Web Push</p>
                <p className="text-[10px] text-muted-foreground">Delivers to browser/PWA in background</p>
              </div>
            </div>
            <Switch checked={sendPush} onCheckedChange={setSendPush} />
          </div>

          <Button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || !title.trim() || !body.trim() || targetUserIds.length === 0}
            className="w-full rounded-xl"
          >
            {sendMutation.isPending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Send size={16} />
            )}
            Send to {targetUserIds.length} {targetUserIds.length === 1 ? "user" : "users"}
          </Button>
        </div>
      </div>

      {/* Past campaigns + analytics */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-ios space-y-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <BarChart3 size={18} className="text-primary" />
          Campaign Analytics
        </h3>

        {loadingCampaigns ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-primary" size={22} />
          </div>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No campaigns sent yet</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c: any) => (
              <div key={c.id} className="p-3 rounded-xl bg-secondary/30 border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wide font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                        {c.segment_type}
                      </span>
                      <p className="text-sm font-semibold text-foreground truncate">{c.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{c.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteCampaign.mutate(c.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center p-2 rounded-lg bg-background border border-border">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Users size={11} />
                      <span className="text-[9px] uppercase font-semibold">Sent</span>
                    </div>
                    <p className="text-sm font-bold text-foreground mt-0.5">{c.recipient_count}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background border border-border">
                    <div className="flex items-center justify-center gap-1 text-blue-600">
                      <Eye size={11} />
                      <span className="text-[9px] uppercase font-semibold">Read</span>
                    </div>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {c.read_count} <span className="text-[10px] font-normal text-muted-foreground">({c.read_rate}%)</span>
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background border border-border">
                    <div className="flex items-center justify-center gap-1 text-emerald-600">
                      <MousePointerClick size={11} />
                      <span className="text-[9px] uppercase font-semibold">Click</span>
                    </div>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {c.click_count} <span className="text-[10px] font-normal text-muted-foreground">({c.click_rate}%)</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
