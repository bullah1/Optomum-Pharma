import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { toast } from "sonner";
import { Loader2, Stethoscope, Calendar, Download, ArrowLeft } from "lucide-react";

const statusSteps = ["pending", "confirmed", "in_progress", "completed"];

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  in_progress: "bg-indigo-500",
  completed: "bg-green-500",
  cancelled: "bg-destructive",
};

const MyAppointmentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("my-appointments-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "doctor_appointments", filter: `user_id=eq.${user.id}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["my-appointments", user.id] });
          const newStatus = (payload.new as any).status;
          const aptNum = (payload.new as any).appointment_number;
          toast.info(`Appointment ${aptNum} — ${statusLabels[newStatus] || newStatus}`);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["my-appointments", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_appointments")
        .select("*, doctors(name, specialization)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const activeStepIndex = (status: string) => {
    if (status === "cancelled") return -1;
    return statusSteps.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="My Appointments" />
      <div className="max-w-lg mx-auto px-4 py-3 space-y-3">

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : !appointments?.length ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center space-y-3">
            <Stethoscope size={32} className="mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No appointments yet</p>
            <button
              onClick={() => navigate("/healthcare/doctors")}
              className="bg-primary text-primary-foreground text-xs font-semibold px-5 py-2.5 rounded-lg"
            >
              Find a Doctor
            </button>
          </div>
        ) : (
          appointments.map((apt) => {
            const step = activeStepIndex(apt.status);
            const isCancelled = apt.status === "cancelled";
            const doctor = (apt as any).doctors;
            const reportUrl = (apt as any).report_url;

            return (
              <div
                key={apt.id}
                onClick={() => navigate(`/appointment/${apt.id}`)}
                className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:border-primary/20 transition-all"
              >
                <div className="p-3.5">
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-primary font-mono">{apt.appointment_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase text-white ${statusColors[apt.status] || "bg-secondary"}`}>
                      {statusLabels[apt.status] || apt.status}
                    </span>
                  </div>

                  {/* Doctor info */}
                  {doctor && (
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                        <Stethoscope size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">{doctor.name}</p>
                        {doctor.specialization && (
                          <p className="text-[10px] text-muted-foreground">{doctor.specialization}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Details row */}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(apt.appointment_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      </span>
                      <span>{apt.time_slot}</span>
                    </div>
                    <span className="font-bold text-foreground">৳{apt.consultation_fee}</span>
                  </div>
                </div>

                {/* Progress bar */}
                {!isCancelled && (
                  <div className="px-3.5 pb-3">
                    <div className="flex gap-1">
                      {statusSteps.map((s, i) => (
                        <div key={s} className={`flex-1 h-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"} ${i === step ? "animate-pulse" : ""}`} />
                      ))}
                    </div>
                  </div>
                )}

                {isCancelled && (
                  <div className="px-3.5 pb-3">
                    <p className="text-[10px] text-destructive font-medium">This appointment has been cancelled</p>
                  </div>
                )}

                {apt.status === "completed" && reportUrl && (
                  <div className="border-t border-border px-3.5 py-2.5">
                    <a href={reportUrl} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-primary">
                      <Download size={12} /> Download Prescription
                    </a>
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

export default MyAppointmentsPage;
