import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Calendar, Phone, User } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusOptions = ["pending", "confirmed", "in_progress", "completed", "cancelled"];

const AdminBeautyAppointments = () => {
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["admin-beauty-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beauty_appointments")
        .select("*, beauty_specialists(name, specialization)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("beauty_appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-beauty-appointments"] }); toast.success("Status updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-foreground">Beauty Appointments</h1>
        <p className="text-xs text-muted-foreground">{appointments?.length || 0} bookings</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
      ) : !appointments?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles size={40} className="mx-auto mb-3 opacity-30" />
          <p>No appointments yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.map((apt: any) => (
            <div key={apt.id} className="bg-card border border-border rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary font-mono">{apt.appointment_number}</span>
                <select
                  value={apt.status}
                  onChange={(e) => updateStatus.mutate({ id: apt.id, status: e.target.value })}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border-0 outline-none cursor-pointer ${statusColors[apt.status] || "bg-secondary"}`}
                >
                  {statusOptions.map((s) => <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{(apt.beauty_specialists as any)?.name || "Specialist"}</p>
                  <p className="text-[10px] text-muted-foreground">{(apt.beauty_specialists as any)?.specialization}</p>
                </div>
                <span className="text-sm font-bold text-foreground">৳{apt.consultation_fee}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User size={11} /> <span className="text-foreground font-medium">{apt.patient_name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone size={11} /> <span className="text-foreground font-medium">{apt.patient_phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar size={11} /> <span className="text-foreground font-medium">{apt.appointment_date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-foreground font-medium">{apt.time_slot?.split("(")[0]?.trim()}</span>
                </div>
              </div>

              {apt.problem_description && (
                <p className="text-xs text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">{apt.problem_description}</p>
              )}

              <p className="text-[10px] text-muted-foreground">
                Booked: {format(new Date(apt.created_at), "dd MMM yyyy, hh:mm a")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBeautyAppointments;
