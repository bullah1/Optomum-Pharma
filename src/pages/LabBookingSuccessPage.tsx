import { useLocation, Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Calendar, Clock, MapPin, Phone, User, FlaskConical, ArrowLeft, Home, Building2 } from "lucide-react";
import { format } from "date-fns";

const LabBookingSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  const items = location.state?.items || [];

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <FlaskConical size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold text-foreground mb-2">No booking found</h2>
        <Link to="/lab-test" className="bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-xl">
          Browse Lab Tests
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-primary py-4">
        <div className="container max-w-lg">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-primary-foreground">
              <ArrowLeft size={20} />
            </button>
            <span className="font-bold text-lg text-primary-foreground">Booking Confirmed</span>
          </div>
        </div>
      </div>

      <div className="container max-w-lg py-6 space-y-4">
        {/* Success animation */}
        <div className="text-center py-6">
          <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500">
            <CheckCircle2 size={48} className="text-success" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Booking Confirmed!</h1>
          <p className="text-sm text-muted-foreground">Your lab test booking has been placed successfully</p>
        </div>

        {/* Booking ID Card */}
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Booking ID</p>
          <p className="text-2xl font-extrabold text-primary tracking-wider">{booking.booking_number}</p>
          <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {format(new Date(booking.preferred_date), "dd MMM yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {booking.preferred_time_slot?.split(" ")[0]}
            </span>
          </div>
        </div>

        {/* Tests Booked */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FlaskConical size={16} className="text-primary" />
              Tests Booked
            </h3>
          </div>
          <div className="divide-y divide-border/30">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.type === "package" ? "Package" : "Individual Test"}
                  </p>
                </div>
                <span className="text-sm font-bold text-foreground">৳{item.price}</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-secondary/30 flex justify-between">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-base font-extrabold text-foreground">৳{booking.total_amount}</span>
          </div>
        </div>

        {/* Patient Details */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Booking Details</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-sm">
              <User size={14} className="text-primary shrink-0" />
              <span className="text-muted-foreground">Patient:</span>
              <span className="font-medium text-foreground">{booking.patient_name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone size={14} className="text-primary shrink-0" />
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium text-foreground">{booking.patient_phone}</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
              <span className="text-muted-foreground">Address:</span>
              <span className="font-medium text-foreground">{booking.address}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={14} className="text-primary shrink-0" />
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium text-foreground">{format(new Date(booking.preferred_date), "dd MMM yyyy")}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock size={14} className="text-primary shrink-0" />
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium text-foreground">{booking.preferred_time_slot}</span>
            </div>
            {booking.diagnostic_lab && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 size={14} className="text-primary shrink-0" />
                <span className="text-muted-foreground">Lab:</span>
                <span className="font-medium text-foreground">{booking.diagnostic_lab}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">Payment</p>
            <p className="text-[11px] text-muted-foreground">Cash on Delivery</p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-600">
            Pay at Collection
          </span>
        </div>

        {/* Info */}
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
          <p className="text-[12px] text-foreground font-medium mb-1">📋 What's Next?</p>
          <ul className="text-[11px] text-muted-foreground space-y-1">
            <li>• Our team will confirm your booking shortly</li>
            <li>• A phlebotomist will visit for sample collection</li>
            <li>• Reports will be delivered within the specified time</li>
            <li>• You can track your booking status in your account</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground text-sm font-semibold"
          >
            <Home size={16} />
            Home
          </Link>
          <Link
            to="/lab-test"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            <FlaskConical size={16} />
            More Tests
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LabBookingSuccessPage;
