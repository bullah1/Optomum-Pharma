import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, MapPin, Phone, User, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const statusFlow = ["assigned", "picked_up", "on_the_way", "delivered"];
const statusLabels: Record<string, string> = {
  assigned: "Assigned",
  picked_up: "Picked Up",
  on_the_way: "On The Way",
  delivered: "Delivered",
};

const RiderDeliveries = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "completed">("active");

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["rider-deliveries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rider_assignments")
        .select("*, orders(id, status, total_amount, delivery_charge, delivery_address, created_at, tracking_status, order_items(id, quantity, price, medicines(name, name_bn)), profiles(name, phone))")
        .eq("rider_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription for rider assignments & orders
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('rider-deliveries-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rider_assignments', filter: `rider_id=eq.${user.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ["rider-deliveries"] }); }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => { queryClient.invalidateQueries({ queryKey: ["rider-deliveries"] }); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const updateStatus = useMutation({
    mutationFn: async ({ assignmentId, newStatus, orderId }: { assignmentId: string; newStatus: string; orderId: string }) => {
      const updates: any = { status: newStatus };
      if (newStatus === "picked_up") updates.picked_up_at = new Date().toISOString();
      if (newStatus === "delivered") updates.delivered_at = new Date().toISOString();

      const { error } = await supabase.from("rider_assignments").update(updates).eq("id", assignmentId);
      if (error) throw error;

      // Also update order status
      let orderStatus = "processing";
      if (newStatus === "picked_up") orderStatus = "shipped";
      if (newStatus === "on_the_way") orderStatus = "shipped";
      if (newStatus === "delivered") orderStatus = "delivered";

      await supabase.from("orders").update({ status: orderStatus, tracking_status: orderStatus }).eq("id", orderId);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rider-deliveries"] }); toast.success("Status updated!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const active = assignments?.filter(a => a.status !== "delivered") || [];
  const completed = assignments?.filter(a => a.status === "delivered") || [];
  const filtered = tab === "active" ? active : completed;

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["active", "completed"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${tab === t ? "bg-primary text-primary-foreground shadow-ios" : "bg-secondary text-muted-foreground"}`}>
            {t === "active" ? `Active (${active.length})` : `Completed (${completed.length})`}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <div className="bg-card rounded-2xl shadow-ios p-8 text-center text-muted-foreground">No deliveries found</div>
      ) : (
        filtered.map((a: any) => {
          const order = a.orders;
          const expanded = expandedId === a.id;
          const currentIdx = statusFlow.indexOf(a.status);
          const nextStatus = currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;

          return (
            <div key={a.id} className="bg-card rounded-2xl shadow-ios overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">#{order?.id?.slice(0, 8)}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <User size={12} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{order?.profiles?.name || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Phone size={12} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{order?.profiles?.phone || "—"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${a.status === "delivered" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                      {statusLabels[a.status] || a.status}
                    </span>
                    <p className="text-lg font-bold text-foreground mt-1">৳{(order?.total_amount || 0) + (order?.delivery_charge || 0)}</p>
                    <p className="text-[10px] text-muted-foreground">COD Amount</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-2">
                  <MapPin size={12} className="text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground truncate">{order?.delivery_address}</p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {nextStatus && (
                    <button
                      onClick={() => updateStatus.mutate({ assignmentId: a.id, newStatus: nextStatus, orderId: order?.id })}
                      disabled={updateStatus.isPending}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      Mark as {statusLabels[nextStatus]}
                    </button>
                  )}
                  <button onClick={() => setExpandedId(expanded ? null : a.id)} className="flex items-center gap-1 text-xs text-primary font-medium ml-auto">
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {expanded ? "Hide" : "Details"}
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-border p-4 bg-muted/10 space-y-2">
                  <p className="text-xs text-muted-foreground">Assigned: {format(new Date(a.created_at), "dd MMM yyyy, hh:mm a")}</p>
                  {a.picked_up_at && <p className="text-xs text-muted-foreground">Picked Up: {format(new Date(a.picked_up_at), "dd MMM, hh:mm a")}</p>}
                  {a.delivered_at && <p className="text-xs text-muted-foreground">Delivered: {format(new Date(a.delivered_at), "dd MMM, hh:mm a")}</p>}
                  {order?.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-xs text-muted-foreground bg-card rounded-xl px-3 py-2">
                      <span>{item.medicines?.name} × {item.quantity}</span>
                      <span className="font-medium text-foreground">৳{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default RiderDeliveries;
