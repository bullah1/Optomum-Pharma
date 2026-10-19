import { useLocation, Link, Navigate } from "react-router-dom";
import MobileBottomNav from "@/components/MobileBottomNav";
import { CheckCircle2, Sparkles, Calendar, Clock, User, Phone } from "lucide-react";

const BeautyBookingSuccessPage = () => {
  const location = useLocation();
  const state = location.state as any;
  const appointment = state?.appointment;
  const specialist = state?.specialist;

  if (!appointment) return <Navigate to="/beauty/specialists" replace />;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <main className="container py-6 max-w-lg space-y-4">
        {/* Success */}
        <div className="text-center space-y-2 py-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Appointment Booked!</h1>
          <p className="text-xs text-muted-foreground">Your appointment has been submitted successfully</p>
        </div>

        {/* Appointment ID */}
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-3.5 text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">Appointment Number</p>
          <p className="text-base font-bold text-primary font-mono">{appointment.appointment_number}</p>
        </div>

        {/* Specialist */}
        <div className="bg-card rounded-xl border border-border p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            {specialist?.image_url ? (
              <img src={specialist.image_url} alt={specialist.name} className="w-full h-full rounded-lg object-cover" />
            ) : (
              <Sparkles size={18} className="text-primary" />
            )}
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">{specialist?.name}</p>
            {specialist?.specialization && <p className="text-[10px] text-primary font-medium">{specialist.specialization}</p>}
          </div>
        </div>

        {/* Details */}
        <div className="bg-card rounded-xl border border-border p-3.5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Calendar size={11} className="text-primary" />
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium text-foreground">{appointment.appointment_date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-primary" />
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium text-foreground">{appointment.time_slot?.split("(")[0]?.trim()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User size={11} className="text-primary" />
              <span className="text-muted-foreground">Patient:</span>
              <span className="font-medium text-foreground">{appointment.patient_name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone size={11} className="text-primary" />
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium text-foreground">{appointment.patient_phone}</span>
            </div>
          </div>
          <div className="border-t border-border pt-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Service Fee</span>
            <span className="font-bold text-foreground">৳{appointment.consultation_fee}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Payment</span>
            <span className="font-medium text-foreground">Cash on Service</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <Link to="/beauty" className="bg-card border border-border rounded-xl py-3 text-center text-sm font-semibold text-foreground">
            Back to Beauty
          </Link>
          <Link to="/account" className="bg-primary rounded-xl py-3 text-center text-sm font-bold text-primary-foreground">
            My Account
          </Link>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default BeautyBookingSuccessPage;
