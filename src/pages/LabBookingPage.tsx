import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLabCart, type LabCartItem } from "@/contexts/LabCartContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, User, MapPin, Calendar, Clock, FlaskConical, Trash2, Building2, CheckCircle2, CreditCard, Banknote, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { addDays, isSameDay } from "date-fns";

const timeSlots = [
  "Morning (8AM-12PM)",
  "Afternoon (12PM-4PM)",
  "Evening (4PM-8PM)",
];

const LabBookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { items, removeItem: removeLabItem, totalAmount, clearItems } = useLabCart();
  const [patientName, setPatientName] = useState(user?.user_metadata?.name || "");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [address, setAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState(timeSlots[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLab, setSelectedLab] = useState<string>("");

  const { data: diagnosticLabs } = useQuery({
    queryKey: ["diagnostic-labs"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostic_labs")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const isFormValid = !!(patientName && patientPhone && address && preferredDate && items.length > 0);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to book a lab test");
      navigate("/auth");
      return;
    }

    if (!isFormValid) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lab_bookings")
        .insert({
          user_id: user.id,
          patient_name: patientName,
          patient_phone: patientPhone,
          patient_age: patientAge ? Number(patientAge) : null,
          patient_gender: patientGender || null,
          address,
          preferred_date: format(preferredDate!, "yyyy-MM-dd"),
          preferred_time_slot: timeSlot,
          items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, type: i.type })),
          total_amount: totalAmount,
          payment_method: "cod",
          notes: notes || null,
          diagnostic_lab: selectedLab,
        } as any)
        .select()
        .single();

      if (error) throw error;

      clearItems();
      navigate("/lab-test/booking-success", {
        state: { booking: data, items },
        replace: true,
      });
    } catch (error: any) {
      toast.error(error.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <FlaskConical size={36} className="text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">No tests selected</h2>
        <p className="text-sm text-muted-foreground mb-5">Go back and select tests to book</p>
        <Link to="/lab-test" className="bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-xl">
          Browse Lab Tests
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20 pb-32">
      {/* Header */}
      <div className="bg-primary sticky top-0 z-30">
        <div className="container max-w-lg px-4 py-3.5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-primary-foreground/90 hover:text-primary-foreground transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <FlaskConical size={17} className="text-primary-foreground/80" />
              <span className="font-bold text-primary-foreground text-[15px]">Book Lab Test</span>
            </div>
            <span className="text-primary-foreground/70 text-[11px] font-medium bg-primary-foreground/10 px-2 py-0.5 rounded-full">
              {items.length} test{items.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="container max-w-lg px-4 py-4 space-y-3">

        {/* Selected Tests */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-[12px] font-bold text-foreground flex items-center gap-1.5">
              <FlaskConical size={13} className="text-primary" />
              Selected Tests
            </span>
            <span className="text-[14px] font-extrabold text-primary">৳{totalAmount}</span>
          </div>
          <div className="divide-y divide-border/10">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <FlaskConical size={12} className="text-primary" />
                </div>
                <p className="text-[12px] font-medium text-foreground flex-1 line-clamp-1">{item.name}</p>
                <span className="text-[12px] font-bold text-foreground shrink-0">৳{item.price}</span>
                <button onClick={() => removeLabItem(item.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Lab */}
        {diagnosticLabs && diagnosticLabs.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3 shadow-sm">
            <h3 className="text-[12px] font-bold text-foreground flex items-center gap-1.5">
              <Building2 size={13} className="text-primary" />
              Diagnostic Center
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {diagnosticLabs.map((lab) => (
                <button
                  key={lab.id}
                  onClick={() => setSelectedLab(selectedLab === lab.name ? "" : lab.name)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl border whitespace-nowrap text-[11px] font-medium transition-all active:scale-95 shrink-0",
                    selectedLab === lab.name
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-primary/20"
                  )}
                >
                  <span className="text-sm">{lab.logo}</span>
                  {lab.name}
                  {selectedLab === lab.name && <CheckCircle2 size={11} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Patient Info */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3 shadow-sm">
          <h3 className="text-[12px] font-bold text-foreground flex items-center gap-1.5">
            <User size={13} className="text-primary" />
            Patient Information
          </h3>
          <input
            placeholder="Full Name *"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[13px] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all"
          />
          <div className="flex gap-2">
            <input
              placeholder="Phone Number *"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              type="tel"
              className="flex-1 px-3.5 py-3 rounded-xl border border-border bg-background text-[13px] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 transition-all"
            />
            <input
              placeholder="Age"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value.replace(/\D/g, ""))}
              maxLength={3}
              className="w-16 px-2 py-3 rounded-xl border border-border bg-background text-[13px] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/40 text-center transition-all"
            />
          </div>
          <select
            value={patientGender}
            onChange={(e) => setPatientGender(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[13px] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Collection Address */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3 shadow-sm">
          <h3 className="text-[12px] font-bold text-foreground flex items-center gap-1.5">
            <MapPin size={13} className="text-primary" />
            Collection Address <span className="text-destructive">*</span>
          </h3>
          <textarea
            placeholder="Enter full address for home sample collection"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[13px] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 resize-none placeholder:text-muted-foreground/40 transition-all"
          />
        </div>

        {/* Date & Time */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3 shadow-sm">
          <h3 className="text-[12px] font-bold text-foreground flex items-center gap-1.5">
            <Calendar size={13} className="text-primary" />
            Preferred Date <span className="text-destructive">*</span>
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            {Array.from({ length: 10 }, (_, i) => {
              const date = addDays(new Date(), i + 1);
              const isSelected = preferredDate && isSameDay(date, preferredDate);
              const dayName = format(date, "EEE");
              const dayNum = format(date, "d");
              const monthName = format(date, "MMM");
              return (
                <button
                  key={i}
                  onClick={() => setPreferredDate(date)}
                  className={cn(
                    "flex flex-col items-center min-w-[52px] py-2.5 px-2 rounded-xl transition-all active:scale-95 shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border text-foreground hover:border-primary/20"
                  )}
                >
                  <span className="text-[10px] font-medium opacity-70">{dayName}</span>
                  <span className="text-[16px] font-bold leading-tight">{dayNum}</span>
                  <span className="text-[9px] font-medium opacity-60">{monthName}</span>
                </button>
              );
            })}
          </div>

          <h3 className="text-[12px] font-bold text-foreground flex items-center gap-1.5 pt-1">
            <Clock size={13} className="text-primary" />
            Preferred Time
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map((slot) => {
              const label = slot.split(" ")[0];
              const time = slot.match(/\((.+)\)/)?.[1] || "";
              return (
                <button
                  key={slot}
                  onClick={() => setTimeSlot(slot)}
                  className={cn(
                    "py-2.5 rounded-xl text-center transition-all active:scale-95",
                    timeSlot === slot
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border text-foreground hover:border-primary/20"
                  )}
                >
                  <span className="text-[11px] font-semibold block">{label}</span>
                  <span className="text-[9px] opacity-70 block">{time}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <details className="bg-card rounded-2xl border border-border shadow-sm">
          <summary className="px-4 py-3 text-[12px] font-bold text-foreground cursor-pointer select-none flex items-center gap-1.5">
            <FileText size={13} className="text-primary" />
            Additional Notes (Optional)
          </summary>
          <div className="px-4 pb-3">
            <textarea
              placeholder="Any special instructions or health conditions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[13px] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 resize-none placeholder:text-muted-foreground/40 transition-all"
            />
          </div>
        </details>

        {/* Payment */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
              <Banknote size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground">Cash on Delivery</p>
              <p className="text-[10px] text-muted-foreground">Pay when sample is collected</p>
            </div>
            <span className="text-[10px] font-medium text-primary bg-primary/8 px-2.5 py-1 rounded-full">
              FREE Collection
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-card border-t border-border shadow-[0_-2px_16px_rgba(0,0,0,0.08)]">
        <div className="container max-w-lg px-4 py-3.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Total Payable</p>
            <p className="text-[18px] font-extrabold text-foreground leading-tight">৳{totalAmount}</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            className={cn(
              "font-bold text-[14px] px-7 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-[0.97]",
              isFormValid
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabBookingPage;
