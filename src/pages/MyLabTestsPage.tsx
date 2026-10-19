import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { toast } from "sonner";
import { Loader2, FlaskConical, Calendar, Download, Clock, TestTube } from "lucide-react";

const statusSteps = ["pending", "confirmed", "sample_collected", "processing", "completed"];

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  sample_collected: "Sample Collected",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusBadgeClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sample_collected: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  processing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const MyLabTestsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("my-lab-bookings-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lab_bookings", filter: `user_id=eq.${user.id}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["my-lab-bookings", user.id] });
          const newStatus = (payload.new as any).status;
          const bookingNum = (payload.new as any).booking_number;
          toast.info(`🧪 ${bookingNum} — ${statusLabels[newStatus] || newStatus}`);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["my-lab-bookings", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_bookings")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const parseItems = (items: any): Array<{ name: string; price: number; item_type?: string }> => {
    if (Array.isArray(items)) return items;
    try { return JSON.parse(items); } catch { return []; }
  };

  const activeStepIndex = (status: string) => {
    if (status === "cancelled") return -1;
    return statusSteps.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="My Lab Tests" />
      <div className="max-w-lg mx-auto px-4 py-3 space-y-3">

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : !bookings?.length ? (
          <div className="bg-card rounded-2xl border border-border p-10 text-center space-y-3 mt-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <TestTube size={28} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">No lab test bookings yet</p>
            <button
              onClick={() => navigate("/lab-test")}
              className="bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Book a Lab Test
            </button>
          </div>
        ) : (
          bookings.map((booking) => {
            const items = parseItems(booking.items);
            const step = activeStepIndex(booking.status);
            const isCancelled = booking.status === "cancelled";
            const reportUrl = (booking as any).report_url;

            return (
              <div
                key={booking.id}
                onClick={() => navigate(`/lab-booking/${booking.id}`)}
                className="bg-card rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
              >
                {/* Header */}
                <div className="p-4 pb-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FlaskConical size={13} className="text-primary" />
                      </div>
                      <span className="text-[13px] font-bold text-primary font-mono">{booking.booking_number}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass[booking.status] || "bg-muted text-muted-foreground"}`}>
                      {statusLabels[booking.status] || booking.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(booking.preferred_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {booking.preferred_time_slot}
                    </span>
                  </div>
                  {(booking as any).diagnostic_lab && (
                    <p className="text-[11px] text-muted-foreground mt-1">🏥 {(booking as any).diagnostic_lab}</p>
                  )}
                </div>

                {/* Divider */}
                <div className="mx-4 border-t border-border" />

                {/* Tests */}
                <div className="p-4 pt-2.5 space-y-1.5">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-[12px] bg-secondary/40 rounded-lg px-3 py-2">
                      <span className="text-foreground font-medium">{item.name}</span>
                      <span className="font-bold text-foreground">৳{item.price}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold pt-1.5 px-1">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-primary">৳{booking.total_amount}</span>
                  </div>
                </div>

                {/* Status Timeline */}
                {!isCancelled && (
                  <div className="px-4 pb-3.5">
                    <div className="flex items-start gap-0.5">
                      {statusSteps.map((s, i) => {
                        const done = i <= step;
                        const isCurrent = i === step;
                        return (
                          <div key={s} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`h-[5px] w-full rounded-full transition-all duration-500 ${done ? "bg-primary" : "bg-border/60"} ${isCurrent ? "animate-pulse" : ""}`} />
                            <span className={`text-[7px] leading-tight text-center font-medium ${done ? "text-primary" : "text-muted-foreground/40"}`}>
                              {statusLabels[s]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isCancelled && (
                  <div className="px-4 pb-3.5">
                    <div className="bg-destructive/10 rounded-lg px-3 py-2">
                      <p className="text-[11px] text-destructive font-medium text-center">❌ Booking cancelled</p>
                    </div>
                  </div>
                )}

                {booking.status === "completed" && reportUrl && (
                  <div className="px-4 pb-4">
                    <a
                      href={reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 bg-emerald-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors w-full"
                    >
                      <Download size={16} />
                      Download Report
                    </a>
                  </div>
                )}

                {booking.status === "completed" && !reportUrl && (
                  <div className="px-4 pb-3.5">
                    <p className="text-[11px] text-muted-foreground text-center bg-secondary/30 rounded-lg py-2">⏳ Report will be uploaded soon</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default MyLabTestsPage;
