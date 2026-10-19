import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Search, ChevronDown, ChevronUp, FlaskConical, Calendar,
  Phone, User, MapPin, Building2, Upload, FileText, Trash2, CreditCard,
  Clock, CheckCircle2, XCircle, Truck, TestTube
} from "lucide-react";

const statusTabs = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "sample_collected", label: "Collected" },
  { key: "processing", label: "Processing" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const statusFlow = ["pending", "confirmed", "sample_collected", "processing", "completed"];

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock, label: "Pending" },
  confirmed: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle2, label: "Confirmed" },
  sample_collected: { color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", icon: TestTube, label: "Sample Collected" },
  processing: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: Truck, label: "Processing" },
  completed: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2, label: "Completed" },
  cancelled: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle, label: "Cancelled" },
};

const paymentStatusOptions = ["pending", "paid", "refunded"];

const paymentColors: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
  paid: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
  refunded: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
};

const AdminLabBookings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-lab-bookings"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const adminApi = async (body: Record<string, any>) => {
    const { data, error } = await supabase.functions.invoke("admin-general", {
      body: { admin_code: "990990", table: "lab_bookings", ...body },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await adminApi({ action: "update", id, payload: { status } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lab-bookings"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updatePaymentStatus = useMutation({
    mutationFn: async ({ id, payment_status }: { id: string; payment_status: string }) => {
      await adminApi({ action: "update", id, payload: { payment_status } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lab-bookings"] });
      toast.success("Payment status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleReportUpload = async (bookingId: string, file: File) => {
    if (!file.type.includes("pdf")) {
      toast.error("Only PDF files allowed");
      return;
    }
    setUploadingId(bookingId);
    try {
      const filePath = `${bookingId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("lab-reports").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("lab-reports").getPublicUrl(filePath);
      await adminApi({ action: "update", id: bookingId, payload: { report_url: urlData.publicUrl } });
      queryClient.invalidateQueries({ queryKey: ["admin-lab-bookings"] });
      toast.success("Report uploaded successfully");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveReport = async (bookingId: string) => {
    try {
      await adminApi({ action: "update", id: bookingId, payload: { report_url: null } });
      queryClient.invalidateQueries({ queryKey: ["admin-lab-bookings"] });
      toast.success("Report removed");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filtered = bookings?.filter((b) => {
    if (activeTab !== "all" && b.status !== activeTab) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        b.booking_number.toLowerCase().includes(s) ||
        b.patient_name.toLowerCase().includes(s) ||
        b.patient_phone.toLowerCase().includes(s) ||
        b.address.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const tabCounts = bookings?.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  const parseItems = (items: any): Array<{ id: string; name: string; price: number; type: string }> => {
    if (Array.isArray(items)) return items;
    try { return JSON.parse(items); } catch { return []; }
  };

  const getNextStatus = (current: string) => {
    const idx = statusFlow.indexOf(current);
    if (idx >= 0 && idx < statusFlow.length - 1) return statusFlow[idx + 1];
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search by booking #, name, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {statusTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === t.key
                ? "bg-primary text-primary-foreground shadow-ios"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label} {tabCounts[t.key] ? `(${tabCounts[t.key]})` : ""}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{filtered?.length ?? 0} bookings</p>

      {/* Bookings */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : !filtered?.length ? (
          <div className="bg-card rounded-2xl shadow-ios p-8 text-center text-muted-foreground">
            No lab bookings found
          </div>
        ) : (
          filtered.map((booking) => {
            const expanded = expandedId === booking.id;
            const items = parseItems(booking.items);
            const sc = statusConfig[booking.status] || statusConfig.pending;
            const StatusIcon = sc.icon;
            const nextStatus = getNextStatus(booking.status);

            return (
              <div key={booking.id} className="bg-card rounded-2xl shadow-ios overflow-hidden">
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FlaskConical size={14} className="text-primary shrink-0" />
                        <p className="text-xs font-bold text-primary font-mono truncate">{booking.booking_number}</p>
                      </div>
                      <p className="text-sm text-foreground font-medium truncate">{booking.patient_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.patient_phone} • {new Date(booking.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${sc.color}`}>
                        <StatusIcon size={10} />
                        {sc.label}
                      </span>
                      <span className="text-sm font-bold text-foreground">৳{booking.total_amount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar size={12} />
                    <span>{new Date(booking.preferred_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })} • {booking.preferred_time_slot}</span>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-secondary font-medium">
                      {items.length} test{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Quick Actions Row */}
                  <div className="flex items-center gap-2">
                    {nextStatus && booking.status !== "cancelled" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: booking.id, status: nextStatus }); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity"
                      >
                        → {statusConfig[nextStatus]?.label || nextStatus}
                      </button>
                    )}
                    {booking.status === "pending" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: booking.id, status: "cancelled" }); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-[11px] font-semibold hover:bg-destructive/20 transition-colors"
                      >
                        <XCircle size={11} /> Cancel
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(expanded ? null : booking.id)}
                      className="flex items-center gap-1 text-xs text-primary font-medium ml-auto"
                    >
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {expanded ? "Hide" : "Details"}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded && (
                  <div className="border-t border-border divide-y divide-border/30">
                    {/* Patient Info */}
                    <div className="p-4 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Patient Info</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <User size={11} className="text-muted-foreground shrink-0" />
                          <span className="text-foreground font-medium truncate">{booking.patient_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone size={11} className="text-muted-foreground shrink-0" />
                          <span className="text-foreground font-medium">{booking.patient_phone}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Age: </span>
                          <span className="text-foreground font-medium">{booking.patient_age || "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gender: </span>
                          <span className="text-foreground font-medium">{booking.patient_gender || "—"}</span>
                        </div>
                        <div className="col-span-2 flex items-start gap-1.5">
                          <MapPin size={11} className="text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-foreground font-medium">{booking.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Lab & Tests */}
                    <div className="p-4 space-y-2">
                      {booking.diagnostic_lab && (
                        <div className="flex items-center gap-1.5 text-xs mb-2">
                          <Building2 size={12} className="text-primary" />
                          <span className="text-foreground font-semibold">{booking.diagnostic_lab}</span>
                        </div>
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tests ({items.length})</p>
                      <div className="space-y-1">
                        {items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs bg-secondary/40 rounded-xl px-3 py-2">
                            <span className="flex items-center gap-1.5">
                              <FlaskConical size={10} className="text-primary" />
                              {item.name}
                              {item.type === "package" && (
                                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">PKG</span>
                              )}
                            </span>
                            <span className="font-medium text-foreground">৳{item.price}</span>
                          </div>
                        ))}
                      </div>
                      {booking.notes && (
                        <div className="text-xs mt-2 p-2 rounded-xl bg-muted/30">
                          <span className="text-muted-foreground">Notes: </span>
                          <span className="text-foreground">{booking.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Payment & Status Controls */}
                    <div className="p-4 space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Manage</p>
                      
                      {/* Status Stepper */}
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium mb-1.5 block">Status</label>
                        <div className="flex flex-wrap gap-1.5">
                          {[...statusFlow, "cancelled"].map((s) => {
                            const cfg = statusConfig[s];
                            const Icon = cfg.icon;
                            const isActive = booking.status === s;
                            return (
                              <button
                                key={s}
                                onClick={() => updateStatus.mutate({ id: booking.id, status: s })}
                                disabled={isActive}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                                  isActive
                                    ? cfg.color + " ring-2 ring-offset-1 ring-current/20"
                                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                }`}
                              >
                                <Icon size={10} />
                                {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Payment Status */}
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium mb-1.5 flex items-center gap-1">
                          <CreditCard size={10} /> Payment
                        </label>
                        <div className="flex gap-1.5">
                          {paymentStatusOptions.map((ps) => (
                            <button
                              key={ps}
                              onClick={() => updatePaymentStatus.mutate({ id: booking.id, payment_status: ps })}
                              disabled={booking.payment_status === ps}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                                booking.payment_status === ps
                                  ? paymentColors[ps] + " ring-2 ring-offset-1 ring-current/20"
                                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                              }`}
                            >
                              {ps.charAt(0).toUpperCase() + ps.slice(1)}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                          <span className="text-muted-foreground">Method: <span className="text-foreground font-medium uppercase">{booking.payment_method}</span></span>
                          <span className="text-foreground font-bold">Total: ৳{booking.total_amount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Report Upload */}
                    <div className="p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">📄 Report PDF</p>
                      {booking.report_url ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                          <FileText size={18} className="text-green-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-green-700 dark:text-green-400">Report Uploaded ✅</p>
                            <a href={booking.report_url} target="_blank" rel="noopener noreferrer"
                              className="text-[11px] text-primary font-medium hover:underline truncate block">
                              View / Download Report
                            </a>
                          </div>
                          <button onClick={() => handleRemoveReport(booking.id)}
                            className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors shrink-0">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-primary/30 cursor-pointer hover:bg-primary/5 transition-colors ${uploadingId === booking.id ? "opacity-50 pointer-events-none" : ""}`}>
                          {uploadingId === booking.id ? (
                            <Loader2 size={20} className="animate-spin text-primary" />
                          ) : (
                            <Upload size={20} className="text-primary" />
                          )}
                          <span className="text-xs font-medium text-foreground">
                            {uploadingId === booking.id ? "Uploading..." : "Click to upload report PDF"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">PDF files only</span>
                          <input type="file" accept=".pdf" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReportUpload(booking.id, f); e.target.value = ""; }}
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

export default AdminLabBookings;
