import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ArrowLeft, Loader2, FlaskConical, MapPin, Phone, User, CheckCircle2, XCircle, Clock, FileText, Download, Calendar, TestTube, Package } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface LabBooking {
  id: string;
  booking_number: string;
  patient_name: string;
  patient_phone: string;
  patient_age: number | null;
  patient_gender: string | null;
  address: string;
  preferred_date: string;
  preferred_time_slot: string;
  payment_method: string;
  payment_status: string;
  status: string;
  total_amount: number;
  items: any[];
  notes: string | null;
  diagnostic_lab: string | null;
  report_url: string | null;
  created_at: string;
  updated_at: string;
}

const trackingSteps = [
  { key: "pending", label: "Booking Placed", icon: Clock, desc: "Your lab test booking has been placed successfully" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2, desc: "Your booking has been confirmed" },
  { key: "sample_collected", label: "Sample Collected", icon: TestTube, desc: "Sample has been collected" },
  { key: "processing", label: "Processing", icon: FlaskConical, desc: "Test in progress" },
  { key: "completed", label: "Report Ready", icon: FileText, desc: "Report is ready" },
];

const cancelledStep = { key: "cancelled", label: "Cancelled", icon: XCircle, desc: "Booking cancelled" };

const statusOrder = ["pending", "confirmed", "sample_collected", "processing", "completed"];

const statusColors: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-blue-500",
  sample_collected: "bg-purple-500",
  processing: "bg-orange-500",
  completed: "bg-emerald-500",
  cancelled: "bg-destructive",
};

const LabBookingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<LabBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }

    const fetchBooking = async () => {
      const { data, error } = await supabase
        .from("lab_bookings")
        .select("*")
        .eq("id", id!)
        .eq("user_id", user.id)
        .single();

      if (data) setBooking(data as unknown as LabBooking);
      if (error) { toast.error("Booking not found"); navigate("/orders"); }
      setLoading(false);
    };

    fetchBooking();

    const channel = supabase
      .channel(`lab-booking-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lab_bookings", filter: `id=eq.${id}` },
        (payload) => {
          const updated = payload.new as any;
          setBooking(prev => prev ? { ...prev, ...updated } : prev);
          toast.info("Booking status updated!");
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, user, authLoading, navigate]);

  const handleCancel = async () => {
    if (!booking || !confirm("Are you sure you want to cancel this booking?")) return;
    const { error } = await supabase.from("lab_bookings").update({ status: "cancelled" }).eq("id", booking.id);
    if (error) { toast.error("Could not cancel"); return; }
    toast.success("Booking cancelled");
    setBooking({ ...booking, status: "cancelled" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (!booking) return null;

  const currentStatus = booking.status;
  const isCancelled = currentStatus === "cancelled";
  const currentIdx = statusOrder.indexOf(currentStatus);
  const items = Array.isArray(booking.items) ? booking.items : [];

  const stepsToShow = isCancelled
    ? [...trackingSteps.slice(0, Math.max(currentIdx, 1)), cancelledStep]
    : trackingSteps;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <PageTopBar title="Lab Booking Details" subtitle={booking.booking_number} />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Status Badge */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${statusColors[currentStatus] || "bg-muted"}`} />
              <span className="font-semibold text-foreground capitalize">
                {isCancelled ? "Cancelled" : trackingSteps.find(s => s.key === currentStatus)?.label || currentStatus}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(booking.created_at), "dd MMM yyyy, hh:mm a")}
            </span>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">📍 Status Tracking</h3>
          <div className="relative">
            {stepsToShow.map((step, i) => {
              const stepIdx = statusOrder.indexOf(step.key);
              const isReached = isCancelled
                ? (step.key === "cancelled" || stepIdx <= 0)
                : stepIdx <= currentIdx;
              const isCurrent = step.key === currentStatus || (isCancelled && step.key === "cancelled");
              const isLast = i === stepsToShow.length - 1;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex gap-3.5 animate-fade-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
                  <div className="flex flex-col items-center relative">
                    {isCurrent && !isCancelled && (
                      <div className="absolute w-9 h-9 rounded-full bg-primary/10 animate-[pulse_2s_ease-in-out_infinite]" />
                    )}
                    <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isReached
                        ? step.key === "cancelled"
                          ? "bg-destructive text-destructive-foreground"
                          : step.key === "completed"
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/80 text-primary-foreground"
                        : "bg-muted text-muted-foreground/30 border border-border"
                    }`}>
                      <StepIcon size={13} strokeWidth={isReached ? 2.5 : 1.5} />
                    </div>
                    {!isLast && (
                      <div className="relative w-0.5 h-8 my-0.5">
                        <div className="absolute inset-0 bg-border/40 rounded-full" />
                        {isReached && !isLast && (
                          <div className="absolute inset-0 bg-primary/60 rounded-full transition-all duration-700" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm font-semibold ${isReached ? "text-foreground" : "text-muted-foreground/40"}`}>
                      {step.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${isReached ? "text-muted-foreground" : "text-muted-foreground/30"}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Download */}
        {booking.report_url && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <FileText size={20} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Report is ready ✅</p>
                <p className="text-xs text-muted-foreground">Download your lab report</p>
              </div>
              <a
                href={booking.report_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                <Download size={14} />
                Download
              </a>
            </div>
          </div>
        )}

        {/* Test Items */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">🧪 Tests</h3>
          <div className="space-y-2.5">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    {item.item_type === "lab_package" ? <Package size={14} className="text-primary" /> : <FlaskConical size={14} className="text-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.item_type === "lab_package" ? "📦 Package" : "🧪 Test"}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-primary">৳{item.price}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <span className="text-base font-bold text-primary">৳{booking.total_amount}</span>
          </div>
        </div>

        {/* Patient Info */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">👤 Patient Info</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <User size={14} className="text-muted-foreground" />
              <span className="text-foreground">{booking.patient_name}</span>
              {booking.patient_age && <span className="text-muted-foreground">({booking.patient_age} years)</span>}
              {booking.patient_gender && <span className="text-muted-foreground capitalize">• {booking.patient_gender}</span>}
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Phone size={14} className="text-muted-foreground" />
              <span className="text-foreground">{booking.patient_phone}</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <MapPin size={14} className="text-muted-foreground mt-0.5" />
              <span className="text-foreground">{booking.address}</span>
            </div>
          </div>
        </div>

        {/* Schedule & Payment */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">📅 Schedule & Payment</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Date</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {format(new Date(booking.preferred_date), "dd MMM yyyy")}
              </p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Time</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{booking.preferred_time_slot}</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Payment</p>
              <p className="text-sm font-medium text-foreground mt-0.5 uppercase">{booking.payment_method}</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Payment Status</p>
              <p className="text-sm font-medium text-foreground mt-0.5 capitalize">{booking.payment_status}</p>
            </div>
          </div>
          {booking.diagnostic_lab && (
            <div className="mt-3 bg-secondary/30 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Diagnostic Lab</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{booking.diagnostic_lab}</p>
            </div>
          )}
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-bold text-foreground mb-2">📝 Notes</h3>
            <p className="text-sm text-muted-foreground">{booking.notes}</p>
          </div>
        )}

        {/* Cancel Button */}
        {currentStatus === "pending" && (
          <button
            onClick={handleCancel}
            className="w-full py-3 rounded-xl border border-destructive/30 text-destructive font-medium text-sm hover:bg-destructive/5 transition-colors"
          >
            Cancel Booking
          </button>
        )}
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default LabBookingDetailPage;
