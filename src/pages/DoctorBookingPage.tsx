import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Stethoscope, Loader2, User, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const timeSlots = [
  "Morning (10AM-1PM)",
  "Afternoon (2PM-5PM)",
  "Evening (6PM-9PM)",
];

const DoctorBookingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const doctor = (location.state as any)?.doctor;

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>();
  const [timeSlot, setTimeSlot] = useState(timeSlots[0]);
  const [problemDescription, setProblemDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">No doctor selected</p>
        <Link to="/healthcare/doctors" className="text-primary text-sm font-medium">← Back to Doctors</Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!user) { toast.error("Please login first"); navigate("/auth"); return; }
    if (!patientName.trim() || !patientPhone.trim() || !appointmentDate) {
      toast.error("Please fill in all required fields"); return;
    }
    if (patientPhone.trim().length < 11) {
      toast.error("Please enter a valid phone number"); return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("doctor_appointments")
        .insert({
          user_id: user.id,
          doctor_id: doctor.id,
          patient_name: patientName.trim(),
          patient_phone: patientPhone.trim(),
          patient_age: patientAge ? Number(patientAge) : null,
          patient_gender: patientGender || null,
          appointment_date: format(appointmentDate, "yyyy-MM-dd"),
          time_slot: timeSlot,
          problem_description: problemDescription.trim() || null,
          consultation_fee: doctor.fee,
          payment_method: "cod",
        })
        .select()
        .single();

      if (error) throw error;
      navigate("/healthcare/doctors/booking-success", { state: { appointment: data, doctor }, replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-8">
      <PageTopBar title="Book Appointment" />
      <main className="container py-3 max-w-lg space-y-3">

        {/* Doctor Card - Compact */}
        <div className="bg-card rounded-xl border border-border p-3.5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            {doctor.image_url ? (
              <img src={doctor.image_url} alt={doctor.name} className="w-full h-full rounded-lg object-cover" />
            ) : (
              <Stethoscope size={18} className="text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[13px] font-bold text-foreground">{doctor.name}</h2>
            {doctor.specialization && <p className="text-[10px] text-primary font-medium">{doctor.specialization}</p>}
          </div>
          <span className="text-base font-extrabold text-foreground shrink-0">৳{doctor.fee}</span>
        </div>

        {/* Patient Info */}
        <div className="bg-card rounded-xl border border-border p-3.5 space-y-2.5">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <User size={12} className="text-primary" /> Patient Information
          </h3>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium">Name *</label>
            <input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Patient name"
              className="w-full mt-0.5 px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium">Phone *</label>
            <input value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} placeholder="01XXXXXXXXX" type="tel"
              className="w-full mt-0.5 px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Age</label>
              <input value={patientAge} onChange={(e) => setPatientAge(e.target.value.replace(/\D/g, ""))} placeholder="Age" maxLength={3}
                className="w-full mt-0.5 px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Gender</label>
              <select value={patientGender} onChange={(e) => setPatientGender(e.target.value)}
                className="w-full mt-0.5 px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-card rounded-xl border border-border p-3.5 space-y-2.5">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <CalendarIcon size={12} className="text-primary" /> Date & Time
          </h3>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium">Preferred Date *</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  "w-full mt-0.5 flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-sm text-left",
                  !appointmentDate && "text-muted-foreground"
                )}>
                  <CalendarIcon size={13} />
                  {appointmentDate ? format(appointmentDate, "PPP") : "Select date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={appointmentDate} onSelect={setAppointmentDate}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                  initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium">Time Slot *</label>
            <div className="grid grid-cols-3 gap-1.5 mt-0.5">
              {timeSlots.map((slot) => (
                <button key={slot} onClick={() => setTimeSlot(slot)}
                  className={cn(
                    "px-2 py-2 rounded-lg border text-[10px] font-medium transition-all text-center leading-tight",
                    timeSlot === slot
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-foreground"
                  )}>
                  {slot.split("(")[0].trim()}
                  <br />
                  <span className="text-[8px] opacity-70">{slot.match(/\((.+)\)/)?.[1]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Problem */}
        <div className="bg-card rounded-xl border border-border p-3.5">
          <label className="text-[10px] text-muted-foreground font-medium">Problem Description (Optional)</label>
          <textarea value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="Briefly describe your health issue..." rows={2} maxLength={500}
            className="w-full mt-0.5 px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
        </div>
      </main>

      {/* Sticky Bottom */}
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-40">
        <div className="container max-w-lg flex items-center justify-between py-3 px-4">
          <div>
            <p className="text-[10px] text-muted-foreground">Consultation Fee</p>
            <p className="text-lg font-extrabold text-foreground">৳{doctor.fee}</p>
          </div>
          <button onClick={handleSubmit} disabled={submitting}
            className="bg-primary text-primary-foreground font-bold text-sm px-6 py-3 rounded-xl active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-2">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {submitting ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default DoctorBookingPage;
