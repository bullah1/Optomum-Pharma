import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ArrowLeft, Bell, CheckCheck, Loader2, Stethoscope, TestTube2, ShoppingBag, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";


const NotificationsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const markClicked = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("notifications")
        .update({ clicked_at: new Date().toISOString() })
        .eq("id", id)
        .is("clicked_at", null);
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ read: true }).eq("read", false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Notifications" showCart={false} />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {unreadCount > 0 && (
          <div className="flex justify-end">
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs text-primary font-semibold flex items-center gap-1"
            >
              <CheckCheck size={14} /> Mark All Read
            </button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Bell size={28} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.read) markRead.mutate(n.id);
                  if (n.link) {
                    markClicked.mutate(n.id);
                    navigate(n.link);
                  }
                }}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                  !n.read ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  n.type === "order" ? "bg-primary/10" : n.type === "appointment" ? "bg-blue-500/10" : n.type === "lab" ? "bg-emerald-500/10" : n.type === "promo" ? "bg-accent/20" : "bg-muted"
                }`}>
                  {n.type === "appointment" ? (
                    <Stethoscope size={16} className="text-blue-500" />
                  ) : n.type === "lab" ? (
                    <TestTube2 size={16} className="text-emerald-500" />
                  ) : n.type === "order" ? (
                    <ShoppingBag size={16} className="text-primary" />
                  ) : n.type === "promo" ? (
                    <Megaphone size={16} className="text-accent-foreground" />
                  ) : (
                    <Bell size={16} className="text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-2" />}
              </div>
            ))}
          </div>
        )}
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default NotificationsPage;
