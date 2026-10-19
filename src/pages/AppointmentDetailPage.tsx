import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import {
  ArrowLeft, Loader2, Stethoscope, MapPin, Phone, User, CheckCircle2,
  XCircle, Clock, FileText, Download, Calendar, Activity, CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Appointment {
  id: string;
  appointment_number: string;
  patient_name: string;
  patient_phone: string;
  patient_age: number | null;
  patient_gender: string | null;
  appointment_date: string;
  time_slot: string;
  problem_description: string | null;
  consultation_fee: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes: string | null;
  report_url: string | null;
  created_at: string;
  doctor_id: string;
}

const trackingSteps = [
  { key: "pending", label: "বুকিং হয়েছে", icon: Clock, desc: "আপনার অ্যাপয়েন্টমেন্ট সফলভাবে বুক হয়েছে" },
  { key: "confirmed", label: "কনফার্মড", icon: CheckCircle2, desc: "ডাক্তার আপনার অ্যাপয়েন্টমেন্ট কনফার্ম করেছেন" },
  { key: "in_progress", label: "চলমান", icon: Activity, desc: "অ্যাপয়েন্টমেন্ট চলছে" },
  { key: "completed", label: "সম্পন্ন", icon: FileText, desc: "অ্যাপয়েন্টমেন্ট সম্পন্ন হয়েছে" },
];

const statusOrder = ["pending", "confirmed", "in_progress", "completed"];

const statusColors: Record<string, string> = {
  pending: "text-amber-600",
  confirmed: "text-blue-600",
  in_progress: "text-indigo-600",
  completed: "text-emerald-600",
  cancelled: "text-red-600",
};

const statusBg: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-blue-500",
  in_progress: "bg-indigo-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
};

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [doctor, setDoctor] = useState<{ name: string; specialization: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointment = async () => {
    if (!id || !user) return;
    const { data, error } = await supabase
      .from("doctor_appointments")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (error || !data) {
      toast.error("অ্যাপয়েন্টমেন্ট পাওয়া যায়নি");
      navigate("/my-appointments");
      return;
    }
    setAppointment(data as Appointment);

    const { data: doc } = await supabase
      .from("doctors")
      .select("name, specialization")
      .eq("id", data.doctor_id)
      .single();
    if (doc) setDoctor(doc);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointment();
  }, [id, user]);

  // Realtime
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`appointment-detail-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "doctor_appointments", filter: `id=eq.${id}` },
        (payload) => {
          setAppointment(prev => prev ? { ...prev, ...payload.new } as Appointment : prev);
          toast.info("অ্যাপয়েন্টমেন্ট আপডেট হয়েছে!");
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleCancel = async () => {
    if (!appointment || appointment.status !== "pending") return;
    setCancelling(true);
    const { error } = await supabase
      .from("doctor_appointments")
      .update({ status: "cancelled" })
      .eq("id", appointment.id);
    if (error) toast.error(error.message);
    else {
      setAppointment(prev => prev ? { ...prev, status: "cancelled" } : prev);
      toast.success("অ্যাপয়েন্টমেন্ট বাতিল হয়েছে");
    }
    setCancelling(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageTopBar title="Appointment Details" />
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={28} /></div>
        <MobileBottomNav />
      </div>
    );
  }

  if (!appointment) return null;

  const isCancelled = appointment.status === "cancelled";
  const currentStepIdx = statusOrder.indexOf(appointment.status);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <PageTopBar title="Appointment Details" subtitle={appointment.appointment_number} />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Doctor Card */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Stethoscope size={22} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{doctor?.name || "ডাক্তার"}</p>
              {doctor?.specialization && (
                <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">৳{appointment.consultation_fee}</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase text-white ${statusBg[appointment.status] || "bg-secondary"}`}>
                {appointment.status === "in_progress" ? "চলমান" : appointment.status === "pending" ? "পেন্ডিং" : appointment.status === "confirmed" ? "কনফার্মড" : appointment.status === "completed" ? "সম্পন্ন" : "বাতিল"}
              </span>
            </div>
          </div>
        </div>

        {/* Status Tracking */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="text-xs font-bold text-foreground mb-4 flex items-center gap-2">
            <Activity size={14} className="text-primary" />
            স্ট্যাটাস ট্র্যাকিং
          </h3>
          {isCancelled ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
              <XCircle size={20} className="text-red-500" />
              <div>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">বাতিল করা হয়েছে</p>
                <p className="text-xs text-muted-foreground">এই অ্যাপয়েন্টমেন্ট বাতিল হয়েছে</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {trackingSteps.map((step, i) => {
                const isDone = i <= currentStepIdx;
                const isCurrent = i === currentStepIdx;
                const StepIcon = step.icon;
                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isDone ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                        <StepIcon size={14} />
                      </div>
                      {i < trackingSteps.length - 1 && (
                        <div className={`w-0.5 h-8 my-1 ${isDone && i < currentStepIdx ? "bg-primary" : "bg-border"}`} />
                      )}
                    </div>
                    <div className="pb-4 pt-1">
                      <p className={`text-xs font-bold ${isDone ? "text-foreground" : "text-muted-foreground/50"}`}>{step.label}</p>
                      <p className={`text-[10px] ${isDone ? "text-muted-foreground" : "text-muted-foreground/30"}`}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Prescription Download */}
        {appointment.report_url && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <FileText size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">প্রেসক্রিপশন তৈরি হয়েছে ✅</p>
                  <p className="text-[10px] text-muted-foreground">ডাউনলোড করতে নিচে ক্লিক করুন</p>
                </div>
              </div>
              <a
                href={appointment.report_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-green-700 transition-colors w-full"
              >
                <Download size={16} />
                প্রেসক্রিপশন ডাউনলোড করুন
              </a>
            </div>
          </div>
        )}

        {appointment.status === "completed" && !appointment.report_url && (
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <FileText size={24} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">⏳ প্রেসক্রিপশন শীঘ্রই আপলোড করা হবে</p>
          </div>
        )}

        {/* Patient Info */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
            <User size={14} className="text-primary" />
            রোগীর তথ্য
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">নাম: </span>
              <span className="text-foreground font-medium">{appointment.patient_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">ফোন: </span>
              <span className="text-foreground font-medium">{appointment.patient_phone}</span>
            </div>
            <div>
              <span className="text-muted-foreground">বয়স: </span>
              <span className="text-foreground font-medium">{appointment.patient_age || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">লিঙ্গ: </span>
              <span className="text-foreground font-medium">{appointment.patient_gender || "—"}</span>
            </div>
          </div>
          {appointment.problem_description && (
            <div className="text-xs p-2.5 rounded-xl bg-secondary/40">
              <span className="text-muted-foreground">সমস্যা: </span>
              <span className="text-foreground">{appointment.problem_description}</span>
            </div>
          )}
        </div>

        {/* Schedule & Payment */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
            <Calendar size={14} className="text-primary" />
            সময়সূচী ও পেমেন্ট
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">তারিখ: </span>
              <span className="text-foreground font-medium">{format(new Date(appointment.appointment_date), "dd MMM yyyy")}</span>
            </div>
            <div>
              <span className="text-muted-foreground">সময়: </span>
              <span className="text-foreground font-medium">{appointment.time_slot}</span>
            </div>
            <div>
              <span className="text-muted-foreground">পেমেন্ট: </span>
              <span className="text-foreground font-medium uppercase">{appointment.payment_method}</span>
            </div>
            <div>
              <span className="text-muted-foreground">স্ট্যাটাস: </span>
              <span className={`font-bold ${appointment.payment_status === "paid" ? "text-green-600" : "text-amber-600"}`}>
                {appointment.payment_status === "paid" ? "পেইড" : "পেন্ডিং"}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><CreditCard size={12} /> মোট ফি</span>
            <span className="text-sm font-bold text-primary">৳{appointment.consultation_fee}</span>
          </div>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-xs font-bold text-foreground mb-2">📝 নোটস</h3>
            <p className="text-xs text-muted-foreground">{appointment.notes}</p>
          </div>
        )}

        {/* Cancel Button */}
        {appointment.status === "pending" && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors disabled:opacity-50"
          >
            {cancelling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
            অ্যাপয়েন্টমেন্ট বাতিল করুন
          </button>
        )}

        <p className="text-[10px] text-center text-muted-foreground/60">
          বুকিং: {format(new Date(appointment.created_at), "dd MMM yyyy, hh:mm a")}
        </p>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default AppointmentDetailPage;
