import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, ChevronDown, ChevronUp, Stethoscope, Calendar, Phone, User, MapPin, Upload, FileText, Trash2 } from "lucide-react";

const statusTabs = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const statusOptions = ["pending", "confirmed", "in_progress", "completed", "cancelled"];
const paymentStatusOptions = ["pending", "paid", "refunded"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const AdminAppointments = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["admin-appointments"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_appointments")
        .select("*, doctors(name, specialization, fee)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("doctor_appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updatePaymentStatus = useMutation({
    mutationFn: async ({ id, payment_status }: { id: string; payment_status: string }) => {
      const { error } = await supabase.from("doctor_appointments").update({ payment_status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast.success("Payment status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleReportUpload = async (aptId: string, file: File) => {
    if (!file.type.includes("pdf")) { toast.error("Only PDF files allowed"); return; }
    setUploadingId(aptId);
    try {
      const filePath = `appointments/${aptId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("lab-reports").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("lab-reports").getPublicUrl(filePath);
      const { error: updateError } = await supabase.from("doctor_appointments").update({ report_url: urlData.publicUrl } as any).eq("id", aptId);
      if (updateError) throw updateError;
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast.success("Prescription/Report uploaded");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploadingId(null); }
  };

  const handleRemoveReport = async (aptId: string) => {
    try {
      const { error } = await supabase.from("doctor_appointments").update({ report_url: null } as any).eq("id", aptId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast.success("Report removed");
    } catch (e: any) { toast.error(e.message); }
  };

  const filtered = appointments?.filter((a) => {
    if (activeTab !== "all" && a.status !== activeTab) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        a.appointment_number.toLowerCase().includes(s) ||
        a.patient_name.toLowerCase().includes(s) ||
        a.patient_phone.toLowerCase().includes(s) ||
        (a as any).doctors?.name?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const tabCounts = appointments?.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search by appointment #, patient, doctor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {statusTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === t.key
                ? "bg-primary text-primary-foreground shadow-ios"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label} {tabCounts[t.key] ? `(${tabCounts[t.key]})` : ""}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{filtered?.length ?? 0} appointments</p>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : !filtered?.length ? (
          <div className="bg-card rounded-2xl shadow-ios p-8 text-center text-muted-foreground">
            No appointments found
          </div>
        ) : (
          filtered.map((apt) => {
            const expanded = expandedId === apt.id;
            const doctor = (apt as any).doctors;
            return (
              <div key={apt.id} className="bg-card rounded-2xl shadow-ios overflow-hidden">
                <div className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Stethoscope size={14} className="text-primary" />
                        <p className="text-xs font-bold text-primary font-mono">{apt.appointment_number}</p>
                      </div>
                      <p className="text-sm text-foreground font-medium">{apt.patient_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.patient_phone} • {new Date(apt.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[apt.status] || "bg-secondary text-foreground"}`}>
                        {apt.status.replace("_", " ")}
                      </span>
                      <span className="text-sm font-bold text-foreground">৳{apt.consultation_fee}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(apt.appointment_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                    </span>
                    <span>{apt.time_slot}</span>
                    {doctor && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {doctor.name}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setExpandedId(expanded ? null : apt.id)}
                    className="flex items-center gap-1 text-xs text-primary font-medium"
                  >
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {expanded ? "Hide Details" : "View Details"}
                  </button>
                </div>

                {expanded && (
                  <div className="border-t border-border p-4 space-y-3 bg-muted/10">
                    {/* Patient Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-muted-foreground" />
                        <span className="text-muted-foreground">Patient:</span>
                        <span className="text-foreground font-medium">{apt.patient_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-muted-foreground" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="text-foreground font-medium">{apt.patient_phone}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Age:</span>{" "}
                        <span className="text-foreground font-medium">{apt.patient_age || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gender:</span>{" "}
                        <span className="text-foreground font-medium capitalize">{apt.patient_gender || "—"}</span>
                      </div>
                    </div>

                    {/* Doctor Info */}
                    {doctor && (
                      <div className="text-xs space-y-1 pt-2 border-t border-border">
                        <p className="font-semibold text-foreground">Doctor</p>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{doctor.name}</span>
                          <span className="text-foreground font-medium">{doctor.specialization || "General"}</span>
                        </div>
                      </div>
                    )}

                    {/* Problem */}
                    {apt.problem_description && (
                      <div className="text-xs pt-2 border-t border-border">
                        <span className="text-muted-foreground">Problem: </span>
                        <span className="text-foreground">{apt.problem_description}</span>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="text-xs space-y-1 pt-2 border-t border-border">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method</span>
                        <span className="text-foreground font-medium uppercase">{apt.payment_method}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">Fee</span>
                        <span className="text-foreground">৳{apt.consultation_fee}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Status</label>
                        <select
                          className="w-full text-xs border border-border rounded-xl px-3 py-2 bg-secondary/30 text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                          value={apt.status}
                          onChange={(e) => updateStatus.mutate({ id: apt.id, status: e.target.value })}
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Payment</label>
                        <select
                          className="w-full text-xs border border-border rounded-xl px-3 py-2 bg-secondary/30 text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                          value={apt.payment_status}
                          onChange={(e) => updatePaymentStatus.mutate({ id: apt.id, payment_status: e.target.value })}
                        >
                          {paymentStatusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Report Upload */}
                    <div className="pt-2 border-t border-border">
                      <label className="text-[10px] text-muted-foreground font-medium mb-1.5 block">📄 Prescription / Report PDF</label>
                      {(apt as any).report_url ? (
                        <div className="flex items-center gap-2">
                          <a href={(apt as any).report_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                            <FileText size={14} /> View Report
                          </a>
                          <button onClick={() => handleRemoveReport(apt.id)}
                            className="flex items-center gap-1 text-xs text-destructive hover:underline">
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      ) : (
                        <label className={`flex items-center gap-2 text-xs font-medium px-3 py-2.5 rounded-xl border border-dashed border-primary/30 cursor-pointer hover:bg-primary/5 transition-colors ${uploadingId === apt.id ? "opacity-50 pointer-events-none" : ""}`}>
                          {uploadingId === apt.id ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} className="text-primary" />}
                          <span className="text-foreground">{uploadingId === apt.id ? "Uploading..." : "Upload PDF"}</span>
                          <input type="file" accept=".pdf" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReportUpload(apt.id, f); e.target.value = ""; }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminAppointments;
