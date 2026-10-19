import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, CheckCheck, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

const NotificationBell = ({ size = 18 }: { size?: number }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { playSound } = useNotificationSound();
  const { permission, requestPermission, showNotification } = useNotificationPermission();

  // Defer notification fetch to reduce initial network contention
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user && ready,
    staleTime: 30 * 1000,
  });

  // Realtime subscription with sound + browser notification
  useEffect(() => {
    if (!user) return;

    // Request notification permission on mount
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      requestPermission();
    }

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });

          // Play sound
          playSound();

          // Show browser notification
          if (payload.new) {
            showNotification(payload.new.title || "New Notification", {
              body: payload.new.body || "",
              tag: payload.new.id,
            });
          }

          // Show in-app toast
          toast.info(payload.new?.title || "New Notification 🔔", {
            description: payload.new?.body,
            duration: 5000,
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient, playSound, showNotification, requestPermission]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark single as read
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  // Mark all read
  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-secondary/50 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={size} className="text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[8px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-card rounded-2xl shadow-ios-lg z-[60] overflow-hidden border border-border animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">Notifications</h2>
            <div className="flex items-center gap-2">
              {permission !== "granted" && (
                <button
                  onClick={() => requestPermission()}
                  className="text-[10px] text-primary font-medium flex items-center gap-1 hover:underline"
                  title="Enable sound notifications"
                >
                  <Volume2 size={12} /> Enable Sound
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-[10px] text-primary font-medium flex items-center gap-1 hover:underline"
                >
                  <CheckCheck size={12} /> Mark All Read
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Close notifications" className="p-2 rounded-full hover:bg-muted min-w-[36px] min-h-[36px] flex items-center justify-center">
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell size={24} className="mb-2 opacity-40" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-border transition-colors cursor-pointer ${
                    !n.read ? "bg-primary/5" : "hover:bg-muted/30"
                  }`}
                  onClick={() => {
                    if (!n.read) markRead.mutate(n.id);
                    if (n.link) {
                      setOpen(false);
                      window.location.href = n.link;
                    }
                  }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    n.type === "order" ? "bg-primary/10" : n.type === "promo" ? "bg-accent/20" : "bg-muted"
                  }`}>
                    <Bell size={14} className={n.type === "order" ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2.5 text-center">
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
