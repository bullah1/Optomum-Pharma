import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ArrowLeft, Loader2, Package, Clock, CheckCircle2, Truck, XCircle, ShoppingBag, FlaskConical, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { resolveDisplayOrderStatus } from "@/lib/orderStatus";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  medicine_id: string;
  medicines: { name: string; name_bn: string | null; image_url: string | null } | null;
}

interface Order {
  id: string;
  status: string;
  tracking_status: string | null;
  total_amount: number;
  delivery_charge: number;
  delivery_address: string;
  created_at: string;
  order_items: OrderItem[];
}

interface LabBooking {
  id: string;
  booking_number: string;
  status: string;
  total_amount: number;
  patient_name: string;
  patient_phone: string;
  preferred_date: string;
  preferred_time_slot: string;
  items: any;
  created_at: string;
  report_url: string | null;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; dotColor: string }> = {
  pending: { label: "Pending", icon: Clock, dotColor: "bg-amber-400" },
  confirmed: { label: "Confirmed", icon: CheckCircle2, dotColor: "bg-blue-400" },
  processing: { label: "Processing", icon: Package, dotColor: "bg-purple-400" },
  payment: { label: "Payment", icon: Clock, dotColor: "bg-blue-400" },
  packing: { label: "Packing", icon: Package, dotColor: "bg-indigo-400" },
  packed: { label: "Packed", icon: Package, dotColor: "bg-sky-400" },
  shipped: { label: "Shipped", icon: Truck, dotColor: "bg-indigo-400" },
  delivered: { label: "Delivered", icon: CheckCircle2, dotColor: "bg-emerald-400" },
  cancelled: { label: "Cancelled", icon: XCircle, dotColor: "bg-destructive" },
  completed: { label: "Completed", icon: CheckCircle2, dotColor: "bg-emerald-400" },
  sample_collected: { label: "Sample Collected", icon: FlaskConical, dotColor: "bg-blue-400" },
  report_ready: { label: "Report Ready", icon: CheckCircle2, dotColor: "bg-emerald-400" },
};

const OrdersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [labBookings, setLabBookings] = useState<LabBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "lab">("orders");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }

    const fetchData = async () => {
      const [ordersRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, order_items(*, medicines(name, name_bn, image_url))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data as unknown as Order[]);
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel('customer-orders-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as any;
          setOrders((prev) => prev.map((o) => o.id === updated.id ? { ...o, status: updated.status, tracking_status: updated.tracking_status } : o));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  const getStatus = (key: string) => statusConfig[key] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Compact Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-3">
          <button onClick={() => navigate("/account")} className="p-1.5 -ml-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-sm font-bold text-foreground">My Orders</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
        {/* Tabs */}
        <div className="hidden">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-semibold transition-all ${
              activeTab === "orders" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Package size={12} /> Medicine ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("lab")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-semibold transition-all ${
              activeTab === "lab" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <FlaskConical size={12} /> Lab ({labBookings.length})
          </button>
        </div>

        {/* Medicine Orders */}
        {activeTab === "orders" && (
          <>
            {orders.length === 0 ? (
              <EmptyState icon={ShoppingBag} text="No orders yet" linkTo="/" linkText="Start Shopping →" />
            ) : (
              <div className="space-y-2">
                {orders.map((order) => {
                  const st = getStatus(resolveDisplayOrderStatus(order.status, order.tracking_status));
                  const itemCount = order.order_items.reduce((sum, i) => sum + i.quantity, 0);
                  const firstItem = order.order_items[0];

                  return (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="bg-card rounded-xl border border-border p-3 cursor-pointer hover:border-primary/20 transition-all active:scale-[0.99]"
                    >
                      {/* Top: Date + Status */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div>
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}
                          </p>
                          <p className="text-[9px] text-muted-foreground/50 font-mono mt-0.5">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-foreground bg-secondary/60 px-2 py-1 rounded-full">
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`} />
                          {st.label}
                        </span>
                      </div>

                      {/* Product Preview */}
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="flex -space-x-2">
                          {order.order_items.slice(0, 3).map((item, i) => (
                            <div key={item.id} className="w-9 h-9 rounded-lg bg-secondary/50 border-2 border-card overflow-hidden shrink-0" style={{ zIndex: 3 - i }}>
                              {item.medicines?.image_url ? (
                                <img src={item.medicines.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package size={12} className="text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {firstItem?.medicines?.name_bn || firstItem?.medicines?.name || "Medicine"}
                          </p>
                          {order.order_items.length > 1 && (
                            <p className="text-[10px] text-muted-foreground">
                              +{order.order_items.length - 1} more items
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <p className="text-[10px] text-muted-foreground">
                          {itemCount} items • Delivery ৳{order.delivery_charge}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-foreground">৳{order.total_amount}</span>
                          <ChevronRight size={12} className="text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Lab Bookings */}
        {activeTab === "lab" && (
          <>
            {labBookings.length === 0 ? (
              <EmptyState icon={FlaskConical} text="No lab bookings yet" linkTo="/lab-test" linkText="Book a Lab Test →" />
            ) : (
              <div className="space-y-2">
                {labBookings.map((booking) => {
                  const st = getStatus(booking.status);
                  const labItems = Array.isArray(booking.items) ? booking.items : [];

                  return (
                    <div
                      key={booking.id}
                      onClick={() => navigate(`/lab-booking/${booking.id}`)}
                      className="bg-card rounded-xl border border-border p-3 cursor-pointer hover:border-primary/20 transition-all active:scale-[0.99]"
                    >
                      {/* Top */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div>
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(booking.created_at), "dd MMM yyyy, hh:mm a")}
                          </p>
                          <p className="text-[10px] text-primary font-semibold font-mono mt-0.5">
                            {booking.booking_number}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-foreground bg-secondary/60 px-2 py-1 rounded-full">
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`} />
                          {st.label}
                        </span>
                      </div>

                      {/* Patient + Tests */}
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FlaskConical size={16} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{booking.patient_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {labItems.length} tests • {booking.preferred_date}
                          </p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-2">
                          {booking.report_url && (
                            <a href={booking.report_url} target="_blank" rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] font-semibold text-primary underline">
                              📄 Report
                            </a>
                          )}
                          <p className="text-[10px] text-muted-foreground">{booking.preferred_time_slot}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-foreground">৳{booking.total_amount}</span>
                          <ChevronRight size={12} className="text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
};

const EmptyState = ({ icon: Icon, text, linkTo, linkText }: { icon: typeof ShoppingBag; text: string; linkTo: string; linkText: string }) => (
  <div className="flex flex-col items-center justify-center py-16 space-y-3">
    <div className="w-14 h-14 rounded-full bg-secondary/60 flex items-center justify-center">
      <Icon size={24} className="text-muted-foreground" />
    </div>
    <p className="text-muted-foreground text-xs">{text}</p>
    <Link to={linkTo} className="text-xs font-semibold text-primary">{linkText}</Link>
  </div>
);

export default OrdersPage;
