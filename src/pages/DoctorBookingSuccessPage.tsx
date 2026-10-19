import { useLocation, Link, Navigate } from "react-router-dom";
import MobileBottomNav from "@/components/MobileBottomNav";
import { CheckCircle2, Stethoscope, Calendar, Clock, User, Phone } from "lucide-react";

const DoctorBookingSuccessPage = () => {
  const location = useLocation();
  const state = location.state as any;
  const appointment = state?.appointment;
  const doctor = state?.doctor;

  if (!appointment) return <Navigate to="/healthcare/doctors" replace />;

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

        {/* Doctor */}
        <div className="bg-card rounded-xl border border-border p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            {doctor?.image_url ? (
              <img src={doctor.image_url} alt={doctor.name} className="w-full h-full rounded-lg object-cover" />
            ) : (
              <Stethoscope size={18} className="text-primary" />
            )}
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">{doctor?.name}</p>
            {doctor?.specialization && <p className="text-[10px] text-primary font-medium">{doctor.specialization}</p>}
          </div>
        </div>

        {/* Details */}
        <div className="bg-card rounded-xl border border-border p-3.5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Calendar size={11} className="text-primary" />
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium text-foreground">
                {new Date(appointment.appointment_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-primary" />
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium text-foreground">{appointment.time_slot}</span>
            </div>
          </div>
          <div className="border-t border-border pt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <User size={11} className="text-muted-foreground" />
              <span className="font-medium text-foreground">{appointment.patient_name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone size={11} className="text-muted-foreground" />
              <span className="font-medium text-foreground">{appointment.patient_phone}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-card rounded-xl border border-border p-3.5 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Consultation Fee</span>
          <span className="text-base font-bold text-foreground">৳{appointment.consultation_fee}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <Link to="/my-appointments" className="flex-1 bg-secondary text-foreground text-xs font-semibold py-3 rounded-xl text-center">
            View Appointments
          </Link>
          <Link to="/" className="flex-1 bg-primary text-primary-foreground text-xs font-semibold py-3 rounded-xl text-center">
            Go Home
          </Link>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default DoctorBookingSuccessPage;
